import { Router } from 'express'
import db from '../config/db.js'
const r = Router()
r.get('/', async (req, res) => { const [rows] = await db.query('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 10', [req.user.id]); res.json(rows) })
r.put('/:id/read', async (req, res) => { await db.query('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]); res.json({ ok: true }) })
export default r
