import { useEffect, useMemo, useState } from 'react';
import * as productosApi from '../api/productos';
import * as stockApi from '../api/stock';
import { useFetch } from '../lib/useFetch';
import { MESES, mesActual, money } from '../lib/format';
import { Badge, Button, Card } from '../components/ui/Primitives';
import { Icon } from '../components/ui/Icon';
import { Loadable } from '../components/ui/States';
import { Dropdown } from '../components/ui/Dropdown';
import { ProductModal } from '../components/inventario/ProductModal';
import { EscanerCodigo } from '../components/ui/EscanerCodigo';
import { categoriaParaMostrar } from '../lib/catalogo';
import { ProductoImagen } from '../components/ui/ProductoImagen';
import { EliminarProductoModal } from '../components/inventario/EliminarProductoModal';
import { StockCajones, mesAnterior } from '../components/inventario/StockCajones';
import { BarraVolver, StockMesCerrado } from '../components/inventario/StockMesCerrado';
import { leerSegmentoMes, navegar, segmentoMes } from '../lib/ruta';

const SIN_CATEGORIA = 'Sin categoría';

function stockStatus({ stockActual, stockMinimo }) {
  if (stockActual === 0) return { label: 'Sin stock', classes: 'bg-red-100 text-red-700' };
  if (stockActual <= stockMinimo) return { label: stockActual + ' u.', classes: 'bg-orange-100 text-orange-800' };
  return { label: stockActual + ' u.', classes: 'bg-emerald-100 text-emerald-800' };
}

function Acciones({ p, onEdit, onDelete }) {
  return (
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
  );
}

