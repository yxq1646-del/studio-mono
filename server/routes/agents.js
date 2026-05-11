const { Router } = require('express')
const { getDB } = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const router = Router()

// 公开 - 列表
router.get('/', (req, res) => {
  const db = getDB()
  const rows = db.prepare('SELECT * FROM agents ORDER BY name ASC').all()
  res.json(rows)
})

// 公开 - 单个
router.get('/:id', (req, res) => {
  const db = getDB()
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id)
  if (!agent) return res.status(404).json({ message: '智能体不存在' })
  res.json(agent)
})

// 创建（公开，用户端也可创建）
router.post('/', (req, res) => {
  const db = getDB()
  const { name, description, avatar_url, system_prompt, provider, custom_base_url, custom_model } = req.body
  if (!name) return res.status(400).json({ message: '名称不能为空' })

  const result = db.prepare(
    `INSERT INTO agents (name, description, avatar_url, system_prompt, provider, custom_base_url, custom_model, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    name,
    description || '',
    avatar_url || '',
    system_prompt || '',
    provider || 'deepseek',
    custom_base_url || '',
    custom_model || '',
    null
  )
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(agent)
})

// 更新
router.put('/:id', authMiddleware, requireRole('admin', 'editor'), (req, res) => {
  const db = getDB()
  const existing = db.prepare('SELECT id FROM agents WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ message: '智能体不存在' })

  const fields = ['name', 'description', 'avatar_url', 'system_prompt', 'provider', 'custom_base_url', 'custom_model']
  const updates = []
  const params = []
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`)
      params.push(req.body[f])
    }
  }
  if (!updates.length) return res.status(400).json({ message: '无更新字段' })

  updates.push("updated_at = datetime('now','localtime')")
  params.push(req.params.id)

  db.prepare(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id)
  res.json(agent)
})

// 删除
router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getDB()
  const agent = db.prepare('SELECT id FROM agents WHERE id = ?').get(req.params.id)
  if (!agent) return res.status(404).json({ message: '智能体不存在' })

  // 解除关联的对话
  db.prepare('UPDATE conversations SET agent_id = NULL WHERE agent_id = ?').run(req.params.id)
  db.prepare('DELETE FROM agents WHERE id = ?').run(req.params.id)
  res.json({ message: '已删除' })
})

module.exports = router
