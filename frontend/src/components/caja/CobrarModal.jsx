import { useState } from 'react';
import * as cajaApi from '../../api/caja';
import { MEDIOS_PAGO } from '../../lib/constants';
import { money } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { Button, Card, ChipGroup, FormError } from '../ui/Primitives';

// Marca una venta pendiente como cobrada: se elige el medio de cobro y recién
// ahí la plata entra a la caja.
export function CobrarModal({ venta, onClose, onDone }) {
  const [medio, setMedio] = useState('efectivo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const cobrar = async () => {
    setSaving(true);
    setError(null);
    try {
      await cajaApi.cobrarVenta(venta.id, medio);
      onDone();
      onClose();
    } catch (err) {
      setError(err.message); // ej: 409 "Esta venta ya está cobrada"
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Marcar como cobrada"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="success" className="flex-[2]" onClick={cobrar} disabled={saving}>
            {saving ? 'Guardando…' : 'Confirmar cobro'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <Card className="p-4 flex flex-col gap-2">
          {venta.clienteNombre && <div className="font-bold text-sm">{venta.clienteNombre}</div>}
          {venta.productos.map((p) => (
            <div key={p.productoId} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{p.cantidad} × {p.nombre}</span>
              <span className="tabular-nums shrink-0">{money(p.precioUnitario * p.cantidad)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-display font-extrabold text-lg tabular-nums">{money(venta.total)}</span>
          </div>
        </Card>

        <div>
          <div className="text-sm font-semibold text-slate-700 mb-2">¿Cómo te pagaron?</div>
          <ChipGroup options={MEDIOS_PAGO} value={medio} onChange={setMedio} label="Medio de cobro" />
        </div>

        <FormError message={error} />
      </div>
    </Modal>
  );
}
