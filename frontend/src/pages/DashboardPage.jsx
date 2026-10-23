import { useMemo, useState } from 'react';
import * as dashboardApi from '../api/dashboard';
import * as productosApi from '../api/productos';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../lib/useFetch';
import { inicioDeMes, money, pctChange } from '../lib/format';
import { Card } from '../components/ui/Primitives';
import { Loadable, LoadingBlock } from '../components/ui/States';
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
  const desde = useMemo(inicioDeMes, []);

  const state = useFetch(
    async () => {
      const [resumen, medios, top, productos] = await Promise.all([
        dashboardApi.getResumen(),
        dashboardApi.getMediosPago({ desde }),
        dashboardApi.getTopProductos({ limite: 5, desde }),
        productosApi.listar(),
      ]);
      return { resumen, medios, top, productos };
    },
    []
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl">Resumen</h1>
          <p className="text-sm text-slate-500">Hola, {usuario.nombre}</p>
        </div>
        {/* Cerrar sesión ahora vive en el Header (celular y escritorio) */}
      </header>

      <Loadable state={state}>
        {({ resumen, medios, top, productos }) => {
          const { actual, anterior } = resumen.mensual;
          // El saldo es acumulado: el del mes anterior es el actual menos lo que se movió este mes.
          const saldoAnterior = resumen.balance - (actual.ingresos - actual.egresos);

          return (
            <>
              <section aria-label="Indicadores principales" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatTile label="Saldo total" value={money(resumen.balance)} delta={pctChange(resumen.balance, saldoAnterior)} goodWhenUp={true} />
                <StatTile label="Ingresos del mes" value={money(actual.ingresos)} delta={pctChange(actual.ingresos, anterior.ingresos)} goodWhenUp={true} />
                <StatTile label="Egresos del mes" value={money(actual.egresos)} delta={pctChange(actual.egresos, anterior.egresos)} goodWhenUp={false} />
                <StatTile label="Alertas de stock" value={String(resumen.alertasStock.length)} hint="productos para reponer" />
              </section>

              <section aria-label="Gráficos financieros" className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
                <FinanceCard />
                {/* self-start: alto según su contenido, no estirada al del gráfico de al lado */}
                <Card className="lg:col-span-2 lg:self-start p-5 md:p-6 flex flex-col gap-4">
                  <h2 className="font-semibold">Medios de cobro</h2>
                  <PaymentDonut data={medios} />
                </Card>
              </section>

              <section aria-label="Productos y stock" className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
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
