import React from 'react';
import { Button, ButtonGroup } from 'reactstrap';

const dinero = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
});

export default function ItemReserva({
  item,
  deshabilitado,
  onCambiar,
  onQuitar,
}) {
  return (
    <tr>
      <th scope="row">{item.nombre}</th>
      <td>
        <ButtonGroup aria-label={'Porciones de ' + item.nombre}>
          <Button
            type="button"
            color="secondary"
            outline
            size="sm"
            disabled={deshabilitado}
            onClick={() => onCambiar(item.alimentoId, -1)}
            aria-label={'Disminuir una porción de ' + item.nombre}
          >
            −
          </Button>
          <span
            className="px-3 d-flex align-items-center"
            aria-live="polite"
          >
            {item.cantidad}
          </span>
          <Button
            type="button"
            color="secondary"
            outline
            size="sm"
            disabled={deshabilitado}
            onClick={() => onCambiar(item.alimentoId, 1)}
            aria-label={'Aumentar una porción de ' + item.nombre}
          >
            +
          </Button>
        </ButtonGroup>
      </td>
      <td>{dinero.format(item.precioUnitario)}</td>
      <td>{dinero.format(item.subtotal)}</td>
      <td>
        <Button
          type="button"
          color="danger"
          outline
          size="sm"
          disabled={deshabilitado}
          onClick={() => onQuitar(item.alimentoId)}
          aria-label={'Quitar ' + item.nombre + ' de la reserva'}
        >
          Quitar
        </Button>
      </td>
    </tr>
  );
}