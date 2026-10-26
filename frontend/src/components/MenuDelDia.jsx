import React from 'react';
import { Alert, Button, Col, Row, Spinner } from 'reactstrap';
import PlatoCard from './PlatoCard.jsx';

export default function MenuDelDia({
  platos = [], cargando = false, error = '', procesando = false,
  reservaActiva = false, onAgregar, onReintentar,
}) {
  return (
    <section aria-labelledby="titulo-menu" aria-busy={cargando}>
      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <h2 id="titulo-menu" className="h3 mb-0">Menú del día</h2>
        {!cargando && !error && <span className="text-secondary">{platos.length} opciones</span>}
      </div>
      {cargando ? (
        <div role="status" className="py-5 text-center">
          <Spinner size="sm" className="me-2" />Cargando menú...
        </div>
      ) : error ? (
        <Alert color="warning">
          <p>{error}</p>
          <Button color="dark" outline onClick={onReintentar}>Volver a intentar</Button>
        </Alert>
      ) : platos.length === 0 ? (
        <Alert color="info">No hay platos disponibles en el catálogo de hoy.</Alert>
      ) : (
        <Row className="g-4">
          {platos.map((plato) => (
            <Col key={plato.id} xs="12" md="4">
              <PlatoCard plato={plato} onAgregar={onAgregar}
                procesando={procesando} reservaActiva={reservaActiva} />
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}
