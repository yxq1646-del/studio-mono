const { Router } = require('express')
const { getDB } = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const router = Router()

router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getDB()
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 20
  const action = req.query.action || ''
  const username = req.query.username || ''
  const dateFrom = req.query.dateFrom || ''
  const dateTo = req.query.dateTo || ''

  let where = 'WHERE 1=1'
  const params = []

  if (action) {
    where += ' AND action = ?'
    params.push(action)
  }
  if (username) {
    where += ' AND username LIKE ?'
    params.push(`%${username}%`)
  }
  if (dateFrom) {
    where += ' AND created_at >= ?'
    params.push(dateFrom)
  }
  if (dateTo) {
    where += ' AND created_at <= ?'
    params.push(dateTo + ' 23:59:59')
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM operation_logs ${where}`).get(...params)
  const offset = (page - 1) * pageSize
  const rows = db.prepare(
    `SELECT * FROM operation_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset)

  // 获取所有操作类型用于筛选
  const actions = db.prepare(
    'SELECT DISTINCT action FROM operation_logs ORDER BY action'
  ).all()

  res.json({
    list: rows,
    total: countRow.total,
    page,
    pageSize,
    actionTypes: actions.map(a => a.action),
  })
})

module.exports = router
