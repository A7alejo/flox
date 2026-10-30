// =====================================================================
// Notificaciones push en este celular. Todo el trabajo con el navegador
// (permiso, service worker, suscripción) vive acá; el componente solo
// muestra el estado.
// En iPhone solo existe con la app instalada en la pantalla de inicio (iOS 16.4+).
// =====================================================================
import * as api from '../api/push';

export const AVISOS_INICIALES = { ventas: true, gastos: true, productos: true };

export function pushSoportado() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// iPhone/iPad sin instalar: el navegador no ofrece push hasta "Agregar a inicio".
export function necesitaInstalar() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  return ios && !instalada;
}

// La clave pública viene en base64url; el navegador la pide como bytes.
function aBytes(base64url) {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const crudo = atob(base64);
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
}

const registro = () => navigator.serviceWorker.ready;

// { estado, avisos }. estado: 'no-soportado' | 'instalar' | 'apagado-servidor' |
// 'bloqueado' | 'inactivo' | 'activo'
export async function leerEstado() {
  if (!pushSoportado()) return { estado: necesitaInstalar() ? 'instalar' : 'no-soportado', avisos: AVISOS_INICIALES };
  const { habilitado } = await api.obtenerClave();
  if (!habilitado) return { estado: 'apagado-servidor', avisos: AVISOS_INICIALES };
  if (Notification.permission === 'denied') return { estado: 'bloqueado', avisos: AVISOS_INICIALES };

  const sub = await (await registro()).pushManager.getSubscription();
  if (!sub) return { estado: 'inactivo', avisos: AVISOS_INICIALES };
  const { suscripto, avisos } = await api.obtenerSuscripcion(sub.endpoint);
  // El navegador tiene la suscripción pero el servidor no (p. ej. se limpió): se vuelve a registrar.
  if (!suscripto) {
    await api.guardarSuscripcion(sub.toJSON(), AVISOS_INICIALES);
    return { estado: 'activo', avisos: AVISOS_INICIALES };
  }
  return { estado: 'activo', avisos };
}

export async function activar(avisos = AVISOS_INICIALES) {
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return { estado: permiso === 'denied' ? 'bloqueado' : 'inactivo', avisos };
  const { publicKey } = await api.obtenerClave();
  const reg = await registro();
  const sub = (await reg.pushManager.getSubscription())
    || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(publicKey) }));
  const guardado = await api.guardarSuscripcion(sub.toJSON(), avisos);
  return { estado: 'activo', avisos: guardado.avisos };
}

export async function cambiarAvisos(avisos) {
  const sub = await (await registro()).pushManager.getSubscription();
  if (!sub) return activar(avisos);
  const guardado = await api.guardarSuscripcion(sub.toJSON(), avisos);
  return { estado: 'activo', avisos: guardado.avisos };
}

export async function desactivar() {
  const sub = await (await registro()).pushManager.getSubscription();
  if (sub) {
    await api.eliminarSuscripcion(sub.endpoint).catch(() => {}); // si falla, igual se da de baja acá
    await sub.unsubscribe();
  }
  return { estado: 'inactivo', avisos: AVISOS_INICIALES };
}

// Al cerrar sesión: este celular deja de recibir avisos de ese usuario. La
// suscripción del navegador se conserva: cuando alguien inicia sesión acá,
// `leerEstado` la registra a su nombre (así no hay que volver a aceptar el permiso).
export async function quitarDelServidor() {
  if (!pushSoportado()) return;
  const sub = await (await registro()).pushManager.getSubscription();
  if (sub) await api.eliminarSuscripcion(sub.endpoint);
}
