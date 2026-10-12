import pool from '../config/db.js'
import { HttpError } from '../middlewares/errorHandelr.js'
import { toTaskCode, parseTaskCode } from '../utils/taskCode.js'

const STATUSES = ['todo', 'in-progress', 'finished']
const PRIORITIES = ['critical', 'high', 'medium', 'low']
const COLUMNS = 'id, title, description, project, priority, status, progress, due, assignedTo'

// Database row -> the object the React UI expects
const formatTask = row => ({
  id: toTaskCode(row.id),
  title: row.title,
  description: row.description || '',
  project: row.project,
  priority: row.priority,
  status: row.status,
  progress: Number(row.progress),
  due: row.due,
  assignedTo: row.assignedTo == null ? null : Number(row.assignedTo),
})

const getDatabaseId = code => {
  const id = parseTaskCode(code)
  if (id == null) throw new HttpError(400, `Invalid task id "${code}". Use the format TSK-201.`)
  return id
}

const findTask = async id => {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM tasks WHERE id = ?`, [id])
  if (rows.length === 0) throw new HttpError(404, 'Task not found.')
  return rows[0]
}

const text = (value, field, { required = false, max = 255 } = {}) => {
  const clean = value == null ? '' : String(value).trim()
  if (required && !clean) throw new HttpError(400, `${field} is required.`)
  if (clean.length > max) throw new HttpError(400, `${field} is too long (max ${max} characters).`)
  return clean
}

const oneOf = (value, list, field) => {
  if (!list.includes(value)) throw new HttpError(400, `${field} must be one of: ${list.join(', ')}.`)
  return value
}

// Reads + checks the body. isCreate = true means title and project are required.
const readTaskBody = async (body = {}, isCreate) => {
  const data = {}

  if (isCreate || body.title !== undefined) data.title = text(body.title, 'title', { required: true })
  if (isCreate || body.project !== undefined) data.project = text(body.project, 'project', { required: true, max: 150 })
  if (body.description !== undefined) data.description = text(body.description, 'description', { max: 5000 })
  if (body.priority !== undefined) data.priority = oneOf(body.priority, PRIORITIES, 'priority')
  if (body.status !== undefined) data.status = oneOf(body.status, STATUSES, 'status')
  if (body.due !== undefined) data.due = text(body.due, 'due', { required: true, max: 50 })

  if (body.progress !== undefined) {
    const progress = Number(body.progress)
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      throw new HttpError(400, 'progress must be a whole number from 0 to 100.')
    }
    data.progress = progress
  }

  if (body.assignedTo !== undefined) {
    if (body.assignedTo === null || body.assignedTo === '') {
      data.assignedTo = null
    } else {
      const employeeId = Number(body.assignedTo)
      if (!Number.isInteger(employeeId) || employeeId < 1) throw new HttpError(400, 'assignedTo must be an employee id.')

      const [employees] = await pool.execute('SELECT id FROM employees WHERE id = ?', [employeeId])
      if (employees.length === 0) throw new HttpError(400, `Employee ${employeeId} does not exist.`)
      data.assignedTo = employeeId
    }
  }

  // keep status and progress consistent
  if (data.status === 'finished' && data.progress === undefined) data.progress = 100
  if (data.progress === 100 && data.status === undefined) data.status = 'finished'

  if (isCreate) {
    data.description = data.description ?? ''
    data.priority = data.priority ?? 'medium'
    data.status = data.status ?? 'todo'
    data.progress = data.progress ?? 0
    data.due = data.due || '24h'
    data.assignedTo = data.assignedTo ?? null
  }

  return data
}

// GET /api/tasks   (optional filters: ?status=todo&project=HRMS&assignedTo=1&search=payroll)
const getTasks = async (req, res) => {
  const { status, project, assignedTo, search } = req.query
  const where = []
  const values = []

  if (status) { where.push('status = ?'); values.push(String(status)) }
  if (project) { where.push('project = ?'); values.push(String(project)) }
  if (assignedTo) { where.push('assignedTo = ?'); values.push(Number(assignedTo)) }
  if (search) {
    where.push('(title LIKE ? OR project LIKE ? OR description LIKE ?)')
    values.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const sql = `SELECT ${COLUMNS} FROM tasks ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`
  const [rows] = await pool.execute(sql, values)
  res.json(rows.map(formatTask))
}

// GET /api/tasks/TSK-201
const getTask = async (req, res) => {
  res.json(formatTask(await findTask(getDatabaseId(req.params.id))))
}

// POST /api/tasks
const createTask = async (req, res) => {
  const data = await readTaskBody(req.body, true)

  const [result] = await pool.execute(
    'INSERT INTO tasks (title, description, project, priority, status, progress, due, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [data.title, data.description, data.project, data.priority, data.status, data.progress, data.due, data.assignedTo],
  )

  res.status(201).json(formatTask(await findTask(result.insertId)))
}

// PATCH /api/tasks/TSK-201   (send only the fields that changed)
const updateTask = async (req, res) => {
  const id = getDatabaseId(req.params.id)
  await findTask(id)

  const data = await readTaskBody(req.body, false)
  const fields = Object.keys(data)
  if (fields.length === 0) throw new HttpError(400, 'Nothing to update.')

  // the column names come from our own code above, never from the user
  const setSql = fields.map(field => `${field} = ?`).join(', ')
  await pool.execute(`UPDATE tasks SET ${setSql} WHERE id = ?`, [...fields.map(field => data[field]), id])

  res.json(formatTask(await findTask(id)))
}

// DELETE /api/tasks/TSK-201
const deleteTask = async (req, res) => {
  const id = getDatabaseId(req.params.id)
  await findTask(id)
  await pool.execute('DELETE FROM tasks WHERE id = ?', [id])
  res.json({ message: 'Task deleted.' })
}

export { getTasks, getTask, createTask, updateTask, deleteTask }