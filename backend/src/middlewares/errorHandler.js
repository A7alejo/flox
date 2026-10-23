// Middleware centralizado de errores. Cualquier error pasado a next(err)
// (incluyendo los de asyncHandler) termina acá.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;

  if (status === 500) {
    // Solo logueamos en el servidor los errores no controlados.
    console.error('[ERROR]', err);
  }

  res.status(status).json({
    error: {
      message: status === 500 ? 'Error interno del servidor' : err.message,
    },
  });
}

module.exports = errorHandler;
