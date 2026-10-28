import { expirarReservasVencidas } from '../services/cicloReserva.service.js';

export function iniciarExpiracion(intervaloMs = 1000) {
  let enCurso = null;
  function ejecutar() {
    if (enCurso) return;
    enCurso = expirarReservasVencidas()
      .catch((error) => console.error('Error al liberar reservas vencidas:', error.message))
      .finally(() => { enCurso = null; });
  }
  ejecutar();
  const intervalo = setInterval(ejecutar, intervaloMs);
  intervalo.unref();
  return async () => {
    clearInterval(intervalo);
    await enCurso;
  };
}
