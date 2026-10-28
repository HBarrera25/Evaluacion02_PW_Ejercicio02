import {
  iniciarReserva,
  expirarReservaUsuario,
} from '../services/cicloReserva.service.js';
import {
  obtenerReserva as obtenerReservaActual,
  agregarAReserva as agregarAlimento,
} from '../services/reserva.service.js';



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
    const reserva = await iniciarReserva(req.usuario.id);
    return res.json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}

export async function consultar(req, res) {
  try {
    const reserva = await obtenerReservaActual(req.usuario.id);
    return res.json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}

export async function agregar(req, res) {
  try {
    const reserva = await agregarAlimento(req.usuario.id, req.body);
    return res.json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}

export async function expirar(req, res) {
  try {
    // El servicio no permite vencerla antes de su fecha.
    const reserva = await expirarReservaUsuario(req.usuario.id);
    return res.json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}