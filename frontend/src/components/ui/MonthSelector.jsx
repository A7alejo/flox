import { Card } from './Primitives';
import { Icon } from './Icon';
import { MESES } from '../../lib/format';

// Selector ◀ mes ▶. No deja avanzar más allá del mes actual.
// - Por defecto: card (Caja).
// - compact: una línea chica, sin card (Inicio).
export function MonthSelector({ anio, mes, onChange, compact = false }) {
  const hoy = new Date();
  const esActual = anio === hoy.getFullYear() && mes === hoy.getMonth();
  const mover = (delta) => {
    const d = new Date(anio, mes + delta, 1);
    onChange({ anio: d.getFullYear(), mes: d.getMonth() });
  };

  const flecha =
    (compact ? 'w-11 h-11 rounded-lg' : 'w-12 h-12 rounded-xl border border-slate-200 bg-white') +
    ' flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed';

  const contenido = (
    <>
      <button type="button" className={flecha} onClick={() => mover(-1)} aria-label="Mes anterior">
        <Icon.chevronLeft className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>
      <div className="text-center" aria-live="polite">
        {/* key: al cambiar de mes el nombre se reemplaza con un fundido */}
        <div key={anio * 12 + mes} className={(compact ? 'text-sm font-semibold whitespace-nowrap min-w-[8.5rem]' : 'font-display font-bold text-lg') + ' animate-fade-in'}>
          {MESES[mes]} {anio}
        </div>
        {!compact && esActual && <div className="text-xs text-slate-500">Mes actual</div>}
      </div>
      <button type="button" className={flecha} onClick={() => mover(1)} disabled={esActual} aria-label="Mes siguiente">
        <Icon.chevronRight className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>
    </>
  );

  if (compact) {
    return (
      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white" role="group" aria-label="Elegir mes">
        {contenido}
      </div>
    );
  }
  return <Card className="p-2 flex items-center justify-between gap-2">{contenido}</Card>;
}
