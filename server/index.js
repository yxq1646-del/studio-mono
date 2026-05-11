require('dotenv').config()

const http = require('http')
const express = require('express')
const path = require('path')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { WebSocketServer } = require('ws')
const { initDB } = require('./db')
const { seed } = require('./seeds/seed')
const { createDoubaoProxy } = require('./doubao-proxy')

const app = express()
app.set('trust proxy', 1)
const server = http.createServer(app)
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

// WebSocket：豆包实时语音
const wss = new WebSocketServer({ server, path: '/api/voice' })
wss.on('connection', (ws) => {
  console.log('[ws] 语音客户端已连接')
  createDoubaoProxy(ws)
})

// 启动时初始化数据库
initDB().then(() => {
  console.log('[db] 数据库已连接')
  seed()

  app.use('/api/auth', require('./routes/auth'))
  app.use('/api', require('./routes/chat'))
  app.use('/api/agents', require('./routes/agents'))
  app.use('/api/files', require('./routes/files'))

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Voice WS ready on ws://localhost:${PORT}/api/voice`)
  })
}).catch(err => {
  console.error('数据库初始化失败:', err)
  process.exit(1)
})
