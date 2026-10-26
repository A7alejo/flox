import { useState } from 'react';
import * as enviosApi from '../api/envios';
import { useFetch } from '../lib/useFetch';
import { ESTADOS_ENVIO, ESTADO_ENVIO } from '../lib/constants';
import { formatFecha } from '../lib/format';
import { Badge, Button, Card, FormError } from '../components/ui/Primitives';
import { Icon } from '../components/ui/Icon';
import { Loadable } from '../components/ui/States';
import { EnvioModal } from '../components/envios/EnvioModal';

const FILTROS = [{ value: 'all', label: 'Todos' }, ...ESTADOS_ENVIO];

// Siguiente paso del flujo en_preparacion → listo_despacho → entregado.
const SIGUIENTE = {
  en_preparacion: { estado: 'listo_despacho', label: 'Marcar listo para despachar' },
  listo_despacho: { estado: 'entregado', label: 'Marcar como entregado' },
};

function EnvioRow({ envio, onChanged, onError }) {
  const estado = ESTADO_ENVIO[envio.estado];
  const siguiente = SIGUIENTE[envio.estado];
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    onError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const eliminar = () => {
    if (!window.confirm(`¿Eliminar el envío de "${envio.clienteNombre}"?`)) return;
    run(() => enviosApi.eliminar(envio.id));
  };

  return (
    <div className="flex flex-col gap-1.5 py-3.5 border-t border-slate-100 first:border-t-0">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm">{envio.clienteNombre}</span>
        <Badge className={estado.classes}>{estado.label}</Badge>
      </div>
      <span className="text-sm text-slate-500">
        {envio.productos.map((p) => `${p.productoNombre} x${p.cantidad}`).join(', ')}
      </span>
      {envio.direccion && <span className="text-xs text-slate-500">{envio.direccion}</span>}
      {envio.notas && <span className="text-xs text-slate-500 italic">{envio.notas}</span>}
      <span className="text-xs text-slate-500">{formatFecha(envio.fechaCreacion)}</span>
      <div className="flex gap-2 mt-1">
        {siguiente && (
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => run(() => enviosApi.actualizarEstado(envio.id, siguiente.estado))}>
            {siguiente.label}
          </Button>
        )}
        <button
          type="button"
          onClick={eliminar}
          disabled={busy}
          aria-label={'Eliminar envío de ' + envio.clienteNombre}
          className="w-12 h-12 rounded-xl border border-slate-200 bg-white text-slate-500 flex items-center justify-center disabled:opacity-50 ml-auto"
        >
          <Icon.trash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function EnviosPage() {
  const state = useFetch(() => enviosApi.listar(), []);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">Envíos / Pedidos</h1>
        <Button onClick={() => setModal(true)}><Icon.plus className="w-4 h-4" aria-hidden="true" /> Crear envío</Button>
      </header>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar por estado">
        {FILTROS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={'h-12 px-4 rounded-full border text-xs font-semibold whitespace-nowrap ' + (filter === value ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600')}
          >
            {label}
          </button>
        ))}
      </div>

      <FormError message={error} />

      <Card className="escalonado p-5">
        <Loadable state={state}>
          {(envios) => {
            const filtered = filter === 'all' ? envios : envios.filter((e) => e.estado === filter);
            return filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8 animate-fade-in">No hay envíos en este estado.</p>
            ) : (
              filtered.map((e) => <EnvioRow key={e.id} envio={e} onChanged={state.reload} onError={setError} />)
            );
          }}
        </Loadable>
      </Card>

      {modal && <EnvioModal onClose={() => setModal(false)} onDone={state.reload} />}
    </div>
  );
}
