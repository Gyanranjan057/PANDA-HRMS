import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import taskRoutes from './routes/taskRoutes.js'
import { notFound, errorHandler } from './middlewares/errorHandelr.js'
import { toTaskCode } from './utils/taskCode.js'
import pool from './config/db.js'

const app = express()
const port = Number(process.env.PORT) || 5000

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || /^http:\/\/localhost:\d+$/ }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', wrap(async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'ok' })
}))

app.use('/api/tasks', taskRoutes)

app.get('/api/workspace', wrap(async (_req, res) => {
  const [employees] = await pool.execute(
    'SELECT id, name, role, dept, email, status, avatar FROM employees ORDER BY id',
  )
  const [taskRows] = await pool.execute(
    'SELECT id, title, description, project, priority, status, progress, due, assignedTo FROM tasks ORDER BY id',
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
      progress: Number(task.progress),
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
  await pool.execute('SELECT id FROM tasks LIMIT 0')
  await pool.execute('SELECT id FROM teams LIMIT 0')
  await pool.execute('SELECT team_id FROM team_members LIMIT 0')

  app.listen(port, () => {
    console.log(`HRMS API listening on http://localhost:${port}`)
  })
}

startServer().catch(error => {
  console.error(
    'Could not connect to the HRMS MySQL database. Check XAMPP and backend/.env.',
    error,
  )
  process.exitCode = 1
})
