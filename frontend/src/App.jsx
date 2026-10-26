import React, { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Container, UncontrolledAlert } from 'reactstrap';
import MenuDelDia from './components/MenuDelDia.jsx';
import { obtenerMenu, obtenerReserva, agregarAReserva } from './services/api.js';

const dinero = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });

export default function App() {
  const [menu, setMenu] = useState([]);
  const [reserva, setReserva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorMenu, setErrorMenu] = useState('');
  const [avisoReserva, setAvisoReserva] = useState('');
  const [errorAccion, setErrorAccion] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [intento, setIntento] = useState(0);
  const bloqueo = useRef(false);

  useEffect(() => {
    const controlador = new AbortController();
    async function cargar() {
      setCargando(true);
      setErrorMenu('');
      setReserva(null);
      setAvisoReserva('');
      const resultados = await Promise.allSettled([
        obtenerMenu(controlador.signal), obtenerReserva(controlador.signal),
      ]);
      if (controlador.signal.aborted) return;
      const [catalogo, actual] = resultados;
      if (catalogo.status === 'fulfilled' && Array.isArray(catalogo.value)) {
        setMenu(catalogo.value);
      } else {
        setErrorMenu(catalogo.reason?.message || 'El menú recibido no es válido.');
      }
      if (actual.status === 'fulfilled') {
        setReserva(actual.value);
      } else {
        setAvisoReserva(actual.reason?.status === 404
          ? 'Las reservas todavía no están disponibles. Puedes consultar el menú.'
          : 'No pudimos consultar tu reserva. Vuelve a cargar la página para intentar nuevamente.');
      }
      setCargando(false);
    }
    cargar();
    return () => controlador.abort();
  }, [intento]);

  const reservaActiva = Boolean(reserva && (!reserva.estado || reserva.estado === 'activa'));

  async function agregarPlato(item) {
    if (bloqueo.current || !reservaActiva) return;
    bloqueo.current = true;
    setProcesando(true);
    setErrorAccion(null);
    try {
      await agregarAReserva(item);
      // Consultar ambos recursos mantiene el stock y los importes sincronizados.
      const [nuevoMenu, nuevaReserva] = await Promise.all([obtenerMenu(), obtenerReserva()]);
      setMenu(nuevoMenu);
      setReserva(nuevaReserva);
    } catch (error) {
      setErrorAccion({ mensaje: error.message });
      // Puede haber fallado la actualización visual después de guardar la reserva.
      setIntento((valor) => valor + 1);
    } finally {
      bloqueo.current = false;
      setProcesando(false);
    }
  }

  return (
    <>
      <header className="cabecera">
        <Container className="py-4">
          <span className="marca">FOOD DEI</span>
          <h1 className="display-6 fw-semibold mt-4">Tu almuerzo, a tu gusto.</h1>
          <p className="mb-0">Elige tus platos y prepara tu reserva del día.</p>
        </Container>
      </header>
      <Container tag="main" className="py-4 py-md-5">
        {errorAccion && (
          <UncontrolledAlert color="warning" role="alert">{errorAccion.mensaje}</UncontrolledAlert>
        )}
        {avisoReserva && <Alert color="info">{avisoReserva}</Alert>}
        {reserva && (
          <Alert color="info" className="d-flex flex-wrap justify-content-between gap-2">
            <span>Tu saldo actual: <strong>{dinero.format(reserva.saldo)}</strong></span>
            <span>Total de tu Reserva: <Badge color="dark" pill>{dinero.format(reserva.total)}</Badge></span>
          </Alert>
        )}
        {reserva && !reservaActiva && <Alert color="info">Inicia una nueva reserva para añadir platos.</Alert>}
        <MenuDelDia platos={menu} cargando={cargando} error={errorMenu}
          procesando={procesando} reservaActiva={reservaActiva}
          onAgregar={agregarPlato} onReintentar={() => setIntento((valor) => valor + 1)} />
      </Container>
      <footer className="text-center text-secondary py-4">Food DEI · Menú sujeto a disponibilidad</footer>
    </>
  );
}
