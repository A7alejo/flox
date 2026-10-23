// Error con código HTTP asociado, para que el errorHandler sepa qué
// status devolver sin tener que adivinar.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
