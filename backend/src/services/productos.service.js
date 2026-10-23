// =====================================================================
// Servicio de Productos: validaciones + reglas de negocio.
// El cálculo de precio_venta lo hace Postgres (columna GENERATED en el
// schema), así que nunca puede desincronizarse de costo_base / margen
// aunque el registro se edite directo en la base. `calcularPrecioVenta`
// se usa solo para previsualizar el precio en el formulario ANTES de
// guardar (ej. mientras el usuario escribe costo y margen).
// =====================================================================
const productosRepo = require('../repositories/productos.repository');
const HttpError = require('../utils/HttpError');

function calcularPrecioVenta(costoBase, porcentajeMargen) {
  return Math.round(costoBase * (1 + porcentajeMargen / 100) * 100) / 100;
}

function validarDatosProducto({ nombre, costoBase, porcentajeMargen }, esCreacion) {
  if (esCreacion && (!nombre || !nombre.trim())) {
    throw new HttpError(400, 'El nombre del producto es obligatorio');
  }
  if (esCreacion && (costoBase === undefined || costoBase === null)) {
    throw new HttpError(400, 'El costo base es obligatorio');
  }
  if (costoBase !== undefined && costoBase !== null && costoBase < 0) {
    throw new HttpError(400, 'El costo base no puede ser negativo');
  }
  if (porcentajeMargen !== undefined && porcentajeMargen !== null && porcentajeMargen < 0) {
    throw new HttpError(400, 'El porcentaje de margen no puede ser negativo');
  }
}

async function listar(filtros) {
  return productosRepo.listar(filtros);
}

async function obtener(id) {
  const producto = await productosRepo.getById(id);
  if (!producto) throw new HttpError(404, 'Producto no encontrado');
  return producto;
}

async function crear(datos) {
  validarDatosProducto(datos, true);
  return productosRepo.crear(datos);
}

async function actualizar(id, datos) {
  validarDatosProducto(datos, false);
  const actualizado = await productosRepo.actualizar(id, datos);
  if (!actualizado) throw new HttpError(404, 'Producto no encontrado');
  return actualizado;
}

async function darDeBaja(id) {
  const resultado = await productosRepo.darDeBaja(id);
  if (!resultado) throw new HttpError(404, 'Producto no encontrado');
  return resultado;
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  darDeBaja,
  calcularPrecioVenta,
};
