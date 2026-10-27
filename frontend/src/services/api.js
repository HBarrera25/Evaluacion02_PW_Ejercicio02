const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

async function solicitar(ruta, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(API_URL + ruta, opciones);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new Error(
      'No se pudo conectar con el servidor. Comprueba que el backend esté encendido.',
    );
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    const error = new Error(
      datos?.mensaje ||
      datos?.message ||
      'No se pudo completar la solicitud.',
    );
    error.status = respuesta.status;
    throw error;
  }

  if (datos === null) {
    throw new Error('El servidor devolvió una respuesta inválida.');
  }
  return datos;
}

export function obtenerMenu(signal) {
  return solicitar('/menu', { signal });
}

export function obtenerReserva(signal) {
  return solicitar('/reserva', { signal });
}

export function agregarAReserva(item) {
  return solicitar('/reserva/agregar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
}

export function cambiarPorciones(alimentoId, cambio) {
  return solicitar('/reserva/porciones', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alimentoId, cambio }),
  });
}

export function quitarDeReserva(alimentoId) {
  return solicitar(
    '/reserva/items/' + encodeURIComponent(alimentoId),
    { method: 'DELETE' },
  );
}

export function iniciarReserva() {
  return solicitar('/reserva/iniciar', { method: 'POST' });
}

export function sincronizarVencimiento() {
  return solicitar('/reserva/expirar', { method: 'POST' });
}

export function confirmarReserva(reservaId) {
  return solicitar('/reserva/confirmar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reservaId }),
  });
}
