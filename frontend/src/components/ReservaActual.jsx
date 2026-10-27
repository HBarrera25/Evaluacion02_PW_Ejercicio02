import React from 'react';
import { Alert, Table } from 'reactstrap';
import ItemReserva from './ItemReserva.jsx';

const dinero = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
});

export default function ReservaActual({
  reserva,
  procesando = false,
  onCambiar,
  onQuitar,
}) {
  if (!reserva) return null;

  const items = reserva.itemsReservados ?? [];
  const activa = reserva.estado === 'activa';
  const deshabilitado = procesando || !activa;

  return (
    <section
      className="mt-4"
      aria-labelledby="titulo-reserva"
      aria-busy={procesando}
    >
      <h2 id="titulo-reserva" className="h4">
        {activa ? 'Tu reserva actual' : 'Tu última reserva'}
      </h2>
      <p className="text-secondary">
        Estado: {reserva.estado === 'sin_reserva'
          ? 'Sin reserva iniciada'
          : reserva.estado}
      </p>

      {items.length === 0 ? (
        <Alert color="light">
          {activa
            ? 'Todavía no has agregado alimentos. Elige uno del menú.'
            : 'No hay alimentos reservados.'}
        </Alert>
      ) : (
        <>
          {activa && (
            <p className="small text-secondary">
              Usa + y − para ajustar las porciones.
              Al disminuir la última porción se quita el alimento.
            </p>
          )}
          <Table responsive striped bordered>
            <thead>
              <tr>
                <th scope="col">Alimento</th>
                <th scope="col">Cantidad</th>
                <th scope="col">Precio unitario</th>
                <th scope="col">Subtotal</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <ItemReserva
                  key={item.alimentoId}
                  item={item}
                  deshabilitado={deshabilitado}
                  onCambiar={onCambiar}
                  onQuitar={onQuitar}
                />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>Total</th>
                <td className="fw-bold">
                  {dinero.format(reserva.total)}
                </td>
                <td />
              </tr>
            </tfoot>
          </Table>
        </>
      )}
    </section>
  );
}