import { Router } from 'express'
import pool from '../config/db.js'
import { toTaskCode, parseTaskCode } from '../utils/taskCode.js'
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js'

const router = Router()

const STATUSES = ['todo', 'in-progress', 'finished']
const PRIORITIES = ['critical', 'high', 'medium', 'low']
const COLUMNS = 'id, title, description, project, priority, status, progress, due, assignedTo'
const adminOnly = [requireAuth, requireRole('admin', 'hr')]
const authenticated = [requireAuth]

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const bad = (res, message) => res.status(400).json({ message })
const isAdmin = req => ['admin', 'hr'].includes(String(req.user?.role || '').toLowerCase())

const toTask = row => ({
  ...row,
  id: toTaskCode(row.id),
  description: row.description || '',
  status: STATUSES.includes(row.status) ? row.status : 'todo',
  progress: Number(row.progress || 0),
  assignedTo: row.assignedTo == null ? null : Number(row.assignedTo),
})

const findTask = async id => {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM tasks WHERE id = ?`, [id])
  return rows[0] ? toTask(rows[0]) : null
}

const employeeExists = async id => {
  const [rows] = await pool.execute('SELECT id FROM employees WHERE id = ?', [id])
  return rows.length > 0
}

const getEmployeeId = async userId => {
  const [rows] = await pool.execute(
    'SELECT employee_id FROM users WHERE id = ? LIMIT 1',
    [userId],
  )
  return rows[0]?.employee_id == null ? null : Number(rows[0].employee_id)
}

// GET /api/tasks
router.get('/', ...authenticated, wrap(async (req, res) => {
  const admin = isAdmin(req)
  const employeeId = admin ? null : await getEmployeeId(req.user.sub)
  const rows = employeeId == null && !admin
    ? []
    : (await pool.execute(
      `SELECT ${COLUMNS} FROM tasks ${admin ? '' : 'WHERE assignedTo = ?'} ORDER BY id`,
      admin ? [] : [employeeId],
    ))[0]
  res.json(rows.map(toTask))
}))

// POST /api/tasks  -> new deliverable (starts as todo, 0%)
router.post('/', ...adminOnly, wrap(async (req, res) => {
  const { title, description, project, priority = 'medium', due = '24h', assignedTo = null } = req.body

  if (!title?.trim() || !project?.trim()) return bad(res, 'title and project are required')
  if (!PRIORITIES.includes(priority)) return bad(res, 'invalid priority')
  if (assignedTo != null && !(await employeeExists(assignedTo))) return bad(res, 'assignee not found')

  const [result] = await pool.execute(
    `INSERT INTO tasks (title, description, project, priority, status, progress, due, assignedTo)
     VALUES (?, ?, ?, ?, 'todo', 0, ?, ?)`,
    [title.trim(), description?.trim() || null, project.trim(), priority, String(due), assignedTo],
  )
  res.status(201).json(await findTask(result.insertId))
}))

// PUT /api/tasks/:id  -> send only what changed (status, assignedTo)
router.put('/:id', ...authenticated, wrap(async (req, res) => {
  const id = parseTaskCode(req.params.id)
  const task = id ? await findTask(id) : null
  if (!task) return res.status(404).json({ message: 'task not found' })

  const { status, assignedTo } = req.body
  const admin = isAdmin(req)
  const employeeId = admin ? null : await getEmployeeId(req.user.sub)
  if (!admin && (employeeId == null || task.assignedTo !== employeeId)) {
    return res.status(403).json({ message: 'You can only update tasks assigned to you.' })
  }
  if (!admin && assignedTo !== undefined) {
    return res.status(403).json({ message: 'Only administrators can reassign tasks.' })
  }

  const sets = []
  const values = []

  if (req.body.progress !== undefined) return bad(res, 'task progress is controlled by status')
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return bad(res, 'invalid status')
    sets.push('status = ?')
    values.push(status)
    sets.push('progress = ?')
    values.push(status === 'finished' ? 100 : status === 'todo' ? 0 : Math.max(task.progress, 1))
  }
  if (assignedTo !== undefined && admin) {
    if (assignedTo != null && !(await employeeExists(assignedTo))) return bad(res, 'assignee not found')
    sets.push('assignedTo = ?')
    values.push(assignedTo)
  }
  if (!sets.length) return bad(res, 'nothing to update')

  await pool.execute(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, [...values, id])
  const updatedTask = await findTask(id)
  if (!admin && task.status !== 'finished' && updatedTask.status === 'finished') {
    const [employees] = await pool.execute(
      'SELECT name FROM employees WHERE id = ? LIMIT 1',
      [employeeId],
    )
    const employeeName = employees[0]?.name || 'An employee'
    const message = `${employeeName} completed ${updatedTask.id}: ${updatedTask.title}`
    await pool.execute(
      `INSERT INTO notifications (user_id, message)
       SELECT id, ? FROM users WHERE LOWER(role) IN ('admin', 'hr')`,
      [message],
    )
  }
  res.json(updatedTask)
}))

// DELETE /api/tasks/:id
router.delete('/:id', ...adminOnly, wrap(async (req, res) => {
  const id = parseTaskCode(req.params.id)
  if (!id) return res.status(404).json({ message: 'task not found' })

  const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [id])
  if (!result.affectedRows) return res.status(404).json({ message: 'task not found' })
  res.json({ message: `${req.params.id} deleted` })
}))

export default router