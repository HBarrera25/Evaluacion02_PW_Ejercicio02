# Evaluacion02_PW_Ejercicio02
EVALUACION 02 PW: Desarrollo de Aplicaciones Web con Integración Frontend- Backend

## PostgreSQL local

Requisitos: PostgreSQL en ejecución, Node.js 22.12 o superior y npm.

1. Desde `backend`, ejecutar `npm ci`.
2. Copiar `.env.example` como `.env` y completar las credenciales locales.
3. Usar `DB_NAME=food_dei`. El usuario necesita permiso para crear bases de datos
   si la base todavía no existe.
4. Ejecutar `npm run db:setup` desde `backend`.

El comando crea la base si no existe, ejecuta `database/schema.sql` y después
`database/seed.sql`. Si encuentra tablas en el esquema `public`, se detiene para
no sobrescribir información. Se utiliza una vez sobre una base nueva/vacía.
Los scripts SQL también pueden ejecutarse desde DBeaver, en ese mismo orden,
conectado a una base vacía. No volver a ejecutar el seed sobre datos existentes.

### Modelo

- `usuarios`: saldo mensual y presupuesto diario, ambos no negativos.
- `alimentos`: nombre, categoría, precio positivo y stock no negativo.
- `reservas`: usuario, estado y fechas de creación, vencimiento y confirmación.
  Solo permite una reserva activa por usuario.
- `reserva_items`: relación entre reserva y alimento, cantidad positiva y precio
  unitario conservado. Un alimento aparece una sola vez por reserva.

Datos iniciales: un usuario con saldo mensual de $100 y presupuesto diario de
$25, y ocho alimentos. El flan comienza sin stock para demostrar “Agotado”.
Las tablas de reservas comienzan vacías.

El stock representa porciones disponibles. Los servicios de reserva deben
retenerlo al agregar y devolverlo al quitar o vencer, usando transacciones.
Confirmar realiza el cobro definitivo sin descontar el stock por segunda vez.
El total se calcula con SUM(cantidad * precio_unitario). El dinero se almacena
como NUMERIC(10,2); pg devuelve estos valores como texto para preservar precisión.
La expiración automática y el control del gasto diario requieren los servicios
del backend: las tablas por sí solas no ejecutan esas operaciones.

### Ver la base en DBeaver

1. Seleccionar **Nueva conexión de base de datos** y elegir **PostgreSQL**.
2. Completar host `localhost`, puerto `5432`, base de datos `food_dei`, y el
   usuario/contraseña configurados en `backend/.env`.
3. Pulsar **Probar conexión**. Si solicita el controlador, descargarlo.
4. Pulsar **Finalizar** y expandir la conexión: **Schemas > public > Tables**.
5. Abrir `alimentos` y seleccionar la pestaña **Datos / Data**.

En un editor SQL de esa conexión se puede ejecutar:

```sql
SELECT * FROM public.alimentos ORDER BY id;
SELECT * FROM public.usuarios ORDER BY id;
```

Si las tablas no aparecen, actualizar la conexión con **Refresh / Actualizar**.
La contraseña permanece en `.env`, que está excluido de Git.

## API del menú

Con PostgreSQL iniciado y `backend/.env` configurado, ejecutar desde `backend`:

```sh
npm run dev
```

Para arrancar sin reinicio automático, usar `npm start`.
El servidor verifica la conexión a la base antes de escuchar peticiones.
El puerto predeterminado es 3000; se puede cambiar mediante `PORT`.

Abrir `http://localhost:3000/api/menu` en el navegador o consultar:

```powershell
Invoke-RestMethod http://localhost:3000/api/menu
```

`GET /api/menu` devuelve HTTP 200 y un arreglo de alimentos ordenados por ID.
Cada objeto contiene `id`, `nombre`, `precio` numérico, `stock` y `categoria`.
Incluye los alimentos con stock cero para mostrar “Agotado” en el frontend.
Un catálogo vacío devuelve `[]`. Un fallo de consulta devuelve HTTP 500 con
`{"mensaje":"No se pudo obtener el menú. Intenta nuevamente."}`.

`FRONTEND_URL` configura el origen permitido por CORS (por defecto
`http://localhost:5173`). Esta ruta solo consulta; no modifica stock ni reservas.

## Frontend del menú

En una terminal mantener el backend encendido con `npm run dev` desde `backend`.
En otra terminal, desde `frontend`, ejecutar `npm ci` y `npm run dev`.
Abrir la dirección que muestre Vite (normalmente `http://localhost:5173`).
Para generar la versión de producción, ejecutar `npm run build`.

La API predeterminada es `http://localhost:3000/api`. Se puede configurar copiando
`frontend/.env.example` a `frontend/.env` y cambiando `VITE_API_URL`.
Si Vite utiliza otro puerto, ajustar `FRONTEND_URL` en el backend y reiniciarlo.

`MenuDelDia.jsx` muestra el catálogo en una columna en móvil y tres desde el
tamaño mediano. `PlatoCard.jsx` presenta categoría, nombre, precio, stock y el
botón de añadir, que muestra “Agotado” cuando el stock es cero.
Se incluyen estados de carga, catálogo vacío, errores y reintento.

### Reservas y vencimiento

1. Crea tu cuenta o inicia sesión y pulsa **Iniciar nueva reserva**. El contador usa la fecha de vencimiento del servidor.
2. Añade platos y ajusta las porciones con **+**, **−** o **Quitar** en el carrito lateral.
3. El stock queda retenido temporalmente y el saldo disponible se actualiza al instante.
4. Pulsa **Confirmar reserva**. Se guarda el nombre de tu cuenta con la compra y se cobra una sola vez, sin descontar stock nuevamente.
5. Al vencer, el servidor devuelve las porciones automáticamente (revisión cada segundo),
   incluso si se cierra el navegador. La interfaz permite iniciar otra reserva.

