const { Router } = require('express')
const { getDB } = require('../db')

const router = Router()

router.post('/chat', async (req, res) => {
  const { messages, apiKey, model, baseUrl, provider } = req.body

  if (!apiKey) {
    return res.status(400).json({ message: '请先设置 API Key' })
  }
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: '消息不能为空' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const isAnthropic = provider !== 'openai'
  const apiBase = baseUrl || (isAnthropic ? 'https://api.anthropic.com' : 'https://api.openai.com')

  // 分离 system 消息和普通消息
  const systemMsgs = messages.filter(m => m.role === 'system')
  const chatMsgs = messages.filter(m => m.role !== 'system')

  let url, headers, body

  if (isAnthropic) {
    url = `${apiBase}/v1/messages`
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }
    body = {
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      stream: true,
      messages: chatMsgs.map(m => ({ role: m.role, content: m.content })),
    }
    if (systemMsgs.length > 0) {
      body.system = systemMsgs.map(m => ({ type: 'text', text: m.content }))
    }
  } else {
    // OpenAI / 兼容格式
    url = `${apiBase}/v1/chat/completions`
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }
    // 合并 system 消息到 messages 数组
    const allMsgs = [...systemMsgs, ...chatMsgs].map(m => ({ role: m.role, content: m.content }))
    body = {
      model: model || 'gpt-4o',
      max_tokens: 4096,
      stream: true,
      messages: allMsgs,
    }
  }

  console.log('[chat] Provider:', isAnthropic ? 'Anthropic' : 'OpenAI')
  console.log('[chat] URL:', url)
  console.log('[chat] Model:', body.model)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[chat] API 错误:', response.status, errText)
      res.write(`data: ${JSON.stringify({ type: 'error', message: `[${response.status}] ${errText}` })}\n\n`)
      res.end()
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)
            // Anthropic SSE 格式
            if (parsed.type === 'content_block_delta') {
              res.write(`data: ${JSON.stringify({ type: 'delta', text: parsed.delta?.text || '' })}\n\n`)
            } else if (parsed.type === 'message_stop') {
              res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
            }
            // OpenAI SSE 格式
            if (parsed.choices && parsed.choices[0]?.delta?.content) {
              res.write(`data: ${JSON.stringify({ type: 'delta', text: parsed.choices[0].delta.content })}\n\n`)
            }
            if (parsed.choices && parsed.choices[0]?.finish_reason) {
              res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
            }
          } catch {
            // 非 JSON 行，忽略
          }
        }
      }
    }

    res.end()
  } catch (err) {
    console.error('[chat] 网络错误:', err.message)
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
    res.end()
  }
})

// 非流式查询（AI 搜索/分析用，不保存对话）
router.post('/chat/query', async (req, res) => {
  const { prompt, apiKey, provider, baseUrl, model } = req.body
  if (!apiKey) return res.status(400).json({ message: '请先设置 API Key' })
  if (!prompt) return res.status(400).json({ message: 'prompt 不能为空' })

  const isAnthropic = provider !== 'openai'
  const apiBase = baseUrl || (isAnthropic ? 'https://api.anthropic.com' : 'https://api.deepseek.com')

  try {
    let url, headers, body
    if (isAnthropic) {
      url = `${apiBase}/v1/messages`
      headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
      body = { model: model || 'claude-sonnet-4-20250514', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }
    } else {
      url = `${apiBase}/v1/chat/completions`
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
      body = { model: model || 'deepseek-chat', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }
    }

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ message: err })
    }
    const data = await response.json()
    const text = isAnthropic
      ? data.content?.[0]?.text || ''
      : data.choices?.[0]?.message?.content || ''
    res.json({ text })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ===== 对话管理 =====

router.get('/conversations', (req, res) => {
  const db = getDB()
  const rows = db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all()
  res.json(rows)
})

router.post('/conversations', (req, res) => {
  const db = getDB()
  const { title, model, agent_id } = req.body
  const result = db.prepare(
    'INSERT INTO conversations (title, model, agent_id) VALUES (?, ?, ?)'
  ).run(title || 'New Chat', model || 'claude-sonnet-4-20250514', agent_id || null)
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(conv)
})

router.delete('/conversations/:id', (req, res) => {
  const db = getDB()
  const conv = db.prepare('SELECT id FROM conversations WHERE id = ?').get(req.params.id)
  if (!conv) {
    return res.status(404).json({ message: '对话不存在' })
  }
  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id)
  res.json({ message: '已删除' })
})

router.get('/conversations/:id/messages', (req, res) => {
  const db = getDB()
  const rows = db.prepare(
    'SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(req.params.id)
  res.json(rows)
})

router.post('/conversations/:id/messages', (req, res) => {
  const db = getDB()
  const { role, content } = req.body
  if (!role || !content) {
    return res.status(400).json({ message: 'role 和 content 不能为空' })
  }
  const result = db.prepare(
    'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
  ).run(req.params.id, role, content)

  db.prepare("UPDATE conversations SET updated_at = datetime('now','localtime') WHERE id = ?").run(req.params.id)

  const msg = db.prepare('SELECT id, role, content, created_at FROM messages WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(msg)
})

const crypto = require('crypto')

// 生成对话分享链接
router.post('/conversations/:id/share', (req, res) => {
  const db = getDB()
  const conv = db.prepare('SELECT id, title, share_token FROM conversations WHERE id = ?').get(req.params.id)
  if (!conv) {
    return res.status(404).json({ message: '对话不存在' })
  }

  // 已有分享链接，直接返回
  if (conv.share_token) {
    return res.json({ shareToken: conv.share_token, shareUrl: `/share/${conv.share_token}` })
  }

  const token = crypto.randomBytes(16).toString('hex')
  db.prepare('UPDATE conversations SET share_token = ? WHERE id = ?').run(token, req.params.id)
  res.json({ shareToken: token, shareUrl: `/share/${token}` })
})

// 取消分享
router.delete('/conversations/:id/share', (req, res) => {
  const db = getDB()
  db.prepare('UPDATE conversations SET share_token = NULL WHERE id = ?').run(req.params.id)
  res.json({ message: '已取消分享' })
})

// 获取分享的对话（不需要认证）
router.get('/share/:token', (req, res) => {
  const db = getDB()
  const conv = db.prepare('SELECT id, title, created_at FROM conversations WHERE share_token = ?').get(req.params.token)
  if (!conv) {
    return res.status(404).json({ message: '分享不存在或已取消' })
  }

  const messages = db.prepare(
    'SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(conv.id)

  res.json({ title: conv.title, messages })
})

module.exports = router
