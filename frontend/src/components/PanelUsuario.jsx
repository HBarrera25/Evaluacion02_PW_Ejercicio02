import React from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
} from 'reactstrap';

const dinero = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
});

export default function PanelUsuario({
  reserva,
  reservaActiva,
  procesando,
  onConfirmar,
  usuario,
}) {
  if (!reserva) {
    return null;
  }

  const tieneItems = (reserva.itemsReservados?.length ?? 0) > 0;
  const puedeConfirmar = reservaActiva && tieneItems && !procesando;
  const confirmada = reserva.estado === 'confirmada';

  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle tag="h2" className="h4">
          Tu saldo y reserva
        </CardTitle>

        <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
          <div>
            <div className="text-secondary">Saldo disponible tras la reserva</div>
            <strong className="fs-4">
              {dinero.format(Number(reserva.saldo))}
            </strong>
          </div>
          <div>
            <div className="text-secondary">
              {confirmada
                ? 'Total de la reserva confirmada'
                : 'Total de la reserva'}
            </div>
            <strong className="fs-4">
              {dinero.format(Number(reserva.total))}
            </strong>
          </div>
        </div>

        {confirmada ? (
          <Alert color="success" className="mb-0">
            {reserva.nombreCliente
              ? <>Reserva confirmada a nombre de <strong>{reserva.nombreCliente}</strong>.</>
              : 'Esta reserva ya fue confirmada y cobrada.'}
          </Alert>
        ) : (
          <>
            <p className="text-secondary">
              El saldo disponible ya contempla esta reserva. El cobro definitivo se realiza al confirmar.
            </p>
            <p>Reserva a nombre de <strong>{usuario.nombre}</strong>.</p>
            <Button type="button" color="success" disabled={!puedeConfirmar} onClick={onConfirmar}>
              {procesando ? 'Procesando...' : 'Confirmar reserva'}
            </Button>
            {reservaActiva && !tieneItems && (
              <p className="small text-secondary mt-2 mb-0">
                Agrega al menos un alimento para confirmar.
              </p>
            )}
            {!reservaActiva && (
              <p className="small text-secondary mt-2 mb-0">
                Necesitas una reserva vigente para confirmar.
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
