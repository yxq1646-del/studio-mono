const { Router } = require('express')
const { getDB } = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const router = Router()
const XLSX = require('xlsx')

router.use(authMiddleware, requireRole('admin'))

function exportToExcel(res, filename, rows, columns) {
  const headers = Object.keys(columns)
  const headerRow = headers.map(h => columns[h])

  const data = [headerRow, ...rows.map(row => headers.map(h => {
    const val = row[h]
    if (val === null || val === undefined) return ''
    return val
  }))]

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = headers.map(() => ({ wch: 20 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.xlsx"`)
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.send(buf)
}

// 导出用户列表
router.get('/users', (req, res) => {
  const db = getDB()
  const role = req.query.role || ''
  const status = req.query.status || ''

  let where = 'WHERE 1=1'
  const params = []
  if (role) { where += ' AND role = ?'; params.push(role) }
  if (status) { where += ' AND status = ?'; params.push(status) }

  const rows = db.prepare(
    `SELECT username, display_name, email, role, status, last_login_at, created_at FROM users ${where} ORDER BY created_at DESC`
  ).all(...params)

  exportToExcel(res, '用户列表', rows, {
    username: '用户名', display_name: '显示名', email: '邮箱',
    role: '角色', status: '状态', last_login_at: '最后登录', created_at: '创建时间',
  })
})

// 导出宠物列表
router.get('/pets', (req, res) => {
  const db = getDB()
  const species = req.query.species || ''
  const status = req.query.status || ''

  let where = 'WHERE 1=1'
  const params = []
  if (species) { where += ' AND species = ?'; params.push(species) }
  if (status) { where += ' AND status = ?'; params.push(status) }

  const rows = db.prepare(
    `SELECT name, species, breed, age_group, gender, size_group, location_city, status, created_at FROM pets ${where} ORDER BY created_at DESC`
  ).all(...params)

  exportToExcel(res, '宠物列表', rows, {
    name: '名称', species: '种类', breed: '品种', age_group: '年龄段',
    gender: '性别', size_group: '体型', location_city: '位置', status: '状态',
    created_at: '创建时间',
  })
})

module.exports = router
