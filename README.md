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
