import React from 'react';
import { Badge, Button, Card, CardBody, CardText, CardTitle } from 'reactstrap';

const dinero = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });

export default function PlatoCard({ plato, onAgregar, procesando = false, reservaActiva = false }) {
  const agotado = plato.stock === 0;
  let textoBoton = 'Añadir a la Reserva';
  if (agotado) textoBoton = 'Agotado';
  else if (procesando) textoBoton = 'Cargando...';

  return (
    <Card className="mb-3 plato-card h-100">
      <CardBody className="d-flex flex-column p-4">
        <span className="plato-categoria">{plato.categoria}</span>
        <CardTitle tag="h3" className="h5 mt-2">{plato.nombre}</CardTitle>
        <div className="my-3">
          <Badge color="success" className="precio">{dinero.format(plato.precio)}</Badge>
        </div>
        <CardText className="text-secondary">
          Stock disponible: <strong>{plato.stock}</strong>
        </CardText>
        <Button
          type="button"
          color={agotado ? 'secondary' : 'primary'}
          className="mt-auto"
          disabled={agotado || procesando || !reservaActiva}
          onClick={() => onAgregar({ alimentoId: plato.id, cantidad: 1 })}
          aria-label={`${textoBoton}: ${plato.nombre}`}
        >
          {textoBoton}
        </Button>
      </CardBody>
    </Card>
  );
}
