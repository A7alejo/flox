// =====================================================================
// Notificaciones push (Web Push). Cuando alguien registra una venta, un
// gasto o un producto, los demás usuarios con la app instalada reciben un
// aviso en el celular. Quien hizo la acción no recibe el suyo.
//
// Necesita VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT (ver
// render.yaml). Sin ellas el resto de la app funciona igual: las
// notificaciones quedan apagadas y `notificar` no hace nada.
// =====================================================================
const webpush = require('web-push');
const pushRepo = require('../repositories/push.repository');
const HttpError = require('../utils/HttpError');

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@floxer.app';
const HABILITADO = Boolean(PUBLIC_KEY && PRIVATE_KEY);

if (HABILITADO) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
} else {
  console.warn('[PUSH] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY no están definidas: las notificaciones están apagadas.');
}

// El servidor le habla a la dirección que manda el navegador. Para que nadie
// pueda hacerle pegar a cualquier sitio, solo aceptamos los servicios de push
// reales (Chrome/Android, Firefox, Safari/iPhone, Edge).
const HOSTS_PUSH = [
  /(^|\.)googleapis\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)push\.apple\.com$/,
  /(^|\.)notify\.windows\.com$/,
];

function validarEndpoint(endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new HttpError(400, 'Suscripción inválida');
  }
  if (url.protocol !== 'https:' || endpoint.length > 1000 || !HOSTS_PUSH.some((re) => re.test(url.hostname))) {
    throw new HttpError(400, 'Suscripción inválida');
  }
  return endpoint;
}

function validarClave(valor) {
  if (typeof valor !== 'string' || !/^[A-Za-z0-9_-]{8,200}$/.test(valor)) {
    throw new HttpError(400, 'Suscripción inválida');
  }
  return valor;
}

const aBool = (v) => v !== false; // por defecto, todos los avisos activos

function normalizarAvisos(avisos = {}) {
  return { ventas: aBool(avisos.ventas), gastos: aBool(avisos.gastos), productos: aBool(avisos.productos) };
}

const aAvisos = (fila) => (fila ? { ventas: fila.avisa_ventas, gastos: fila.avisa_gastos, productos: fila.avisa_productos } : null);

function claveVapid() {
  return { habilitado: HABILITADO, publicKey: HABILITADO ? PUBLIC_KEY : null };
}

async function guardarSuscripcion(usuarioId, { subscription, avisos }, userAgent) {
  if (!HABILITADO) throw new HttpError(503, 'Las notificaciones no están activadas en el servidor');
  const endpoint = validarEndpoint(subscription?.endpoint);
  const fila = await pushRepo.guardar({
    usuarioId,
    endpoint,
    p256dh: validarClave(subscription?.keys?.p256dh),
    auth: validarClave(subscription?.keys?.auth),
    userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 300) : null,
    avisos: normalizarAvisos(avisos),
  });
  return { avisos: aAvisos(fila) };
}

async function obtenerSuscripcion(usuarioId, endpoint) {
  const fila = await pushRepo.getAvisos(usuarioId, validarEndpoint(endpoint));
  return { suscripto: Boolean(fila), avisos: aAvisos(fila) };
}

async function eliminarSuscripcion(usuarioId, endpoint) {
  await pushRepo.eliminar(usuarioId, validarEndpoint(endpoint));
}

const pesos = (n) => '$' + Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 });
const quien = (usuario) => (usuario?.nombre || 'Alguien').trim().slice(0, 40);
const recortar = (texto, max) => (texto.length > max ? texto.slice(0, max - 1) + '…' : texto);

// Textos de cada aviso. Corto: en el celular se ve en una o dos líneas.
const AVISOS = {
  venta: (usuario, { venta }) => ({
    tipo: 'ventas',
    titulo: venta.estado === 'pendiente' ? 'Venta pendiente' : 'Nueva venta',
    cuerpo: `${quien(usuario)} registró una venta de ${pesos(venta.total)}` + (venta.cliente_nombre ? ` para ${venta.cliente_nombre}` : ''),
    url: '/caja',
  }),
  cobro: (usuario, { venta }) => ({
    tipo: 'ventas',
    titulo: 'Venta cobrada',
    cuerpo: `${quien(usuario)} cobró una venta de ${pesos(venta.total)}`,
    url: '/caja',
  }),
  gasto: (usuario, { movimiento }) => ({
    tipo: 'gastos',
    titulo: 'Nuevo gasto',
    cuerpo: `${quien(usuario)} registró un gasto de ${pesos(movimiento.monto)}: ${recortar(String(movimiento.concepto || ''), 80)}`,
    url: '/caja',
  }),
  producto: (usuario, { producto }) => ({
    tipo: 'productos',
    titulo: 'Producto nuevo',
    cuerpo: `${quien(usuario)} agregó ${recortar(String(producto.nombre || ''), 80)}`,
    url: '/stock',
  }),
};

/**
 * Avisa a los demás usuarios. Se llama SIN await después de responder: un
 * problema con las notificaciones nunca debe afectar la venta, el gasto o el
 * producto, que ya quedaron guardados.
 */
async function notificar(evento, usuario, datos) {
  if (!HABILITADO) return;
  try {
    const armar = AVISOS[evento];
    if (!armar || !usuario?.id) return;
    const { tipo, titulo, cuerpo, url } = armar(usuario, datos);
    const destinos = await pushRepo.listarDestinos(tipo, usuario.id);
    if (destinos.length === 0) return;

    const mensaje = JSON.stringify({ titulo, cuerpo, url, tag: tipo });
    await Promise.allSettled(destinos.map(async (d) => {
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, mensaje, { TTL: 3600 });
      } catch (err) {
        // 404/410: el celular ya no existe o revocó el permiso -> se limpia.
        if (err.statusCode === 404 || err.statusCode === 410) await pushRepo.eliminarPorEndpoint(d.endpoint);
        else console.error('[PUSH] No se pudo enviar un aviso:', err.statusCode || err.message);
      }
    }));
  } catch (err) {
    console.error('[PUSH] Error al armar los avisos:', err.message);
  }
}

module.exports = { claveVapid, guardarSuscripcion, obtenerSuscripcion, eliminarSuscripcion, notificar };
