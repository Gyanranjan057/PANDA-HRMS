
import { rateLimit } from 'express-rate-limit'

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  skip: req => req.path === '/auth/login',
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
  },
})

export { apiLimiter, loginLimiter }
