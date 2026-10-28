import React from 'react';
import { Button, ButtonGroup, ListGroupItem } from 'reactstrap';
const dinero = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });

export default function ItemReserva({ item, deshabilitado, onCambiar, onQuitar }) {
  return (
    <ListGroupItem>
      <strong>{item.nombre}</strong>
      <p className="small text-secondary mb-2">{dinero.format(item.precioUnitario)} por porción · Subtotal: {dinero.format(item.subtotal)}</p>
      <div className="d-flex flex-wrap justify-content-between gap-2">
        <ButtonGroup size="sm" aria-label={'Porciones de ' + item.nombre}>
          <Button color="secondary" outline disabled={deshabilitado}
            onClick={() => onCambiar(item.alimentoId, item.cantidad - 1)} aria-label={'Disminuir una porción de ' + item.nombre}>−</Button>
          <span className="px-3 d-flex align-items-center" aria-live="polite">{item.cantidad}</span>
          <Button color="secondary" outline disabled={deshabilitado}
            onClick={() => onCambiar(item.alimentoId, item.cantidad + 1)} aria-label={'Aumentar una porción de ' + item.nombre}>+</Button>
        </ButtonGroup>
        <Button color="danger" outline size="sm" disabled={deshabilitado}
          onClick={() => onQuitar(item.alimentoId)} aria-label={'Quitar ' + item.nombre}>Quitar</Button>
      </div>
    </ListGroupItem>
  );
}
