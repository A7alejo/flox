# Flox — Frontend

PWA mobile-first (React + Vite + Tailwind CSS) para la gestión interna de Flox.
Consume la API de `../backend` (ver `backend/README.md`).

## Desarrollo

```
cp .env.example .env     # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev              # http://localhost:5173
```

El backend tiene que estar corriendo en el puerto 4000 y `http://localhost:5173`
tiene que figurar en su `CORS_ORIGINS` (ya viene así en `backend/.env.example`).

`npm run build` genera `dist/` con el service worker; `npm run preview` lo sirve
(puerto 4173: agregarlo a `CORS_ORIGINS` si se prueba contra el backend real).

## Variables de entorno

| Variable | Dev | Producción (Vercel) |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000/api` | URL pública del backend en Render **con** el sufijo `/api`, ej. `https://flox-api.onrender.com/api` |

- Vite incrusta la variable en el build: si se cambia en Vercel hay que **re-deployar**.
- La URL del frontend en Vercel tiene que estar en `CORS_ORIGINS` del backend (sin `*`),
  y el backend debe correr con `NODE_ENV=production` para que la cookie salga
  `Secure; SameSite=None`.

## Estructura

```
src/
├── api/          Única capa que habla con el backend
│   ├── client.js     fetch con credentials:'include', ApiError, manejo de 401
│   └── auth.js · productos.js · caja.js · envios.js · dashboard.js
├── context/      AuthContext: GET /auth/me al arrancar, login/logout
├── lib/          format, constants (enums de la API), useFetch, paleta de gráficos
├── components/   ui/ (primitivas) · layout/ (nav, banner de instalación) · dashboard/ · inventario/ · caja/ · envios/
└── pages/        Login · Dashboard · Inventario · Caja · Envios
```

Reglas del proyecto:

- Los componentes **nunca** hacen `fetch` ni arman URLs: importan funciones de `src/api/*`.
- Los servicios devuelven datos ya normalizados (camelCase, `number` en vez de los
  `NUMERIC` como string que manda Postgres). Los componentes no conocen nombres de columna.
- La sesión vive en una cookie `httpOnly`; el frontend no guarda ningún token.

## PWA

`vite-plugin-pwa` genera el manifest y el service worker. Solo se precachea el shell
estático; las llamadas a la API nunca se cachean. En Android/Chrome aparece el botón
"Instalar"; en iOS se muestra la instrucción "Compartir → Agregar a pantalla de inicio".
Los íconos están en `public/` (192, 512, maskable y apple-touch-icon).
