const { Router } = require('express')
const { getDB } = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = Router()

// 所有收藏接口需要登录
router.use(authMiddleware)

// 获取当前用户的收藏列表（包含宠物信息）
router.get('/', (req, res) => {
  const db = getDB()
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 12
  const offset = (page - 1) * pageSize

  const countRow = db.prepare(
    'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?'
  ).get(req.user.id)
  const total = countRow ? countRow.total : 0

  const rows = db.prepare(`
    SELECT f.id as fav_id, f.created_at as fav_created_at, p.*
    FROM favorites f
    JOIN pets p ON p.id = f.pet_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, pageSize, offset)

  res.json({ list: rows, total, page, pageSize })
})

// 收藏/取消收藏（toggle）
router.post('/', (req, res) => {
  const db = getDB()
  const { pet_id } = req.body
  if (!pet_id) {
    return res.status(400).json({ message: 'pet_id 不能为空' })
  }

  const pet = db.prepare('SELECT id FROM pets WHERE id = ?').get(pet_id)
  if (!pet) {
    return res.status(404).json({ message: '宠物不存在' })
  }

  const existing = db.prepare(
    'SELECT id FROM favorites WHERE user_id = ? AND pet_id = ?'
  ).get(req.user.id, pet_id)

  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id)
    res.json({ favorited: false, message: '已取消收藏' })
  } else {
    db.prepare(
      'INSERT INTO favorites (user_id, pet_id) VALUES (?, ?)'
    ).run(req.user.id, pet_id)
    res.json({ favorited: true, message: '已收藏' })
  }
})

// 检查某宠物是否已被当前用户收藏（用于宠物列表/详情页展示收藏状态）
router.get('/check/:petId', (req, res) => {
  const db = getDB()
  const fav = db.prepare(
    'SELECT id FROM favorites WHERE user_id = ? AND pet_id = ?'
  ).get(req.user.id, req.params.petId)
  res.json({ favorited: !!fav })
})

// 批量检查收藏状态
router.post('/check-batch', (req, res) => {
  const db = getDB()
  const { pet_ids } = req.body
  if (!Array.isArray(pet_ids) || pet_ids.length === 0) {
    return res.json({ favoritedIds: [] })
  }
  const placeholders = pet_ids.map(() => '?').join(',')
  const rows = db.prepare(
    `SELECT pet_id FROM favorites WHERE user_id = ? AND pet_id IN (${placeholders})`
  ).all(req.user.id, ...pet_ids)
  res.json({ favoritedIds: rows.map(r => r.pet_id) })
})

module.exports = router
