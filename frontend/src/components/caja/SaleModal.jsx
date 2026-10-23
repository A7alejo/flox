import { useState } from 'react';
import * as cajaApi from '../../api/caja';
import * as productosApi from '../../api/productos';
import { useFetch } from '../../lib/useFetch';
import { MEDIOS_PAGO, MEDIO_PAGO_LABEL } from '../../lib/constants';
import { money } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { Button, Card, ChipGroup, FormError, Stepper } from '../ui/Primitives';
import { Icon } from '../ui/Icon';
import { Loadable } from '../ui/States';

// Venta en 3 toques: elegir producto → "Confirmar venta" (cantidad 1 y efectivo por defecto) → listo.
export function SaleModal({ onClose, onDone }) {
  const productos = useFetch(() => productosApi.listar(), []);
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'success'
  const [producto, setProducto] = useState(null);
  const [qty, setQty] = useState(1);
  const [medio, setMedio] = useState('efectivo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  const pick = (p) => {
    setProducto(p);
    setQty(1);
    setMedio('efectivo');
    setError(null);
    setStep('confirm');
  };

  const confirmar = async () => {
    setSaving(true);
    setError(null);
    try {
      // El monto lo calcula el backend con el precio vigente; acá solo se informa el resultado.
      setResultado(await cajaApi.registrarVenta({ productoId: producto.id, cantidad: qty, medioPago: medio }));
      setStep('success');
      onDone();
    } catch (err) {
      setError(err.message); // ej: 409 "Stock insuficiente. Disponible: 2"
    } finally {
      setSaving(false);
    }
  };

  const otraVenta = () => {
    productos.reload(); // el stock cambió con la venta anterior
    setStep('select');
    setProducto(null);
  };

  return (
    <Modal title="Registrar venta" onClose={onClose}>
      {step === 'select' && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-500">Paso 1 · Elegí el producto</span>
          <Loadable state={productos}>
            {(lista) =>
              lista.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick(p)}
                  disabled={p.stockActual === 0}
                  className="flex items-center gap-3 p-3.5 min-h-[56px] rounded-xl border border-slate-200 bg-white text-left disabled:opacity-40 disabled:cursor-not-allowed hover:border-flox-600"
                >
                  <div className="w-10 h-10 rounded-lg bg-flox-100 text-flox-600 flex items-center justify-center shrink-0">
                    <Icon.box className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.nombre}</div>
                    <div className="text-xs text-slate-500">{money(p.precioVenta)} · {p.stockActual === 0 ? 'sin stock' : p.stockActual + ' en stock'}</div>
                  </div>
                  <Icon.chevronRight className="w-4 h-4 text-slate-500" aria-hidden="true" />
                </button>
              ))
            }
          </Loadable>
        </div>
      )}

      {step === 'confirm' && producto && (
        <div className="flex flex-col gap-5">
          <span className="text-xs font-semibold text-slate-500">Paso 2 · Confirmá los datos</span>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-flox-100 text-flox-600 flex items-center justify-center shrink-0">
              <Icon.box className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">{producto.nombre}</div>
              <div className="text-xs text-slate-500">{money(producto.precioVenta)} c/u</div>
            </div>
          </Card>

          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">Cantidad</div>
            <div className="flex items-center gap-4 flex-wrap">
              <Stepper value={qty} onChange={setQty} min={1} max={producto.stockActual} label="Cantidad" />
              <span className="text-xs text-slate-500">de {producto.stockActual} disponibles</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">Medio de cobro</div>
            <ChipGroup options={MEDIOS_PAGO} value={medio} onChange={setMedio} label="Medio de cobro" />
          </div>

          <Card className="bg-flox-50 border-flox-100 p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-flox-700">Total</span>
            <span className="font-display font-extrabold text-xl text-flox-700 tabular-nums">{money(producto.precioVenta * qty)}</span>
          </Card>

          <FormError message={error} />

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('select')} disabled={saving}>Atrás</Button>
            <Button variant="success" className="flex-1" onClick={confirmar} disabled={saving}>
              {saving ? 'Registrando…' : 'Confirmar venta'}
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && resultado && (
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <Icon.check className="w-8 h-8 text-emerald-700" />
          </div>
          <h3 className="font-display font-bold text-lg">¡Venta registrada!</h3>
          <p className="text-sm text-slate-500">{qty} × {producto.nombre} · {MEDIO_PAGO_LABEL[medio]}</p>
          <p className="font-bold text-lg text-flox-600 tabular-nums">{money(resultado.movimiento.monto)}</p>
          <p className="text-xs text-slate-500">Stock actualizado: {producto.stockActual} → {resultado.stockRestante} unidades</p>
          <div className="flex flex-col gap-2 w-full mt-3">
            <Button onClick={otraVenta}>Registrar otra venta</Button>
            <Button variant="ghost" onClick={onClose}>Volver a Caja</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
