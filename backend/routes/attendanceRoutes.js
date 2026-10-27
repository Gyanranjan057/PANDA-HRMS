import { Router } from 'express'
import pool from '../config/db.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()
const anySignedInUser = [requireAuth]

async function findEmployeeId(userId) {
  const [rows] = await pool.execute(
    'SELECT employee_id FROM users WHERE id = ? LIMIT 1',
    [userId],
  )
  return rows[0]?.employee_id ? Number(rows[0].employee_id) : null
}

function formatAttendance(row) {
  const date = row.date instanceof Date
    ? row.date.toISOString().slice(0, 10)
    : String(row.date).slice(0, 10)
  return {
    id: Number(row.id),
    employeeId: row.employeeId == null ? undefined : Number(row.employeeId),
    employeeCode: row.employeeCode || undefined,
    name: row.name || undefined,
    department: row.department || undefined,
    designation: row.designation || undefined,
    date,
    punchInAt: row.punchIn ? new Date(row.punchIn).toISOString() : null,
    punchOutAt: row.punchOut ? new Date(row.punchOut).toISOString() : null,
    status: row.punchIn
      ? new Date(row.punchIn).getHours() >= 10 ? 'Late' : 'Present'
      : 'Absent',
  }
}

router.get('/me', ...anySignedInUser, async (req, res, next) => {
  try {
    const employeeId = await findEmployeeId(req.user.sub)
    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'This account is not linked to an employee record.',
      })
    }

    const [rows] = await pool.execute(
      `SELECT id, employeeId, date, punchIn, punchOut
       FROM attendances WHERE employeeId = ?
       ORDER BY date DESC LIMIT 90`,
      [employeeId],
    )
    res.json({ attendance: rows.map(formatAttendance) })
  } catch (error) {
    next(error)
  }
})

router.post('/punch-in', ...anySignedInUser, async (req, res, next) => {
  try {
    const employeeId = await findEmployeeId(req.user.sub)
    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'This account is not linked to an employee record.',
      })
    }
    const [existingRows] = await pool.execute(
      'SELECT id, punchIn FROM attendances WHERE employeeId = ? AND date = CURDATE() LIMIT 1',
      [employeeId],
    )
    if (existingRows[0]?.punchIn) {
      return res.status(409).json({
        success: false,
        message: 'You have already punched in for this date.',
      })
    }

    await pool.execute(
      `INSERT INTO attendances (employeeId, date, punchIn)
       VALUES (?, CURDATE(), NOW(3))
       ON DUPLICATE KEY UPDATE punchIn = VALUES(punchIn)`,
      [employeeId],
    )
    const [rows] = await pool.execute(
      'SELECT id, employeeId, date, punchIn, punchOut FROM attendances WHERE employeeId = ? AND date = CURDATE() LIMIT 1',
      [employeeId],
    )
    res.status(201).json({ attendance: formatAttendance(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.post('/punch-out', ...anySignedInUser, async (req, res, next) => {
  try {
    const employeeId = await findEmployeeId(req.user.sub)
    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'This account is not linked to an employee record.',
      })
    }
    const [result] = await pool.execute(
      `UPDATE attendances SET punchOut = NOW(3)
       WHERE employeeId = ? AND date = CURDATE() AND punchIn IS NOT NULL AND punchOut IS NULL`,
      [employeeId],
    )
    if (!result.affectedRows) {
      return res.status(409).json({
        success: false,
        message: 'Punch in before punching out, or this shift is already complete.',
      })
    }

    const [rows] = await pool.execute(
      'SELECT id, employeeId, date, punchIn, punchOut FROM attendances WHERE employeeId = ? AND date = CURDATE() LIMIT 1',
      [employeeId],
    )
    res.json({ attendance: formatAttendance(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.get('/', ...anySignedInUser, async (req, res, next) => {
  const from = typeof req.query.from === 'string' ? req.query.from : ''
  const to = typeof req.query.to === 'string' ? req.query.to : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return res.status(400).json({
      success: false,
      message: 'Valid from and to dates are required.',
    })
  }

  try {
    const [accountRows] = await pool.execute(
      'SELECT employee_id, role FROM users WHERE id = ? LIMIT 1',
      [req.user.sub],
    )
    const account = accountRows[0]
    if (!account) {
      return res.status(401).json({ success: false, message: 'Account not found.' })
    }
    const isAdmin = ['admin', 'hr'].includes(String(account.role).toLowerCase())
    if (!isAdmin && !account.employee_id) {
      return res.status(403).json({
        success: false,
        message: 'This account is not linked to an employee record.',
      })
    }

    const [employeeRows] = await pool.execute(
      `SELECT id, employeeId, name, COALESCE(department, dept, '') AS department,
              COALESCE(designation, role, '') AS designation
       FROM employees ${isAdmin ? '' : 'WHERE id = ?'}
       ORDER BY name`,
      isAdmin ? [] : [account.employee_id],
    )
    const [rows] = await pool.execute(
      `SELECT a.id, a.employeeId, e.employeeId AS employeeCode, e.name,
              COALESCE(e.department, e.dept, '') AS department,
              COALESCE(e.designation, e.role, '') AS designation,
              a.date, a.punchIn, a.punchOut
       FROM attendances a
       JOIN employees e ON e.id = a.employeeId
       WHERE a.date BETWEEN ? AND ? ${isAdmin ? '' : 'AND a.employeeId = ?'}
       ORDER BY a.date, e.name`,
      isAdmin ? [from, to] : [from, to, account.employee_id],
    )
    res.json({
      employees: employeeRows.map(employee => ({
        id: Number(employee.id),
        employeeCode: employee.employeeId || `EMP${String(employee.id).padStart(3, '0')}`,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
      })),
      attendance: rows.map(formatAttendance),
    })
  } catch (error) {
    next(error)
  }
})

export default router
