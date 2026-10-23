import { useMemo, useState } from 'react';
import * as cajaApi from '../api/caja';
import * as dashboardApi from '../api/dashboard';
import { useFetch } from '../lib/useFetch';
import { MEDIOS_PAGO, MEDIO_PAGO_LABEL } from '../lib/constants';
import { formatFecha, inicioDeMes, money } from '../lib/format';
import { Button, Card } from '../components/ui/Primitives';
import { Icon } from '../components/ui/Icon';
import { Loadable } from '../components/ui/States';
import { SaleModal } from '../components/caja/SaleModal';
import { GastoModal } from '../components/caja/GastoModal';

const MEDIO_EMOJI = { efectivo: '💵', personal_pay: '📲', transferencia: '🏦' };

function MovementRow({ m }) {
  const positivo = m.tipo === 'ingreso';
  return (
    <div className="flex items-center gap-3 py-3 border-t border-slate-100 first:border-t-0">
      <div className={'w-9 h-9 rounded-full flex items-center justify-center shrink-0 ' + (positivo ? 'bg-emerald-100' : 'bg-red-100')}>
        {positivo ? <Icon.up className="w-4 h-4 text-emerald-700" /> : <Icon.down className="w-4 h-4 text-red-700" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{m.concepto}</div>
        <div className="text-xs text-slate-500">{formatFecha(m.fecha)}{m.medioPago && ' · ' + MEDIO_PAGO_LABEL[m.medioPago]}</div>
      </div>
      <div className={'font-bold text-sm tabular-nums ' + (positivo ? 'text-emerald-600' : 'text-red-600')}>
        {positivo ? '+' : '−'}{money(m.monto)}
      </div>
    </div>
  );
}

export default function CajaPage() {
  const desde = useMemo(inicioDeMes, []);
  const state = useFetch(async () => {
    const [total, mes, medios, movimientos] = await Promise.all([
      cajaApi.getBalance(),
      cajaApi.getBalance({ desde }),
      dashboardApi.getMediosPago(),
      cajaApi.listarMovimientos({ limit: 50 }),
    ]);
    return { total, mes, medios, movimientos };
  }, []);
  const [modal, setModal] = useState(null); // null | 'venta' | 'gasto'

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

      <Loadable state={state}>
        {({ total, mes, medios, movimientos }) => {
          const porMedio = Object.fromEntries(medios.map((m) => [m.medioPago, m.total]));
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <Card className="md:col-span-2 p-6 flex flex-col gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Balance de caja</div>
                    <div className="font-display font-extrabold text-3xl text-flox-600 tabular-nums">{money(total.balance)}</div>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div>
                    <div className="text-xs text-slate-500 mb-2">Ingresos acumulados por medio de cobro</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
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
                  <div className="flex justify-between"><span className="text-slate-500">Ingresos del mes</span><span className="font-bold text-emerald-600 tabular-nums">{money(mes.totalIngresos)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Egresos del mes</span><span className="font-bold text-red-600 tabular-nums">{money(mes.totalEgresos)}</span></div>
                </Card>
              </div>

              <Card className="p-5">
                <h3 className="font-semibold mb-1">Historial</h3>
                {movimientos.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Todavía no hay movimientos.</p>
                ) : (
                  movimientos.map((m) => <MovementRow key={m.id} m={m} />)
                )}
              </Card>
            </>
          );
        }}
      </Loadable>

      {modal === 'venta' && <SaleModal onClose={() => setModal(null)} onDone={state.reload} />}
      {modal === 'gasto' && <GastoModal onClose={() => setModal(null)} onDone={state.reload} />}
    </div>
  );
}
