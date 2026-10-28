const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

async function solicitar(ruta, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, credentials: 'include' });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servidor. Comprueba que el backend esté encendido.');
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const error = new Error(datos?.mensaje || datos?.message || 'No se pudo completar la solicitud.');
    error.status = respuesta.status;
    if (respuesta.status === 401 && !ruta.startsWith('/auth/')) window.dispatchEvent(new Event('sesion-expirada'));
    throw error;
  }
  if (datos === null) throw new Error('El servidor devolvió una respuesta inválida.');
  return datos;
}

export const consultarSesion = () => solicitar('/auth/sesion');
export const cerrarSesion = () => solicitar('/auth/salir', { method: 'POST' });
export function autenticarUsuario(modo, datos) {
  return solicitar('/auth/' + modo, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
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

export function cambiarPorciones(alimentoId, cantidad) {
  return solicitar('/reserva/actualizar-porciones/' + encodeURIComponent(alimentoId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad }),
  });
}

export function quitarDeReserva(alimentoId) {
  return solicitar('/reserva/eliminar/' + encodeURIComponent(alimentoId), {
    method: 'DELETE',
  });
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
