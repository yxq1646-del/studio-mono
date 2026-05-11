require('dotenv').config()

const express = require('express')
const path = require('path')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { initDB } = require('./db')
const { seed } = require('./seeds/seed')

const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 生产环境：托管前端构建产物
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// 通用 API 限流
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
})

app.use('/api', generalLimiter)

// 启动时初始化数据库
initDB().then(() => {
  console.log('[db] 数据库已连接')
  seed()

  app.use('/api/auth', require('./routes/auth'))
  app.use('/api', require('./routes/chat'))
  app.use('/api/agents', require('./routes/agents'))
  app.use('/api/files', require('./routes/files'))

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('数据库初始化失败:', err)
  process.exit(1)
})
