import { useState } from 'react';
import { Card } from '../ui/Primitives';
import { Icon } from '../ui/Icon';
import { VIZ, stockTier } from '../../lib/viz';
import { MEDIO_PAGO_LABEL } from '../../lib/constants';
import { compact, formatDia, money } from '../../lib/format';

// Gráficos dibujados a mano en SVG (sin librería de charting): barras divergentes
// para ingresos/egresos, dona para medios de cobro, ranking para top productos.

/* delta: undefined = el indicador no se compara · null = sin base (mes anterior en 0) · number = % */
export function StatTile({ label, value, delta, goodWhenUp, hint }) {
  let deltaEl = null;
  if (delta === null) {
    deltaEl = <span className="text-xs text-slate-500">Sin datos del mes anterior</span>;
  } else if (delta === 0) {
    deltaEl = <span className="text-xs font-semibold text-slate-500">Sin cambios vs. mes anterior</span>;
  } else if (delta !== undefined) {
    const good = delta > 0 === goodWhenUp;
    const Arrow = delta > 0 ? Icon.up : Icon.down;
    deltaEl = (
      <span className={'inline-flex items-center gap-1 text-xs font-bold ' + (good ? 'text-emerald-700' : 'text-red-700')}>
        <Arrow className="w-3.5 h-3.5" aria-hidden="true" />
        {Math.abs(delta)}% vs. mes anterior
      </span>
    );
  }
  return (
    <Card className="p-4 sm:p-5 flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="font-display font-extrabold text-xl sm:text-2xl tabular-nums">{value}</span>
      {deltaEl}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </Card>
  );
}

