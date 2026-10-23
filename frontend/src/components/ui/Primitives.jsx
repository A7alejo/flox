// Estilo compartido de todos los inputs. 16px (text-base) evita el zoom automático al enfocar en móviles.
export const inputClass =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base font-normal focus:outline-none focus:ring-2 focus:ring-flox-600';

export function Badge({ children, className = '' }) {
  return <span className={'inline-flex items-center h-6 px-2.5 rounded-full text-xs font-bold whitespace-nowrap ' + className}>{children}</span>;
}

export function Card({ children, className = '' }) {
  return <div className={'bg-white border border-slate-200 rounded-2xl ' + className}>{children}</div>;
}

const VARIANTS = {
  primary: 'bg-flox-600 text-white hover:bg-flox-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-500 hover:bg-slate-100',
};

// Área táctil mínima de 48px (h-12 / min-h-[48px]).
export function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={
        'inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl font-semibold text-sm min-h-[48px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ' +
        VARIANTS[variant] + ' ' + className
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl bg-red-50 text-red-700 px-3.5 py-3 text-sm font-semibold">
      {message}
    </div>
  );
}

// Selector de cantidad con botones de 48px (uso con el pulgar).
export function Stepper({ value, onChange, min = 0, max = Infinity, label }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" aria-label="Restar uno" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="w-12 h-12 rounded-xl border border-slate-200 bg-white font-bold text-xl disabled:opacity-40">−</button>
      <span className="font-display font-extrabold text-xl w-9 text-center tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Sumar uno" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} className="w-12 h-12 rounded-xl border border-slate-200 bg-white font-bold text-xl disabled:opacity-40">+</button>
    </div>
  );
}

// Chips de selección única (medio de cobro, filtros).
export function ChipGroup({ options, value, onChange, label }) {
  return (
    <div className="flex gap-2 flex-wrap" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={'h-12 px-4 rounded-full border text-sm font-semibold ' + (value === o.value ? 'bg-flox-600 border-flox-600 text-white' : 'bg-white border-slate-200 text-slate-700')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
