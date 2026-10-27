import React from 'react';
import { Alert, Table } from 'reactstrap';

const dinero = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
});

export default function ReservaActual({ reserva }) {
  if (!reserva) return null;
  const items = reserva.itemsReservados ?? [];

  return (
    <section className="mt-4" aria-labelledby="titulo-reserva">
      <h2 id="titulo-reserva" className="h4">
        {reserva.estado === 'activa' ? 'Tu reserva actual' : 'Tu última reserva'}
      </h2>
      <p className="text-secondary">
        Estado: {reserva.estado === 'sin_reserva'
          ? 'Sin reserva iniciada'
          : reserva.estado}
      </p>
      {items.length === 0 ? (
        <Alert color="light">
          {reserva.estado === 'activa'
            ? 'Todavía no has agregado alimentos. Elige uno del menú.'
            : 'No hay alimentos reservados.'}
        </Alert>
      ) : (
        <Table responsive striped bordered>
          <thead>
            <tr>
              <th scope="col">Alimento</th>
              <th scope="col">Cantidad</th>
              <th scope="col">Precio unitario</th>
              <th scope="col">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.alimentoId}>
                <th scope="row">{item.nombre}</th>
                <td>{item.cantidad}</td>
                <td>{dinero.format(item.precioUnitario)}</td>
                <td>{dinero.format(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>Total</th>
              <td className="fw-bold">{dinero.format(reserva.total)}</td>
            </tr>
          </tfoot>
        </Table>
      )}
    </section>
  );
}