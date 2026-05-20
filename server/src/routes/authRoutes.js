import express from 'express'
import jwt from 'jsonwebtoken'
import { getOne } from '../lib/db.js'
import { verifyPassword } from '../lib/password.js'

export const authRouter = express.Router()

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if(!email || !password) return res.status(400).json({ message:'Email and password required' })

  const user = await getOne(`
    SELECT u.id, u.email, u.role, u.employee_id, u.name, u.password_hash, e.branch 
    FROM users u 
    LEFT JOIN employees e ON u.employee_id = e.id 
    WHERE u.email=?
  `, [email])

  if(!user) return res.status(401).json({ message:'Invalid credentials' })

  const ok = await verifyPassword(password, user.password_hash)
  if(!ok) return res.status(401).json({ message:'Invalid credentials' })

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

  res.json({
    token,
    user: {
      id: user.id,
      role: user.role,
      employee_id: user.employee_id,
      name: user.name,
      email: user.email,
      branch: user.branch
    }
  })
})

authRouter.get('/me', async (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if(!token) return res.status(401).json({ message:'Missing token' })

  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const me = await getOne(`
      SELECT u.id, u.email, u.role, u.employee_id, u.name, e.branch 
      FROM users u 
      LEFT JOIN employees e ON u.employee_id = e.id 
      WHERE u.id=?
    `, [payload.userId])

    if(!me) return res.status(401).json({ message:'Invalid user' })
    res.json({ id: me.id, role: me.role, employee_id: me.employee_id, name: me.name, email: me.email, branch: me.branch })
  }catch{
    res.status(401).json({ message:'Invalid token' })
  }
})
