import { Card } from '../ui/Primitives';
import { Icon } from '../ui/Icon';
import { LoadingBlock } from '../ui/States';
import { MESES } from '../../lib/format';

// Pantalla de entrada de Stock: un "cajón" por mes. Arriba el mes en curso
// (se calcula con los productos de hoy, así funciona aunque falte el historial);
// abajo los meses anteriores, cerrados, que salen de /stock/meses.
// Celular: tarjeta blanca con borde verde y grilla de 2. Escritorio (md+):
// tarjeta verde oscura a todo el ancho y grilla de 3.
export function StockCajones({ actual, productos, meses, onAbrir }) {
  const unidades = productos.reduce((s, p) => s + p.stockActual, 0);
  const bajos = productos.filter((p) => p.stockActual <= p.stockMinimo).length;
  const resumenActual = meses.data?.find((m) => m.enCurso);
  const anteriores = (meses.data ?? []).filter((m) => !m.enCurso);
  const nombreMes = MESES[actual.mes - 1];
  const abrirActual = () => onAbrir({ ...actual, enCurso: true });

  return (
    <div className="flex flex-col gap-5 md:gap-7">
      <header className="flex flex-col gap-1">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">
          <span className="md:hidden">Stock</span>
          <span className="hidden md:inline">Stock por mes</span>
        </h1>
        <p className="text-sm md:text-[15px] text-slate-600">
          <span className="md:hidden">Tocá un mes para ver sus productos.</span>
          <span className="hidden md:inline">Elegí un mes para ver su stock. El mes actual se edita; los anteriores solo se miran.</span>
        </p>
      </header>

      {/* Mes en curso · celular */}
      <button
        type="button"
        onClick={abrirActual}
        className="md:hidden text-left flex flex-col gap-4 p-5 rounded-2xl bg-white border-2 border-flox-600 shadow-[0_4px_14px_rgba(13,148,136,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-flox-600 focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="self-start px-2.5 h-6 inline-flex items-center rounded-full bg-flox-100 text-flox-700 text-xs font-bold">Mes en curso</span>
            <span className="font-display font-extrabold text-2xl">Stock {nombreMes}</span>
          </div>
          <span className="w-12 h-12 rounded-xl bg-flox-600 text-white flex items-center justify-center shrink-0">
            <Icon.chevronRight className="w-6 h-6" aria-hidden="true" />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Dato label="Productos" valor={productos.length} />
          <Dato label="Unidades" valor={unidades} />
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Icon.box className="w-[18px] h-[18px] text-flox-700" aria-hidden="true" />
            <span>Sobró de {mesAnterior(actual.mes)}: <strong>{resumenActual ? resumenActual.sobro + ' u.' : '—'}</strong></span>
          </div>
          {bajos > 0 && (
            <div className="flex items-center gap-2 text-orange-800">
              <Icon.alert className="w-[18px] h-[18px]" aria-hidden="true" />
              <span><strong>{bajos} {bajos === 1 ? 'producto' : 'productos'}</strong> con stock bajo</span>
            </div>
          )}
        </div>
      </button>

      {/* Mes en curso · escritorio */}
      <button
        type="button"
        onClick={abrirActual}
        className="hidden md:flex text-left items-center justify-between gap-6 px-8 py-7 rounded-[18px] bg-[#0F3D3A] text-white hover:bg-[#0D3532] focus:outline-none focus-visible:ring-2 focus-visible:ring-flox-600 focus-visible:ring-offset-2"
      >
        <div className="flex flex-col">
          <span className="text-[13px] tracking-[.08em] uppercase text-[#A8D8CF] font-semibold">Mes actual · editable</span>
          <span className="font-display font-bold text-[28px] mt-1.5">Stock {nombreMes}</span>
          <span className="text-sm text-[#D9F0EC] mt-2">
            Arrancó con lo que sobró de {mesAnterior(actual.mes)}: {resumenActual ? resumenActual.sobro + ' u.' : '—'}
          </span>
        </div>
        <div className="flex gap-10 text-right shrink-0">
          <NumeroOscuro valor={productos.length} label="productos" />
          <NumeroOscuro valor={unidades} label="unidades" />
          <NumeroOscuro valor={bajos} label="stock bajo" className={bajos > 0 ? 'text-[#FDE68A]' : ''} />
        </div>
      </button>

      <section className="flex flex-col gap-3">
        <h2 className="font-display font-bold text-lg md:hidden">Meses anteriores</h2>
        <MesesAnteriores meses={meses} anteriores={anteriores} actual={actual} onAbrir={onAbrir} />
      </section>
    </div>
  );
}

