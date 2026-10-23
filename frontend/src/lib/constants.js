// Valores que el backend valida como enums (caja.service.js y envios.service.js).
// `value` es lo que viaja por la API; `label` es lo que ve la persona.

export const MEDIOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'personal_pay', label: 'Personal Pay' },
  { value: 'transferencia', label: 'Transferencia' },
];

export const MEDIO_PAGO_LABEL = Object.fromEntries(MEDIOS_PAGO.map((m) => [m.value, m.label]));

export const ESTADOS_ENVIO = [
  { value: 'en_preparacion', label: 'En preparación', classes: 'bg-orange-100 text-orange-800' },
  { value: 'listo_despacho', label: 'Listo para despachar', classes: 'bg-blue-100 text-blue-700' },
  { value: 'entregado', label: 'Entregado', classes: 'bg-emerald-100 text-emerald-800' },
];

export const ESTADO_ENVIO = Object.fromEntries(ESTADOS_ENVIO.map((e) => [e.value, e]));
