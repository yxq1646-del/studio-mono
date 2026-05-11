/**
 * 现有图片迁移脚本
 * 将数据库中现有的 image_url 批量迁移到 CDN 或本地 uploads 目录
 *
 * 用法：
 *   cd server
 *   node ../scripts/migrate-images.js
 *
 * 迁移策略：
 *   1. 读取 pets 和 agents 表中所有 image_url
 *   2. 如果 URL 是外部 URL（http/https），尝试下载 → 上传到 CDN/本地 → 更新数据库
 *   3. 如果 URL 是本地路径，直接复制文件
 *   4. 更新数据库中的 image_url 字段
 */

const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')
const { initDB, getDB, saveDB } = require('../server/db')
const { saveToLocal } = require('../server/config/cdn')

const UPLOADS_DIR = path.join(__dirname, '..', 'server', 'uploads')

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`下载失败: ${res.statusCode}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

async function migrate() {
  await initDB()
  const db = getDB()
  ensureUploadsDir()

  console.log('=== 图片迁移脚本 ===\n')

  // 迁移 pets 表
  const pets = db.prepare("SELECT id, name, image_url FROM pets WHERE image_url IS NOT NULL AND image_url != ''").all()
  console.log(`[pets] 找到 ${pets.length} 条记录有图片`)

  for (const pet of pets) {
    try {
      let buffer
      if (pet.image_url.startsWith('http://') || pet.image_url.startsWith('https://')) {
        console.log(`  下载: ${pet.name} → ${pet.image_url}`)
        buffer = await downloadFile(pet.image_url)
      } else if (fs.existsSync(pet.image_url)) {
        console.log(`  复制: ${pet.name} → ${pet.image_url}`)
        buffer = fs.readFileSync(pet.image_url)
      } else {
        console.log(`  跳过: ${pet.name} (无法读取: ${pet.image_url})`)
        continue
      }

      const ext = path.extname(pet.image_url) || '.jpg'
      const filename = `pet_${pet.id}_${Date.now()}${ext}`
      const result = saveToLocal(buffer, filename)
      db.prepare("UPDATE pets SET image_url = ?, updated_at = datetime('now','localtime') WHERE id = ?")
        .run(result.originalUrl, pet.id)
      console.log(`  已迁移: ${pet.name} → ${result.originalUrl}`)
    } catch (err) {
      console.error(`  失败: ${pet.name} → ${err.message}`)
    }
  }

  // 迁移 agents 表
  const agents = db.prepare("SELECT id, name, avatar_url FROM agents WHERE avatar_url IS NOT NULL AND avatar_url != ''").all()
  console.log(`\n[agents] 找到 ${agents.length} 条记录有头像`)

  for (const agent of agents) {
    try {
      let buffer
      if (agent.avatar_url.startsWith('http://') || agent.avatar_url.startsWith('https://')) {
        console.log(`  下载: ${agent.name} → ${agent.avatar_url}`)
        buffer = await downloadFile(agent.avatar_url)
      } else if (fs.existsSync(agent.avatar_url)) {
        console.log(`  复制: ${agent.name} → ${agent.avatar_url}`)
        buffer = fs.readFileSync(agent.avatar_url)
      } else {
        console.log(`  跳过: ${agent.name} (无法读取: ${agent.avatar_url})`)
        continue
      }

      const ext = path.extname(agent.avatar_url) || '.jpg'
      const filename = `agent_${agent.id}_${Date.now()}${ext}`
      const result = saveToLocal(buffer, filename)
      db.prepare("UPDATE agents SET avatar_url = ?, updated_at = datetime('now','localtime') WHERE id = ?")
        .run(result.originalUrl, agent.id)
      console.log(`  已迁移: ${agent.name} → ${result.originalUrl}`)
    } catch (err) {
      console.error(`  失败: ${agent.name} → ${err.message}`)
    }
  }

  saveDB()
  console.log('\n=== 迁移完成 ===')
}

migrate().catch(err => {
  console.error('迁移失败:', err)
  process.exit(1)
})
