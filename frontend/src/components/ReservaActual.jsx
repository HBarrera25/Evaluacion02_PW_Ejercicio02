import React from 'react';
import { Alert, ListGroup } from 'reactstrap';
import ItemReserva from './ItemReserva.jsx';
const dinero = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });

export default function ReservaActual({ reserva, procesando = false, onCambiar, onQuitar }) {
  if (!reserva) return null;
  const items = reserva.itemsReservados ?? [];
  const activa = reserva.estado === 'activa';
  return (
    <section aria-labelledby="titulo-reserva" aria-busy={procesando}>
      <h2 id="titulo-reserva" className="h4">{activa ? 'Tu reserva actual' : 'Tu última reserva'}</h2>
      <p className="text-secondary">Estado: {reserva.estado === 'sin_reserva' ? 'Sin reserva iniciada' : reserva.estado}</p>
      {procesando && <p role="status">Cargando...</p>}
      {items.length === 0 ? <Alert color="light">Todavía no hay alimentos en tu reserva.</Alert> : <>
        {activa && <p className="small text-secondary">Usa + y − para ajustar las porciones. Reducir a cero quita el plato.</p>}
        <ListGroup>{items.map((item) => <ItemReserva key={item.alimentoId} item={item}
          deshabilitado={procesando || !activa} onCambiar={onCambiar} onQuitar={onQuitar} />)}</ListGroup>
        <p className="fw-bold mt-3">Total: {dinero.format(reserva.total)}</p>
      </>}
    </section>
  );
}
