import { useState } from 'react';
import * as productosApi from '../../api/productos';
import { calcularPrecioVenta, money } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { Button, Card, Field, FormError, inputClass } from '../ui/Primitives';

const num = (v) => Number(String(v).replace(',', '.')) || 0;

// Alta y edición de producto. Si llega `producto` es edición.
// El precio de venta lo calcula Postgres al guardar (columna GENERATED); lo que se ve acá es
// solo el preview con la misma fórmula.
export function ProductModal({ producto, onClose, onSaved }) {
  const editando = Boolean(producto);
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [categoria, setCategoria] = useState(producto?.categoria ?? '');
  const [stock, setStock] = useState(String(producto?.stockActual ?? 10));
  const [stockMinimo, setStockMinimo] = useState(String(producto?.stockMinimo ?? 5));
  const [costo, setCosto] = useState(String(producto?.costoBase ?? ''));
  const [margen, setMargen] = useState(producto?.porcentajeMargen ?? 45);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const precio = calcularPrecioVenta(num(costo), margen);
  const ganancia = precio - num(costo);
  const valido = nombre.trim() && costo !== '';

  const guardar = async () => {
    setSaving(true);
    setError(null);
    const datos = {
      nombre: nombre.trim(),
      categoria: categoria.trim() || undefined,
      stockActual: Math.max(0, Math.round(num(stock))),
      stockMinimo: Math.max(0, Math.round(num(stockMinimo))),
      costoBase: num(costo),
      porcentajeMargen: margen,
    };
    try {
      if (editando) await productosApi.actualizar(producto.id, datos);
      else await productosApi.crear(datos);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const darDeBaja = async () => {
    if (!window.confirm(`¿Dar de baja "${producto.nombre}"? Deja de aparecer en el inventario; el historial se conserva.`)) return;
    setSaving(true);
    setError(null);
    try {
      await productosApi.darDeBaja(producto.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editando ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="success" className="flex-[2]" onClick={guardar} disabled={saving || !valido}>
            {saving ? 'Guardando…' : 'Guardar producto'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Nombre del producto">
          <input className={inputClass} placeholder="Ej: Lavandina 5L" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>

        <Field label="Categoría">
          <input className={inputClass} placeholder="Ej: Limpieza de ropa" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        </Field>

        <div className="flex gap-3">
          <div className="flex-1">
            <Field label="Stock">
              <input type="number" inputMode="numeric" min="0" className={inputClass} value={stock} onChange={(e) => setStock(e.target.value)} />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Stock mínimo">
              <input type="number" inputMode="numeric" min="0" className={inputClass} value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="h-px bg-slate-100 my-1" />

        <Card className="bg-flox-50 border-flox-100 p-4 flex flex-col gap-4">
          <h3 className="font-semibold text-sm text-flox-700">Calculadora de costo y ganancia</h3>

          <Field label="Costo base ($)">
            <input type="number" inputMode="decimal" min="0" className={inputClass} value={costo} onChange={(e) => setCosto(e.target.value)} />
          </Field>

          <Field label="Porcentaje de ganancia (%)">
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="200" step="5" className="flex-1 h-12" value={Math.min(margen, 200)} onChange={(e) => setMargen(Number(e.target.value))} />
              <input
                type="number"
                inputMode="decimal"
                min="0"
                className={inputClass + ' !w-20 !px-2 text-center'}
                value={margen}
                onChange={(e) => setMargen(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </Field>

          <div className="bg-flox-600 rounded-xl px-4 py-4 text-white flex items-center justify-between">
            <div>
              <div className="text-xs opacity-80">Precio de venta sugerido</div>
              <div className="font-display font-extrabold text-2xl tabular-nums">{money(precio)}</div>
            </div>
            <div className="text-right text-xs opacity-90">
              Ganancia<br /><span className="font-bold text-sm tabular-nums">{money(ganancia)}</span>
            </div>
          </div>
        </Card>

        <FormError message={error} />

        {editando && (
          <Button variant="outline" className="!text-red-700 !border-red-200" onClick={darDeBaja} disabled={saving}>
            Dar de baja este producto
          </Button>
        )}
      </div>
    </Modal>
  );
}
