# Food DEI · FluxCode

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Reactstrap](https://img.shields.io/badge/Reactstrap-343A40?style=for-the-badge&logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

**Evaluación II de Programación Web · Ejercicio 02 · UCA · Ciclo 02, 2026**

## ¿De qué trata el proyecto?

Food DEI es una aplicación web para reservar almuerzos de la empresa Food DEI S.A. de R.L. El reto consiste en armar una reserva con porciones limitadas, respetar el dinero disponible y confirmarla antes de que termine el tiempo. Integra un frontend de React con una API de Express y persistencia en PostgreSQL.

El menú se puede explorar sin iniciar sesión: muestra imágenes, precios, categorías, stock y una descripción de los ingredientes. Para reservar, cada persona crea una cuenta o inicia sesión. Cada cuenta nueva recibe **$100 de saldo mensual y $25 de presupuesto diario**, con reservas y consumos independientes. Todos comparten el inventario del restaurante.

## Equipo FluxCode

| Integrante | Carné |
| --- | --- |
| Heraldo Riquelmy Barrera Gomez | 00226325 |
| Jorge Alberto Escobar Menjivar | 00072325 |
| Erick Jose Claros López | 00071125 |
| Robert Stanley Colocho Andrade | 00054625 |
| Diego Leonardo Melara Munguía | 00180825 |

## Tecnologías utilizadas

| Tecnología | Uso en el proyecto |
| --- | --- |
| JavaScript | Lógica del cliente y del servidor, promesas y comunicación HTTP |
| Node.js | Ejecución del backend y herramientas de desarrollo |
| Express 5 | API REST, rutas y manejo de solicitudes |
| React 18 | Componentes, estado y hooks de la interfaz |
| Vite 8 | Servidor de desarrollo y compilación del frontend |
| Bootstrap 5 y Reactstrap 9 | Tarjetas, formularios, alertas, modales y diseño adaptable |
| CSS | Identidad visual, logo y presentación del catálogo |
| PostgreSQL y `pg` | Usuarios, sesiones, inventario, reservas y transacciones |
| `node:crypto` | Contraseñas con scrypt y tokens de sesión aleatorios |
| `node:test` | Pruebas unitarias y de integración |

## Requisitos previos

- **Node.js 22.12 o superior** y npm. Comprobar con `node --version` y `npm --version`.
- **PostgreSQL instalado y en ejecución**, con un usuario y contraseña conocidos.
- **Git** para clonar el repositorio.
- Dos terminales: una para el backend y otra para el frontend.
- DBeaver o pgAdmin son opcionales para consultar la base.

## Instalación y ejecución

Los siguientes comandos parten de la raíz del repositorio. Los comandos para copiar archivos están escritos para PowerShell; también se pueden copiar manualmente los archivos `.env.example` como `.env`.

### 1. Clonar el repositorio

```powershell
git clone https://github.com/HBarrera25/Evaluacion02_PW_Ejercicio02.git
cd Evaluacion02_PW_Ejercicio02
```

Si ya lo tienes clonado, abre una terminal dentro de esa carpeta.

### 2. Instalar y configurar el backend

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Editar `backend/.env` con las credenciales de tu instalación:

```dotenv
PORT=3000
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=food_dei
DB_USER=postgres
DB_PASSWORD=TU_CLAVE_LOCAL
RESERVA_DURACION_MINUTOS=5
```

Los archivos `.env` están excluidos de Git. El backend carga su configuración desde `backend/.env`.

### 3. Preparar la base de datos

**Primera instalación, con una base nueva o vacía:**

```powershell
npm run db:setup
```

El comando crea `food_dei` si no existe y ejecuta `database/schema.sql` y `database/seed.sql`, en ese orden. El usuario de PostgreSQL necesita permiso para crear la base; alternativamente, crear una base vacía llamada `food_dei` desde DBeaver o pgAdmin antes de ejecutar el comando.

Se cargan ocho alimentos. El flan comienza sin stock para demostrar el estado **Agotado**. También se conserva un usuario de demostración sin credenciales; para usar la aplicación se debe crear una cuenta desde la página.

**Si la base ya corresponde a una versión anterior del proyecto:**

```powershell
npm run db:migrate
```

Las migraciones añaden el nombre del comprador, los campos de acceso y las sesiones sin borrar registros. Pueden ejecutarse nuevamente. No ejecutar `db:setup` ni volver a cargar el seed sobre datos existentes: `db:setup` se detiene si encuentra tablas para proteger la información.

### 4. Iniciar el backend

Desde `backend`, en la primera terminal:

```powershell
npm run dev
```

Debe aparecer el mensaje de conexión con PostgreSQL y la dirección **http://localhost:3000**. Para ejecutar sin reinicio automático se puede usar `npm start`.

Comprobación rápida del catálogo público:

```powershell
Invoke-RestMethod http://localhost:3000/api/menu
```

### 5. Instalar e iniciar el frontend

En la segunda terminal, desde la raíz del repositorio:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev -- --strictPort
```

El archivo `frontend/.env` contiene:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Abrir **http://localhost:5173**. Mantener ambas terminales abiertas y detener cada servidor con `Ctrl+C` cuando se termine de usar.

Si se cambia el puerto del backend, actualizar `VITE_API_URL`. Si se cambia el puerto del frontend, actualizar `FRONTEND_URL` para que coincida exactamente con el origen del navegador y reiniciar los servidores. Usar `localhost` de forma consistente para las cookies de sesión.

## Cómo usar Food DEI

1. **Explorar:** consultar el menú y tocar la foto, el nombre o **Ver qué lleva** para leer la descripción del plato.
2. **Reservar:** pulsar **Hacer una reserva** o **Añadir a la Reserva**. Si no hay sesión, se abre el acceso sobre el menú; se puede cerrar y seguir explorando.
3. **Crear una cuenta:** escribir el nombre, un nombre de usuario único de 3 a 30 letras sin tildes, números o guion bajo y una contraseña de 8 a 128 caracteres. También se puede entrar con una cuenta existente.
4. **Continuar:** al entrar desde una acción de reserva, se inicia la reserva y se añade el plato seleccionado, si lo había. Entrar desde el botón del encabezado permite iniciar la reserva después con **Iniciar nueva reserva**.
5. **Ajustar porciones:** usar **+**, **−** o **Quitar** en el carrito lateral. Reducir a cero elimina el plato. El stock, el total, el saldo disponible y el presupuesto restante se actualizan.
6. **Confirmar:** pulsar **Confirmar reserva** antes de que termine el contador. Se registra el nombre de la cuenta y se realiza el cobro definitivo.
7. **Vencimiento:** si no se confirma a tiempo, se cierra la reserva y se devuelve el stock. El servidor revisa el vencimiento cada segundo, incluso si se cierra el navegador. Se puede iniciar otra reserva.
8. **Cambiar de persona:** cerrar sesión y entrar con otra cuenta. Sus reservas y su dinero son independientes.

### Reglas de negocio

- El stock se retiene al añadir y se libera al reducir, quitar o vencer la reserva.
- No se permite reservar por encima del stock, del saldo mensual o del presupuesto diario restante.
- Confirmar no vuelve a descontar stock. Repetir la confirmación no cobra dos veces.
- Cada usuario puede tener una sola reserva activa. Las reservas cerradas conservan sus ítems como historial en la base.
- `saldoMensual` es el saldo contable; `saldo` descuenta temporalmente la reserva activa; `presupuestoDisponible` resta las compras confirmadas de hoy y la reserva activa.
- El día se calcula en la zona `America/El_Salvador`. Iniciar sesión nuevamente no recarga el saldo ni reinicia el gasto diario. El saldo mensual es un importe inicial: no hay recarga mensual automática.
- El plazo se configura con `RESERVA_DURACION_MINUTOS` (5 minutos por defecto).
- Las cuentas y sesiones persisten en PostgreSQL. Las contraseñas se guardan con scrypt y sal aleatoria; las cookies de sesión son HttpOnly/SameSite=Lax y duran siete días. Cerrar sesión revoca el token del servidor.
- Las rutas de reserva comprueban el usuario autenticado. El nombre del comprador se toma de su cuenta.

## Estructura del proyecto

```text
Evaluacion02_PW_Ejercicio02/
├── backend/
│   ├── scripts/
│   │   ├── setup-db.js                 # Crea una base vacía y carga esquema y datos
│   │   └── migrate-db.js               # Actualiza una base existente sin borrar datos
│   ├── src/
│   │   ├── app.js                     # Express, CORS y conexión de rutas y middleware
│   │   ├── server.js                  # Arranque, conexión y cierre del servidor
│   │   ├── config/db.js               # Configuración y pool de PostgreSQL
│   │   ├── controllers/               # Solicitudes de menú, reservas, porciones y cobro
│   │   ├── jobs/expirarReservas.js     # Revisión periódica de reservas vencidas
│   │   ├── middleware/errorHandler.js # Respuestas de error centralizadas
│   │   ├── repositories/              # Consultas de alimentos, reservas, usuarios y sesiones
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # Registro, login, sesiones y autorización
│   │   │   ├── menu.routes.js         # Consulta del catálogo público
│   │   │   └── reserva.routes.js      # Operaciones sobre la reserva del usuario
│   │   └── services/                  # Stock, porciones, presupuesto y transacciones
│   ├── test/
│   │   ├── confirmacion.service.test.js # Validación de identificadores
│   │   └── reserva.integration.test.js # Flujo HTTP con PostgreSQL aislado
│   ├── .env.example                   # Ejemplo de configuración del backend
│   ├── package.json                   # Dependencias y comandos del backend
│   └── package-lock.json              # Versiones de dependencias
├── database/
│   ├── migrations/                    # Cambios para bases de versiones anteriores
│   ├── schema.sql                     # Tablas, restricciones e índices
│   └── seed.sql                       # Catálogo y datos iniciales
├── frontend/
│   ├── public/images/                 # Logo e imágenes locales del menú
│   ├── src/
│   │   ├── components/                # Acceso, catálogo, carrito, saldo, logo y contador
│   │   ├── hooks/useReserva.js        # Estado, carga, acciones y vencimiento de reservas
│   │   ├── services/api.js            # Peticiones HTTP y cookies de sesión
│   │   ├── styles/app.css             # Estilos e identidad visual
│   │   ├── App.jsx                    # Menú público, sesión y flujo de reservas
│   │   └── main.jsx                   # Entrada de React e importación de estilos
│   ├── .env.example                   # URL de la API para el frontend
│   ├── index.html                     # Documento base de Vite
│   ├── package.json                   # Dependencias y comandos del frontend
│   └── package-lock.json              # Versiones de dependencias
├── .gitignore                         # Exclusión de secretos y archivos generados
└── README.md                          # Documentación central del proyecto
```

`node_modules/`, `dist/` y los archivos `.env` se generan localmente y no se versionan. Los README que incluyan las dependencias instaladas pertenecen a esas bibliotecas; la documentación propia del proyecto se concentra en este archivo.

## API REST

El catálogo es público. Las rutas de reserva y la consulta de sesión requieren la cookie emitida al registrarse o iniciar sesión.

| Método | Ruta | Función o cuerpo |
| --- | --- | --- |
| GET | `/api/menu` | Catálogo, precios y stock |
| POST | `/api/auth/registro` | `{ "nombre": "Ana Pérez", "nombreUsuario": "ana", "password": "una-clave-larga" }` |
| POST | `/api/auth/ingresar` | `{ "nombreUsuario": "ana", "password": "una-clave-larga" }` |
| GET | `/api/auth/sesion` | Datos públicos de la cuenta actual |
| POST | `/api/auth/salir` | Cierra y revoca la sesión |
| GET | `/api/reserva` | Reserva, saldo y presupuesto disponible |
| POST | `/api/reserva/iniciar` | Inicia o recupera la reserva activa |
| POST | `/api/reserva/agregar` | `{ "alimentoId": 1, "cantidad": 1 }` |
| PUT | `/api/reserva/actualizar-porciones/:id` | `{ "cantidad": 2 }`, cantidad final; cero quita el plato |
| DELETE | `/api/reserva/eliminar/:id` | Quita todas las porciones y devuelve stock |
| POST | `/api/reserva/confirmar` | `{ "reservaId": 1 }`, cobra una sola vez |
| POST | `/api/reserva/expirar` | Sincroniza el vencimiento sin anticiparlo |

Se conservan PATCH `/api/reserva/porciones` y DELETE `/api/reserva/items/:alimentoId` por compatibilidad. Las validaciones responden con mensajes para la interfaz: stock y saldo insuficientes devuelven HTTP 400; sin sesión se devuelve 401; una reserva vencida o vacía al confirmar devuelve 409.

## Pruebas y compilación

Desde `backend`, con PostgreSQL activo y `.env` configurado:

```powershell
npm test
```

Para ejecutar únicamente las pruebas de integración:

```powershell
npm run test:integration
```

Las pruebas de integración crean un esquema temporal exclusivo, cargan sus propios datos y lo eliminan al terminar. Requieren permiso para crear esquemas; no usan las tablas reales de `public`. Comprueban registro, login, cuentas independientes, autorización, stock, dinero, concurrencia, confirmación sin doble cobro y vencimiento automático.

Desde `frontend`, generar la versión de producción:

```powershell
npm run build
```

La salida queda en `frontend/dist`. Para verla localmente, ejecutar `npm run preview -- --port 5173 --strictPort` con el servidor de desarrollo del frontend detenido y el backend encendido.

## Datos, imágenes y personalización

- **Precios y stock actuales:** editar la tabla `alimentos` desde DBeaver o pgAdmin. Los precios deben ser mayores que cero. Los ítems ya reservados conservan su precio unitario original.
- **Datos para instalaciones nuevas:** editar `database/seed.sql`; cambiarlo no modifica una base existente.
- **Saldo y presupuesto para cuentas nuevas:** modificar los valores iniciales del INSERT en `backend/src/repositories/usuario.repository.js`. Cambiar también el texto de presentación en `frontend/src/components/Acceso.jsx`.
- **Textos del login y registro:** `frontend/src/components/Acceso.jsx`.
- **Descripción de los platos:** `frontend/src/components/PlatoCard.jsx`; si la API incluye `descripcion`, ese contenido tiene prioridad.
- **Estilos y logo:** `frontend/src/styles/app.css` y `frontend/src/components/Logo.jsx`.
- **Recursos locales:** `frontend/public/images/menu-platos.png` contiene las ocho fotos ilustrativas generadas con IA en cuatro columnas y dos filas. `food-dei-logo.png` contiene el logo aprobado. No se depende de servicios externos para servir estas imágenes.

Para consultar el catálogo desde un editor SQL:

```sql
SELECT id, nombre, precio, stock FROM alimentos ORDER BY id;
```

## Problemas frecuentes

| Problema | Qué revisar |
| --- | --- |
| No se conecta con PostgreSQL | Servicio activo, puerto y credenciales de `backend/.env` |
| `db:setup` indica que ya hay tablas | Para una instalación previa, usar `npm run db:migrate` |
| Error por una columna o tabla de sesión inexistente | Ejecutar las migraciones y reiniciar el backend |
| No se conecta con la API | Backend encendido y `VITE_API_URL` correcto |
| Login no conserva la sesión o aparece error de origen | Usar `localhost` y hacer coincidir `FRONTEND_URL` con el puerto del frontend |
| Puerto 3000 o 5173 ocupado | Detener el otro proceso o cambiar los puertos y sus variables relacionadas |
| Las pruebas fallan al crear un esquema | Dar permiso de creación de esquemas al usuario de la base de pruebas |

Para un despliegue fuera del entorno local, usar HTTPS y `NODE_ENV=production` para activar cookies Secure. Este proyecto no incluye recuperación de contraseña ni verificación de correo.
