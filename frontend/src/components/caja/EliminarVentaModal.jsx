import { useState } from 'react';
import * as cajaApi from '../../api/caja';
import { Modal } from '../ui/Modal';
import { Button, FormError } from '../ui/Primitives';
import { money } from '../../lib/format';

// Confirmación en pantalla para borrar del historial una venta (sale de Caja y
// vuelve el stock, todo junto) o un gasto (solo sale de Caja).
export function EliminarVentaModal({ movimiento, titulo, onClose, onDone }) {
  const esGasto = movimiento.tipo === 'egreso';
  const que = esGasto ? 'gasto' : 'venta';
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const eliminar = async () => {
    setBusy(true);
    setError(null);
    try {
      await cajaApi.eliminarDelHistorial(movimiento.id);
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={esGasto ? 'Eliminar gasto' : 'Eliminar venta'}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button variant="danger" className="flex-1" disabled={busy} onClick={eliminar}>
            {busy ? 'Eliminando…' : 'Eliminar ' + que}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-sm">
        <p>
          ¿Eliminar {esGasto ? 'este gasto' : 'esta venta'}? <strong>{titulo}</strong> por <strong>{money(movimiento.monto)}</strong>.
        </p>
        <p>
          {esGasto ? 'Se quita de Caja.' : 'Se quita de Caja y el stock vuelve.'} Esta acción <strong>no se puede deshacer</strong>.
        </p>
        <FormError message={error} />
      </div>
    </Modal>
  );
}
