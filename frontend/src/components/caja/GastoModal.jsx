import { useState } from 'react';
import * as cajaApi from '../../api/caja';
import { MEDIOS_PAGO } from '../../lib/constants';
import { Modal } from '../ui/Modal';
import { Button, ChipGroup, Field, FormError, inputClass } from '../ui/Primitives';

// Mismo patrón que SaleModal: campos grandes, medio de cobro en chips, un solo botón de confirmación.
export function GastoModal({ onClose, onDone }) {
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [medio, setMedio] = useState('efectivo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const montoNum = Number(monto.replace(',', '.'));
  const valido = montoNum > 0 && concepto.trim();

  const registrar = async () => {
    setSaving(true);
    setError(null);
    try {
      await cajaApi.registrarEgreso({ monto: montoNum, concepto: concepto.trim(), medioPago: medio });
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Registrar gasto"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="danger" className="flex-[2]" onClick={registrar} disabled={saving || !valido}>
            {saving ? 'Registrando…' : 'Registrar gasto'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Monto ($)">
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            placeholder="0"
            className={inputClass + ' !h-14 font-display font-extrabold !text-xl tabular-nums'}
            value={monto}
            onChange={(e) => setMonto(e.target.value.replace(/[^\d.,]/g, ''))}
          />
        </Field>

        <Field label="Concepto">
          <input className={inputClass} placeholder="Ej: Compra de envases" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
        </Field>

        <div>
          <div className="text-sm font-semibold text-slate-700 mb-2">Medio de pago</div>
          <ChipGroup options={MEDIOS_PAGO} value={medio} onChange={setMedio} label="Medio de pago" />
        </div>

        <FormError message={error} />
      </div>
    </Modal>
  );
}
