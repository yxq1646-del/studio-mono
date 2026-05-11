const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { getDB } = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const router = Router()

// 所有用户路由需要登录 + admin 角色
router.use(authMiddleware, requireRole('admin'))

// 获取用户列表（分页+搜索+筛选）
router.get('/', (req, res) => {
  const db = getDB()
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 10
  const search = req.query.search || ''
  const role = req.query.role || ''
  const status = req.query.status || ''

  let where = 'WHERE 1=1'
  const params = []

  if (search) {
    where += ' AND (username LIKE ? OR display_name LIKE ? OR email LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (role) {
    where += ' AND role = ?'
    params.push(role)
  }
  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM users ${where}`).get(...params)
  const total = countRow.total

  const offset = (page - 1) * pageSize
  const rows = db.prepare(
    `SELECT id, username, display_name, email, role, status, avatar_url, last_login_at, created_at
     FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset)

  res.json({ list: rows, total, page, pageSize })
})

// 创建用户
router.post('/', (req, res) => {
  const db = getDB()
  const { username, password, display_name, email, role } = req.body

  if (!username || !password || !display_name) {
    return res.status(400).json({ message: '用户名、密码和显示名称不能为空' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return res.status(409).json({ message: '用户名已存在' })
  }

  const hash = bcrypt.hashSync(password, 10)
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, display_name, email, role) VALUES (?, ?, ?, ?, ?)'
  ).run(username, hash, display_name, email || null, role || 'viewer')

  const user = db.prepare('SELECT id, username, display_name, email, role, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(user)
})

// 更新用户
router.put('/:id', (req, res) => {
  const db = getDB()
  const { id } = req.params
  const { display_name, email, role, status, password } = req.body

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id)
  if (!user) {
    return res.status(404).json({ message: '用户不存在' })
  }

  const updates = []
  const params = []

  if (display_name !== undefined) { updates.push('display_name = ?'); params.push(display_name) }
  if (email !== undefined) { updates.push('email = ?'); params.push(email) }
  if (role !== undefined) { updates.push('role = ?'); params.push(role) }
  if (status !== undefined) { updates.push('status = ?'); params.push(status) }
  if (password) {
    updates.push('password_hash = ?')
    params.push(bcrypt.hashSync(password, 10))
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: '没有需要更新的字段' })
  }

  updates.push("updated_at = datetime('now','localtime')")
  params.push(id)

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  const updated = db.prepare('SELECT id, username, display_name, email, role, status, created_at, updated_at FROM users WHERE id = ?').get(id)
  res.json(updated)
})

// 删除用户（软删除）
router.delete('/:id', (req, res) => {
  const db = getDB()
  const { id } = req.params

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id)
  if (!user) {
    return res.status(404).json({ message: '用户不存在' })
  }

  db.prepare("UPDATE users SET status = 'disabled', updated_at = datetime('now','localtime') WHERE id = ?").run(id)
  res.json({ message: '已禁用' })
})

module.exports = router
