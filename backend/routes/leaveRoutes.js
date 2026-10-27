import { Router } from 'express'
import pool from '../config/db.js'
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js'

const router = Router()
const anySignedInUser = [requireAuth]
const adminRoles = [requireAuth, requireRole('admin', 'hr')]

async function findAccount(userId) {
  const [rows] = await pool.execute(
    'SELECT id, employee_id, role FROM users WHERE id = ? LIMIT 1',
    [userId],
  )
  return rows[0] || null
}

async function findEmployeeAccount(userId) {
  const account = await findAccount(userId)
  if (!account) {
    return { status: 401, message: 'Account not found.' }
  }
  if (String(account.role).toLowerCase() !== 'employee') {
    return { status: 403, message: 'Leave requests are available to employee accounts only.' }
  }
  if (!account.employee_id) {
    return { status: 403, message: 'This account is not linked to an employee record.' }
  }
  return { account }
}

function mapLeave(row) {
  const formatDate = value => value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10)
  return {
    id: Number(row.id),
    employeeId: Number(row.employeeId),
    employeeName: row.employeeName,
    employeeEmail: row.employeeEmail,
    leaveType: row.leaveType,
    fromDate: formatDate(row.startDate),
    toDate: formatDate(row.endDate),
    reason: row.reason || '',
    handoverTo: row.handoverTo || '',
    days: Math.floor((new Date(`${formatDate(row.endDate)}T00:00:00`) - new Date(`${formatDate(row.startDate)}T00:00:00`)) / 86400000) + 1,
    status: row.status,
    createdAt: row.createdAt,
  }
}

const leaveSelect = `SELECT l.id, l.employeeId, e.name AS employeeName, e.email AS employeeEmail,
                            l.leaveType, l.startDate, l.endDate, l.reason, l.handoverTo,
                            l.status, l.createdAt
                     FROM leaves l
                     JOIN employees e ON e.id = l.employeeId`

router.get('/', ...anySignedInUser, async (req, res, next) => {
  try {
    const account = await findAccount(req.user.sub)
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
    const employeeScope = isAdmin ? '' : 'WHERE l.employeeId = ?'
    const [rows] = await pool.execute(
      `${leaveSelect} ${employeeScope} ORDER BY l.createdAt DESC`,
      isAdmin ? [] : [account.employee_id],
    )
    res.json({ requests: rows.map(mapLeave) })
  } catch (error) {
    next(error)
  }
})

router.post('/', ...anySignedInUser, async (req, res, next) => {
  const leaveType = typeof req.body?.leaveType === 'string' ? req.body.leaveType.trim() : ''
  const startDate = typeof req.body?.fromDate === 'string' ? req.body.fromDate : ''
  const endDate = typeof req.body?.toDate === 'string' ? req.body.toDate : ''
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
  if (
    !leaveType ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
    endDate < startDate ||
    reason.length < 8 ||
    reason.length > 600
  ) {
    return res.status(400).json({
      success: false,
      message: 'Enter a leave type, valid date range, and a reason of at least 8 characters.',
    })
  }

  try {
    const employeeResult = await findEmployeeAccount(req.user.sub)
    if (!employeeResult.account) {
      return res.status(employeeResult.status).json({
        success: false,
        message: employeeResult.message,
      })
    }
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [insertResult] = await connection.execute(
        `INSERT INTO leaves
           (employeeId, leaveType, startDate, endDate, reason, handoverTo, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
        [
          employeeResult.account.employee_id,
          leaveType,
          startDate,
          endDate,
          reason,
          typeof req.body?.handoverTo === 'string' ? req.body.handoverTo.trim().slice(0, 100) : null,
        ],
      )
      const [employeeRows] = await connection.execute(
        'SELECT name FROM employees WHERE id = ? LIMIT 1',
        [employeeResult.account.employee_id],
      )
      const employeeName = employeeRows[0]?.name || 'An employee'
      const [adminAccounts] = await connection.execute(
        "SELECT id FROM users WHERE LOWER(role) IN ('admin', 'hr')",
      )
      const notificationMessage = `New ${leaveType} request from ${employeeName} (${startDate} to ${endDate}).`
      const notificationRecipients = [
        employeeResult.account.id,
        ...adminAccounts.map(account => Number(account.id)),
      ]
      for (const userId of new Set(notificationRecipients)) {
        const message = userId === employeeResult.account.id
          ? `${leaveType} request submitted. It is pending admin review.`
          : notificationMessage
        await connection.execute(
          'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
          [userId, message],
        )
      }
      const [rows] = await connection.execute(
        `${leaveSelect} WHERE l.id = ? LIMIT 1`,
        [insertResult.insertId],
      )
      await connection.commit()
      res.status(201).json({ request: mapLeave(rows[0]) })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/status', ...adminRoles, async (req, res, next) => {
  const id = Number(req.params.id)
  const status = req.body?.status
  if (!Number.isSafeInteger(id) || id < 1 || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid leave decision.' })
  }
  try {
    const [result] = await pool.execute(
      "UPDATE leaves SET status = ?, reviewedBy = ? WHERE id = ? AND status = 'Pending'",
      [status, req.user.sub, id],
    )
    if (!result.affectedRows) {
      return res.status(409).json({ success: false, message: 'This request is no longer pending.' })
    }
    const [rows] = await pool.execute(`${leaveSelect} WHERE l.id = ? LIMIT 1`, [id])
    res.json({ request: mapLeave(rows[0]) })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/withdraw', ...anySignedInUser, async (req, res, next) => {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: 'Invalid leave request ID.' })
  }
  try {
    const employeeResult = await findEmployeeAccount(req.user.sub)
    if (!employeeResult.account) {
      return res.status(employeeResult.status).json({
        success: false,
        message: employeeResult.message,
      })
    }
    const [updateResult] = await pool.execute(
      `UPDATE leaves SET status = 'Withdrawn'
       WHERE id = ? AND employeeId = ? AND status = 'Pending'`,
      [id, employeeResult.account.employee_id],
    )
    if (!updateResult.affectedRows) {
      return res.status(409).json({ success: false, message: 'Only your pending requests can be withdrawn.' })
    }
    const [rows] = await pool.execute(`${leaveSelect} WHERE l.id = ? LIMIT 1`, [id])
    res.json({ request: mapLeave(rows[0]) })
  } catch (error) {
    next(error)
  }
})

export default router