`RESERVA_DURACION_MINUTOS` configura el plazo (5 minutos por defecto).
El saldo mensual inicial es $100 y el presupuesto diario es $25. La API distingue
`saldoMensual` (saldo contable), `saldo` (descontando la reserva activa) y
`presupuestoDisponible` (restando compras confirmadas de hoy y la reserva activa).
El día se calcula en la zona `America/El_Salvador`. Las reservas cerradas conservan
sus ítems como historial y no retienen nuevamente saldo ni stock.

### Rutas

| Método | Ruta | Cuerpo / finalidad |
| --- | --- | --- |
| GET | `/api/menu` | Catálogo, precios y stock |
| GET | `/api/reserva` | Reserva, saldo y presupuesto disponible |
| POST | `/api/reserva/iniciar` | Iniciar o recuperar la reserva activa |
| POST | `/api/reserva/agregar` | `{ "alimentoId": 1, "cantidad": 1 }` |
| PUT | `/api/reserva/actualizar-porciones/:id` | `{ "cantidad": 2 }`, cantidad final; cero quita el plato |
| DELETE | `/api/reserva/eliminar/:id` | Quitar todas las porciones y devolver stock |
| POST | `/api/reserva/confirmar` | `{ "reservaId": 1 }`, confirmación idempotente |
| POST | `/api/reserva/expirar` | Sincronizar vencimiento; no permite anticiparlo |

Stock insuficiente devuelve HTTP 400 y `Stock insuficiente`. Aumentar porciones
por encima del saldo devuelve HTTP 400 y `Saldo insuficiente para esta cantidad`.
Superar el presupuesto diario también devuelve HTTP 400, con su propio mensaje.
Modificar una reserva vencida o confirmar una vacía devuelve HTTP 409.
Se conservan las rutas antiguas PATCH `/api/reserva/porciones` y DELETE
`/api/reserva/items/:alimentoId` por compatibilidad.

### Pruebas

Desde `backend`, con `.env` configurado:

```sh
npm test
npm run test:integration
```

La prueba de integración requiere PostgreSQL y permiso para crear un esquema.
Crea un esquema temporal exclusivo, carga los datos de prueba y lo elimina al
terminar; no usa las tablas del esquema `public`. Comprueba las rutas HTTP,
stock, saldo, presupuesto diario, cantidades inválidas, actualizaciones
concurrentes, confirmación sin doble cobro y expiración sin navegador.

Desde `frontend`, `npm run build` valida la compilación de producción.

### Descripciones y nombre del comprador

Toca la imagen, el nombre o **Ver qué lleva** para abrir el detalle del plato.
Las descripciones del catálogo de demostración están en `PlatoCard.jsx`; pueden
ajustarse allí a la receta del restaurante. Si la API incluye `descripcion`, se
muestra ese contenido con prioridad.

### Registro e inicio de sesión

El menú y las descripciones se muestran sin iniciar sesión. Al pulsar **Hacer una reserva**
o **Añadir a la Reserva**, se abre el formulario de acceso sobre el menú. Después de
entrar o registrarse, se inicia la reserva y se añade el plato seleccionado, si lo había.
Cerrar el formulario permite seguir explorando. El acceso del encabezado permite
iniciar sesión sin crear una reserva automáticamente.

La página permite crear una cuenta con nombre, nombre de usuario único y contraseña
(de 8 a 128 caracteres), iniciar sesión y cerrar sesión. Cada alta recibe $100 de
saldo mensual y $25 de presupuesto diario, fijados por el servidor. Iniciar sesión
otra vez no recarga el saldo ni reinicia el gasto del día. Los usuarios comparten
el inventario del restaurante, pero sus reservas y presupuestos son independientes.

La reserva toma el nombre de la cuenta autenticada. El servidor ignora identificadores
de usuario o nombres de comprador enviados por el cliente y comprueba la propiedad
de cada reserva. Las contraseñas se guardan mediante scrypt con sal aleatoria.
Las sesiones duran siete días, se guardan con token hasheado en PostgreSQL y usan
una cookie HttpOnly/SameSite=Lax; cerrar sesión la revoca en el servidor.

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| POST | `/api/auth/registro` | `{ "nombre": "Ana Pérez", "nombreUsuario": "ana", "password": "una-clave-larga" }` |
| POST | `/api/auth/ingresar` | `{ "nombreUsuario": "ana", "password": "una-clave-larga" }` |
| GET | `/api/auth/sesion` | Usuario de la sesión actual |
| POST | `/api/auth/salir` | Cerrar la sesión |

Las rutas de reserva requieren la cookie de sesión. El catálogo sigue siendo público.
Usar `http://localhost:5173` en desarrollo; `FRONTEND_URL` debe coincidir exactamente
con el origen del navegador. La API permite credenciales solo para ese origen y
rechaza escrituras con un origen distinto. En producción usar HTTPS y
`NODE_ENV=production` para activar cookies Secure.

### Actualizar una base existente

Desde `backend`, ejecutar `npm run db:migrate` y reiniciar el servidor.
Las migraciones añaden el nombre del comprador, los campos de acceso y las sesiones
sin eliminar datos. Se pueden repetir. Una instalación nueva con `npm run db:setup`
ya incluye estas estructuras.

El usuario de demostración anterior y sus compras se conservan como datos históricos;
no se le asigna una contraseña predeterminada. Las cuentas nuevas se crean desde
la página y empiezan con sus propios límites. El registro no incluye recuperación
de contraseña ni verificación de correo.
