const { withTransaction } = require('../config/db');
const enviosRepo = require('../repositories/envios.repository');
const HttpError = require('../utils/HttpError');

const ESTADOS_VALIDOS = ['en_preparacion', 'listo_despacho', 'entregado'];

async function listar(filtros) {
  return enviosRepo.listar(filtros);
}

async function obtener(id) {
  const envio = await enviosRepo.getById(id);
  if (!envio) throw new HttpError(404, 'Envío no encontrado');
  return envio;
}

async function crear({ clienteNombre, direccion, notas, productos }) {
  if (!clienteNombre || !clienteNombre.trim()) {
    throw new HttpError(400, 'El nombre/referencia del cliente es obligatorio');
  }
  if (!Array.isArray(productos) || productos.length === 0) {
    throw new HttpError(400, 'Debe incluir al menos un producto en el envío');
  }
  for (const item of productos) {
    if (!item.productoId || !item.cantidad || item.cantidad <= 0) {
      throw new HttpError(400, 'Cada producto del envío necesita productoId y cantidad > 0');
    }
  }

  // Transacción: si falla la inserción de algún ítem del detalle,
  // no queremos un envío "fantasma" sin productos asociados.
  return withTransaction((client) =>
    enviosRepo.crear({ clienteNombre, direccion, notas, productos }, client)
  );
}

async function actualizarEstado(id, estado) {
  if (!ESTADOS_VALIDOS.includes(estado)) {
    throw new HttpError(400, `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`);
  }
  const envio = await enviosRepo.actualizarEstado(id, estado);
  if (!envio) throw new HttpError(404, 'Envío no encontrado');
  return envio;
}

async function eliminar(id) {
  const resultado = await enviosRepo.eliminar(id);
  if (!resultado) throw new HttpError(404, 'Envío no encontrado');
}

module.exports = { listar, obtener, crear, actualizarEstado, eliminar };
