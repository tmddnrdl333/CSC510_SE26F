// Lets code inside db.runTransaction() abort with an HTTP status: throwing
// rolls the transaction back, and the route turns the error into a response.

class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

/** Send an HttpError as JSON. Returns false for any other error so the caller can 500. */
function sendHttpError(res, error) {
  if (!(error instanceof HttpError)) return false;
  res.status(error.status).json({ error: error.message, ...error.extra });
  return true;
}

module.exports = { HttpError, sendHttpError };