function MesesAnteriores({ meses, anteriores, actual, onAbrir }) {
  if (meses.error?.status === 503) {
    return <Vacio>El historial por mes se activa cuando se aplique la migración de stock en la base de datos.</Vacio>;
  }
  if (meses.error) {
    return (
      <Card className="p-4 flex items-center justify-between gap-3 text-sm">
        <span className="text-red-700 font-semibold">{meses.error.message}</span>
        <button type="button" onClick={meses.reload} className="h-12 px-4 rounded-xl border border-slate-200 font-semibold shrink-0">Reintentar</button>
      </Card>
    );
  }
  if (meses.data == null) return <LoadingBlock />;
  if (anteriores.length === 0) {
    return <Vacio>Cuando termine {MESES[actual.mes - 1].toLowerCase()}, su cajón aparece acá con lo que sobró, ingresó y se vendió.</Vacio>;
  }
  return <GrillaMeses lista={anteriores} onAbrir={onAbrir} />;
}

function GrillaMeses({ lista, onAbrir }) {
  return (
    <div className="escalonado grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
      {lista.map((m) => (
        <button
          key={`${m.anio}-${m.mes}`}
          type="button"
          onClick={() => onAbrir({ anio: m.anio, mes: m.mes, enCurso: false })}
          className="text-left min-h-[132px] p-3.5 md:px-6 md:py-5 rounded-2xl bg-white border border-slate-200 flex flex-col gap-2 hover:border-flox-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-flox-600"
        >
          {/* celular */}
          <div className="md:hidden flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">{m.anio}</span>
            <Candado className="w-4 h-4 text-slate-500" />
          </div>
          <span className="md:hidden font-display font-bold text-lg">{MESES[m.mes - 1]}</span>
          <span className="md:hidden text-[13px] text-slate-700">Cerró con <strong>{m.quedo} u.</strong></span>
          <span className="md:hidden text-[13px] text-slate-700">Vendidas: {m.vendido}</span>

          {/* escritorio */}
          <div className="hidden md:flex flex-col items-start gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
              <Candado className="w-3 h-3" /> Solo lectura
            </span>
            <span className="font-display font-bold text-lg whitespace-nowrap">Stock {MESES[m.mes - 1]}</span>
          </div>
          <div className="hidden md:flex gap-7 mt-3">
            <NumeroClaro valor={m.quedo} label="quedaron" />
            <NumeroClaro valor={m.ingreso} label="ingresaron" />
            <NumeroClaro valor={m.vendido} label="vendidas" />
          </div>
        </button>
      ))}
    </div>
  );
}

// "septiembre" para octubre (mes 1-12).
export const mesAnterior = (mes) => MESES[(mes + 10) % 12].toLowerCase();

function Vacio({ children }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 md:border-dashed md:border-slate-300 p-4 md:p-6 text-sm text-slate-600 md:text-center">
      {children}
    </div>
  );
}

function Dato({ label, valor }) {
  return (
    <div className="p-3 rounded-xl bg-flox-50 flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-flox-700">{label}</span>
      <span className="font-display font-bold text-[22px] tabular-nums">{valor}</span>
    </div>
  );
}

function NumeroOscuro({ valor, label, className = '' }) {
  return (
    <div>
      <div className={'font-display font-bold text-[26px] tabular-nums ' + className}>{valor}</div>
      <div className="text-[13px] text-[#A8D8CF]">{label}</div>
    </div>
  );
}

function NumeroClaro({ valor, label }) {
  return (
    <div>
      <div className="font-display font-bold text-xl tabular-nums">{valor}</div>
      <div className="text-[13px] text-slate-600">{label}</div>
    </div>
  );
}

export function Candado({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Cerrado">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}
