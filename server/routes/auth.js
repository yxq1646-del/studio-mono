const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jsonwebtoken = require('jsonwebtoken')
const { getDB } = require('../db')
const { authMiddleware, JWT_SECRET } = require('../middleware/auth')
const { logOperation } = require('../utils/operationLog')

const router = Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' })
  }

  const db = getDB()
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = ?').get(username, 'active')
  if (!user) {
    logOperation({ username, action: 'login_failed', detail: '用户不存在或已禁用', ip })
    return res.status(401).json({ message: '用户名或密码错误' })
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    logOperation({ userId: user.id, username, action: 'login_failed', detail: '密码错误', ip })
    return res.status(401).json({ message: '用户名或密码错误' })
  }

  db.prepare('UPDATE users SET last_login_at = datetime(\'now\',\'localtime\') WHERE id = ?').run(user.id)

  logOperation({ userId: user.id, username, action: 'login', detail: '登录成功', ip })

  const token = jsonwebtoken.sign(
    { id: user.id, username: user.username, role: user.role, display_name: user.display_name },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
    },
  })
})

router.get('/me', authMiddleware, (req, res) => {
  const db = getDB()
  const user = db.prepare('SELECT id, username, display_name, email, role, avatar_url, status, created_at FROM users WHERE id = ?').get(req.user.id)
  if (!user) {
    return res.status(404).json({ message: '用户不存在' })
  }
  res.json(user)
})

module.exports = router
