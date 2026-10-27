import {
  obtenerReserva,
  agregarAReserva,
} from '../services/reserva.service.js';

const USUARIO_DEMO_ID = 1;

function responderError(res, error) {
  const status = error.status || 500;
  if (status === 500) console.error('Error en reservas:', error);
  return res.status(status).json({
    mensaje: status === 500
      ? 'No se pudo procesar la reserva. Intenta nuevamente.'
      : error.message,
  });
}

export async function consultar(req, res) {
  try {
    return res.json(await obtenerReserva(USUARIO_DEMO_ID));
  } catch (error) {
    return responderError(res, error);
  }
}

export async function agregar(req, res) {
  try {
    const reserva = await agregarAReserva(USUARIO_DEMO_ID, req.body);
    return res.status(200).json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}