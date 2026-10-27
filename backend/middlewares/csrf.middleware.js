const configuredOrigins = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN
const allowedOrigins = configuredOrigins
  ? configuredOrigins.split(',').map(origin => origin.trim())
  : null
const isLoopbackOrigin = origin => {
  try {
    const url = new URL(origin)
    return url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname)
  } catch {
    return false
  }
}

export const originIsAllowed = origin => {
  if (!origin) return false
  if (allowedOrigins?.includes(origin)) return true
  return isLoopbackOrigin(origin)
}

const csrfProtection = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']

  if (safeMethods.includes(req.method)) {
    return next()
  }

  const origin = req.get('Origin')

  if (!originIsAllowed(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Request origin not allowed',
    })
  }

  next()
}

export default csrfProtection