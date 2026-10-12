import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

const router = Router()

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

router.post('/login', wrap(async (req, res) => {
  const identifier = typeof req.body?.identifier === 'string'
    ? req.body.identifier.trim().toLowerCase()
    : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Authentication is not configured.' })
  }

  const [rows] = await pool.execute(
    `SELECT id, name, email, password_hash, role, employee_id
     FROM users
     WHERE LOWER(email) = ?
     LIMIT 1`,
    [identifier],
  )
  const account = rows[0]

  if (!account || !(await bcrypt.compare(password, account.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  const token = jwt.sign(
    { role: account.role },
    process.env.JWT_SECRET,
    { subject: String(account.id), expiresIn: '8h' },
  )

  res.json({
    token,
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      employeeId: account.employee_id,
    },
  })
}))

export default router