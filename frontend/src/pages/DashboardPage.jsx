import { useMemo, useState } from 'react';
import * as cajaApi from '../api/caja';
import * as dashboardApi from '../api/dashboard';
import * as productosApi from '../api/productos';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../lib/useFetch';
import { MESES, mesActual, money, pctChange, rangoDeMes } from '../lib/format';
import { Card } from '../components/ui/Primitives';
import { Loadable, LoadingBlock } from '../components/ui/States';
import { MonthSelector } from '../components/ui/MonthSelector';
import { FinanceChart, PaymentDonut, StatTile, StockCriticidad, TopProductsList } from '../components/dashboard/Widgets';

const RANGOS = [{ dias: 7, label: '7 días' }, { dias: 30, label: '30 días' }];

// La evolución se pide aparte para que cambiar de 7 a 30 días no recargue el resto del tablero.
function FinanceCard() {
  const [dias, setDias] = useState(7);
  const state = useFetch(() => dashboardApi.getEvolucion(dias), [dias]);

  return (
    <Card className="lg:col-span-3 p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Evolución financiera</h2>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Rango de días">
          {RANGOS.map((r) => (
            <button
              key={r.dias}
              type="button"
              onClick={() => setDias(r.dias)}
              aria-pressed={dias === r.dias}
              className={'h-10 px-3 rounded-lg text-xs font-semibold ' + (dias === r.dias ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500')}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <Loadable state={state}>{(data) => <FinanceChart data={data} />}</Loadable>
    </Card>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  // Mes elegido: afecta lo que es "del mes" (ingresos/egresos, medios de cobro, top).
  // Saldo total, evolución y stock no dependen del mes.
  const [periodo, setPeriodo] = useState(mesActual);
  const rango = useMemo(() => rangoDeMes(periodo), [periodo]);
  const rangoAnterior = useMemo(() => rangoDeMes({ anio: periodo.anio, mes: periodo.mes - 1 }), [periodo]);
  // new Date(anio, -1, 1) ya resuelve diciembre del año anterior.

  const state = useFetch(
    async () => {
      const [resumen, mes, mesAnterior, medios, top, productos] = await Promise.all([
        dashboardApi.getResumen(),
        cajaApi.getBalance(rango),
        cajaApi.getBalance(rangoAnterior),
        dashboardApi.getMediosPago(rango),
        dashboardApi.getTopProductos({ limite: 5, ...rango }),
        productosApi.listar(),
      ]);
      return { resumen, mes, mesAnterior, medios, top, productos };
    },
    [rango]
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl">Resumen</h1>
          <p className="text-sm text-slate-500">Hola, {usuario.nombre}</p>
        </div>
        <MonthSelector compact anio={periodo.anio} mes={periodo.mes} onChange={setPeriodo} />
      </header>

      <Loadable state={state}>
        {({ resumen, mes, mesAnterior, medios, top, productos }) => {
          const { actual } = resumen.mensual;
          // El saldo es acumulado: el del mes anterior es el actual menos lo que se movió este mes.
          const saldoAnterior = resumen.balance - (actual.ingresos - actual.egresos);
          const nombreMes = MESES[periodo.mes].toLowerCase();

          return (
            <>
              <section aria-label="Indicadores principales" className="escalonado grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatTile label="Saldo total" value={money(resumen.balance)} delta={pctChange(resumen.balance, saldoAnterior)} goodWhenUp={true} />
                <StatTile label={`Ingresos de ${nombreMes}`} value={money(mes.totalIngresos)} delta={pctChange(mes.totalIngresos, mesAnterior.totalIngresos)} goodWhenUp={true} />
                <StatTile label={`Egresos de ${nombreMes}`} value={money(mes.totalEgresos)} delta={pctChange(mes.totalEgresos, mesAnterior.totalEgresos)} goodWhenUp={false} />
                <StatTile label="Alertas de stock" value={String(resumen.alertasStock.length)} hint="productos para reponer" />
              </section>

              <section aria-label="Gráficos financieros" className="escalonado grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
                <FinanceCard />
                {/* self-start: alto según su contenido, no estirada al del gráfico de al lado */}
                <Card className="lg:col-span-2 lg:self-start p-5 md:p-6 flex flex-col gap-4">
                  <h2 className="font-semibold">Medios de cobro</h2>
                  <PaymentDonut data={medios} />
                </Card>
              </section>

              <section aria-label="Productos y stock" className="escalonado grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
                <Card className="lg:col-span-2 p-5 md:p-6 flex flex-col gap-4">
                  <h2 className="font-semibold">Top 5 productos más vendidos</h2>
                  <TopProductsList items={top} />
                </Card>
                <Card className="lg:col-span-3 p-5 md:p-6 flex flex-col gap-4">
                  <h2 className="font-semibold">Stock por criticidad</h2>
                  <StockCriticidad products={productos} />
                </Card>
              </section>
            </>
          );
        }}
      </Loadable>
      {state.loading && state.data && <LoadingBlock label="Actualizando…" />}
    </div>
  );
}
