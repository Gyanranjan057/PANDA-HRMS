// Throw this to send a clean message to the UI / Postman: throw new HttpError(404, 'Task not found.')
class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.statusCode = status
  }
}

const notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` })
}

const errorHandler = (error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' })
  }

  const status = error.statusCode || error.status || 500
  if (status >= 500) console.error(error)

  res.status(status).json({
    error: status >= 500 ? 'Internal server error.' : error.message,
  })
}

export { HttpError, notFound, errorHandler }