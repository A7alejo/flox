import { Button } from './Primitives';

export function Spinner({ className = 'w-6 h-6' }) {
  return (
    <svg className={'animate-spin text-flox-600 ' + className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingBlock({ label = 'Cargando…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500 animate-fade-in">
      <Spinner /> {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center text-center gap-3 py-12 animate-pop-in">
      <p className="text-sm font-semibold text-red-700">{error?.message || 'Ocurrió un error inesperado.'}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}

// Muestra spinner la primera vez, error si falló sin datos previos, o el contenido.
export function Loadable({ state, children }) {
  if (state.data == null) {
    if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
    return <LoadingBlock />;
  }
  return children(state.data);
}
