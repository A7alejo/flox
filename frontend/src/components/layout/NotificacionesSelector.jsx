import { useEffect, useRef, useState } from 'react';
import { activar, AVISOS_INICIALES, cambiarAvisos, desactivar, leerEstado } from '../../lib/push';

// Botón de campana del encabezado: abre el menú "Notificaciones" para recibir
// avisos en este celular cuando otra persona registra una venta, un gasto o un
// producto. Quien hace la acción no recibe su propio aviso.
const TIPOS = [
  { id: 'ventas', label: 'Ventas', ayuda: 'Ventas nuevas y cobros' },
  { id: 'gastos', label: 'Gastos', ayuda: 'Gastos registrados' },
  { id: 'productos', label: 'Productos nuevos', ayuda: 'Altas en Stock' },
];

const MENSAJES = {
  instalar: 'En iPhone, primero instalá la app: tocá Compartir y elegí "Agregar a inicio". Después abrila desde ahí.',
  'no-soportado': 'Este navegador no permite notificaciones.',
  'apagado-servidor': 'Las notificaciones todavía no están activadas en el servidor.',
  bloqueado: 'Bloqueaste las notificaciones de Floxer. Activalas desde los ajustes del celular o del navegador.',
};

function IconoCampana(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function NotificacionesSelector() {
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [estado, setEstado] = useState(null); // null = todavía no se consultó
  const [avisos, setAvisos] = useState(AVISOS_INICIALES);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const caja = useRef(null);

  const cerrar = () => {
    setCerrando(true);
    setTimeout(() => { setAbierto(false); setCerrando(false); }, 150);
  };

  const aplicar = ({ estado: e, avisos: a }) => { setEstado(e); setAvisos(a); };

  // Si ya había permiso en este celular, se deja registrado a nombre de quien
  // inició sesión (sin mostrar nada). Los errores acá no molestan a nadie.
  useEffect(() => {
    leerEstado().then(aplicar).catch(() => {});
  }, []);

  useEffect(() => {
    if (!abierto) return undefined;
    leerEstado().then(aplicar).catch(() => setError('No se pudo consultar el estado. Probá de nuevo.'));
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) cerrar(); };
    const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const correr = async (tarea) => {
    setOcupado(true);
    setError('');
    try {
      aplicar(await tarea());
    } catch (err) {
      setError(err.message || 'No se pudo completar. Probá de nuevo.');
    } finally {
      setOcupado(false);
    }
  };

  const activo = estado === 'activo';
  const alternar = (id) => correr(() => cambiarAvisos({ ...avisos, [id]: !avisos[id] }));

  return (
    <div ref={caja} className="relative shrink-0 md:order-3">
      <button
        type="button"
        onClick={() => (abierto ? cerrar() : setAbierto(true))}
        aria-label="Notificaciones"
        aria-haspopup="true"
        aria-expanded={abierto}
        className="relative min-h-[44px] min-w-[44px] rounded-xl border border-white/30 text-white flex items-center justify-center hover:bg-white/10 transition-transform duration-150 active:scale-90"
      >
        <IconoCampana className="w-5 h-5" aria-hidden="true" />
        {activo && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#33C2C9] ring-2 ring-[#16285A]" aria-hidden="true" />}
      </button>

      {abierto && (
        <div className={'fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+68px)] md:absolute md:left-auto md:right-0 md:top-[52px] md:w-72 z-30 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/10 origin-top-right ' + (cerrando ? 'animate-pop-out pointer-events-none' : 'animate-pop-in')}>
          <p className="px-1 text-sm font-bold text-slate-900">Notificaciones</p>
          <p className="px-1 pb-2 text-xs text-slate-500">Te avisamos en este celular cuando otra persona registra algo.</p>

          {estado === null && !error && <p className="px-1 py-3 text-sm text-slate-500">Cargando…</p>}

          {MENSAJES[estado] && <p className="px-1 py-2 text-sm text-slate-700">{MENSAJES[estado]}</p>}

          {estado === 'inactivo' && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => correr(() => activar(avisos))}
              className="w-full min-h-[48px] rounded-xl bg-flox-600 text-white text-[15px] font-bold hover:bg-flox-700 disabled:opacity-60"
            >
              {ocupado ? 'Activando…' : 'Activar notificaciones'}
            </button>
          )}

          {activo && (
            <>
              <div className="flex flex-col gap-1" role="group" aria-label="Qué avisos recibir">
                {TIPOS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="switch"
                    aria-checked={avisos[t.id]}
                    disabled={ocupado}
                    onClick={() => alternar(t.id)}
                    className="flex items-center justify-between gap-3 min-h-[48px] px-3 rounded-xl text-left text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <span className="flex flex-col leading-tight">
                      <span className="text-[15px] font-semibold">{t.label}</span>
                      <span className="text-xs text-slate-500">{t.ayuda}</span>
                    </span>
                    <span className={'relative w-11 h-6 rounded-full shrink-0 transition-colors ' + (avisos[t.id] ? 'bg-flox-600' : 'bg-slate-300')} aria-hidden="true">
                      <span className={'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ' + (avisos[t.id] ? 'translate-x-5' : '')} />
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => correr(desactivar)}
                className="mt-2 w-full min-h-[44px] rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Desactivar en este celular
              </button>
            </>
          )}

          {error && <p role="alert" className="px-1 pt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
