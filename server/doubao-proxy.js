// 豆包实时语音代理
const { WebSocket } = require('ws')
const crypto = require('crypto')

const DOUBAO_URL = 'wss://openspeech.bytedance.com/api/v3/realtime/dialogue'
const APP_ID = process.env.DOUBAO_APP_ID || ''
const ACCESS_KEY = process.env.DOUBAO_ACCESS_KEY || ''

console.log('[doubao] APP_ID:', APP_ID ? APP_ID.slice(0, 4) + '***' : '未设置!')
console.log('[doubao] ACCESS_KEY:', ACCESS_KEY ? ACCESS_KEY.slice(0, 6) + '***' : '未设置!')

// CRC32
const CRC_TABLE = new Int32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? (c >>> 1) ^ 0xEDB88320 : c >>> 1
  CRC_TABLE[i] = c
}
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF]; return (c ^ 0xFFFFFFFF) >>> 0 }

function packDoubao(type, payload) {
  const isJson = typeof payload === 'string'
  const payloadBytes = isJson ? Buffer.from(payload, 'utf-8') : payload
  const header = Buffer.alloc(8)
  header[0] = 0x01; header[1] = type; header[2] = 0x00; header[3] = isJson ? 0x01 : 0x00
  header.writeUInt32BE(payloadBytes.length, 4)
  const frame = Buffer.concat([header, payloadBytes])
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(frame), 0)
  return Buffer.concat([frame, crcBuf])
}

function unpackDoubao(data) {
  if (data.length < 12) return null
  const payloadLen = data.readUInt32BE(4)
  if (data.length < 12 + payloadLen) return null
  const payload = data.slice(8, 8 + payloadLen)
  return { type: data[1], payload: data[3] === 0x01 ? tryJson(payload) : payload, totalLen: 12 + payloadLen }
}
function tryJson(b) { try { return JSON.parse(b.toString('utf-8')) } catch { return b.toString('utf-8') } }

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(Buffer.isBuffer(data) ? data : JSON.stringify(data))
}

// ===== 多种鉴权方式依次尝试 =====
const AUTH_METHODS = [
  {
    label: '自定义Headers',
    getHeaders: () => ({
      'X-Api-App-ID': APP_ID,
      'X-Api-Access-Key': ACCESS_KEY,
      'X-Api-Resource-Id': 'volc.speech.dialog',
      'X-Api-App-Key': 'PlgvMymc7f3tQnJ6',
      'X-Api-Connect-Id': crypto.randomUUID(),
    }),
  },
  {
    label: 'Bearer Token',
    getHeaders: () => ({
      'Authorization': `Bearer; ${ACCESS_KEY}`,
      'X-Api-Resource-Id': 'volc.speech.dialog',
      'X-Api-Connect-Id': crypto.randomUUID(),
    }),
  },
  {
    label: 'Bearer+AppID',
    getHeaders: () => ({
      'Authorization': `Bearer; ${ACCESS_KEY}`,
      'X-Api-App-ID': APP_ID,
      'X-Api-Resource-Id': 'volc.speech.dialog',
      'X-Api-Connect-Id': crypto.randomUUID(),
    }),
  },
  {
    label: 'X-Api-Key',
    getHeaders: () => ({
      'X-Api-Key': ACCESS_KEY,
      'X-Api-Resource-Id': 'volc.speech.dialog',
      'X-Api-Connect-Id': crypto.randomUUID(),
    }),
  },
]

