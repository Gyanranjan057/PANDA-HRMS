import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pool from '../config/db.js'

const createAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before creating the admin account.')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await pool.execute(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Administrator', ?, ?, 'Admin')
     ON DUPLICATE KEY UPDATE
       name = 'Administrator',
       password_hash = VALUES(password_hash),
       role = 'Admin'`,
    [email, passwordHash],
  )

  console.log(`Admin account is ready for ${email}.`)
}

createAdmin()
  .catch(error => {
    console.error('Could not create the admin account:', error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())