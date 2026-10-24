import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { registrarModal } from '../../lib/ruta';

// Bottom-sheet en móvil, diálogo centrado desde sm:.
// El botón Atrás (navegador o celular) la cierra sin cambiar de pantalla (ver lib/ruta.js).
export function Modal({ title, onClose, children, footer }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => registrarModal(() => onCloseRef.current()), []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // el fondo no scrollea mientras el modal está abierto
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-6">
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 shrink-0">
          <h2 className="font-display font-bold text-lg flex-1">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-12 h-12 -my-1.5 -mr-2 rounded-xl flex items-center justify-center">
            <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Icon.x className="w-4 h-4" /></span>
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-200 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
