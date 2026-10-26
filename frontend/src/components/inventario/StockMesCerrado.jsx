import * as stockApi from '../../api/stock';
import { useFetch } from '../../lib/useFetch';
import { MESES } from '../../lib/format';
import { Card } from '../ui/Primitives';
import { Loadable } from '../ui/States';
import { Candado, mesAnterior } from './StockCajones';

const conSigno = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');

// Cajón de un mes anterior: solo lectura. Lo que se corrija va en el mes en
// curso y queda registrado como ajuste.
export function StockMesCerrado({ anio, mes, mesActual, onVolver, onAbrirActual }) {
  const state = useFetch(() => stockApi.detalleDelMes(anio, mes), [anio, mes]);

  return (
    <div className="flex flex-col gap-4">
      <BarraVolver onVolver={onVolver} />
      <header className="flex items-center justify-between gap-3 -mt-2">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">Stock {MESES[mes - 1]}</h1>
        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
          <Candado className="w-3 h-3" /> <span className="md:hidden">Cerrado</span><span className="hidden md:inline">Solo lectura</span>
        </span>
      </header>

      <Loadable state={state}>
        {({ totales, productos }) => (
          <>
            <div className="escalonado grid grid-cols-4 gap-2 md:gap-4">
              <Total label={`Sobró de ${mesAnterior(mes)}`} valor={totales.sobro} />
              <Total label="Ingresó" valor={conSigno(totales.ingreso)} className="text-flox-700" />
              <Total label="Vendido" valor={conSigno(-totales.vendido)} className="text-amber-700" />
              <Total label="Quedó" valor={totales.quedo} destacado />
            </div>
            {totales.ajuste !== 0 && (
              <p className="text-sm text-slate-700 -mt-1">Ajustes del mes: <strong>{conSigno(totales.ajuste)} u.</strong></p>
            )}

            <div className="flex gap-2.5 p-3.5 rounded-xl bg-slate-100 text-[13px] leading-snug text-slate-700">
              <span aria-hidden="true" className="w-[18px] h-[18px] shrink-0 rounded-full border-2 border-slate-500 text-slate-600 text-[11px] font-bold flex items-center justify-center mt-px">i</span>
              <span>
                Este mes está cerrado: solo se puede ver. Si algo quedó mal, corregilo en{' '}
                <button type="button" onClick={onAbrirActual} className="font-bold text-flox-700 underline-offset-2 hover:underline">
                  Stock {MESES[mesActual.mes - 1]}
                </button>{' '}
                y queda registrado como ajuste.
              </span>
            </div>

            <Card className="overflow-hidden">
              <div role="table" aria-label={`Stock de ${MESES[mes - 1]} por producto`} className="escalonado">
                <div role="row" className="grid grid-cols-[minmax(0,1fr)_repeat(4,2.75rem)] md:grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))] md:gap-4 md:px-6 gap-1 px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 text-right">
                  <span role="columnheader" className="text-left">Producto</span>
                  <span role="columnheader">Sobró</span>
                  <span role="columnheader"><span className="md:hidden">Ingr.</span><span className="hidden md:inline">Ingresó</span></span>
                  <span role="columnheader"><span className="md:hidden">Vend.</span><span className="hidden md:inline">Vendido</span></span>
                  <span role="columnheader">Quedó</span>
                </div>
                {productos.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8 animate-fade-in">No hubo stock ni movimientos este mes.</p>
                ) : (
                  productos.map((p) => (
                    <div role="row" key={p.id} className="grid grid-cols-[minmax(0,1fr)_repeat(4,2.75rem)] md:grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))] md:gap-4 md:px-6 gap-1 px-3.5 py-3 border-b border-slate-100 last:border-b-0 text-sm text-right items-center tabular-nums">
                      <span role="cell" className="text-left text-[13px] font-semibold leading-tight">
                        {p.nombre}
                        {p.ajuste !== 0 && <span className="block text-[11px] font-normal text-slate-500">Ajuste {conSigno(p.ajuste)}</span>}
                      </span>
                      <span role="cell" className="text-slate-600">{p.sobro}</span>
                      <span role="cell" className="text-flox-700">{conSigno(p.ingreso)}</span>
                      <span role="cell" className="text-amber-700">{conSigno(-p.vendido)}</span>
                      <span role="cell" className="font-bold">{p.quedo}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </>
        )}
      </Loadable>
    </div>
  );
}

function Total({ label, valor, className = '', destacado = false }) {
  return (
    <div className={'px-1.5 py-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 text-center ' + (destacado ? 'bg-flox-600 text-white' : 'bg-white border border-slate-200')}>
      <span className={'text-[11px] font-semibold leading-tight ' + (destacado ? '' : 'text-slate-600')}>{label}</span>
      <span className={'font-display font-bold text-lg tabular-nums ' + className}>{valor}</span>
    </div>
  );
}

// "‹ Stock": vuelve a los cajones. Área táctil de 48px.
export function BarraVolver({ onVolver }) {
  return (
    <button type="button" onClick={onVolver} className="self-start -ml-3 h-12 pl-1.5 pr-3 rounded-xl flex items-center gap-1 text-sm font-semibold text-slate-600 hover:bg-slate-100">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      <span className="md:hidden">Stock</span>
      <span className="hidden md:inline">Todos los meses</span>
    </button>
  );
}