function createDoubaoProxy(browserWs) {
  if (!APP_ID || !ACCESS_KEY) {
    send(browserWs, { type: 'error', message: '豆包密钥未配置' })
    return
  }
  console.log('[doubao] 新客户端')

  let doubaoWs = null
  let config = null
  let buffer = Buffer.alloc(0)
  let authIdx = 0

  function tryAuth() {
    if (authIdx >= AUTH_METHODS.length) {
      send(browserWs, { type: 'error', message: '所有鉴权方式均返回401，请检查 APP ID / Access Key 是否正确' })
      return
    }
    const m = AUTH_METHODS[authIdx]
    const headers = m.getHeaders()
    console.log(`[doubao] 尝试 [${authIdx + 1}/${AUTH_METHODS.length}] ${m.label}`)

    const ws = new WebSocket(DOUBAO_URL, { headers })
    let done = false
    const t = setTimeout(() => {
      if (!done) { done = true; try { ws.close() } catch {}; authIdx++; tryAuth() }
    }, 8000)

    ws.on('open', () => {
      if (done) return
      done = true; clearTimeout(t)
      console.log(`[doubao] ${m.label} ✓ 已连接`)
      doubaoWs = ws

      send(browserWs, { type: 'state', state: 'connected' })
      doubaoWs.send(packDoubao(0x01, JSON.stringify({
        event: 'StartConnection',
        reqid: crypto.randomUUID(),
        payload: { format: 'pcm', sample_rate: 16000, channels: 1, bit_depth: 16 },
      })))
      console.log('[doubao] → StartConnection')

      ws.on('message', (data) => {
        buffer = Buffer.concat([buffer, data])
        while (buffer.length >= 12) {
          const msg = unpackDoubao(buffer)
          if (!msg) break
          buffer = buffer.slice(msg.totalLen)
          onDoubaoMsg(msg)
        }
      })

      ws.on('error', (e) => { console.error('[doubao] err:', e.message); send(browserWs, { type: 'error', message: e.message }) })
      ws.on('close', (c) => { console.log('[doubao] 断开 code:', c); send(browserWs, { type: 'state', state: 'disconnected' }) })
    })

    ws.on('error', () => { if (!done) { done = true; clearTimeout(t); console.log(`[doubao] ${m.label} ✗ 连接失败`); authIdx++; tryAuth() } })
    ws.on('unexpected-response', (req, res) => {
      if (!done) { done = true; clearTimeout(t); console.log(`[doubao] ${m.label} ✗ HTTP ${res.statusCode}`); authIdx++; tryAuth() }
    })
  }

  function onDoubaoMsg(msg) {
    const label = msg.type === 0x91 ? JSON.stringify(msg.payload).slice(0, 200) : (msg.type === 0x92 ? `[audio ${msg.payload?.length || 0}B]` : `[type 0x${msg.type.toString(16)}]`)
    console.log(`[doubao] ← ${label}`)

    switch (msg.type) {
      case 0x91: {
        const e = msg.payload?.event
        if (e === 'ConnectionStarted') startSession()
        else if (e === 'SessionStarted') { console.log('[doubao] SessionStarted ✓'); send(browserWs, { type: 'state', state: 'listening' }) }
        else if (e === 'SessionFinished') send(browserWs, { type: 'state', state: 'idle' })
        else if (e === 'SessionError') send(browserWs, { type: 'error', message: msg.payload?.payload?.message || '会话错误' })
        break
      }
      case 0x92: if (Buffer.isBuffer(msg.payload)) send(browserWs, msg.payload); break
      case 0x93: if (msg.payload?.payload?.result?.text) send(browserWs, { type: 'asr', text: msg.payload.payload.result.text }); break
      case 0xF0: send(browserWs, { type: 'error', message: typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload) }); break
    }
  }

  function startSession() {
    const session = {
      event: 'StartSession',
      reqid: crypto.randomUUID(),
      payload: {
        model: config?.model || '2.2.0.0',
        dialog: {
          bot_name: config?.botName || 'AI助手',
          system_role: config?.systemRole || '你是一个友好的AI语音助手',
          speaking_style: config?.speakingStyle || '1',
          input_mod: 'auto',
        },
        tts: { speaker: config?.speaker || 'xiaohe' },
        asr: { enable_hotword: false, vad_silence_ms: 600 },
      },
    }
    doubaoWs.send(packDoubao(0x01, JSON.stringify(session)))
    console.log('[doubao] → StartSession')
  }

  function finishSession() {
    if (doubaoWs?.readyState === WebSocket.OPEN) {
      doubaoWs.send(packDoubao(0x01, JSON.stringify({ event: 'FinishSession', reqid: crypto.randomUUID(), payload: {} })))
    }
  }

  // 浏览器消息
  browserWs.on('message', (data) => {
    if (typeof data === 'string' || (Buffer.isBuffer(data) && data[0] === 0x7B)) {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'config') { config = msg; tryAuth() }
        else if (msg.type === 'stop') finishSession()
        else if (msg.type === 'interrupt') { finishSession(); setTimeout(startSession, 300) }
      } catch {}
    } else if (Buffer.isBuffer(data) && doubaoWs?.readyState === WebSocket.OPEN) {
      doubaoWs.send(packDoubao(0x02, data))
    }
  })

  browserWs.on('close', () => { console.log('[doubao] 客户端断开'); finishSession(); try { doubaoWs?.close() } catch {} })
}

module.exports = { createDoubaoProxy }
