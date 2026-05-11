const { Router } = require('express')
const { getDB } = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = Router()

router.get('/', authMiddleware, (req, res) => {
  const db = getDB()

  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = ?').get('active').count
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ?').get('admin', 'active').count
  const disabledCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = ?').get('disabled').count
  const totalPets = db.prepare('SELECT COUNT(*) as count FROM pets').get().count
  const availablePets = db.prepare('SELECT COUNT(*) as count FROM pets WHERE status = ?').get('available').count
  const pendingAdoptions = db.prepare('SELECT COUNT(*) as count FROM adoptions WHERE status = ?').get('pending').count
  const totalConversations = db.prepare('SELECT COUNT(*) as count FROM conversations').get().count

  res.json({
    users: { total: totalUsers, admin: adminCount, disabled: disabledCount },
    pets: { total: totalPets, available: availablePets },
    adoptions: { pending: pendingAdoptions },
    conversations: { total: totalConversations },
  })
})

module.exports = router
