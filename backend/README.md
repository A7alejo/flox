# Flox — Backend

API REST en Node.js + Express + PostgreSQL para la app de gestión interna de Flox.

## Estructura

```
flox-backend/
├── database/
│   └── schema.sql          ← DDL completo, correr una vez en Supabase
├── src/
│   ├── config/db.js         ← Pool de conexión + helper de transacciones
│   ├── routes/               ← Define URLs y verbos HTTP, delega al controller
│   ├── controllers/          ← Lee req, llama al service, arma res (sin SQL)
│   ├── services/              ← Reglas de negocio y validaciones (sin SQL directo)
│   ├── repositories/          ← Única capa que escribe SQL
│   ├── middlewares/            ← errorHandler, requireAuth, loginRateLimiter
│   ├── utils/                   ← HttpError, asyncHandler, jwt.js
│   ├── app.js                 ← Configuración de Express (helmet, cors, cookies, rutas)
│   └── server.js              ← Punto de entrada (arranca el server)
├── scripts/
│   └── crear-usuario.js    ← Alta de usuarios por consola (no hay registro público)
├── package.json
└── .env.example
```

Patrón: **Route → Controller → Service → Repository → DB**. Cada capa solo
conoce a la siguiente; el Controller nunca escribe SQL y el Repository
nunca valida reglas de negocio.

## Puesta en marcha

1. Crear la base en Supabase y correr `database/schema.sql` en el SQL Editor.
2. Copiar `.env.example` a `.env` y completar `DATABASE_URL` con la connection
   string de Supabase (Project Settings → Database → Connection string).
3. Generar un `JWT_SECRET` propio (no usar un valor de ejemplo):
   `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
4. `npm install`
5. Crear los 2 usuarios iniciales: `npm run crear-usuario -- "Nombre" email@ejemplo.com`
   (pide la contraseña de forma oculta, no hay endpoint público de registro)
6. `npm run dev` (con nodemon) o `npm start`
7. Probar: `GET http://localhost:4000/health` → `{ "status": "ok" }`

## Deploy en Render

- Build command: `npm install`
- Start command: `npm start`
- Variables de entorno: copiar las mismas de `.env`, con estos cambios para producción:
  - `NODE_ENV=production` (activa cookies `Secure` + `SameSite=None`, imprescindible
    porque el frontend en Vercel y el backend en Render son dominios distintos)
  - `JWT_SECRET` con un valor generado para producción, distinto al de desarrollo
  - `CORS_ORIGINS` con la URL exacta del frontend en Vercel (sin `*`)
- Después del primer deploy, correr `npm run crear-usuario` **una vez**, apuntando
  `DATABASE_URL` a la base de producción (se puede correr en local, ya que Supabase
  es accesible desde afuera).

## Endpoints

Base URL: `/api`. **Todos los endpoints salvo `/auth/login` y `/auth/logout`
exigen sesión** (cookie `flox_token` válida) — si no, responden `401`.

