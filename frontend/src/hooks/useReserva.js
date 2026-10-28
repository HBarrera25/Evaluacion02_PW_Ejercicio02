import { useCallback, useEffect, useRef, useState } from 'react';
import {
  obtenerMenu, obtenerReserva, agregarAReserva, cambiarPorciones,
  quitarDeReserva, confirmarReserva, iniciarReserva, sincronizarVencimiento,
} from '../services/api.js';

// Centraliza la carga, la sincronización y las operaciones de la reserva.
export default function useReserva(usuario) {
  const [menu, setMenu] = useState([]);
  const [reserva, setReserva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorMenu, setErrorMenu] = useState('');
  const [errorAccion, setErrorAccion] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [intento, setIntento] = useState(0);
  const [ahora, setAhora] = useState(Date.now());
  const bloqueo = useRef(false);
  const avisoId = useRef(0);

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    async function cargar() {
      setCargando(true);
      setErrorMenu('');
      try {
        // La consulta de reserva libera stock vencido antes de leer el menú.
        const actual = usuario ? await obtenerReserva(controlador.signal) : null;
        const catalogo = await obtenerMenu(controlador.signal);
        if (controlador.signal.aborted) return;
        setReserva(actual);
        setMenu(catalogo);
      } catch (error) {
        if (!controlador.signal.aborted) setErrorMenu(error.message);
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }
    cargar();
    return () => controlador.abort();
  }, [intento, usuario]);

  const mostrarError = useCallback((error) => {
    setErrorAccion({ id: ++avisoId.current, mensaje: error.message });
  }, []);

  const ejecutar = useCallback(async (operacion) => {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setProcesando(true);
    setErrorAccion(null);
    setMensaje('');
    try {
      const resultado = await operacion();
      const actual = await obtenerReserva();
      const catalogo = await obtenerMenu();
      setReserva(actual);
      setMenu(catalogo);
      setAhora(Date.now());
      if (resultado?.mensaje) setMensaje(resultado.mensaje);
    } catch (error) {
      mostrarError(error);
      // Releer antes de repetir una operación cuya respuesta pudo perderse.
      setIntento((valor) => valor + 1);
    } finally {
      bloqueo.current = false;
      setProcesando(false);
    }
  }, [mostrarError]);

  const vencida = reserva?.estado === 'activa' && new Date(reserva.expiraEn).getTime() <= ahora;
  const reservaActiva = reserva?.estado === 'activa' && !vencida;
  useEffect(() => {
    if (vencida) ejecutar(sincronizarVencimiento);
  }, [vencida, ahora, ejecutar]);

  return {
    menu, reserva, cargando, errorMenu, errorAccion, procesando, mensaje,
    ahora, vencida, reservaActiva, mostrarError,
    reintentar: () => setIntento((valor) => valor + 1),
    iniciar: () => ejecutar(iniciarReserva),
    agregar: (item) => ejecutar(() => agregarAReserva(item)),
    cambiar: (id, cantidad) => ejecutar(() => cambiarPorciones(id, cantidad)),
    quitar: (id) => ejecutar(() => quitarDeReserva(id)),
    confirmar: () => ejecutar(() => confirmarReserva(reserva.id)),
  };
}
