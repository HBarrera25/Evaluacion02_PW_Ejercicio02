import React, { useState } from 'react';
import { Badge, Button, Card, CardBody, CardText, CardTitle, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const dinero = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });

// Las ocho fotos comparten un archivo local con cuatro columnas y dos filas.
// Asociarlas por nombre evita depender de los IDs asignados por PostgreSQL.
const fotos = {
  'Menú Ejecutivo (Pollo)': [0, 0],
  'Pasta Alfredo': [1, 0],
  'Carne a la plancha': [2, 0],
  'Ensalada fresca': [3, 0],
  'Sopa de verduras': [0, 1],
  'Jugo natural': [1, 1],
  'Agua embotellada': [2, 1],
  'Flan de vainilla': [3, 1],
};

const descripciones = {
  'Menú Ejecutivo (Pollo)': 'Pechuga de pollo a la plancha, acompañada de arroz y vegetales salteados.',
  'Pasta Alfredo': 'Pasta fettuccine con salsa cremosa Alfredo, queso parmesano y un toque de perejil.',
  'Carne a la plancha': 'Carne de res a la plancha con vegetales: brócoli, zanahoria y calabacín.',
  'Ensalada fresca': 'Mezcla de lechuga, tomate, pepino y cebolla morada con aderezo ligero.',
  'Sopa de verduras': 'Caldo de verduras con papa, zanahoria, apio y vegetales de temporada.',
  'Jugo natural': 'Jugo de naranja servido frío, preparado con naranjas frescas.',
  'Agua embotellada': 'Agua purificada sin gas, en botella individual sellada.',
  'Flan de vainilla': 'Flan suave de leche, huevo y vainilla, cubierto con caramelo.',
};

export default function PlatoCard({ plato, onAgregar, procesando = false, reservaActiva = false, onSolicitarAcceso }) {
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const cerrarDetalle = () => setDetalleAbierto(false);
  const agotado = plato.stock === 0;
  const foto = fotos[plato.nombre];
  let textoBoton = 'Añadir a la Reserva';
  if (agotado) textoBoton = 'Agotado';
  else if (procesando) textoBoton = 'Cargando...';

  return (
    <>
    <Card className="mb-3 plato-card h-100">
      <button type="button" className="plato-ver-foto" onClick={() => setDetalleAbierto(true)}
        aria-label={`Ver ingredientes de ${plato.nombre}`} aria-haspopup="dialog">
      {foto ? (
        <div
          className="plato-foto"
          role="img"
          aria-label={`Imagen ilustrativa de ${plato.nombre}`}
          style={{
            backgroundImage: `url("${import.meta.env.BASE_URL}images/menu-platos.png")`,
            backgroundPosition: `${foto[0] * 100 / 3}% ${foto[1] * 100}%`,
          }}
        />
      ) : (
        <div className="plato-foto plato-foto-vacia">Imagen no disponible</div>
      )}
      </button>
      <CardBody className="d-flex flex-column p-4">
        <span className="plato-categoria">{plato.categoria}</span>
        <CardTitle tag="h3" className="h5 mt-2">
          <button type="button" className="plato-ver-nombre" onClick={() => setDetalleAbierto(true)}
            aria-haspopup="dialog">{plato.nombre}</button>
        </CardTitle>
        <button type="button" className="plato-ver-detalle" onClick={() => setDetalleAbierto(true)}
          aria-label={`Ver descripción de ${plato.nombre}`} aria-haspopup="dialog">Ver qué lleva</button>
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
          disabled={agotado || procesando || (!reservaActiva && !onSolicitarAcceso)}
          onClick={() => (onSolicitarAcceso || onAgregar)({ alimentoId: plato.id, cantidad: 1 })}
          aria-label={`${textoBoton}: ${plato.nombre}`}
        >
          {textoBoton}
        </Button>
      </CardBody>
    </Card>
    <Modal isOpen={detalleAbierto} toggle={cerrarDetalle} centered labelledBy={`detalle-plato-${plato.id}`}>
      <ModalHeader toggle={cerrarDetalle} id={`detalle-plato-${plato.id}`}>{plato.nombre}</ModalHeader>
      <ModalBody>
        <p className="plato-categoria">{plato.categoria}</p>
        <p>{plato.descripcion || descripciones[plato.nombre] || 'La descripción de este plato todavía no está disponible.'}</p>
        <Badge color="success">{dinero.format(plato.precio)}</Badge>
        <span className="ms-3 text-secondary">{agotado ? 'Agotado' : `${plato.stock} porciones disponibles`}</span>
      </ModalBody>
      <ModalFooter><Button color="secondary" outline onClick={cerrarDetalle}>Cerrar</Button></ModalFooter>
    </Modal>
    </>
  );
}
