import {
  cambiarPorciones,
  quitarAlimento,
} from '../services/porciones.service.js';

const USUARIO_DEMO_ID = 1;

function responderError(res, error) {
  const status = error.status || 500;
  if (status === 500) {
    console.error('Error al modificar porciones:', error);
  }
  return res.status(status).json({
    mensaje: status === 500
      ? 'No se pudo modificar la reserva. Intenta nuevamente.'
      : error.message,
  });
}

export async function cambiar(req, res) {
  try {
    const reserva = await cambiarPorciones(USUARIO_DEMO_ID, req.body);
    return res.json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}

export async function quitar(req, res) {
  try {
    const parametro = req.params.alimentoId;
    if (!/^[1-9]\d*$/.test(parametro)) {
      return res.status(400).json({
        mensaje: 'El identificador del alimento no es válido.',
      });
    }
    const reserva = await quitarAlimento(
      USUARIO_DEMO_ID,
      Number(parametro),
    );
    return res.json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}