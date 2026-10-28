export default function errorHandler(error, req, res, next) {
  console.error('Error de solicitud:', error.message);
  const status = error.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ mensaje: status === 400 ? 'El cuerpo JSON no es válido.' : 'No se pudo completar la solicitud.' });
}
