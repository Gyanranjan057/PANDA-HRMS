import { Router } from 'express'
import pool from '../config/db.js'
import { toTaskCode, parseTaskCode } from '../utils/taskCode.js'

const router = Router()

const STATUSES = ['todo', 'in-progress', 'finished']
const PRIORITIES = ['critical', 'high', 'medium', 'low']
const COLUMNS = 'id, title, description, project, priority, status, progress, due, assignedTo'

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const bad = (res, message) => res.status(400).json({ message })

const toTask = row => ({
  ...row,
  id: toTaskCode(row.id),
  description: row.description || '',
  assignedTo: row.assignedTo == null ? null : Number(row.assignedTo),
  progress: Number(row.progress),
})

const findTask = async id => {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM tasks WHERE id = ?`, [id])
  return rows[0] ? toTask(rows[0]) : null
}

const employeeExists = async id => {
  const [rows] = await pool.execute('SELECT id FROM employees WHERE id = ?', [id])
  return rows.length > 0
}

// GET /api/tasks
router.get('/', wrap(async (_req, res) => {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM tasks ORDER BY id`)
  res.json(rows.map(toTask))
}))

// POST /api/tasks  -> new deliverable (starts as todo, 0%)
router.post('/', wrap(async (req, res) => {
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

// PUT /api/tasks/:id  -> send only what changed (status, progress, assignedTo)
router.put('/:id', wrap(async (req, res) => {
  const id = parseTaskCode(req.params.id)
  if (!id || !(await findTask(id))) return res.status(404).json({ message: 'task not found' })

  const { status, progress, assignedTo } = req.body
  const sets = []
  const values = []

  if (status !== undefined) {
    if (!STATUSES.includes(status)) return bad(res, 'invalid status')
    sets.push('status = ?')
    values.push(status)
  }
  if (progress !== undefined) {
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) return bad(res, 'progress must be 0-100')
    sets.push('progress = ?')
    values.push(progress)
  }
  if (assignedTo !== undefined) {
    if (assignedTo != null && !(await employeeExists(assignedTo))) return bad(res, 'assignee not found')
    sets.push('assignedTo = ?')
    values.push(assignedTo)
  }
  if (!sets.length) return bad(res, 'nothing to update')

  await pool.execute(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, [...values, id])
  res.json(await findTask(id))
}))

// DELETE /api/tasks/:id
router.delete('/:id', wrap(async (req, res) => {
  const id = parseTaskCode(req.params.id)
  if (!id) return res.status(404).json({ message: 'task not found' })

  const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [id])
  if (!result.affectedRows) return res.status(404).json({ message: 'task not found' })
  res.json({ message: `${req.params.id} deleted` })
}))

export default router