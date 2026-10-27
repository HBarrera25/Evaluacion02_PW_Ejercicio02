import { pool } from '../config/db.js';
import { agregarAReserva } from './reserva.service.js';
import { consultarReserva } from '../repositories/reserva.repository.js';

function errorHttp(status, mensaje) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

function validarAlimentoId(alimentoId) {
  if (
    !Number.isInteger(alimentoId) ||
    alimentoId <= 0 ||
    alimentoId > 2147483647
  ) {
    throw errorHttp(400, 'alimentoId debe ser un entero positivo válido.');
  }
}

export async function cambiarPorciones(usuarioId, datos) {
  const { alimentoId, cambio } = datos ?? {};
  validarAlimentoId(alimentoId);

  if (cambio !== 1 && cambio !== -1) {
    throw errorHttp(400, 'cambio debe ser 1 o -1.');
  }

  if (cambio === 1) {
    // Reutiliza stock, presupuesto, saldo y transacción del integrante 2.
    return agregarAReserva(usuarioId, {
      alimentoId,
      cantidad: 1,
    });
  }

  return reducirOQuitar(usuarioId, alimentoId, false);
}

export async function quitarAlimento(usuarioId, alimentoId) {
  validarAlimentoId(alimentoId);
  return reducirOQuitar(usuarioId, alimentoId, true);
}

async function reducirOQuitar(usuarioId, alimentoId, quitarTodo) {
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

    const reserva = await client.query(
      `
      SELECT id
      FROM reservas
      WHERE usuario_id = $1 AND estado = 'activa'
      FOR UPDATE
      `,
      [usuarioId],
    );
    if (!reserva.rowCount) {
      throw errorHttp(409, 'No hay una reserva activa.');
    }
    const reservaId = reserva.rows[0].id;

    const alimento = await client.query(
      'SELECT id FROM alimentos WHERE id = $1 FOR UPDATE',
      [alimentoId],
    );
    if (!alimento.rowCount) {
      throw errorHttp(404, 'El alimento no existe.');
    }

    const resultado = await client.query(
      `
      SELECT cantidad
      FROM reserva_items
      WHERE reserva_id = $1 AND alimento_id = $2
      FOR UPDATE
      `,
      [reservaId, alimentoId],
    );
    if (!resultado.rowCount) {
      throw errorHttp(404, 'El alimento no está en tu reserva.');
    }

    // Revisar la fecha después de esperar los bloqueos.
    const vigente = await client.query(
      `
      SELECT id
      FROM reservas
      WHERE id = $1
        AND estado = 'activa'
        AND expira_en > clock_timestamp()
      `,
      [reservaId],
    );
    if (!vigente.rowCount) {
      throw errorHttp(409, 'La reserva ya venció.');
    }

    const cantidadActual = resultado.rows[0].cantidad;
    const cantidadDevuelta = quitarTodo ? cantidadActual : 1;

    if (quitarTodo || cantidadActual === 1) {
      await client.query(
        `
        DELETE FROM reserva_items
        WHERE reserva_id = $1 AND alimento_id = $2
        `,
        [reservaId, alimentoId],
      );
    } else {
      await client.query(
        `
        UPDATE reserva_items
        SET cantidad = cantidad - 1
        WHERE reserva_id = $1 AND alimento_id = $2
        `,
        [reservaId, alimentoId],
      );
    }

    await client.query(
      `
      UPDATE alimentos
      SET stock = stock + $1
      WHERE id = $2
      `,
      [cantidadDevuelta, alimentoId],
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