const jsonwebtoken = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'studio-mono-secret-key-2025'

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登录' })
  }
  try {
    const token = header.split(' ')[1]
    const payload = jsonwebtoken.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Token 无效或已过期' })
  }
}

module.exports = { authMiddleware, JWT_SECRET }
