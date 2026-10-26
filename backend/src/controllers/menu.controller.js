import { obtenerMenu } from '../repositories/alimento.repository.js';

export async function listarMenu(req, res) {
  try {
    const alimentos = await obtenerMenu();
    return res.status(200).json(alimentos);
  } catch (error) {
    console.error('Error al consultar el menú:', error.message);
    return res.status(500).json({
      mensaje: 'No se pudo obtener el menú. Intenta nuevamente.',
    });
  }
}
