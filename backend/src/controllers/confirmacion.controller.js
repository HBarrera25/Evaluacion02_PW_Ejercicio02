import { confirmarReserva } from '../services/confirmacion.service.js';



export async function confirmar(req, res) {
  try {
    const resultado = await confirmarReserva(req.usuario.id, { ...req.body, nombreCliente: req.usuario.nombre });
    return res.status(200).json(resultado);
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status === 500) {
      console.error('Error al confirmar la reserva:', error);
    }
    return res.status(status).json({
      mensaje: status === 500
        ? 'No se pudo confirmar la reserva. Intenta nuevamente.'
        : error.message,
    });
  }
}
