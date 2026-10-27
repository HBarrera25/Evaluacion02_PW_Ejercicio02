# Food DEI — confirmación y cobro de reservas

Implementación del alcance del integrante 5: confirmar una reserva activa,
cobrarla una sola vez dentro de una transacción PostgreSQL y mostrar el saldo
disponible en el frontend.

## Archivos de esta entrega

- `backend/src/services/confirmacion.service.js`: valida la reserva, saldo,
  presupuesto diario y vencimiento; actualiza el estado y descuenta el saldo
  en una transacción. No modifica inventario.
- `backend/src/controllers/confirmacion.controller.js`: expone el usuario de
  demostración del seed (`id = 1`) y traduce errores a respuestas HTTP.
- `backend/src/routes/reserva.routes.js`: registra `POST /confirmar`; el
  servidor debe montar este router bajo `/api/reserva`.
- `frontend/src/services/api.js`: servicio HTTP compartido, incluida la llamada
  de confirmación.
- `frontend/src/components/PanelUsuario.jsx`: muestra saldo, total y acción de
  confirmar.
- `frontend/src/App.jsx`: integración de confirmación. Recibe por props el
  estado y los callbacks de la aplicación que proporcionan los integrantes
  anteriores.

## Contratos de integración

El backend presupone `pool` exportado desde `backend/src/config/db.js` y las
tablas `usuarios`, `reservas` y `reserva_items` descritas por el proyecto. El
router usa Express y debe componerse con las rutas de reservas existentes, sin
reemplazarlas.

La respuesta de `GET /api/reserva` debe incluir `id`, `estado`, `saldo`,
`total` e `itemsReservados`. El componente `App` recibe `reserva`,
`setReserva`, `reservaActiva`, `procesando`, `setProcesando`, `bloqueo`
(referencia compartida), `setErrorAccion`, `setAvisoReserva`, `setIntento`,
`setMenu` y, opcionalmente, `onIniciarNuevaReserva`. La validez de
`reservaActiva` debe contemplar `expiraEn`.

Configura `VITE_API_URL` con la URL base de la API; por defecto se usa
`http://localhost:3000/api`.

## Ejecución y validación del backend

Desde `backend/`:

```bash
npm install
npm test
```

La configuración de PostgreSQL usa `DATABASE_URL`. En un entorno integrado,
monta el router con:

```js
app.use('/api/reserva', reservaRouter);
```

El servicio crea el pool desde
[backend/src/config/db.js](./backend/src/config/db.js); no abre conexiones
para entradas inválidas y libera cada cliente después de confirmar o revertir
la transacción.

Las pruebas incluidas cubren el rechazo temprano de `usuarioId` y
`reservaId`. Las comprobaciones que requieren PostgreSQL deben ejecutarse con
los seeds y los módulos de los integrantes anteriores.

Esta rama de origen no incluía el backend, el frontend ni sus dependencias, por
lo que la integración final y las pruebas con PostgreSQL deben ejecutarse al
combinar estos archivos con los módulos base del equipo.
