import { useEffect, useRef, useState } from 'react';
import { useTema } from '../../lib/tema';

// Botón de tema del encabezado (prototipo "modo oscuro"): muestra sol o luna
// según cómo se ve la app y abre el menú "Apariencia" con Claro / Oscuro /
// Automático. La elección queda guardada en este celular.
const OPCIONES = [
  { id: 'claro', label: 'Claro', ayuda: 'Siempre claro' },
  { id: 'oscuro', label: 'Oscuro', ayuda: 'Siempre oscuro' },
  { id: 'auto', label: 'Automático', ayuda: 'Igual que el celular' },
];

function IconoSol(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconoLuna(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconoCelular(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  );
}

const ICONO = { claro: IconoSol, oscuro: IconoLuna, auto: IconoCelular };

export function TemaSelector() {
  const { preferencia, oscuro, elegir } = useTema();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);

  // Cerrar al tocar afuera o con Escape
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false); };
    const tecla = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const Actual = oscuro ? IconoLuna : IconoSol;

  return (
    <div ref={caja} className="relative shrink-0 md:order-3">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Apariencia"
        aria-haspopup="true"
        aria-expanded={abierto}
        className="min-h-[44px] min-w-[44px] rounded-xl border border-[#B8C6C1] bg-white flex items-center justify-center hover:bg-slate-50"
      >
        <Actual className="w-5 h-5" aria-hidden="true" />
      </button>

      {abierto && (
        <div className="absolute right-0 top-[52px] z-30 w-60 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/10">
          <p className="px-1 pb-2 text-sm font-bold text-slate-900">Apariencia</p>
          <div role="radiogroup" aria-label="Tema de la app" className="flex flex-col gap-1">
            {OPCIONES.map((o) => {
              const Icono = ICONO[o.id];
              const activo = preferencia === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => { elegir(o.id); setAbierto(false); }}
                  className={'flex items-center gap-3 min-h-[48px] px-3 rounded-xl text-left ' + (activo ? 'bg-flox-50 text-flox-700' : 'text-slate-700 hover:bg-slate-50')}
                >
                  <Icono className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[15px] font-semibold">{o.label}</span>
                    <span className="text-xs text-slate-500">{o.ayuda}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
