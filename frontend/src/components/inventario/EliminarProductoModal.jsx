import { useState } from 'react';
import * as productosApi from '../../api/productos';
import { Modal } from '../ui/Modal';
import { Button, FormError } from '../ui/Primitives';

// Confirmación en pantalla para borrar un producto. Si el backend responde 409
// (tiene ventas/envíos), se ofrece "Dar de baja" en su lugar.
export function EliminarProductoModal({ producto, onClose, onDone }) {
  const [error, setError] = useState(null);
  const [conHistorial, setConHistorial] = useState(false);
  const [busy, setBusy] = useState(false);

  const ejecutar = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      if (err.status === 409) setConHistorial(true);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Eliminar producto"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>Cancelar</Button>
          {conHistorial ? (
            <Button variant="dangerOutline" className="flex-1" disabled={busy} onClick={() => ejecutar(() => productosApi.darDeBaja(producto.id))}>
              {busy ? 'Guardando…' : 'Dar de baja'}
            </Button>
          ) : (
            <Button variant="danger" className="flex-1" disabled={busy} onClick={() => ejecutar(() => productosApi.eliminar(producto.id))}>
              {busy ? 'Eliminando…' : 'Eliminar'}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-sm">
        <p>
          ¿Eliminar <strong>{producto.nombre}</strong>? Esta acción <strong>no se puede deshacer</strong>.
        </p>
        <FormError message={error} />
        {conHistorial && (
          <p className="text-slate-500">
            "Dar de baja" lo saca del inventario y de las ventas, pero conserva su historial.
          </p>
        )}
      </div>
    </Modal>
  );
}
