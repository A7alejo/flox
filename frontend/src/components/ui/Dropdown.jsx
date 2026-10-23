import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { inputClass } from './Primitives';

// Desplegable propio (reemplaza al <select> nativo, cuya lista abierta no se
// puede estilizar): botón con el estilo de los inputs y un panel flotante
// redondeado con opciones agrupadas.
// - grupos: [{ label, opciones: [{ value, label }] }]  (o `opciones` sin grupos)
// - El panel es `fixed` y se ubica respecto del botón: así no lo recorta el
//   scroll del Modal. Si no entra abajo, se abre hacia arriba.
// - Teclado: Enter/Espacio/flechas abren; flechas mueven; Enter elige; Escape cierra.
export function Dropdown({ value, onChange, placeholder = 'Seleccionar', grupos, opciones, disabled = false, id, ...aria }) {
  const lista = grupos ?? [{ label: null, opciones: opciones ?? [] }];
  const planas = lista.flatMap((g) => g.opciones);
  const seleccionada = planas.find((o) => o.value === value);

  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1); // índice en `planas` resaltado con el teclado
  const [pos, setPos] = useState(null);
  const botonRef = useRef(null);
  const panelRef = useRef(null);
  const listId = useId();

  const abrir = () => {
    if (disabled) return;
    setActivo(Math.max(0, planas.findIndex((o) => o.value === value)));
    setAbierto(true);
  };
  const cerrar = (devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) botonRef.current?.focus();
  };
  const elegir = (op) => {
    onChange(op.value);
    cerrar();
  };

  // Posición del panel: debajo del botón, o arriba si no hay lugar.
  useLayoutEffect(() => {
    if (!abierto) return;
    const r = botonRef.current.getBoundingClientRect();
    const alto = Math.min(288, panelRef.current?.scrollHeight ?? 288);
    const abajo = window.innerHeight - r.bottom - 8;
    const haciaArriba = abajo < alto && r.top > abajo;
    setPos({
      left: r.left,
      width: r.width,
      top: haciaArriba ? undefined : r.bottom + 6,
      bottom: haciaArriba ? window.innerHeight - r.top + 6 : undefined,
      maxHeight: Math.max(160, (haciaArriba ? r.top : abajo) - 12),
    });
  }, [abierto]);

  // Cerrar al tocar afuera, o si se scrollea / cambia el tamaño (el panel quedaría desfasado).
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => {
      if (!panelRef.current?.contains(e.target) && !botonRef.current?.contains(e.target)) cerrar(false);
    };
    const reubicar = (e) => { if (!panelRef.current?.contains(e.target)) cerrar(false); };
    document.addEventListener('pointerdown', fuera);
    window.addEventListener('scroll', reubicar, true);
    window.addEventListener('resize', reubicar);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      window.removeEventListener('scroll', reubicar, true);
      window.removeEventListener('resize', reubicar);
    };
  }, [abierto]);

  // Mantener visible la opción resaltada al moverse con flechas. Se mueve solo el
  // scroll del panel (scrollIntoView movería también la página y cerraría la lista).
  useEffect(() => {
    const panel = panelRef.current;
    if (!abierto || !pos || !panel || activo < 0) return;
    const op = panel.querySelector(`[data-idx="${activo}"]`);
    if (!op) return;
    if (op.offsetTop < panel.scrollTop) panel.scrollTop = op.offsetTop - 6;
    else if (op.offsetTop + op.offsetHeight > panel.scrollTop + panel.clientHeight) {
      panel.scrollTop = op.offsetTop + op.offsetHeight - panel.clientHeight + 6;
    }
  }, [abierto, activo, pos]);

  // Con la lista cerrada: el botón la abre con teclado.
  const onKeyDown = (e) => {
    if (disabled || abierto) return;
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); abrir(); }
  };

  // Con la lista abierta: teclado a nivel ventana y en fase de captura, así
  // funciona aunque el botón no tenga el foco (Safari no enfoca botones al hacer
  // clic) y el Escape cierra solo la lista, sin llegar al Modal que la contiene.
  const estadoRef = useRef({});
  estadoRef.current = { planas, activo, elegir, cerrar };
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => {
      const { planas: ops, activo: act, elegir: elegirOp, cerrar: cerrarLista } = estadoRef.current;
      const manejadas = ['Escape', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '];
      if (e.key === 'Tab') return cerrarLista(false);
      if (!manejadas.includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') cerrarLista();
      else if (e.key === 'ArrowDown') setActivo(Math.min(ops.length - 1, act + 1));
      else if (e.key === 'ArrowUp') setActivo(Math.max(0, act - 1));
      else if (e.key === 'Home') setActivo(0);
      else if (e.key === 'End') setActivo(ops.length - 1);
      else if (ops[act]) elegirOp(ops[act]); // Enter / Espacio
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [abierto]);

  let idx = -1; // índice corrido para mapear opciones agrupadas a `planas`
  return (
    <>
      <button
        ref={botonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={listId}
        aria-activedescendant={abierto && activo >= 0 ? `${listId}-${activo}` : undefined}
        disabled={disabled}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={onKeyDown}
        className={
          inputClass +
          ' relative flex items-center text-left pr-11 hover:border-slate-300 disabled:bg-slate-50 disabled:cursor-not-allowed ' +
          (abierto ? 'ring-2 ring-flox-600 border-transparent ' : '') +
          (seleccionada ? 'text-slate-900' : 'text-slate-400')
        }
        {...aria}
      >
        <span className="truncate">{seleccionada ? seleccionada.label : placeholder}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className={'pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-transform ' + (abierto ? 'rotate-180' : '')}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Portal al body: fuera del <label> de Field (si no, el clic en una opción
          volvería a activar el botón) y fuera del scroll del Modal. */}
      {abierto && createPortal(
        <div
          ref={panelRef}
          id={listId}
          role="listbox"
          style={pos ? { position: 'fixed', ...pos } : { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
          className="z-50 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10"
        >
          {lista.map((g, gi) => (
            <div key={g.label ?? gi} role={g.label ? 'group' : undefined} aria-label={g.label ?? undefined} className={gi > 0 ? 'mt-1' : ''}>
              {g.label && <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.label}</div>}
              {g.opciones.map((op) => {
                idx += 1;
                const i = idx;
                const elegida = op.value === value;
                return (
                  <div
                    key={op.value}
                    id={`${listId}-${i}`}
                    data-idx={i}
                    role="option"
                    aria-selected={elegida}
                    onPointerEnter={() => setActivo(i)}
                    onClick={() => elegir(op)}
                    className={
                      'flex items-center justify-between gap-3 min-h-[44px] px-3 rounded-lg cursor-pointer text-base ' +
                      (elegida ? 'bg-flox-50 text-flox-700 font-semibold ' : 'text-slate-800 ') +
                      (i === activo && !elegida ? 'bg-slate-100' : '')
                    }
                  >
                    <span>{op.label}</span>
                    {elegida && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 shrink-0">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
