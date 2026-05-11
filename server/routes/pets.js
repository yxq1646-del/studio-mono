const { Router } = require('express')
const { getDB } = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const router = Router()

// 获取宠物列表（筛选+分页）
router.get('/', (req, res) => {
  const db = getDB()
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 12
  const species = req.query.species || ''
  const size = req.query.size || ''
  const status = req.query.status || 'available'
  const search = req.query.search || ''
  const nearLat = parseFloat(req.query.nearLat) || 0
  const nearLng = parseFloat(req.query.nearLng) || 0

  let where = 'WHERE 1=1'
  const params = []

  if (species) {
    where += ' AND species = ?'
    params.push(species)
  }
  if (size) {
    where += ' AND size_group = ?'
    params.push(size)
  }
  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }
  if (search) {
    where += ' AND (name LIKE ? OR breed LIKE ? OR description LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  let orderBy = 'ORDER BY created_at DESC'
  let selectExtra = ''

  // 如果提供了经纬度，计算距离排序
  if (nearLat && nearLng) {
    selectExtra = `, (
      6371 * acos(
        cos(radians(${nearLat})) * cos(radians(COALESCE(latitude, 0))) *
        cos(radians(COALESCE(longitude, 0)) - radians(${nearLng})) +
        sin(radians(${nearLat})) * sin(radians(COALESCE(latitude, 0)))
      )
    ) as distance`
    orderBy = 'ORDER BY distance ASC'
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM pets ${where}`).get(...params)
  const offset = (page - 1) * pageSize
  const rows = db.prepare(
    `SELECT *${selectExtra} FROM pets ${where} ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset)

  res.json({ list: rows, total: countRow.total, page, pageSize })
})

// 获取单个宠物
router.get('/:id', (req, res) => {
  const db = getDB()
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id)
  if (!pet) {
    return res.status(404).json({ message: '宠物不存在' })
  }
  res.json(pet)
})

// ===== 管理员 CRUD =====

router.post('/', authMiddleware, requireRole('admin', 'editor'), (req, res) => {
  const db = getDB()
  const { name, species, breed, age_group, gender, size_group, description, image_url, location_city, latitude, longitude } = req.body
  if (!name || !species) {
    return res.status(400).json({ message: '名称和种类不能为空' })
  }
  const result = db.prepare(
    `INSERT INTO pets (name, species, breed, age_group, gender, size_group, description, image_url, location_city, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(name, species, breed || null, age_group || null, gender || null, size_group || null, description || null, image_url || null, location_city || null, latitude || null, longitude || null)
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(result.lastInsertRowid)
  db.prepare('INSERT INTO pet_status_logs (pet_id, from_status, to_status) VALUES (?, NULL, ?)')
    .run(pet.id, pet.status)
  res.status(201).json(pet)
})

router.put('/:id', authMiddleware, requireRole('admin', 'editor'), (req, res) => {
  const db = getDB()
  const oldPet = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id)
  if (!oldPet) return res.status(404).json({ message: '宠物不存在' })

  const { name, species, breed, age_group, gender, size_group, description, image_url, location_city, latitude, longitude, status } = req.body
  const fields = []
  const params = []
  const map = { name, species, breed, age_group, gender, size_group, description, image_url, location_city, latitude, longitude, status }
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) { fields.push(`${k} = ?`); params.push(v) }
  }
  if (fields.length === 0) return res.status(400).json({ message: '无更新字段' })
  fields.push("updated_at = datetime('now','localtime')")
  params.push(req.params.id)
  db.prepare(`UPDATE pets SET ${fields.join(', ')} WHERE id = ?`).run(...params)

  // 记录状态变更
  if (status && status !== oldPet.status) {
    db.prepare(
      'INSERT INTO pet_status_logs (pet_id, from_status, to_status) VALUES (?, ?, ?)'
    ).run(req.params.id, oldPet.status, status)
  }

  res.json(db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id))
})

router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getDB()
  const pet = db.prepare('SELECT id FROM pets WHERE id = ?').get(req.params.id)
  if (!pet) return res.status(404).json({ message: '宠物不存在' })
  db.prepare("UPDATE pets SET status = 'adopted', updated_at = datetime('now','localtime') WHERE id = ?").run(req.params.id)
  res.json({ message: '已下架' })
})

// 获取宠物状态时间线
router.get('/:id/timeline', (req, res) => {
  const db = getDB()
  const pet = db.prepare('SELECT id FROM pets WHERE id = ?').get(req.params.id)
  if (!pet) return res.status(404).json({ message: '宠物不存在' })

  const logs = db.prepare(`
    SELECT * FROM pet_status_logs
    WHERE pet_id = ?
    ORDER BY created_at ASC
  `).all(req.params.id)

  res.json({ list: logs })
})

module.exports = router
