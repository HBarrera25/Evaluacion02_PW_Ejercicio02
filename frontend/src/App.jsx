import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Container, Row, UncontrolledAlert, Modal, ModalHeader } from 'reactstrap';
import MenuDelDia from './components/MenuDelDia.jsx';
import PanelUsuario from './components/PanelUsuario.jsx';
import ReservaActual from './components/ReservaActual.jsx';
import Temporizador from './components/Temporizador.jsx';
import Acceso from './components/Acceso.jsx';
import Logo from './components/Logo.jsx';
import useReserva from './hooks/useReserva.js';
import {
  consultarSesion, cerrarSesion, agregarAReserva, iniciarReserva,
} from './services/api.js';

const dinero = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [errorSesion, setErrorSesion] = useState('');
  const [reintento, setReintento] = useState(0);
  const [acceso, setAcceso] = useState(null);
  const [avisoAcceso, setAvisoAcceso] = useState('');
  useEffect(() => {
    let activo = true;
    setCargandoSesion(true);
    setErrorSesion('');
    consultarSesion().then((datos) => { if (activo) setUsuario(datos.usuario); })
      .catch((error) => { if (activo && error.status !== 401) setErrorSesion(error.message); })
      .finally(() => { if (activo) setCargandoSesion(false); });
    return () => { activo = false; };
  }, [reintento]);
  useEffect(() => {
    const salir = () => setUsuario(null);
    window.addEventListener('sesion-expirada', salir);
    return () => window.removeEventListener('sesion-expirada', salir);
  }, []);
  async function ingresar(cuenta) {
    setAvisoAcceso('');
    try {
      if (acceso?.reservar) {
        await iniciarReserva();
        if (acceso.item) await agregarAReserva(acceso.item);
      }
    } catch (error) {
      setAvisoAcceso(error.message);
    }
    setUsuario(cuenta);
    setAcceso(null);
  }
  return <>
    {errorSesion && <Container className="pt-3"><Alert color="warning">{errorSesion} <Button size="sm" onClick={() => setReintento((n) => n + 1)}>Reintentar sesión</Button></Alert></Container>}
    {avisoAcceso && <Container className="pt-3"><Alert color="warning">{avisoAcceso}</Alert></Container>}
    <MenuUsuario key={usuario?.id ?? 'visitante'} usuario={usuario} cargandoSesion={cargandoSesion}
      onSalir={() => { setUsuario(null); setAvisoAcceso(''); }}
      onAcceso={(item = null, reservar = true) => setAcceso({ item, reservar })} />
    <Modal isOpen={Boolean(acceso)} toggle={() => setAcceso(null)} centered labelledBy="titulo-acceso">
      <ModalHeader id="titulo-acceso" toggle={() => setAcceso(null)}>Ingresa para reservar</ModalHeader>
      <Acceso onIngresar={ingresar} />
    </Modal>
  </>;
}

function MenuUsuario({ usuario, onSalir, onAcceso, cargandoSesion }) {
  const [saliendo, setSaliendo] = useState(false);
  const {
    menu, reserva, cargando, errorMenu, errorAccion, procesando, mensaje,
    ahora, vencida, reservaActiva, mostrarError, reintentar,
    iniciar, agregar, cambiar, quitar, confirmar,
  } = useReserva(usuario);

  async function salir() {
    setSaliendo(true);
    try { await cerrarSesion(); onSalir(); }
    catch (error) {
      if (error.status === 401) onSalir();
      else mostrarError(error);
    } finally { setSaliendo(false); }
  }
  const deshabilitado = procesando || cargando || saliendo || Boolean(errorMenu);
  return (
    <>
      <header className="cabecera">
        <Container className="py-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <Logo />
            <div className="d-flex align-items-center gap-3">
              {usuario ? <>
              <span>Hola, <strong>{usuario.nombre}</strong> <small>(@{usuario.nombreUsuario})</small></span>
              <Button color="light" outline size="sm" disabled={procesando || saliendo} onClick={salir}>{saliendo ? 'Saliendo...' : 'Cerrar sesión'}</Button>
              </> : <Button color="light" outline size="sm" disabled={cargandoSesion} onClick={() => onAcceso(null, false)}>Iniciar sesión</Button>}
            </div>
          </div>
          <h1 className="display-6 fw-semibold mt-4">Tu almuerzo, a tu gusto.</h1>
          <p className="mb-0">El sabor que buscas a un solo clic.</p>
        </Container>
      </header>
      <Container tag="main" className="py-4 py-md-5">
        {errorAccion && <UncontrolledAlert key={errorAccion.id} color="warning" role="alert">{errorAccion.mensaje}</UncontrolledAlert>}
        {!usuario && <Alert color="info" className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <span>Explora el menú. Para reservar, inicia sesión o crea tu cuenta.</span>
          <Button color="primary" disabled={cargandoSesion} onClick={() => onAcceso()}>Hacer una reserva</Button>
        </Alert>}
        {reserva && (
          <Alert color="info" className="panel-saldo d-flex flex-wrap justify-content-between gap-2">
            <span>Tu saldo actual: <strong>{dinero.format(reserva.saldo)}</strong></span>
            <span>Total de tu Reserva: <Badge color="dark" pill>{dinero.format(reserva.total)}</Badge></span>
            <span>Presupuesto diario disponible: <strong>{dinero.format(reserva.presupuestoDisponible)}</strong></span>
          </Alert>
        )}
        {reserva && !reservaActiva && (
          <Alert color={reserva.estado === 'expirada' || vencida ? 'warning' : 'info'}>
            <p>{reserva.estado === 'expirada' || vencida
              ? 'El tiempo terminó. Tu reserva se cerró y sus porciones se liberaron. Puedes iniciar nuevamente.'
              : 'Inicia una nueva reserva para añadir platos.'}</p>
            <Button color="primary" disabled={deshabilitado || vencida} onClick={iniciar}>
              {procesando ? 'Cargando...' : 'Iniciar nueva reserva'}
            </Button>
          </Alert>
        )}
        {reservaActiva && <Temporizador expiraEn={reserva.expiraEn} ahora={ahora} />}
        {mensaje && <Alert color="success" role="status">{mensaje}</Alert>}
        <Row className="g-4">
          <Col xs="12" lg={usuario ? 8 : 12}>
            <MenuDelDia platos={menu} cargando={cargando} error={errorMenu}
              procesando={deshabilitado || cargandoSesion} reservaActiva={reservaActiva}
              onSolicitarAcceso={!usuario ? (item) => onAcceso(item) : undefined}
              onAgregar={agregar}
              onReintentar={reintentar} />
          </Col>
          {usuario && <Col xs="12" lg="4" tag="aside">
            <PanelUsuario usuario={usuario} key={reserva?.id ?? 'sin-reserva'} reserva={reserva} reservaActiva={reservaActiva} procesando={deshabilitado}
              onConfirmar={confirmar} />
            <ReservaActual reserva={vencida ? { ...reserva, estado: 'expirada' } : reserva} procesando={deshabilitado}
              onCambiar={cambiar}
              onQuitar={quitar} />
          </Col>}
        </Row>
      </Container>
      <footer className="text-center text-secondary py-4">Food DEI · Todos los derechos reservados 2026®</footer>
    </>
  );
}
