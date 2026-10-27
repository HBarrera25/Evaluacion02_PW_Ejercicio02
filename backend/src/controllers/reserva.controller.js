import {
  iniciarReserva,
  expirarReservaUsuario,
} from '../services/cicloReserva.service.js';

const USUARIO_DEMO_ID = 1;

function responderError(res, error) {
  const status = error.status || 500;
  if (status === 500) {
    console.error('Error en el ciclo de reserva:', error);
  }

  return res.status(status).json({
    mensaje: status === 500
      ? 'No se pudo actualizar la reserva. Intenta nuevamente.'
      : error.message,
  });
}

export async function iniciar(req, res) {
  try {
    const reserva = await iniciarReserva(USUARIO_DEMO_ID);
    return res.json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}

export async function expirar(req, res) {
  try {
    // El servicio no permite vencerla antes de su fecha.
    const reserva = await expirarReservaUsuario(USUARIO_DEMO_ID);
    return res.json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}