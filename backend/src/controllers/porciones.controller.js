import {
  cambiarPorciones,
  quitarAlimento,
  actualizarPorciones,
} from '../services/porciones.service.js';



export async function actualizar(req, res) {
  try {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ mensaje: 'El identificador del alimento no es válido.' });
    }
    return res.json(await actualizarPorciones(req.usuario.id, Number(req.params.id), req.body?.cantidad));
  } catch (error) {
    return responderError(res, error);
  }
}

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
    const reserva = await cambiarPorciones(req.usuario.id, req.body);
    return res.json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}

export async function quitar(req, res) {
  try {
    const parametro = req.params.id ?? req.params.alimentoId;
    if (!/^[1-9]\d*$/.test(parametro)) {
      return res.status(400).json({
        mensaje: 'El identificador del alimento no es válido.',
      });
    }
    const reserva = await quitarAlimento(
      req.usuario.id,
      Number(parametro),
    );
    return res.json(reserva);
  } catch (error) {
    return responderError(res, error);
  }
}
