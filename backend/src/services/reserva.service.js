import { pool } from '../config/db.js';
import { consultarReserva } from '../repositories/reserva.repository.js';

function errorHttp(status, mensaje) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

export async function obtenerReserva(usuarioId) {
  const reserva = await consultarReserva(pool, usuarioId);
  if (!reserva) throw errorHttp(404, 'Usuario no encontrado.');
  return reserva;
}

export async function agregarAReserva(usuarioId, datos) {
  const { alimentoId, cantidad } = datos ?? {};
  for (const [nombre, valor] of Object.entries({ alimentoId, cantidad })) {
    if (!Number.isInteger(valor) || valor <= 0 || valor > 2147483647) {
      throw errorHttp(400, nombre + ' debe ser un entero positivo válido.');
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const usuario = await client.query(
      'SELECT id FROM usuarios WHERE id = $1 FOR UPDATE',
      [usuarioId],
    );
    if (!usuario.rowCount) throw errorHttp(404, 'Usuario no encontrado.');

    const reserva = await client.query(
      "SELECT id FROM reservas WHERE usuario_id = $1 AND estado = 'activa' FOR UPDATE",
      [usuarioId],
    );
    if (!reserva.rowCount) {
      throw errorHttp(409, 'Primero debes iniciar una reserva.');
    }
    const reservaId = reserva.rows[0].id;

    const alimento = await client.query(
      'SELECT id, precio, stock FROM alimentos WHERE id = $1 FOR UPDATE',
      [alimentoId],
    );
    if (!alimento.rowCount) throw errorHttp(404, 'El alimento no existe.');
    if (alimento.rows[0].stock < cantidad) {
      throw errorHttp(409, 'No hay suficiente stock disponible.');
    }

    const anterior = await client.query(
      'SELECT cantidad, precio_unitario FROM reserva_items WHERE reserva_id = $1 AND alimento_id = $2',
      [reservaId, alimentoId],
    );
    const item = anterior.rows[0];
    if ((item?.cantidad ?? 0) + cantidad > 2147483647) {
      throw errorHttp(400, 'La cantidad acumulada excede el límite permitido.');
    }
    const precio = item?.precio_unitario ?? alimento.rows[0].precio;

    // Los cálculos y las comparaciones monetarias se realizan en PostgreSQL.
    const validacion = await client.query(
      `
      WITH importes AS (
        SELECT
          COALESCE((
            SELECT SUM(cantidad * precio_unitario)
            FROM reserva_items WHERE reserva_id = $1
          ), 0) + $2::numeric * $3::numeric AS nuevo_total,
          COALESCE((
            SELECT SUM(i.cantidad * i.precio_unitario)
            FROM reservas r
            JOIN reserva_items i ON i.reserva_id = r.id
            WHERE r.usuario_id = $4
              AND r.estado = 'confirmada'
              AND (r.confirmada_en AT TIME ZONE 'America/El_Salvador')::date
                  = (clock_timestamp() AT TIME ZONE 'America/El_Salvador')::date
          ), 0) AS gastado_hoy
      )
      SELECT
        importes.nuevo_total <= u.saldo_mensual AS saldo_suficiente,
        importes.nuevo_total + importes.gastado_hoy
          <= u.presupuesto_diario AS presupuesto_suficiente
      FROM usuarios u CROSS JOIN importes WHERE u.id = $4
      `,
      [reservaId, cantidad, precio, usuarioId],
    );
    const limites = validacion.rows[0];
    if (!limites.saldo_suficiente) {
      throw errorHttp(409, 'Saldo mensual insuficiente.');
    }
    if (!limites.presupuesto_suficiente) {
      throw errorHttp(409, 'La reserva supera tu presupuesto diario disponible.');
    }

    // Verificar vigencia después de esperar los bloqueos.
    const stock = await client.query(
      `
      UPDATE alimentos SET stock = stock - $1
      WHERE id = $2 AND stock >= $1
        AND EXISTS (
          SELECT 1 FROM reservas
          WHERE id = $3 AND estado = 'activa'
            AND expira_en > clock_timestamp()
        )
      RETURNING id
      `,
      [cantidad, alimentoId, reservaId],
    );
    if (!stock.rowCount) {
      throw errorHttp(409, 'La reserva venció o el stock ya no está disponible.');
    }

    await client.query(
      `
      INSERT INTO reserva_items (
        reserva_id, alimento_id, cantidad, precio_unitario
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (reserva_id, alimento_id)
      DO UPDATE SET cantidad = reserva_items.cantidad + EXCLUDED.cantidad
      `,
      [reservaId, alimentoId, cantidad, precio],
    );

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