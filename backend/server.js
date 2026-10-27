import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/authRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import leaveRoutes from './routes/leaveRoutes.js'
import notificationRoutes from './routes/notifications.js'
import csrfProtection, { originIsAllowed } from './middlewares/csrf.middleware.js'
import { apiLimiter, loginLimiter } from './middlewares/rateLimiter.js'
import { notFound, errorHandler } from './middlewares/errorHandelr.js'
import { toTaskCode } from './utils/taskCode.js'
import pool from './config/db.js'

const app = express()
const port = Number(process.env.PORT) || 5000

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const ensureLeaveColumns = async () => {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME AS name FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'leaves'`,
  )
  const existingColumns = new Set(columns.map(column => column.name))
  if (!existingColumns.has('handoverTo')) {
    await pool.execute('ALTER TABLE leaves ADD COLUMN handoverTo VARCHAR(100) NULL')
  }
  if (!existingColumns.has('reviewedBy')) {
    await pool.execute('ALTER TABLE leaves ADD COLUMN reviewedBy INT NULL')
  }
}

const ensureEmployeeCompatibilityColumns = async () => {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME AS name FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'employees'`,
  )
  const existingColumns = new Set(columns.map(column => column.name))
  if (!existingColumns.has('dept')) {
    await pool.execute('ALTER TABLE employees ADD COLUMN dept VARCHAR(150) NULL')
  }
  if (!existingColumns.has('avatar')) {
    await pool.execute('ALTER TABLE employees ADD COLUMN avatar VARCHAR(255) NULL')
  }
  if (existingColumns.has('department')) {
    await pool.execute('UPDATE employees SET dept = department WHERE dept IS NULL')
  }
}

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || originIsAllowed(origin)),
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(csrfProtection)
app.use('/api', apiLimiter)
app.use('/api/auth/login', loginLimiter)

app.get('/', (_req, res) => {
  res.send('Panda HRMS API running')
})

app.use('/api/auth', authRoutes)
app.use('/api/employee', employeeRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/leave', leaveRoutes)
app.use('/api/notifications', notificationRoutes)

app.get('/api/health', wrap(async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'ok' })
}))

app.use('/api/tasks', taskRoutes)

app.get('/api/workspace', wrap(async (_req, res) => {
  const [employees] = await pool.execute(
    'SELECT id, employeeId, name, role, dept, email, status, avatar FROM employees ORDER BY id',
  )
  const [taskRows] = await pool.execute(
    'SELECT id, title, description, project, priority, status, due, assignedTo FROM tasks ORDER BY id',
  )
  const [teamRows] = await pool.execute('SELECT id, name FROM teams ORDER BY id')
  const [memberRows] = await pool.execute(
    'SELECT team_id, employee_id FROM team_members ORDER BY team_id, employee_id',
  )

  const membersByTeam = new Map()
  for (const row of memberRows) {
    membersByTeam.set(
      row.team_id,
      [...(membersByTeam.get(row.team_id) || []), row.employee_id],
    )
  }

  res.json({
    employees: employees.map(employee => ({
      ...employee,
      role: employee.role || '',
      dept: employee.dept || '',
      email: employee.email || '',
      avatar: employee.avatar || '',
    })),
    tasks: taskRows.map(task => ({
      ...task,
      id: toTaskCode(task.id),
      description: task.description || '',
      assignedTo: task.assignedTo == null ? null : Number(task.assignedTo),
      status: task.status === 'finished' ? 'finished' : 'todo',
    })),
    teams: teamRows.map(team => ({
      ...team,
      members: membersByTeam.get(team.id) || [],
    })),
  })
}))

app.use(notFound)
app.use(errorHandler)

const startServer = async () => {
  await pool.query('SELECT 1')
  await pool.execute('SELECT id FROM employees LIMIT 0')
  await pool.execute('SELECT id FROM users LIMIT 0')
  await pool.execute('SELECT id FROM tasks LIMIT 0')
  await pool.execute('SELECT id FROM teams LIMIT 0')
  await pool.execute('SELECT team_id FROM team_members LIMIT 0')
  await pool.execute('SELECT id FROM attendances LIMIT 0')
  await pool.execute('SELECT id FROM leaves LIMIT 0')
  await pool.execute('SELECT id FROM notifications LIMIT 0')
  await ensureEmployeeCompatibilityColumns()
  await ensureLeaveColumns()

  const server = app.listen(port, () => {
    console.log(`HRMS API listening on http://localhost:${port}`)
  })

  let shuttingDown = false
  const closeDatabase = async () => {
    try {
      await pool.end()
    } catch (error) {
      console.error('Could not close database connections cleanly.', error)
      process.exitCode = 1
    }
  }
  const shutdown = () => {
    if (shuttingDown) return
    shuttingDown = true

    if (!server.listening) {
      closeDatabase()
      return
    }

    server.close(async error => {
      if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') {
        console.error('Could not shut down the HRMS API cleanly.', error)
        process.exitCode = 1
      }
      await closeDatabase()
    })
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

startServer().catch(error => {
  console.error(
    'Could not connect to the HRMS MySQL database. Check XAMPP and backend/.env.',
    error,
  )
  pool.end().catch(cleanupError => {
    console.error('Could not close MySQL connections cleanly.', cleanupError)
  }).finally(() => {
    process.exitCode = 1
  })
})
