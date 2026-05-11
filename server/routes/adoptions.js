const { Router } = require('express')
const { getDB } = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const { logFromReq } = require('../utils/operationLog')

const router = Router()

// 提交领养申请
router.post('/', (req, res) => {
  const db = getDB()
  const { pet_id, applicant_name, applicant_phone, applicant_email, reason, housing_type, has_experience } = req.body

  if (!pet_id || !applicant_name || !applicant_phone) {
    return res.status(400).json({ message: '宠物ID、姓名和电话不能为空' })
  }

  const pet = db.prepare('SELECT id, status FROM pets WHERE id = ?').get(pet_id)
  if (!pet) {
    return res.status(404).json({ message: '宠物不存在' })
  }
  if (pet.status !== 'available') {
    return res.status(400).json({ message: '该宠物当前不可领养' })
  }

  const result = db.prepare(
    `INSERT INTO adoptions (pet_id, applicant_name, applicant_phone, applicant_email, reason, housing_type, has_experience)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(pet_id, applicant_name, applicant_phone, applicant_email || null, reason || null, housing_type || null, has_experience ? 1 : 0)

  db.prepare("UPDATE pets SET status = 'pending', updated_at = datetime('now','localtime') WHERE id = ?").run(pet_id)

  const adoption = db.prepare('SELECT * FROM adoptions WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(adoption)
})

// 获取领养列表（需登录）
router.get('/', authMiddleware, (req, res) => {
  const db = getDB()
  const status = req.query.status || ''
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 10

  let where = 'WHERE 1=1'
  const params = []

  if (status) {
    where += ' AND a.status = ?'
    params.push(status)
  }

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM adoptions a LEFT JOIN pets p ON a.pet_id = p.id ${where}`
  ).get(...params)

  const offset = (page - 1) * pageSize
  const rows = db.prepare(
    `SELECT a.*, p.name as pet_name, p.species as pet_species
     FROM adoptions a LEFT JOIN pets p ON a.pet_id = p.id
     ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset)

  res.json({ list: rows, total: countRow.total, page, pageSize })
})

// 审核领养（需 admin 角色）
router.put('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getDB()
  const { id } = req.params
  const { status, reviewer_notes } = req.body

  const adoption = db.prepare('SELECT * FROM adoptions WHERE id = ?').get(id)
  if (!adoption) {
    return res.status(404).json({ message: '申请不存在' })
  }

  db.prepare(
    "UPDATE adoptions SET status = ?, reviewer_notes = ?, updated_at = datetime('now','localtime') WHERE id = ?"
  ).run(status, reviewer_notes || null, id)

  // 如果拒绝，恢复宠物状态
  if (status === 'rejected' || status === 'cancelled') {
    db.prepare("UPDATE pets SET status = 'available', updated_at = datetime('now','localtime') WHERE id = ?").run(adoption.pet_id)
  }
  if (status === 'approved') {
    db.prepare("UPDATE pets SET status = 'adopted', updated_at = datetime('now','localtime') WHERE id = ?").run(adoption.pet_id)
  }

  const updated = db.prepare(
    `SELECT a.*, p.name as pet_name, p.species as pet_species
     FROM adoptions a LEFT JOIN pets p ON a.pet_id = p.id WHERE a.id = ?`
  ).get(id)

  logFromReq(req, `adoption_${status}`, `领养申请 #${id} ${status === 'approved' ? '已通过' : status === 'rejected' ? '已拒绝' : '已更新'}`)

  res.json(updated)
})

module.exports = router
