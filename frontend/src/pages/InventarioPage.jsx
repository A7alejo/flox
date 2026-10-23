import { useMemo, useState } from 'react';
import * as productosApi from '../api/productos';
import { useFetch } from '../lib/useFetch';
import { money } from '../lib/format';
import { Badge, Button, Card } from '../components/ui/Primitives';
import { Icon } from '../components/ui/Icon';
import { Loadable } from '../components/ui/States';
import { ProductModal } from '../components/inventario/ProductModal';
import { categoriaParaMostrar } from '../lib/catalogo';
import { EliminarProductoModal } from '../components/inventario/EliminarProductoModal';

function stockStatus({ stockActual, stockMinimo }) {
  if (stockActual === 0) return { label: 'Sin stock', classes: 'bg-red-100 text-red-700' };
  if (stockActual <= stockMinimo) return { label: stockActual + ' u.', classes: 'bg-orange-100 text-orange-800' };
  return { label: stockActual + ' u.', classes: 'bg-emerald-100 text-emerald-800' };
}

function ProductRow({ p, onEdit, onDelete }) {
  const s = stockStatus(p);
  return (
    <div className="flex items-center gap-3 py-3 border-t border-slate-100 first:border-t-0">
      <div className="w-11 h-11 rounded-lg bg-flox-100 text-flox-600 flex items-center justify-center shrink-0">
        <Icon.box className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{p.nombre}</div>
        <div className="text-xs text-slate-500 truncate">{categoriaParaMostrar(p) || 'Sin categoría'} · {money(p.precioVenta)}</div>
      </div>
      <Badge className={s.classes}>{s.label}</Badge>
      <div className="flex shrink-0 -mr-2">
        <button type="button" onClick={onEdit} aria-label={'Editar ' + p.nombre} className="w-12 h-12 rounded-xl flex items-center justify-center">
          <span className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center">
            <Icon.edit className="w-4 h-4 text-slate-500" />
          </span>
        </button>
        <button type="button" onClick={onDelete} aria-label={'Eliminar ' + p.nombre} className="w-12 h-12 rounded-xl flex items-center justify-center">
          <span className="w-9 h-9 rounded-lg border border-red-200 bg-white flex items-center justify-center">
            <Icon.trash className="w-4 h-4 text-red-600" />
          </span>
        </button>
      </div>
    </div>
  );
}

export default function InventarioPage() {
  const state = useFetch(() => productosApi.listar(), []);
  const [query, setQuery] = useState('');
  // undefined = modal cerrado · null = alta · objeto = edición
  const [modal, setModal] = useState(undefined);
  const [aEliminar, setAEliminar] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (state.data ?? []).filter((p) => p.nombre.toLowerCase().includes(q) || (categoriaParaMostrar(p) ?? '').toLowerCase().includes(q));
  }, [state.data, query]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">Inventario</h1>
        <div className="flex gap-3">
          <div className="relative flex-1 sm:w-72">
            <Icon.search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <label className="sr-only" htmlFor="inventario-search">Buscar producto</label>
            <input
              id="inventario-search"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-flox-600"
              placeholder="Buscar por nombre o categoría"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setModal(null)}>
            <Icon.plus className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nuevo producto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </header>

      <Card className="p-5">
        <Loadable state={state}>
          {() =>
            filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                {query ? `Sin resultados para "${query}".` : 'Todavía no cargaste productos.'}
              </p>
            ) : (
              filtered.map((p) => <ProductRow key={p.id} p={p} onEdit={() => setModal(p)} onDelete={() => setAEliminar(p)} />)
            )
          }
        </Loadable>
      </Card>

      {modal !== undefined && (
        <ProductModal
          producto={modal}
          existentes={state.data ?? []}
          onClose={() => setModal(undefined)}
          onSaved={state.reload}
          onEliminar={(p) => { setModal(undefined); setAEliminar(p); }}
        />
      )}
      {aEliminar && <EliminarProductoModal producto={aEliminar} onClose={() => setAEliminar(null)} onDone={state.reload} />}
    </div>
  );
}
