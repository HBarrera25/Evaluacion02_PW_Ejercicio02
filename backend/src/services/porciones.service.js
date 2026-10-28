import { pool } from '../config/db.js';
import { consultarReserva } from '../repositories/reserva.repository.js';

const errorHttp = (status, mensaje) => Object.assign(new Error(mensaje), { status });

export function cambiarPorciones(usuarioId, datos = {}) {
  if (datos.cambio !== 1 && datos.cambio !== -1) {
    throw errorHttp(400, 'cambio debe ser 1 o -1.');
  }
  return modificar(usuarioId, datos.alimentoId, datos.cambio, true);
}

export function actualizarPorciones(usuarioId, alimentoId, cantidad) {
  return modificar(usuarioId, alimentoId, cantidad, false);
}

export function quitarAlimento(usuarioId, alimentoId) {
  return modificar(usuarioId, alimentoId, 0, false);
}

async function modificar(usuarioId, alimentoId, valor, relativo) {
  if (!Number.isInteger(alimentoId) || alimentoId <= 0 || alimentoId > 2147483647) {
    throw errorHttp(400, 'El identificador del alimento no es válido.');
  }
  if (!Number.isInteger(valor) || (!relativo && valor < 0) || valor > 2147483647) {
    throw errorHttp(400, 'cantidad debe ser un entero no negativo válido.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const usuario = await client.query('SELECT id FROM usuarios WHERE id = $1 FOR UPDATE', [usuarioId]);
    if (!usuario.rowCount) throw errorHttp(404, 'Usuario no encontrado.');
    const reserva = await client.query("SELECT id FROM reservas WHERE usuario_id = $1 AND estado = 'activa' FOR UPDATE", [usuarioId]);
    if (!reserva.rowCount) throw errorHttp(409, 'No hay una reserva activa.');
    const reservaId = reserva.rows[0].id;
    const alimento = await client.query('SELECT stock FROM alimentos WHERE id = $1 FOR UPDATE', [alimentoId]);
    if (!alimento.rowCount) throw errorHttp(404, 'El alimento no existe.');
    const item = await client.query('SELECT cantidad, precio_unitario FROM reserva_items WHERE reserva_id = $1 AND alimento_id = $2', [reservaId, alimentoId]);
    if (!item.rowCount) throw errorHttp(404, 'El alimento no está en tu reserva.');
    const cantidad = relativo ? item.rows[0].cantidad + valor : valor;
    if (cantidad < 0 || cantidad > 2147483647) throw errorHttp(400, 'Cantidad fuera del rango permitido.');
    const diferencia = cantidad - item.rows[0].cantidad;
    if (diferencia > alimento.rows[0].stock) throw errorHttp(400, 'Stock insuficiente');

    if (diferencia > 0) {
      const { rows: [limite] } = await client.query(`
        WITH total AS (
          SELECT COALESCE(SUM(cantidad * precio_unitario), 0) + $2::numeric * $3::numeric AS nuevo
          FROM reserva_items WHERE reserva_id = $1
        ), gasto AS (
          SELECT COALESCE(SUM(i.cantidad * i.precio_unitario), 0) AS hoy
          FROM reservas r JOIN reserva_items i ON i.reserva_id = r.id
          WHERE r.usuario_id = $4 AND r.estado = 'confirmada'
            AND (r.confirmada_en AT TIME ZONE 'America/El_Salvador')::date
              = (clock_timestamp() AT TIME ZONE 'America/El_Salvador')::date
        )
        SELECT total.nuevo <= u.saldo_mensual AS saldo,
               total.nuevo + gasto.hoy <= u.presupuesto_diario AS presupuesto
        FROM usuarios u CROSS JOIN total CROSS JOIN gasto WHERE u.id = $4
      `, [reservaId, diferencia, item.rows[0].precio_unitario, usuarioId]);
      if (!limite.saldo) throw errorHttp(400, 'Saldo insuficiente para esta cantidad');
      if (!limite.presupuesto) throw errorHttp(400, 'La reserva supera tu presupuesto diario disponible.');
    }
    // Comprobar vigencia después de esperar todos los bloqueos.
    const vigente = await client.query('SELECT id FROM reservas WHERE id = $1 AND expira_en > clock_timestamp()', [reservaId]);
    if (!vigente.rowCount) throw errorHttp(409, 'La reserva ya venció.');
    if (cantidad === 0) {
      await client.query('DELETE FROM reserva_items WHERE reserva_id = $1 AND alimento_id = $2', [reservaId, alimentoId]);
    } else {
      await client.query('UPDATE reserva_items SET cantidad = $3 WHERE reserva_id = $1 AND alimento_id = $2', [reservaId, alimentoId, cantidad]);
    }
    await client.query('UPDATE alimentos SET stock = stock - $1 WHERE id = $2', [diferencia, alimentoId]);
    const actualizada = await consultarReserva(client, usuarioId);
    await client.query('COMMIT');
    return actualizada;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
