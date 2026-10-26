import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { registrarModal } from '../../lib/ruta';

// Bottom-sheet en móvil, diálogo centrado desde sm:.
// El botón Atrás (navegador o celular) la cierra sin cambiar de pantalla (ver lib/ruta.js).
// Entra subiendo desde abajo (celular) o apareciendo (escritorio) con el fondo que se
// oscurece. Al cerrarla con la X, Escape o Atrás se anima la salida y después se avisa al padre.
const SALIDA_MS = 170;

export function Modal({ title, onClose, children, footer }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [saliendo, setSaliendo] = useState(false);
  const saliendoRef = useRef(false);
  const cerrar = () => {
    if (saliendoRef.current) return;
    saliendoRef.current = true;
    setSaliendo(true);
    setTimeout(() => onCloseRef.current(), SALIDA_MS);
  };
  useEffect(() => registrarModal(cerrar), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // el fondo no scrollea mientras el modal está abierto
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={'fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-6 ' + (saliendo ? 'animate-fade-out' : 'animate-fade-in')}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={'bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col ' + (saliendo ? 'animate-sheet-out sm:animate-pop-out' : 'animate-sheet-in sm:animate-pop-in')}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 shrink-0">
          <h2 className="font-display font-bold text-lg flex-1">{title}</h2>
          <button type="button" onClick={cerrar} aria-label="Cerrar" className="w-12 h-12 -my-1.5 -mr-2 rounded-xl flex items-center justify-center">
            <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Icon.x className="w-4 h-4" /></span>
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-200 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