### Auth
| Verbo | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` → setea cookie httpOnly y devuelve `{ usuario }` |
| POST | `/auth/logout` | Borra la cookie de sesión |
| GET | `/auth/me` | Devuelve el usuario autenticado actual |
| PUT | `/auth/password` | `{ passwordActual, passwordNueva }` → cambia la contraseña |

### Productos
| Verbo | Ruta | Descripción |
|---|---|---|
| GET | `/productos` | Lista productos. Query: `search`, `categoria`, `incluirInactivos` |
| GET | `/productos/calcular-precio` | Preview de precio. Query: `costoBase`, `porcentajeMargen` |
| GET | `/productos/:id` | Detalle de un producto |
| POST | `/productos` | Crea producto |
| PUT | `/productos/:id` | Edita producto |
| DELETE | `/productos/:id` | Baja lógica (`activo = false`) |

### Caja
| Verbo | Ruta | Descripción |
|---|---|---|
| GET | `/caja/movimientos` | Historial. Query: `tipo`, `medioPago`, `desde`, `hasta`, `limit`, `offset` |
| GET | `/caja/balance` | Totales ingresos/egresos/balance. Query: `desde`, `hasta` |
| POST | `/caja/ventas` | Venta rápida (transacción: descuenta stock + registra ingreso) |
| POST | `/caja/egresos` | Registra un gasto |

### Envíos
| Verbo | Ruta | Descripción |
|---|---|---|
| GET | `/envios` | Lista envíos. Query: `estado` |
| GET | `/envios/:id` | Detalle con productos despachados |
| POST | `/envios` | Crea envío con su detalle de productos |
| PUT | `/envios/:id/estado` | Cambia estado (`en_preparacion`, `listo_despacho`, `entregado`) |
| DELETE | `/envios/:id` | Elimina envío |

### Dashboard
| Verbo | Ruta | Descripción |
|---|---|---|
| GET | `/dashboard/resumen` | Balance total + stock total + alertas de stock bajo + `mensual` (totales del mes actual y del anterior, en hora de Argentina, para los deltas) |
| GET | `/dashboard/ingresos-egresos` | Evolución diaria. Query: `dias` (default 7) |
| GET | `/dashboard/medios-pago` | Desglose de ingresos por medio de cobro. Query: `desde`, `hasta` |
| GET | `/dashboard/top-productos` | Productos más vendidos por unidades. Query: `limite` (default 5, máx 20), `desde`, `hasta` |
| GET | `/dashboard/stock-critico` | Productos en o por debajo del stock mínimo |

> `GET /envios` incluye `productos` (detalle) en cada envío, con la misma forma que `GET /envios/:id`.

## Por qué está así

- **`precio_venta` es una columna `GENERATED` en Postgres**, no se calcula en
  JS al guardar. Así nunca puede quedar desincronizada de `costo_base` /
  `porcentaje_margen`, ni siquiera si alguien edita la fila directo en Supabase.
  `GET /productos/calcular-precio` existe solo para el preview en vivo del
  formulario, antes de guardar.
- **`registrarVenta` usa `SELECT ... FOR UPDATE` dentro de una transacción**:
  bloquea la fila del producto mientras dura la operación, para que si los
  dos usuarios registran una venta del mismo producto al mismo tiempo, no
  se pise el descuento de stock entre sí (condición de carrera).
- **Baja de productos es lógica (`activo = false`)**, no `DELETE`, porque el
  historial de ventas (`movimientos_caja`) y de envíos (`envio_detalle`)
  referencian `producto_id`; borrar de verdad rompería ese historial.

## Seguridad

- **Contraseñas**: nunca se guardan en texto plano. Se hashean con `bcryptjs`
  (12 rounds) antes de insertarse en `usuarios.password_hash`. El login
  compara con `bcrypt.compare`, nunca comparando strings directamente.
- **No hay registro público**: con solo 2 usuarios reales, el alta se hace
  por consola (`scripts/crear-usuario.js`), no por un endpoint HTTP que
  cualquiera podría golpear.
- **El JWT vive en una cookie `httpOnly`, nunca en `localStorage`**: con
  `httpOnly: true` el JavaScript del navegador no puede leer la cookie, así
  que un ataque XSS no puede robar la sesión (que es exactamente lo que sí
  podría pasar si el token se guardara en `localStorage`). El frontend ni
  siquiera necesita manejar el token: solo tiene que mandar
  `credentials: 'include'` en cada `fetch`.
- **`secure` + `sameSite` según el entorno**: en producción (`NODE_ENV=production`)
  la cookie va con `Secure` (solo viaja por HTTPS) y `SameSite=None` (necesario
  porque Vercel y Render son dominios distintos). En desarrollo local va con
  `SameSite=Lax` sin `Secure`, porque `localhost` no tiene HTTPS.
- **Mismo mensaje de error** si el email no existe o si la contraseña es
  incorrecta ("Credenciales inválidas"), para no revelarle a un atacante
  qué emails son válidos.
- **Rate limiting en `/auth/login`**: máximo 10 intentos cada 15 minutos por
  IP, para frenar fuerza bruta sobre las contraseñas.
- **`helmet()`** agrega los headers HTTP de seguridad recomendados por
  defecto (oculta `X-Powered-By`, etc.).
- **CORS con `origin` explícito, nunca `*`**: con `credentials: true` el
  navegador directamente rechaza `*`, así que `CORS_ORIGINS` tiene que listar
  las URLs exactas permitidas (frontend en Vercel + localhost en dev).
- **`app.set('trust proxy', 1)`**: necesario en Render (y cualquier PaaS
  detrás de un proxy) para que Express detecte bien que la conexión es HTTPS
  y para que el rate limiter identifique la IP real del cliente.
- **`JWT_SECRET` obligatorio**: `src/utils/jwt.js` tira un error al arrancar
  si falta, para no correr nunca con un secreto vacío o adivinable. Hay que
  generarlo (ver "Puesta en marcha") y usar un valor distinto en desarrollo
  y en producción.
- **El error 500 nunca expone el stack trace** al cliente (`errorHandler.js`
  devuelve siempre "Error interno del servidor" y loguea el detalle solo en
  el servidor).

### Qué falta si en el futuro hace falta más (no incluido a propósito, por ser 2 usuarios internos de confianza)
- Refresh tokens / rotación de sesión.
- Roles o permisos distintos entre los dos usuarios (hoy ambos tienen el mismo acceso total).
- 2FA.
