// =====================================================================
// Tema de la app: 'claro' | 'oscuro' | 'auto' (sigue al celular).
// La preferencia se guarda en este dispositivo (localStorage). El modo
// oscuro es solo apariencia: pone la clase "dark" en <html> y la hoja
// theme-dark.css recolorea las mismas clases que ya usan las pantallas.
// index.html aplica la clase antes de pintar, para que no "parpadee".
// =====================================================================
import { useEffect, useState } from 'react';

const CLAVE = 'floxer-tema';
const OPCIONES = ['claro', 'oscuro', 'auto'];
const COLOR_BARRA = { claro: '#16285A', oscuro: '#13214A' };

const mediaOscuro = () => window.matchMedia('(prefers-color-scheme: dark)');

export function leerPreferencia() {
  try {
    const valor = localStorage.getItem(CLAVE);
    return OPCIONES.includes(valor) ? valor : 'auto';
  } catch {
    return 'auto'; // navegación privada o almacenamiento bloqueado
  }
}

function esOscuro(preferencia) {
  return preferencia === 'oscuro' || (preferencia === 'auto' && mediaOscuro().matches);
}

function aplicar(preferencia) {
  const oscuro = esOscuro(preferencia);
  document.documentElement.classList.toggle('dark', oscuro);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', oscuro ? COLOR_BARRA.oscuro : COLOR_BARRA.claro);
  return oscuro;
}

// Hook para el selector: devuelve la preferencia, si se ve oscuro y cómo cambiarla.
export function useTema() {
  const [preferencia, setPreferencia] = useState(leerPreferencia);
  const [oscuro, setOscuro] = useState(() => esOscuro(preferencia));

  useEffect(() => {
    setOscuro(aplicar(preferencia));
    if (preferencia !== 'auto') return undefined;
    // En automático, seguir los cambios del celular (ej. modo noche programado).
    const media = mediaOscuro();
    const alCambiar = () => setOscuro(aplicar('auto'));
    media.addEventListener('change', alCambiar);
    return () => media.removeEventListener('change', alCambiar);
  }, [preferencia]);

  const elegir = (valor) => {
    try {
      localStorage.setItem(CLAVE, valor);
    } catch {
      // sin almacenamiento: el cambio vale hasta recargar
    }
    setPreferencia(valor);
  };

  return { preferencia, oscuro, elegir };
}
