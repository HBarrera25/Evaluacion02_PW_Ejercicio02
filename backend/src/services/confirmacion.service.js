import { pool } from '../config/db.js';

function errorHttp(status, mensaje) {
  return Object.assign(new Error(mensaje), { status });
}

export async function confirmarReserva(usuarioId, datos) {
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    throw errorHttp(400, 'usuarioId debe ser un entero positivo válido.');
  }

  const { reservaId } = datos ?? {};

  if (
    !Number.isInteger(reservaId) ||
    reservaId <= 0 ||
    reservaId > 2147483647
  ) {
    throw errorHttp(400, 'reservaId debe ser un entero positivo válido.');
  }

  const client = await pool.connect();
  let transaccionAbierta = false;

  try {
    await client.query('BEGIN');
    transaccionAbierta = true;

    const usuario = await client.query(
      `
      SELECT id, saldo_mensual
      FROM usuarios
      WHERE id = $1
      FOR UPDATE
      `,
      [usuarioId],
    );
    if (!usuario.rowCount) {
      throw errorHttp(404, 'Usuario no encontrado.');
    }

    const resultado = await client.query(
      `
      SELECT id, estado
      FROM reservas
      WHERE id = $1 AND usuario_id = $2
      FOR UPDATE
      `,
      [reservaId, usuarioId],
    );
    if (!resultado.rowCount) {
      throw errorHttp(404, 'La reserva no existe.');
    }

    if (resultado.rows[0].estado === 'confirmada') {
      await client.query('COMMIT');
      transaccionAbierta = false;
      return {
        reservaId,
        estado: 'confirmada',
        yaConfirmada: true,
        saldo: Number(usuario.rows[0].saldo_mensual),
        mensaje: 'Esta reserva ya estaba confirmada. No se realizó otro cobro.',
      };
    }

    if (resultado.rows[0].estado !== 'activa') {
      throw errorHttp(409, 'La reserva ya no está activa.');
    }

    const importes = await client.query(
      `
      WITH calculo AS (
        SELECT
          COUNT(*) AS numero_items,
          COALESCE(SUM(cantidad * precio_unitario), 0) AS total
        FROM reserva_items
        WHERE reserva_id = $1
      ),
      gasto AS (
        SELECT COALESCE(
          SUM(i.cantidad * i.precio_unitario), 0
        ) AS gastado_hoy
        FROM reservas r
        JOIN reserva_items i ON i.reserva_id = r.id
        WHERE r.usuario_id = $2
          AND r.estado = 'confirmada'
          AND (r.confirmada_en AT TIME ZONE 'America/El_Salvador')::date
              = (clock_timestamp() AT TIME ZONE 'America/El_Salvador')::date
      )
      SELECT
        calculo.numero_items,
        calculo.total,
        calculo.total <= u.saldo_mensual AS saldo_suficiente,
        calculo.total + gasto.gastado_hoy
          <= u.presupuesto_diario AS presupuesto_suficiente
      FROM usuarios u
      CROSS JOIN calculo
      CROSS JOIN gasto
      WHERE u.id = $2
      `,
      [reservaId, usuarioId],
    );

    const validacion = importes.rows[0];
    if (Number(validacion.numero_items) === 0) {
      throw errorHttp(409, 'No puedes confirmar una reserva vacía.');
    }
    if (!validacion.saldo_suficiente) {
      throw errorHttp(409, 'Saldo mensual insuficiente.');
    }
    if (!validacion.presupuesto_suficiente) {
      throw errorHttp(409, 'La reserva supera tu presupuesto diario disponible.');
    }

    const confirmada = await client.query(
      `
      WITH instante AS (
        SELECT clock_timestamp() AS ahora
      )
      UPDATE reservas r
      SET estado = 'confirmada',
          confirmada_en = instante.ahora
      FROM instante
      WHERE r.id = $1
        AND r.estado = 'activa'
        AND r.expira_en > instante.ahora
      RETURNING r.confirmada_en
      `,
      [reservaId],
    );
    if (!confirmada.rowCount) {
      throw errorHttp(409, 'La reserva venció antes de confirmarse.');
    }

    const cobro = await client.query(
      `
      UPDATE usuarios
      SET saldo_mensual = saldo_mensual - $1::numeric
      WHERE id = $2 AND saldo_mensual >= $1::numeric
      RETURNING saldo_mensual
      `,
      [validacion.total, usuarioId],
    );
    if (!cobro.rowCount) {
      throw errorHttp(409, 'Saldo mensual insuficiente.');
    }

    await client.query('COMMIT');
    transaccionAbierta = false;

    return {
      reservaId,
      estado: 'confirmada',
      yaConfirmada: false,
      totalCobrado: Number(validacion.total),
      saldo: Number(cobro.rows[0].saldo_mensual),
      confirmadaEn: confirmada.rows[0].confirmada_en,
      mensaje: 'Reserva confirmada y cobro realizado.',
    };
  } catch (error) {
    if (transaccionAbierta) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        throw Object.assign(
          new Error('No se pudo revertir la transacción de confirmación.', {
            cause: rollbackError,
          }),
          { status: 500, originalError: error },
        );
      }
    }
    throw error;
  } finally {
    client.release();
  }
}
