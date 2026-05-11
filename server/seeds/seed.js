const bcrypt = require('bcryptjs')
const { getDB, saveDB } = require('../db')

function seed() {
  const db = getDB()

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
  if (existing) {
    console.log('[seed] 已有数据，跳过')
    return
  }

  const hash = bcrypt.hashSync('admin123', 10)
  db.prepare('INSERT INTO users (username, password_hash, display_name, email, role) VALUES (?, ?, ?, ?, ?)')
    .run('admin', hash, 'Administrator', 'admin@example.com', 'admin')

  saveDB()
  console.log('[seed] 初始化完成: 1 管理员用户')
}

module.exports = { seed }
