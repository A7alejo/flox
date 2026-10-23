import { useState } from 'react';
import * as enviosApi from '../../api/envios';
import * as productosApi from '../../api/productos';
import { useFetch } from '../../lib/useFetch';
import { Modal } from '../ui/Modal';
import { Button, Field, FormError, Stepper, inputClass } from '../ui/Primitives';
import { Loadable } from '../ui/States';

// Mismo patrón que SaleModal/GastoModal. Los productos se arman con un stepper por fila:
// los que quedan en 0 no se incluyen.
export function EnvioModal({ onClose, onDone }) {
  const productos = useFetch(() => productosApi.listar(), []);
  const [cliente, setCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [cantidades, setCantidades] = useState({}); // { [productoId]: cantidad }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const items = Object.entries(cantidades)
    .filter(([, c]) => c > 0)
    .map(([id, cantidad]) => ({ productoId: Number(id), cantidad }));
  const valido = cliente.trim() && items.length > 0;

  const crear = async () => {
    setSaving(true);
    setError(null);
    try {
      await enviosApi.crear({
        clienteNombre: cliente.trim(),
        direccion: direccion.trim() || undefined,
        notas: notas.trim() || undefined,
        productos: items,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Crear envío"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button className="flex-[2]" onClick={crear} disabled={saving || !valido}>
            {saving ? 'Creando…' : 'Crear envío'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Cliente">
          <input className={inputClass} placeholder="Ej: Martina G. — Caballito" value={cliente} onChange={(e) => setCliente(e.target.value)} />
        </Field>
        <Field label="Dirección (opcional)">
          <input className={inputClass} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </Field>
        <Field label="Notas (opcional)">
          <input className={inputClass} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </Field>

        <div>
          <div className="text-sm font-semibold text-slate-700 mb-2">Productos</div>
          <Loadable state={productos}>
            {(lista) =>
              lista.length === 0 ? (
                <p className="text-sm text-slate-500">Primero cargá productos en el Inventario.</p>
              ) : (
                <ul className="flex flex-col">
                  {lista.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2 border-t border-slate-100 first:border-t-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{p.nombre}</div>
                        <div className="text-xs text-slate-500">{p.stockActual} en stock</div>
                      </div>
                      <Stepper
                        value={cantidades[p.id] ?? 0}
                        onChange={(c) => setCantidades((prev) => ({ ...prev, [p.id]: c }))}
                        label={'Cantidad de ' + p.nombre}
                      />
                    </li>
                  ))}
                </ul>
              )
            }
          </Loadable>
        </div>

        <FormError message={error} />
      </div>
    </Modal>
  );
}
