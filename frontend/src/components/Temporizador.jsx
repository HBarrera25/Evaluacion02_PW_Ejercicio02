import React from 'react';
import { Alert } from 'reactstrap';

export default function Temporizador({ expiraEn, ahora }) {
  const segundos = Math.max(0, Math.ceil((new Date(expiraEn).getTime() - ahora) / 1000));
  const tiempo = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
  return <Alert color={segundos <= 60 ? 'warning' : 'info'}>
    Tiempo para confirmar: <strong role="timer" aria-label="Tiempo restante">{tiempo}</strong>
  </Alert>;
}
