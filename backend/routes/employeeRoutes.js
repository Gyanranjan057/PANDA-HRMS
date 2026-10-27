import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../config/db.js'
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js'

const router = Router()
const canViewEmployees = [requireAuth, requireRole('admin', 'hr')]

const toEmployee = row => ({
  id: row.id,
  employeeId: row.employeeId || `EMP${String(row.id).padStart(3, '0')}`,
  name: row.name,
  email: row.email || '',
  phone: row.phone || '',
  department: row.department || row.dept || '',
  designation: row.designation || row.role || '',
  workType: row.workType || '',
  status: row.status || '',
  role: row.role || '',
  leaveBalance: 0,
  avatar: row.avatar || '',
})

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

router.get('/', ...canViewEmployees, async (req, res, next) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1)
    const limit = Math.min(parsePositiveInteger(req.query.limit, 10), 100)
    const search = typeof req.query.search === 'string'
      ? req.query.search.trim()
      : ''
    const department = typeof req.query.department === 'string'
      ? req.query.department.trim()
      : ''
    const status = typeof req.query.status === 'string'
      ? req.query.status.trim()
      : ''
    const workType = typeof req.query.workType === 'string'
      ? req.query.workType.trim()
      : ''

    const conditions = []
    const values = []

    if (search) {
      conditions.push(
        '(name LIKE ? OR email LIKE ? OR role LIKE ? OR dept LIKE ? OR CAST(id AS CHAR) LIKE ?)',
      )
      const searchTerm = `%${search}%`
      values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (department && department !== 'All') {
      conditions.push('dept = ?')
      values.push(department)
    }

    if (status && status !== 'All') {
      conditions.push('status = ?')
      values.push(status)
    }

    if (workType && workType !== 'All') {
      conditions.push('workType = ?')
      values.push(workType)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM employees ${where}`,
      values,
    )
    const [employeeRows] = await pool.execute(
      `SELECT id, employeeId, name, role, dept, department, designation,
              workType, phone, email, status, avatar
       FROM employees ${where}
       ORDER BY id
       LIMIT ? OFFSET ?`,
      [...values, limit, (page - 1) * limit],
    )
    const total = Number(countRows[0].total)

    res.json({
      success: true,
      data: employeeRows.map(toEmployee),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/', ...canViewEmployees, async (req, res, next) => {
  const {
    employeeId,
    name,
    email,
    phone,
    department,
    designation,
    workType,
    role,
    leaveBalance,
    password,
  } = req.body || {}
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : ''
  const parsedLeaveBalance = leaveBalance
  const accountRoles = {
    employee: 'Employee',
    hr: 'HR',
    admin: 'Admin',
  }
  const roleForAccount = accountRoles[normalizedRole]
  const normalizedEmployeeId = typeof employeeId === 'string' ? employeeId.trim() : ''
  const normalizedName = typeof name === 'string' ? name.trim() : ''

  if (
    !normalizedEmployeeId ||
    normalizedEmployeeId.length > 50 ||
    normalizedName.length < 2 ||
    normalizedName.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    normalizedEmail.length > 120 ||
    typeof department !== 'string' ||
    !department.trim() ||
    department.trim().length > 150 ||
    typeof designation !== 'string' ||
    !designation.trim() ||
    designation.trim().length > 150 ||
    (typeof phone === 'string' && phone.trim().length > 20) ||
    (typeof workType === 'string' && workType.trim().length > 50) ||
    !roleForAccount ||
    typeof parsedLeaveBalance !== 'number' ||
    !Number.isSafeInteger(parsedLeaveBalance) ||
    parsedLeaveBalance < 0 ||
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 128
  ) {
    return res.status(400).json({
      success: false,
      message: 'Complete all required fields with valid employee, role, leave balance, and password values.',
    })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const passwordHash = await bcrypt.hash(password, 12)
    const [employeeResult] = await connection.execute(
      `INSERT INTO employees
         (employeeId, name, role, dept, email, phone, department, designation,
          workType, passwordHash, leaveBalance, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        normalizedEmployeeId,
        normalizedName,
        designation.trim(),
        department.trim(),
        normalizedEmail,
        typeof phone === 'string' && phone.trim() ? phone.trim() : null,
        department.trim(),
        designation.trim(),
        typeof workType === 'string' && workType.trim() ? workType.trim() : 'Full Time',
        passwordHash,
        Number(leaveBalance),
      ],
    )

    await connection.execute(
      `INSERT INTO users (name, email, password_hash, role, employee_id)
       VALUES (?, ?, ?, ?, ?)`,
      [normalizedName, normalizedEmail, passwordHash, roleForAccount, employeeResult.insertId],
    )
    await connection.commit()

    res.status(201).json({
      success: true,
      data: {
        id: employeeResult.insertId,
        employeeId: normalizedEmployeeId,
        name: normalizedName,
        email: normalizedEmail,
        department: department.trim(),
        designation: designation.trim(),
        workType: workType || 'Full Time',
        role: roleForAccount,
        status: 'Active',
        leaveBalance: parsedLeaveBalance,
      },
      message: 'Employee account created. They can now sign in with this email and password.',
    })
  } catch (error) {
    await connection.rollback()
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'That employee ID or email is already registered.',
      })
    }
    next(error)
  } finally {
    connection.release()
  }
})

router.get('/:id', ...canViewEmployees, async (req, res, next) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid employee ID',
    })
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, employeeId, name, role, dept, email, status, avatar,
              phone, department, designation, workType, leaveBalance
       FROM employees WHERE id = ? LIMIT 1`,
      [id],
    )

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      })
    }

    res.json({
      success: true,
      data: {
        ...toEmployee(rows[0]),
        employeeId: rows[0].employeeId || toEmployee(rows[0]).employeeId,
        phone: rows[0].phone || '',
        department: rows[0].department || rows[0].dept || '',
        designation: rows[0].designation || rows[0].role || '',
        workType: rows[0].workType || '',
        leaveBalance: Number(rows[0].leaveBalance || 0),
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
