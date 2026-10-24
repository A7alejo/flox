import { useEffect, useState } from 'react';

// =====================================================================
// Navegación con la URL (History API, sin librería). Cada pantalla tiene
// su dirección, así recargar la página no vuelve al inicio y Atrás/Adelante
// (del navegador o del celular) se mueven entre pantallas de la app.
//   /            Inicio
//   /stock       Stock por mes (cajones)
//   /stock/2026-10  un mes (el en curso es editable; los anteriores, solo lectura)
//   /caja · /envios · /usuarios
// En Vercel, vercel.json reescribe toda ruta a /index.html.
// =====================================================================

export const RUTAS = {
  dashboard: '/',
  inventario: '/stock',
  caja: '/caja',
  envios: '/envios',
  usuarios: '/usuarios',
};

const PAGINA_DE = { '': 'dashboard', stock: 'inventario', caja: 'caja', envios: 'envios', usuarios: 'usuarios' };

const EVENTO = 'flox:ruta';

// { pagina, partes }: "partes" son los segmentos después de la sección
// (ej. /stock/2026-10 -> pagina 'inventario', partes ['2026-10']).
// Una dirección desconocida da pagina null.
export function leerRuta(pathname) {
  const [seccion = '', ...partes] = pathname.split('/').filter(Boolean);
  return { pagina: PAGINA_DE[seccion] ?? null, partes };
}

// Va a `path` agregando un paso al historial (o reemplazando el actual,
// para corregir direcciones inválidas sin dejar un paso "muerto" para Atrás).
export function navegar(path, { reemplazar = false } = {}) {
  if (path !== window.location.pathname) {
    window.history[reemplazar ? 'replaceState' : 'pushState'](null, '', path);
    window.dispatchEvent(new Event(EVENTO));
  }
  if (!reemplazar) window.scrollTo(0, 0);
}

// Ruta actual; se actualiza con navegar() y con Atrás/Adelante (popstate).
export function useRuta() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const actualizar = () => setPath(window.location.pathname);
    window.addEventListener('popstate', actualizar);
    window.addEventListener(EVENTO, actualizar);
    return () => {
      window.removeEventListener('popstate', actualizar);
      window.removeEventListener(EVENTO, actualizar);
    };
  }, []);
  return leerRuta(path);
}

// '2026-10' <-> { anio: 2026, mes: 10 } (mes 1-12)
export const segmentoMes = ({ anio, mes }) => `${anio}-${String(mes).padStart(2, '0')}`;
export function leerSegmentoMes(segmento) {
  const m = /^(\d{4})-(\d{2})$/.exec(segmento ?? '');
  if (!m) return null;
  const mes = Number(m[2]);
  return mes >= 1 && mes <= 12 ? { anio: Number(m[1]), mes } : null;
}

// ---------------------------------------------------------------------
// Ventanitas (Modal) y el botón Atrás: cada una abierta agrega un paso al
// historial (misma URL, con marcador). Atrás la cierra y la pantalla queda
// igual; si se cierra con su botón, se quita ese paso (history.back) para no
// dejar pasos "muertos". Si mientras tanto se abre otra (ej. Editar ->
// Eliminar), su paso se agrega recién cuando termina ese back.
// ---------------------------------------------------------------------
const pilaModales = []; // [{ id, cerrar, porAtras }]
const pushPendientes = []; // ids esperando a que termine un back propio
let backsPropios = 0;
let proximoId = 0;

const agregarPaso = (id) => window.history.pushState({ floxModal: id }, '');

window.addEventListener('popstate', () => {
  if (backsPropios > 0) {
    // Es el back que hicimos al cerrar una ventanita con su botón: no cerrar nada.
    backsPropios--;
    if (backsPropios === 0) pushPendientes.splice(0).forEach(agregarPaso);
    return;
  }
  // Atrás de verdad: cerrar la ventanita de arriba si su paso ya no está.
  const arriba = pilaModales[pilaModales.length - 1];
  if (arriba && window.history.state?.floxModal !== arriba.id) {
    arriba.porAtras = true;
    arriba.cerrar();
  }
});

// Lo llama Modal al abrirse; devuelve la función para cuando se desmonta.
export function registrarModal(cerrar) {
  const entrada = { id: ++proximoId, cerrar, porAtras: false };
  pilaModales.push(entrada);
  if (backsPropios > 0) pushPendientes.push(entrada.id);
  else agregarPaso(entrada.id);

  return () => {
    const i = pilaModales.indexOf(entrada);
    if (i >= 0) pilaModales.splice(i, 1);
    if (entrada.porAtras) return; // su paso ya lo sacó el Atrás
    const pendiente = pushPendientes.indexOf(entrada.id);
    if (pendiente >= 0) {
      pushPendientes.splice(pendiente, 1); // nunca llegó a agregarse
    } else if (window.history.state?.floxModal === entrada.id) {
      backsPropios++;
      window.history.back();
    }
  };
}
