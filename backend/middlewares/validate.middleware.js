
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const allowedSources = ['body', 'params', 'query']

    if (!allowedSources.includes(source)) {
      return next(new Error('Invalid validation source'))
    }

    const result = schema.safeParse(req[source])

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }

    if (!req.validated) {
      req.validated = {}
    }

    req.validated[source] = result.data

    return next()
  }
}

export default validate