// Fila de la lista (celular).
function ProductRow({ p, onEdit, onDelete }) {
  const s = stockStatus(p);
  return (
    <div className="flex items-center gap-3 py-3 border-t border-slate-100 first:border-t-0">
      <ProductoImagen nombre={p.nombre} />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="font-semibold text-sm leading-snug line-clamp-2">{p.nombre}</div>
        <div className="flex items-center gap-2 min-w-0">
          <Badge className={s.classes}>{s.label}</Badge>
          <span className="text-xs text-slate-500 truncate">{categoriaParaMostrar(p) || SIN_CATEGORIA} · {money(p.precioVenta)}</span>
        </div>
      </div>
      <Acciones p={p} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

// Columnas de la tabla de escritorio: Producto | Sobró | Ingresó | Vendido | Quedan | acciones
const COLUMNAS = 'grid grid-cols-[minmax(0,2.4fr)_repeat(3,minmax(0,0.8fr))_minmax(0,1.1fr)_5.5rem] gap-4 items-center';

// Fila de la tabla (escritorio). `mov` = movimientos del mes del producto;
// null si todavía no hay historial (se ven guiones).
function ProductTableRow({ p, mov, onEdit, onDelete }) {
  const dato = (v) => (mov ? v : '—');
  const bajo = p.stockActual <= p.stockMinimo;
  return (
    <div role="row" className={COLUMNAS + ' px-6 py-3 border-t border-slate-100 text-[15px] tabular-nums'}>
      <div role="cell" className="flex items-center gap-3 min-w-0">
        <ProductoImagen nombre={p.nombre} />
        <div className="min-w-0">
          <div className="font-semibold truncate">{p.nombre}</div>
          <div className="text-xs text-slate-500 truncate">
            {categoriaParaMostrar(p) || SIN_CATEGORIA} · {money(p.precioVenta)}
            {mov && mov.ajuste !== 0 && <span className="text-slate-600"> · Ajuste {mov.ajuste > 0 ? '+' : '−'}{Math.abs(mov.ajuste)}</span>}
          </div>
        </div>
      </div>
      <span role="cell" className="text-slate-600">{dato(mov?.sobro)}</span>
      <span role="cell" className="text-flox-700">{dato(mov?.ingreso)}</span>
      <span role="cell" className="text-amber-700">{dato(mov?.vendido)}</span>
      <span role="cell" className={'font-bold ' + (p.stockActual === 0 ? 'text-red-700' : bajo ? 'text-amber-700' : '')}>
        {p.stockActual}
        {p.stockActual === 0 ? ' · sin stock' : bajo ? ' · stock bajo' : ''}
      </span>
      <div role="cell" className="flex justify-end">
        <Acciones p={p} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

// Cajón del mes en curso: los productos de hoy (buscar, alta, edición, baja).
// Todo cambio de stock queda registrado en el mes.
function StockMesActual({ state, actual, resumen, onVolver, onCambio }) {
  const detalle = useFetch(() => stockApi.detalleDelMes(actual.anio, actual.mes), [actual.anio, actual.mes]);
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState('');
  // undefined = modal cerrado · null = alta · objeto = edición
  const [modal, setModal] = useState(undefined);
  const [aEliminar, setAEliminar] = useState(null);
  const [escaneando, setEscaneando] = useState(false);
  const [codigoNuevo, setCodigoNuevo] = useState(''); // para precargarlo en el alta

  // Movimientos del mes por producto; sin historial (migración pendiente) queda null.
  const movimientos = useMemo(() => {
    if (!detalle.data) return null;
    return new Map(detalle.data.productos.map((p) => [p.id, p]));
  }, [detalle.data]);
  const VACIO = { sobro: 0, ingreso: 0, vendido: 0, ajuste: 0, quedo: 0 };

  const categorias = useMemo(() => {
    const set = new Set((state.data ?? []).map((p) => categoriaParaMostrar(p) || SIN_CATEGORIA));
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [state.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (state.data ?? []).filter((p) => {
      const cat = categoriaParaMostrar(p) || SIN_CATEGORIA;
      if (categoria && cat !== categoria) return false;
      return p.nombre.toLowerCase().includes(q) || cat.toLowerCase().includes(q) || Boolean(q && p.codigoBarras?.includes(q));
    });
  }, [state.data, query, categoria]);

  const cambio = () => {
    onCambio();
    detalle.reload();
  };
  const vacio = query || categoria ? 'Sin resultados para esa búsqueda.' : 'Todavía no cargaste productos.';

  // Escanear en Stock: un producto → se abre para editar; varios → se filtran;
  // ninguno → se abre directo el alta con ese código ya cargado.
  const alEscanear = (codigo) => {
    setEscaneando(false);
    const hallados = (state.data ?? []).filter((p) => p.codigoBarras === codigo);
    if (hallados.length === 1) {
      setModal(hallados[0]);
    } else if (hallados.length > 1) {
      setCategoria('');
      setQuery(codigo);
    } else {
      abrirAlta(codigo);
    }
  };
  const abrirAlta = (codigo = '') => {
    setCodigoNuevo(codigo);
    setModal(null);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* Encabezado · celular */}
      <div className="md:hidden flex flex-col gap-2">
        <BarraVolver onVolver={onVolver} />
        <header className="flex items-center justify-between gap-3">
          <h1 className="font-display font-extrabold text-2xl">Stock {MESES[actual.mes - 1]}</h1>
          <Badge className="bg-flox-100 text-flox-700">En curso</Badge>
        </header>
      </div>

      {/* Encabezado · escritorio */}
      <header className="hidden md:flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button type="button" onClick={onVolver} className="h-12 px-2 -ml-2 rounded-xl text-sm font-semibold text-flox-700 hover:bg-flox-50 whitespace-nowrap">
            ← Todos los meses
          </button>
          <h1 className="font-display font-bold text-[26px] whitespace-nowrap">Stock {MESES[actual.mes - 1]}</h1>
          <Badge className="bg-flox-50 text-flox-700">Editable</Badge>
        </div>
        <Button onClick={() => abrirAlta()} className="shrink-0">
          <Icon.plus className="w-4 h-4" aria-hidden="true" />
          Agregar producto
        </Button>
      </header>

      {/* Franja del mes (celular). Sin el historial (migración 003 sin aplicar) muestra guiones. */}
      <div className="md:hidden flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-flox-50 border border-flox-100 text-sm text-teal-900">
        <Icon.box className="w-5 h-5 text-flox-700 shrink-0 mt-px" aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <span>
            Sobró de {mesAnterior(actual.mes)}: <strong>{resumen ? resumen.sobro + ' u.' : '—'}</strong> · Ingresó este mes: <strong>{resumen ? resumen.ingreso + ' u.' : '—'}</strong>
          </span>
          {!resumen && <span className="text-xs text-teal-800">Se completa cuando se active el historial de stock.</span>}
        </div>
      </div>

      {/* Buscador (+ Nuevo en celular, + categoría en escritorio) */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Icon.search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <label className="sr-only" htmlFor="inventario-search">Buscar producto</label>
          <input
            id="inventario-search"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-flox-600"
            placeholder="Buscar producto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="hidden md:block w-60 shrink-0">
          <Dropdown
            value={categoria}
            onChange={setCategoria}
            aria-label="Filtrar por categoría"
            opciones={[{ value: '', label: 'Todas las categorías' }, ...categorias.map((c) => ({ value: c, label: c }))]}
          />
        </div>
        <Button variant="outline" onClick={() => setEscaneando(true)} aria-label="Buscar con código de barras" className="!px-3 shrink-0">
          <Icon.barcode className="w-5 h-5" aria-hidden="true" />
          <span className="hidden md:inline">Escanear</span>
        </Button>
        <Button onClick={() => abrirAlta()} className="md:hidden">
          <Icon.plus className="w-4 h-4" aria-hidden="true" />
          Nuevo
        </Button>
      </div>


      {/* Lista · celular */}
      <Card className="escalonado md:hidden px-4 py-1">
        <Loadable state={state}>
          {() =>
            filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8 animate-fade-in">{vacio}</p>
            ) : (
              filtered.map((p) => <ProductRow key={p.id} p={p} onEdit={() => setModal(p)} onDelete={() => setAEliminar(p)} />)
            )
          }
        </Loadable>
      </Card>

      {/* Tabla · escritorio */}
      <Card className="hidden md:block overflow-hidden">
        <div role="table" aria-label={`Stock de ${MESES[actual.mes - 1]}`} className="escalonado">
          <div role="row" className={COLUMNAS + ' px-6 py-3.5 bg-slate-50 text-[13px] font-semibold text-slate-600'}>
            <span role="columnheader">Producto</span>
            <span role="columnheader">Sobró</span>
            <span role="columnheader">Ingresó</span>
            <span role="columnheader">Vendido</span>
            <span role="columnheader">Quedan</span>
            <span role="columnheader" className="sr-only">Acciones</span>
          </div>
          <Loadable state={state}>
            {() =>
              filtered.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 animate-fade-in border-t border-slate-100">{vacio}</p>
              ) : (
                filtered.map((p) => (
                  <ProductTableRow
                    key={p.id}
                    p={p}
                    mov={movimientos ? movimientos.get(p.id) ?? VACIO : null}
                    onEdit={() => setModal(p)}
                    onDelete={() => setAEliminar(p)}
                  />
                ))
              )
            }
          </Loadable>
        </div>
      </Card>
      {!movimientos && (
        <p className="hidden md:block -mt-2 text-xs text-slate-500">Sobró, Ingresó y Vendido se completan cuando se active el historial de stock.</p>
      )}

      {modal !== undefined && (
        <ProductModal
          producto={modal}
          existentes={state.data ?? []}
          codigoInicial={modal === null ? codigoNuevo : ''}
          onClose={() => setModal(undefined)}
          onSaved={cambio}
          onEliminar={(p) => { setModal(undefined); setAEliminar(p); }}
        />
      )}
      {aEliminar && <EliminarProductoModal producto={aEliminar} onClose={() => setAEliminar(null)} onDone={cambio} />}
      {escaneando && <EscanerCodigo titulo="Buscar por código" onDetect={alEscanear} onClose={() => setEscaneando(false)} />}
    </div>
  );
}

// Stock: primero los cajones por mes (/stock); al tocar uno se abre el mes
// (/stock/2026-10): el en curso es editable, los anteriores solo lectura.
export default function InventarioPage({ partes = [] }) {
  const state = useFetch(() => productosApi.listar(), []);
  const meses = useFetch(() => stockApi.listarMeses(), []);

  // El mes en curso lo define el servidor (hora de Argentina); sin historial, el del teléfono.
  const resumenActual = meses.data?.find((m) => m.enCurso) ?? null;
  const local = mesActual();
  const actual = resumenActual ? { anio: resumenActual.anio, mes: resumenActual.mes } : { anio: local.anio, mes: local.mes + 1 };

  // El mes abierto vive en la URL. Uno inválido o futuro vuelve a los cajones.
  const pedido = leerSegmentoMes(partes[0]);
  const futuro = pedido && pedido.anio * 12 + pedido.mes > actual.anio * 12 + actual.mes;
  const invalido = partes.length > 0 && (!pedido || futuro || partes.length > 1);
  const abierto = pedido && !invalido ? { ...pedido, enCurso: pedido.anio === actual.anio && pedido.mes === actual.mes } : null;
  useEffect(() => {
    if (invalido) navegar('/stock', { reemplazar: true });
  }, [invalido]);

  const ir = (destino) => navegar(destino ? '/stock/' + segmentoMes(destino) : '/stock');
  const recargar = () => {
    state.reload();
    meses.reload();
  };

  if (abierto && !abierto.enCurso) {
    return (
      <StockMesCerrado
        anio={abierto.anio}
        mes={abierto.mes}
        mesActual={actual}
        onVolver={() => ir(null)}
        onAbrirActual={() => ir({ ...actual, enCurso: true })}
      />
    );
  }
  if (abierto) {
    return <StockMesActual state={state} actual={actual} resumen={resumenActual} onVolver={() => ir(null)} onCambio={recargar} />;
  }
  return (
    <Loadable state={state}>
      {(productos) => <StockCajones actual={actual} productos={productos} meses={meses} onAbrir={ir} />}
    </Loadable>
  );
}
