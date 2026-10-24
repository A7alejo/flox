import { useState } from 'react';
import { leerTema, guardarTema, siguienteTema } from '../../lib/tema';

const ETIQUETA = { claro: 'Claro', oscuro: 'Oscuro', automatico: 'Automático' };

// Botón que pasa de Claro a Oscuro a Automático y recuerda la elección.
export function SelectorTema() {
  const [tema, setTema] = useState(leerTema);

  function cambiar() {
    const nuevo = siguienteTema(tema);
    guardarTema(nuevo);
    setTema(nuevo);
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      aria-label={`Tema: ${ETIQUETA[tema]}. Tocar para cambiar`}
      className="min-h-[44px] px-3 md:px-[14px] rounded-xl border border-[#B8C6C1] bg-white text-sm font-semibold hover:bg-slate-50 shrink-0"
    >
      <span className="md:hidden" aria-hidden="true">{tema === 'oscuro' ? '☾' : tema === 'claro' ? '☀' : 'A'}</span>
      <span className="hidden md:inline">{ETIQUETA[tema]}</span>
    </button>
  );
}
