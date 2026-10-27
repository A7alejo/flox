import { useState } from 'react';
import * as cajaApi from '../../api/caja';
import * as productosApi from '../../api/productos';
import { useFetch } from '../../lib/useFetch';
import { MEDIOS_PAGO, MEDIO_PAGO_LABEL } from '../../lib/constants';
import { money } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { Button, Card, ChipGroup, Field, FormError, Stepper, inputClass } from '../ui/Primitives';
import { Icon } from '../ui/Icon';
import { Loadable } from '../ui/States';

const ESTADOS = [
  { value: 'pagada', label: 'Cobrada ahora' },
  { value: 'pendiente', label: 'Queda pendiente' },
];

// Venta con uno o varios productos:
// 1) cantidades con stepper (como en Envíos) → 2) cobrada ahora o pendiente → listo.
// El stock se descuenta en los dos casos; la plata entra a caja solo si está cobrada.
export function SaleModal({ onClose, onDone }) {
  const productos = useFetch(() => productosApi.listar(), []);
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'success'
  const [cantidades, setCantidades] = useState({}); // { [productoId]: cantidad }
  const [estado, setEstado] = useState('pagada');
  const [medio, setMedio] = useState('efectivo');
  const [cliente, setCliente] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  const lista = productos.data ?? [];
  const lineas = lista
    .filter((p) => (cantidades[p.id] ?? 0) > 0)
    .map((p) => ({ producto: p, cantidad: cantidades[p.id] }));
  const total = lineas.reduce((s, l) => s + l.producto.precioVenta * l.cantidad, 0);
  const unidades = lineas.reduce((s, l) => s + l.cantidad, 0);

  const confirmar = async () => {
    setSaving(true);
    setError(null);
    try {
      // El total lo recalcula el backend con el precio vigente; acá es solo para mostrar.
      setResultado(
        await cajaApi.registrarVenta({
          items: lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad })),
          estado,
          medioPago: estado === 'pagada' ? medio : undefined,
          clienteNombre: cliente.trim() || undefined,
        })
      );
      setStep('success');
      onDone();
    } catch (err) {
      setError(err.message); // ej: 409 "Stock insuficiente de Jabón. Disponible: 2"
    } finally {
      setSaving(false);
    }
  };

  const otraVenta = () => {
    productos.reload(); // el stock cambió con la venta anterior
    setCantidades({});
    setEstado('pagada');
    setMedio('efectivo');
    setCliente('');
    setResultado(null);
    setStep('select');
  };

  const footer =
    step === 'select' ? (
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500">{unidades === 0 ? 'Elegí al menos un producto' : `${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`}</div>
          <div className="font-display font-extrabold text-lg tabular-nums">{money(total)}</div>
        </div>
        <Button className="flex-1" disabled={lineas.length === 0} onClick={() => { setError(null); setStep('confirm'); }}>
          Continuar
        </Button>
      </div>
    ) : step === 'confirm' ? (
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('select')} disabled={saving}>Atrás</Button>
        <Button variant={estado === 'pagada' ? 'success' : 'primary'} className="flex-1" onClick={confirmar} disabled={saving}>
          {saving ? 'Registrando…' : estado === 'pagada' ? 'Confirmar venta' : 'Guardar como pendiente'}
        </Button>
      </div>
    ) : null;

  return (
    <Modal title="Registrar venta" onClose={onClose} footer={footer}>
      {step === 'select' && (
        <div className="flex flex-col gap-3 animate-pop-in">
          <span className="text-xs font-semibold text-slate-500">Paso 1 · Elegí los productos y cantidades</span>
          <Loadable state={productos}>
            {(items) =>
              items.length === 0 ? (
                <p className="text-sm text-slate-500">Primero cargá productos en el Inventario.</p>
              ) : (
                <ul className="flex flex-col">
                  {items.map((p) => (
                    <li key={p.id} className={'flex items-center gap-3 py-2.5 border-t border-slate-100 first:border-t-0 ' + (p.stockActual === 0 ? 'opacity-40' : '')}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{p.nombre}</div>
                        <div className="text-xs text-slate-500">
                          {money(p.precioVenta)} · {p.stockActual === 0 ? 'sin stock' : p.stockActual + ' en stock'}
                        </div>
                      </div>
                      <Stepper
                        value={cantidades[p.id] ?? 0}
                        onChange={(c) => setCantidades((prev) => ({ ...prev, [p.id]: c }))}
                        max={p.stockActual}
                        label={'Cantidad de ' + p.nombre}
                      />
                    </li>
                  ))}
                </ul>
              )
            }
          </Loadable>
        </div>
      )}

      {step === 'confirm' && (
        <div className="flex flex-col gap-5 animate-pop-in">
          <span className="text-xs font-semibold text-slate-500">Paso 2 · Confirmá la venta</span>

          <Card className="p-4 flex flex-col gap-2">
            {lineas.map((l) => (
              <div key={l.producto.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{l.cantidad} × {l.producto.nombre}</span>
                <span className="font-semibold tabular-nums shrink-0">{money(l.producto.precioVenta * l.cantidad)}</span>
              </div>
            ))}
          </Card>

          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">¿Ya la pagaron?</div>
            <ChipGroup options={ESTADOS} value={estado} onChange={setEstado} label="Estado de la venta" />
          </div>

          {estado === 'pagada' ? (
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-2">Medio de cobro</div>
              <ChipGroup options={MEDIOS_PAGO} value={medio} onChange={setMedio} label="Medio de cobro" />
            </div>
          ) : (
            <p className="text-sm text-slate-500 -mt-2">
              El stock se descuenta ahora. La plata entra a la caja cuando la marques como cobrada.
            </p>
          )}

          <Field label={estado === 'pendiente' ? 'Cliente (para saber quién debe)' : 'Cliente (opcional)'}>
            <input className={inputClass} value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ej: Martina — Caballito" maxLength={150} />
          </Field>

          <Card className="bg-flox-50 border-flox-100 p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-flox-700">Total</span>
            <span className="font-display font-extrabold text-xl text-flox-700 tabular-nums">{money(total)}</span>
          </Card>

          <FormError message={error} />
        </div>
      )}

      {step === 'success' && resultado && (
        <div className="escalonado flex flex-col items-center text-center gap-3 py-6">
          <div className={'w-16 h-16 rounded-full flex items-center justify-center ' + (resultado.venta.estado === 'pagada' ? 'bg-emerald-100' : 'bg-orange-100')}>
            <Icon.check className={'w-8 h-8 ' + (resultado.venta.estado === 'pagada' ? 'text-emerald-700' : 'text-orange-700')} />
          </div>
          <h3 className="font-display font-bold text-lg">
            {resultado.venta.estado === 'pagada' ? '¡Venta registrada!' : 'Venta guardada como pendiente'}
          </h3>
          <p className="text-sm text-slate-500">
            {resultado.venta.productos.map((p) => `${p.cantidad} × ${p.nombre}`).join(', ')}
            {resultado.venta.estado === 'pagada' && ' · ' + MEDIO_PAGO_LABEL[resultado.venta.medioPago]}
          </p>
          <p className="font-bold text-lg text-flox-600 tabular-nums">{money(resultado.venta.total)}</p>
          {resultado.venta.estado === 'pendiente' && (
            <p className="text-xs text-slate-500">Va a aparecer en "Ventas pendientes" hasta que la cobres.</p>
          )}
          <p className="text-xs text-slate-500">
            Stock actualizado: {resultado.stock.map((s) => `${s.nombre} ${s.stockRestante}`).join(' · ')}
          </p>
          <div className="flex flex-col gap-2 w-full mt-3">
            <Button onClick={otraVenta}>Registrar otra venta</Button>
            <Button variant="ghost" onClick={onClose}>Volver a Caja</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
