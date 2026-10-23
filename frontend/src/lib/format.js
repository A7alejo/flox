export const money = (n) => (n < 0 ? '−' : '') + '$' + Math.round(Math.abs(n)).toLocaleString('es-AR');

export const compact = (n) => (n >= 1000 ? Math.round(n / 1000) + 'K' : String(n));

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// "Hoy, 14:32" · "Ayer, 18:47" · "12/10, 09:05"
export function formatFecha(iso) {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff === 0) return 'Hoy, ' + hora;
  if (diff === 1) return 'Ayer, ' + hora;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ', ' + hora;
}

// Etiqueta de un día 'YYYY-MM-DD' (la serie del dashboard). Se parsea a mano para
// no pasar por UTC y terminar mostrando el día anterior.
export function formatDia(dia, corto = false) {
  const [y, m, d] = dia.split('-').map(Number);
  if (corto) return d + '/' + m;
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
}

// ISO del primer instante del mes en curso (hora local del dispositivo).
export function inicioDeMes() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1).toISOString();
}

// Variación porcentual entera. null si no hay base de comparación (mes anterior en 0).
export function pctChange(actual, anterior) {
  if (!anterior) return null;
  return Math.round(((actual - anterior) / Math.abs(anterior)) * 100);
}

// Misma fórmula que productos.service.js / la columna GENERATED de Postgres:
// precio = costo × (1 + margen/100), redondeado a 2 decimales.
export function calcularPrecioVenta(costoBase, porcentajeMargen) {
  return Math.round(costoBase * (1 + porcentajeMargen / 100) * 100) / 100;
}
