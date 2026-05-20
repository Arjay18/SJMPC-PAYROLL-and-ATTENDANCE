import jwt from 'jsonwebtoken'
import { getOne } from '../lib/db.js'

export async function requireAuth(req, res, next){
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if(!token) return res.status(401).json({ message:'Missing token' })

  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    const me = await getOne(`SELECT id, email, role, employee_id, name FROM users WHERE id=?`, [payload.userId])
    if(!me) return res.status(401).json({ message:'Invalid user' })
    req.user = me
    next()
  }catch{
    res.status(401).json({ message:'Invalid token' })
  }
}

export function requireRole(role){
  return (req, res, next) => {
    if(req.user?.role !== role) return res.status(403).json({ message:'Forbidden' })
    next()
  }
}

