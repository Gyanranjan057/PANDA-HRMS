import { Router } from 'express'
import pool from '../config/db.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, message, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 50`,
      [req.user.sub],
    )
    res.json({
      notifications: rows.map(row => ({
        id: Number(row.id),
        message: row.message || '',
        isRead: Boolean(row.is_read),
        createdAt: row.created_at,
      })),
    })
  } catch (error) {
    next(error)
  }
})

router.delete('/', requireAuth, async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM notifications WHERE user_id = ?', [req.user.sub])
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
