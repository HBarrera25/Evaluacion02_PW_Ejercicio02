import { pool } from '../config/db.js';
import { consultarReserva } from '../repositories/reserva.repository.js';

const DURACION_MINUTOS = 10;

function errorHttp(status, mensaje) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

// Ejecutar dentro de una transacción que ya bloqueó al usuario.
async function liberarReservaVencida(client, usuarioId) {
  const { rows } = await client.query(
    `
    SELECT id
    FROM reservas
    WHERE usuario_id = $1 AND estado = 'activa'
    FOR UPDATE
    `,
    [usuarioId],
  );

  const reserva = rows[0];
  if (!reserva) return;

  // Comprobar la fecha después de obtener el bloqueo.
  const vencida = await client.query(
    `
    SELECT id FROM reservas
    WHERE id = $1 AND expira_en <= clock_timestamp()
    `,
    [reserva.id],
  );
  if (!vencida.rowCount) return;

  // Mantener un orden común al bloquear varios alimentos.
  await client.query(
    `
    SELECT a.id
    FROM alimentos a
    JOIN reserva_items i ON i.alimento_id = a.id
    WHERE i.reserva_id = $1
    ORDER BY a.id
    FOR UPDATE OF a
    `,
    [reserva.id],
  );

  await client.query(
    `
    UPDATE alimentos a
    SET stock = a.stock + i.cantidad
    FROM reserva_items i
    WHERE i.reserva_id = $1 AND i.alimento_id = a.id
    `,
    [reserva.id],
  );

  await client.query(
    "UPDATE reservas SET estado = 'expirada' WHERE id = $1",
    [reserva.id],
  );

  // Conservar los ítems como historial.
  // El estado evita devolver el stock una segunda vez.
}

async function gestionarCiclo(usuarioId, crearNueva) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const usuario = await client.query(
      'SELECT id FROM usuarios WHERE id = $1 FOR UPDATE',
      [usuarioId],
    );
    if (!usuario.rowCount) {
      throw errorHttp(404, 'Usuario no encontrado.');
    }

    await liberarReservaVencida(client, usuarioId);

    if (crearNueva) {
      // Si ya hay una activa, conservarla.
      // El bloqueo del usuario serializa los inicios concurrentes.
      await client.query(
        `
        INSERT INTO reservas (
          usuario_id, estado, creada_en, expira_en
        )
        SELECT
          $1,
          'activa',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP + $2::integer * INTERVAL '1 minute'
        WHERE NOT EXISTS (
          SELECT 1 FROM reservas
          WHERE usuario_id = $1 AND estado = 'activa'
        )
        `,
        [usuarioId, DURACION_MINUTOS],
      );
    }

    const reserva = await consultarReserva(client, usuarioId);
    await client.query('COMMIT');
    return reserva;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function iniciarReserva(usuarioId) {
  return gestionarCiclo(usuarioId, true);
}

export function expirarReservaUsuario(usuarioId) {
  return gestionarCiclo(usuarioId, false);
}

export async function expirarReservasVencidas() {
  // Seleccionar candidatos sin bloquearlos aquí.
  // Cada transacción vuelve a comprobar estado y vencimiento.
  const { rows } = await pool.query(
    `
    SELECT usuario_id FROM reservas
    WHERE estado = 'activa'
      AND expira_en <= clock_timestamp()
    ORDER BY expira_en, id
    LIMIT 100
    `,
  );

  for (const fila of rows) {
    try {
      await expirarReservaUsuario(fila.usuario_id);
    } catch (error) {
      console.error(
        'No se pudo vencer la reserva del usuario',
        fila.usuario_id,
        error.message,
      );
    }
  }
}