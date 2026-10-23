// Envuelve un controlador async para que cualquier error (rechazo de
// promesa) caiga automáticamente en next(err) sin necesidad de try/catch
// repetido en cada controlador.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
