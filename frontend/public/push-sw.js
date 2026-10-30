// Notificaciones push de Floxer. El service worker principal (generado por
// vite-plugin-pwa) carga este archivo con importScripts.
/* eslint-env serviceworker */

self.addEventListener('push', (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { cuerpo: event.data ? event.data.text() : '' };
  }
  const titulo = datos.titulo || 'Floxer';
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.cuerpo || '',
      icon: '/pwa-192.png',
      badge: '/favicon.svg',
      tag: datos.tag || 'floxer', // avisos del mismo tipo se reemplazan, no se apilan sin fin
      renotify: true,
      data: { url: datos.url || '/' },
    })
  );
});

// Al tocar el aviso: abre la app (o la trae al frente) en la pantalla indicada.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if (new URL(v.url).origin === self.location.origin && 'focus' in v) {
          return v.focus().then((f) => (f && 'navigate' in f ? f.navigate(destino) : f));
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});
