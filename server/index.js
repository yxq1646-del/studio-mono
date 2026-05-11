require('dotenv').config()

const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { initDB } = require('./db')
const { seed } = require('./seeds/seed')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')))

// 通用 API 限流：100次/分钟
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
})

// 登录接口限流：5次/分钟
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '登录尝试过多，请1分钟后再试' },
})

app.use('/api', generalLimiter)
app.use('/api/auth/login', loginLimiter)

// 启动时初始化数据库
initDB().then(() => {
  console.log('[db] 数据库已连接')
  seed()

  // 挂载路由
  app.use('/api/auth', require('./routes/auth'))
  app.use('/api/users', require('./routes/users'))
  app.use('/api/stats', require('./routes/stats'))
  app.use('/api/pets', require('./routes/pets'))
  app.use('/api/adoptions', require('./routes/adoptions'))
  app.use('/api', require('./routes/chat'))
  app.use('/api/agents', require('./routes/agents'))
app.use('/api/files', require('./routes/files'))
  app.use('/api/favorites', require('./routes/favorites'))
  app.use('/api/upload', require('./routes/upload'))
  app.use('/api/logs', require('./routes/logs'))
  app.use('/api/export', require('./routes/export'))

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('数据库初始化失败:', err)
  process.exit(1)
})
