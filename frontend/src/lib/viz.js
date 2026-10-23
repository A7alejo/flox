// Paleta de datos (validada en el prototipo). NO es el acento de marca (teal):
// el par divergente ingresos/egresos usa azul/rojo en vez de verde/rojo para
// separarse bajo daltonismo, y las paletas categórica y de estado también están
// verificadas por contraste.
export const VIZ = {
  ingresos: '#2a78d6',
  egresos: '#e34948',
  baseline: '#c3c2b7',
  grid: '#e1e0d9',
  // Un color FIJO por medio de cobro (no por posición en el ranking):
  // efectivo verde, Personal Pay violeta (pedido de los usuarios).
  medioPago: { efectivo: '#15803D', personal_pay: '#7C3AED', transferencia: '#94a3b8' },
  status: {
    good: { hex: '#0ca30c', label: 'Óptimo' },
    warning: { hex: '#fab219', label: 'Medio' },
    critical: { hex: '#d03b3b', label: 'Alerta urgente' },
  },
};

// Criticidad de stock en 3 niveles. El umbral "medio" es el stock mínimo propio
// de cada producto (el mismo criterio que usa el backend para las alertas).
export function stockTier({ stockActual, stockMinimo }) {
  if (stockActual === 0) return 'critical';
  if (stockActual <= stockMinimo) return 'warning';
  return 'good';
}
