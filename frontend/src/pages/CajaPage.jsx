import { useMemo, useState } from 'react';
import * as cajaApi from '../api/caja';
import * as dashboardApi from '../api/dashboard';
import { useFetch } from '../lib/useFetch';
import { MEDIOS_PAGO, MEDIO_PAGO_LABEL } from '../lib/constants';
import { MESES, formatFecha, mesActual, money, rangoDeMes } from '../lib/format';
import { Button, Card } from '../components/ui/Primitives';
import { Icon } from '../components/ui/Icon';
import { Loadable } from '../components/ui/States';
import { SaleModal } from '../components/caja/SaleModal';
import { GastoModal } from '../components/caja/GastoModal';
import { CobrarModal } from '../components/caja/CobrarModal';
import { MonthSelector } from '../components/ui/MonthSelector';

const MEDIO_EMOJI = { efectivo: '💵', personal_pay: '📲' };

// Ventas nuevas: título "Venta a <cliente>" (o "Venta") y debajo qué se vendió.
// Se limpia el concepto guardado (prefijo "Venta:"/"Venta #n:" y "(cliente)" al final).
function tituloYDetalle(m) {
  if (!m.ventaId) return { titulo: m.concepto, detalle: null };
  let productos = m.concepto.replace(/^Venta(?: #\d+)?:\s*/, '');
  if (m.clienteNombre && productos.endsWith(` (${m.clienteNombre})`)) {
    productos = productos.slice(0, -(m.clienteNombre.length + 3));
  }
  return { titulo: m.clienteNombre ? `Venta a ${m.clienteNombre}` : 'Venta', detalle: productos };
}

function MovementRow({ m }) {
  const positivo = m.tipo === 'ingreso';
  const { titulo, detalle } = tituloYDetalle(m);
  return (
    <div className="flex items-center gap-3 py-3 border-t border-slate-100 first:border-t-0">
      <div className={'w-9 h-9 rounded-full flex items-center justify-center shrink-0 ' + (positivo ? 'bg-emerald-100' : 'bg-red-100')}>
        {positivo ? <Icon.up className="w-4 h-4 text-emerald-700" /> : <Icon.down className="w-4 h-4 text-red-700" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{titulo}</div>
        {detalle && <div className="text-xs text-slate-600 truncate" title={detalle}>{detalle}</div>}
        <div className="text-xs text-slate-500">{formatFecha(m.fecha)}{m.medioPago && ' · ' + MEDIO_PAGO_LABEL[m.medioPago]}</div>
      </div>
      <div className={'font-bold text-sm tabular-nums ' + (positivo ? 'text-emerald-600' : 'text-red-600')}>
        {positivo ? '+' : '−'}{money(m.monto)}
      </div>
    </div>
  );
}

// Ventas que todavía no pagaron: no suman al balance hasta "Marcar como cobrada".
function VentasPendientes({ state, onCobrar }) {
  // Sin datos y con error (ej. 503 si falta la migración): aviso corto, sin romper la pantalla.
  if (state.data == null) {
    if (!state.error) return null;
    return (
      <Card className="p-5">
        <h3 className="font-semibold mb-1">Ventas pendientes</h3>
        <p className="text-sm text-slate-500">{state.error.message}</p>
      </Card>
    );
  }
  if (state.data.length === 0) return null;

  const totalPendiente = state.data.reduce((s, v) => s + v.total, 0);
  return (
    <Card className="p-5 border-orange-200">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="font-semibold">Ventas pendientes de cobro</h3>
        <span className="text-sm font-bold text-orange-700 tabular-nums">{money(totalPendiente)}</span>
      </div>
      {state.data.map((v) => (
        <div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 border-t border-slate-100 first:border-t-0">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{v.clienteNombre || 'Sin nombre'}</div>
            <div className="text-xs text-slate-500 truncate">
              {v.productos.map((p) => `${p.nombre} x${p.cantidad}`).join(', ')} · {formatFecha(v.fechaCreacion)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm tabular-nums text-orange-700">{money(v.total)}</span>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => onCobrar(v)}>Marcar como cobrada</Button>
          </div>
        </div>
      ))}
    </Card>
  );
}

export default function CajaPage() {
  const [periodo, setPeriodo] = useState(mesActual);
  const rango = useMemo(() => rangoDeMes(periodo), [periodo]);

  const state = useFetch(async () => {
    const [total, mes, medios, movimientos] = await Promise.all([
      cajaApi.getBalance(), // saldo total acumulado (no depende del mes)
      cajaApi.getBalance(rango),
      dashboardApi.getMediosPago(rango),
      cajaApi.listarMovimientos({ ...rango, limit: 500 }),
    ]);
    return { total, mes, medios, movimientos };
  }, [rango]);
  // Aparte del resto: si falla (ej. migración sin aplicar) no rompe el balance ni el historial.
  const pendientes = useFetch(() => cajaApi.listarVentas({ estado: 'pendiente' }), []);
  const [modal, setModal] = useState(null); // null | 'venta' | 'gasto'
  const [aCobrar, setACobrar] = useState(null);
  const recargar = () => {
    state.reload();
    pendientes.reload();
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">Caja / Finanzas</h1>
        <div className="flex gap-3">
          <Button variant="success" className="flex-1 sm:flex-none" onClick={() => setModal('venta')}>
            <Icon.plus className="w-4 h-4" aria-hidden="true" /> Registrar venta
          </Button>
          <Button variant="danger" className="flex-1 sm:flex-none" onClick={() => setModal('gasto')}>
            <span className="text-lg leading-none" aria-hidden="true">−</span> Registrar gasto
          </Button>
        </div>
      </header>

      <MonthSelector anio={periodo.anio} mes={periodo.mes} onChange={setPeriodo} />

      <Loadable state={state}>
        {({ total, mes, medios, movimientos }) => {
          const porMedio = Object.fromEntries(medios.map((m) => [m.medioPago, m.total]));
          const nombreMes = MESES[periodo.mes].toLowerCase();
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <Card className="md:col-span-2 p-6 flex flex-col gap-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500">Balance de {nombreMes}</div>
                      <div className={'font-display font-extrabold text-3xl tabular-nums ' + (mes.balance < 0 ? 'text-red-600' : 'text-flox-600')}>{money(mes.balance)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Saldo total en caja</div>
                      <div className="font-bold tabular-nums">{money(total.balance)}</div>
                    </div>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div>
                    <div className="text-xs text-slate-500 mb-2">Ingresos de {nombreMes} por medio de cobro</div>
                    {/* Efectivo y Personal Pay en dos columnas iguales y centradas */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-center">
                      {MEDIOS_PAGO.map((m) => (
                        <div key={m.value}>
                          <div className="text-xs text-slate-500">{MEDIO_EMOJI[m.value]} {m.label}</div>
                          <div className="font-bold tabular-nums">{money(porMedio[m.value] ?? 0)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card className="p-6 flex flex-col justify-center gap-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Ingresos de {nombreMes}</span><span className="font-bold text-emerald-600 tabular-nums">{money(mes.totalIngresos)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Egresos de {nombreMes}</span><span className="font-bold text-red-600 tabular-nums">{money(mes.totalEgresos)}</span></div>
                </Card>
              </div>

              <VentasPendientes state={pendientes} onCobrar={setACobrar} />

              <Card className="p-5">
                <h3 className="font-semibold mb-1">Historial de {nombreMes}</h3>
                {movimientos.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No hay movimientos en {nombreMes} {periodo.anio}.</p>
                ) : (
                  movimientos.map((m) => <MovementRow key={m.id} m={m} />)
                )}
              </Card>
            </>
          );
        }}
      </Loadable>

      {modal === 'venta' && <SaleModal onClose={() => setModal(null)} onDone={recargar} />}
      {modal === 'gasto' && <GastoModal onClose={() => setModal(null)} onDone={state.reload} />}
      {aCobrar && <CobrarModal venta={aCobrar} onClose={() => setACobrar(null)} onDone={recargar} />}
    </div>
  );
}