export function FinanceChart({ data }) {
  const [hover, setHover] = useState(null);
  const n = data.length;
  const i = Math.min(hover ?? n - 1, n - 1);
  const current = data[i];

  const max = Math.max(1, ...data.map((d) => Math.max(d.ingresos, d.egresos)));
  const W = 560, H = 190, padX = 24;
  const colW = (W - padX * 2) / n;
  const barW = Math.min(24, colW * 0.5);
  const midY = H / 2;
  const scale = (v) => (v / max) * (H / 2 - 16);
  const net = current.ingresos - current.egresos;
  const labelEvery = n > 7 ? 5 : 1; // con 30 días solo se rotula uno de cada 5
  const corto = n > 7;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: VIZ.ingresos }} aria-hidden="true"></span>Ingresos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: VIZ.egresos }} aria-hidden="true"></span>Egresos
        </span>
      </div>

      <svg viewBox={'0 0 ' + W + ' ' + H} className="w-full h-auto" role="img" aria-label="Evolución diaria de ingresos y egresos, en pesos">
        <line x1={padX} y1={midY} x2={W - padX} y2={midY} stroke={VIZ.baseline} strokeWidth="1" />
        {data.map((d, idx) => {
          const cx = padX + colW * idx + colW / 2;
          const hIn = scale(d.ingresos);
          const hEg = scale(d.egresos);
          const active = i === idx;
          return (
            <g key={d.dia}>
              <rect x={cx - barW / 2} y={midY - hIn} width={barW} height={hIn} rx="3" fill={VIZ.ingresos} opacity={active ? 1 : 0.88}
                className="animate-grow-y [transform-box:fill-box] origin-bottom" style={{ animationDelay: Math.min(idx * 12, 200) + 'ms' }} />
              <rect x={cx - barW / 2} y={midY} width={barW} height={hEg} rx="3" fill={VIZ.egresos} opacity={active ? 1 : 0.88}
                className="animate-grow-y [transform-box:fill-box] origin-top" style={{ animationDelay: Math.min(idx * 12, 200) + 'ms' }} />
              {(n - 1 - idx) % labelEvery === 0 && (
                <text x={cx} y={H - 2} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">{formatDia(d.dia, corto)}</text>
              )}
              <rect
                x={padX + colW * idx}
                y="0"
                width={colW}
                height={H}
                fill="transparent"
                tabIndex={n > 7 ? -1 : 0}
                role="button"
                aria-label={formatDia(d.dia) + ': ingresos ' + money(d.ingresos) + ', egresos ' + money(d.egresos)}
                onMouseEnter={() => setHover(idx)}
                onClick={() => setHover(idx)}
                onFocus={() => setHover(idx)}
              />
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm">
        <span className="font-semibold">{formatDia(current.dia)}</span>
        <span className="text-slate-600">Ingresos <strong className="text-slate-900 tabular-nums">{money(current.ingresos)}</strong></span>
        <span className="text-slate-600">Egresos <strong className="text-slate-900 tabular-nums">{money(current.egresos)}</strong></span>
        <span className="text-slate-600">Neto <strong className={'tabular-nums ' + (net >= 0 ? 'text-emerald-700' : 'text-red-700')}>{money(net)}</strong></span>
      </div>

      <table className="sr-only">
        <caption>Ingresos y egresos por día</caption>
        <thead><tr><th scope="col">Día</th><th scope="col">Ingresos</th><th scope="col">Egresos</th></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.dia}><td>{formatDia(d.dia)}</td><td>{money(d.ingresos)}</td><td>{money(d.egresos)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PaymentDonut({ data }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) return <p className="text-sm text-slate-500 py-6">No hay ingresos en este mes.</p>;

  const R = 62, CX = 84, CY = 84, STROKE = 24, GAP = 3;
  const circumference = 2 * Math.PI * R;
  let cumulative = 0;

  return (
    // flex-wrap: si la tarjeta es angosta, la leyenda baja debajo del anillo en vez de desbordar.
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg viewBox="0 0 168 168" className="w-36 h-36 shrink-0" role="img" aria-label="Desglose de ingresos del mes por medio de cobro">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F1F5F9" strokeWidth={STROKE} />
        {data.map((d, idx) => {
          const frac = d.total / total;
          const arc = frac * circumference;
          // Con un solo medio de cobro (100%) el anillo va cerrado: sin el GAP de separación.
          const dash = data.length === 1 ? circumference : Math.max(arc - GAP, 0.001);
          const el = (
            <circle
              key={d.medioPago}
              cx={CX} cy={CY} r={R} fill="none"
              stroke={VIZ.medioPago[d.medioPago] || '#94a3b8'}
              strokeWidth={hover === idx ? STROKE + 5 : STROKE}
              strokeDasharray={dash + ' ' + (circumference - dash)}
              strokeDashoffset={-cumulative}
              transform={'rotate(-90 ' + CX + ' ' + CY + ')'}
              style={{ transition: 'stroke-width 120ms', animationDelay: idx * 60 + 'ms' }}
              className="animate-dibujar"
              tabIndex="0"
              role="button"
              aria-label={(MEDIO_PAGO_LABEL[d.medioPago] || 'Otro') + ': ' + money(d.total) + ', ' + Math.round(frac * 100) + ' por ciento'}
              onMouseEnter={() => setHover(idx)}
              onClick={() => setHover(idx)}
              onFocus={() => setHover(idx)}
              onMouseLeave={() => setHover(null)}
              onBlur={() => setHover(null)}
            />
          );
          cumulative += arc;
          return el;
        })}
        <text x={CX} y={CY - 2} textAnchor="middle" className="fill-slate-900 font-display font-extrabold text-[15px]">{'$' + compact(total)}</text>
        <text x={CX} y={CY + 14} textAnchor="middle" className="fill-slate-500 text-[8px] font-semibold">ingresos del mes</text>
      </svg>

      <ul className="flex-1 basis-56 min-w-0 flex flex-col gap-2">
        {data.map((d, idx) => (
          <li key={d.medioPago} className={'flex items-center gap-3 rounded-lg px-2 py-1.5 ' + (hover === idx ? 'bg-slate-50' : '')}>
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: VIZ.medioPago[d.medioPago] || '#94a3b8' }} aria-hidden="true"></span>
            <span className="flex-1 min-w-0 text-sm font-medium text-slate-700 truncate">{MEDIO_PAGO_LABEL[d.medioPago] || 'Otro'}</span>
            <span className="shrink-0 text-sm font-bold tabular-nums">{money(d.total)}</span>
            <span className="shrink-0 text-xs text-slate-500 tabular-nums w-9 text-right">{Math.round((d.total / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TopProductsList({ items }) {
  if (items.length === 0) return <p className="text-sm text-slate-500 py-6">No hay ventas en este mes.</p>;
  const max = Math.max(...items.map((i) => i.unidades));
  return (
    <ul className="escalonado flex flex-col gap-3">
      {items.map((p) => (
        <li key={p.id} className="flex items-center gap-3">
          <span className="w-32 sm:w-40 shrink-0 text-sm font-medium text-slate-700 truncate">{p.nombre}</span>
          <span className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={p.nombre + ': ' + p.unidades + ' unidades vendidas'}>
            <span className="block h-full rounded-full bg-flox-600 origin-left animate-grow-x" style={{ width: (p.unidades / max) * 100 + '%' }}></span>
          </span>
          <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums" aria-hidden="true">{p.unidades}</span>
        </li>
      ))}
    </ul>
  );
}

// Color + ícono + texto (nunca solo color) para cada nivel de criticidad.
export function StockCriticidad({ products }) {
  const tiers = { good: 0, warning: 0, critical: 0 };
  products.forEach((p) => { tiers[stockTier(p)]++; });
  const flagged = products.filter((p) => stockTier(p) !== 'good').sort((a, b) => a.stockActual - b.stockActual);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(VIZ.status).map(([key, s]) => (
          <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.hex }} aria-hidden="true"></span>
            {tiers[key]} {s.label}
          </span>
        ))}
      </div>
      {flagged.length === 0 ? (
        <p className="text-sm text-slate-500">Todo el stock está en nivel óptimo.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {flagged.map((p) => {
            const s = VIZ.status[stockTier(p)];
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <Icon.alert className="w-5 h-5 shrink-0 text-slate-500" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.nombre}</div>
                  <div className="text-xs text-slate-500">{p.stockActual === 0 ? 'Sin stock disponible' : 'Quedan ' + p.stockActual + ' unidades (mínimo ' + p.stockMinimo + ')'}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.hex }} aria-hidden="true"></span>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
