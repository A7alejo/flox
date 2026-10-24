// Apariencia de la app: "claro", "oscuro" o "automatico" (sigue el modo del dispositivo).
// La elección se guarda en este navegador. Los estilos viven en index.css
// (html[data-theme="oscuro"]), así las pantallas no cambian.
const CLAVE = 'flox_tema';
const OPCIONES = ['claro', 'oscuro', 'automatico'];
const oscuroSistema = window.matchMedia('(prefers-color-scheme: dark)');

export function leerTema() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    return OPCIONES.includes(guardado) ? guardado : 'automatico';
  } catch {
    return 'automatico';
  }
}

function aplicar(tema) {
  const efectivo = tema === 'automatico' ? (oscuroSistema.matches ? 'oscuro' : 'claro') : tema;
  document.documentElement.dataset.theme = efectivo;
}

export function guardarTema(tema) {
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    // Sin almacenamiento (navegación privada): el cambio dura solo esta sesión.
  }
  aplicar(tema);
}

export function siguienteTema(tema) {
  return OPCIONES[(OPCIONES.indexOf(tema) + 1) % OPCIONES.length];
}

export function iniciarTema() {
  aplicar(leerTema());
  oscuroSistema.addEventListener('change', () => {
    if (leerTema() === 'automatico') aplicar('automatico');
  });
}
