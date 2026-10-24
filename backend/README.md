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

## Deploy (Render + Vercel + Supabase)

Esquema: el navegador habla **solo** con `https://floxer.vercel.app`. Vercel sirve
la PWA y reenvía `/api/*` a `https://floxer-api.onrender.com` (`frontend/vercel.json`).
Así la cookie de sesión es del mismo dominio y funciona también en Safari/iPhone,
que bloquea las cookies de terceros.

**1. Render (API)** — New > Blueprint > repo `A7alejo/flox`: toma `render.yaml`
de la raíz (servicio `floxer-api`, plan free, `rootDir: backend`, health check
`/health`). `JWT_SECRET` lo genera Render. Cargar a mano:
- `DATABASE_URL`: la del **Session pooler** de Supabase (`*.pooler.supabase.com:5432`).
- `DB_SSL_CA` (recomendado): el certificado de Supabase, para verificar la conexión.

Si Render no da el nombre `floxer-api`, actualizar la URL en `frontend/vercel.json`.

**2. Vercel (PWA)** — Add New > Project > repo `A7alejo/flox`:
- Project Name: `floxer` (queda `floxer.vercel.app`).
- Root Directory: `frontend`. Framework: Vite (build `npm run build`, output `dist`).
- No hace falta `VITE_API_URL`: por defecto es `/api`.

**3. Supabase** — la base ya tiene `schema.sql` y las migraciones 001 a 004.
Los usuarios existentes sirven tal cual; para crear más: Panel de Admin o
`npm run crear-usuario` apuntando `DATABASE_URL` a esa base.

**4. Probar**: `https://floxer-api.onrender.com/health` → `{ "status": "ok" }`, después
entrar a `https://floxer.vercel.app` desde el celular, iniciar sesión e instalar la app.

> Render free se duerme tras ~15 min sin uso: el primer pedido después tarda
> ~30-60 s en responder. Es normal en el plan gratuito.

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
- **`secure` + `sameSite`**: la cookie va siempre con `SameSite=Lax`, porque
  el navegador solo ve el dominio de Vercel (que reenvía `/api` a Render). En
  producción (`NODE_ENV=production`) además va con `Secure` (solo HTTPS); en
  desarrollo no, porque `localhost` no tiene HTTPS.
- **CSRF**: los POST/PUT/PATCH/DELETE con sesión exigen el encabezado
  `X-CSRF-Token` (`middlewares/csrf.js`); si falta o no coincide, `403`.
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
