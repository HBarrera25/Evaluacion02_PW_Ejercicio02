import React, { useState } from 'react';
import { Alert, Button } from 'reactstrap';
import PanelUsuario from './components/PanelUsuario.jsx';
import {
  confirmarReserva,
  obtenerMenu,
  obtenerReserva,
} from './services/api.js';

export default function App({
  reserva,
  setReserva,
  reservaActiva,
  procesando,
  setProcesando,
  bloqueo,
  setErrorAccion,
  setAvisoReserva,
  setIntento,
  setMenu,
  onIniciarNuevaReserva,
  children,
}) {
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const reservaVigente = (() => {
    if (!reservaActiva || reserva?.estado !== 'activa') {
      return false;
    }
    if (!reserva.expiraEn) {
      return true;
    }
    const expiraEn = Date.parse(reserva.expiraEn);
    return Number.isFinite(expiraEn) && expiraEn > Date.now();
  })();

  async function confirmarActual() {
    if (
      bloqueo.current ||
      !reservaVigente ||
      !reserva?.id ||
      !reserva.itemsReservados?.length
    ) {
      return;
    }

    const reservaId = reserva.id;
    bloqueo.current = true;
    setProcesando(true);
    setErrorAccion(null);
    setMensajeConfirmacion('');

    try {
      const resultado = await confirmarReserva(reservaId);

      setReserva((actual) => {
        if (!actual || actual.id !== reservaId) {
          return actual;
        }
        return {
          ...actual,
          estado: 'confirmada',
          saldo: resultado.saldo,
        };
      });
      setMensajeConfirmacion(resultado.mensaje);

      try {
        const [actualizada, nuevoMenu] = await Promise.all([
          obtenerReserva(),
          obtenerMenu(),
        ]);
        setReserva(actualizada);
        setMenu(nuevoMenu);
      } catch {
        setAvisoReserva(
          'La confirmación fue exitosa, pero no se pudo actualizar toda la información.',
        );
      }
    } catch (error) {
      setErrorAccion({
        mensaje: error.status
          ? error.message
          : 'No se pudo verificar la respuesta. Se consultará el estado de la reserva antes de volver a intentar.',
      });
      setIntento((valor) => valor + 1);
    } finally {
      bloqueo.current = false;
      setProcesando(false);
    }
  }

  async function iniciarNuevaReserva() {
    setMensajeConfirmacion('');
    if (onIniciarNuevaReserva) {
      await onIniciarNuevaReserva();
    }
  }

  return (
    <>
      {children}
      <PanelUsuario
        reserva={reserva}
        reservaActiva={reservaVigente}
        procesando={procesando}
        onConfirmar={confirmarActual}
      />
      {mensajeConfirmacion && (
        <Alert color="success" role="status">
          {mensajeConfirmacion}
        </Alert>
      )}
      {onIniciarNuevaReserva && (
        <Button type="button" color="primary" onClick={iniciarNuevaReserva}>
          Iniciar otra reserva
        </Button>
      )}
    </>
  );
}
