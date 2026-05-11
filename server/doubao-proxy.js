// 豆包实时语音代理
// 浏览器(JSON+raw PCM) ⟷ 本服务 ⟷ 豆包WS(二进制协议+auth headers)
const { WebSocket } = require('ws')
const crypto = require('crypto')

const DOUBAO_URL = 'wss://openspeech.bytedance.com/api/v3/realtime/dialogue'
const APP_ID = process.env.DOUBAO_APP_ID || ''
const ACCESS_KEY = process.env.DOUBAO_ACCESS_KEY || ''

// CRC32 查表
const CRC_TABLE = new Int32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? (c >>> 1) ^ 0xEDB88320 : c >>> 1
  CRC_TABLE[i] = c
}
function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF]
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// 豆包二进制帧封装
function packDoubao(type, payload) {
  const isJson = typeof payload === 'string'
  const payloadBytes = isJson ? Buffer.from(payload, 'utf-8') : payload
  const header = Buffer.alloc(8)
  header[0] = 0x01 // version
  header[1] = type
  header[2] = 0x00 // flags
  header[3] = isJson ? 0x01 : 0x00 // 0x01=JSON, 0x00=raw
  header.writeUInt32BE(payloadBytes.length, 4)

  const frame = Buffer.concat([header, payloadBytes])
  const crc = crc32(frame)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc, 0)
  return Buffer.concat([frame, crcBuf])
}

// 豆包二进制帧解包
function unpackDoubao(data) {
  if (data.length < 12) return null
  const msgType = data[1]
  const isJson = data[3] === 0x01
  const payloadLen = data.readUInt32BE(4)
  if (data.length < 12 + payloadLen) return null
  const payload = data.slice(8, 8 + payloadLen)
  return {
    type: msgType,
    payload: isJson ? JSON.parse(payload.toString('utf-8')) : payload,
    totalLen: 12 + payloadLen
  }
}

function createDoubaoProxy(browserWs) {
  let doubaoWs = null
  let config = null
  let buffer = Buffer.alloc(0)

  console.log('[doubao] 新客户端连接')

  function connectDoubao() {
    doubaoWs = new WebSocket(DOUBAO_URL, {
      headers: {
        'X-Api-App-ID': APP_ID,
        'X-Api-Access-Key': ACCESS_KEY,
        'X-Api-Resource-Id': 'volc.speech.dialog',
        'X-Api-App-Key': 'PlgvMymc7f3tQnJ6',
        'X-Api-Connect-Id': crypto.randomUUID(),
      },
    })

    doubaoWs.on('open', () => {
      console.log('[doubao] 已连接豆包')
      sendToBrowser({ type: 'state', state: 'connected' })

      // 发送 StartConnection
      doubaoWs.send(packDoubao(0x01, JSON.stringify({
        event: 'StartConnection',
        reqid: crypto.randomUUID(),
        payload: {
          format: 'pcm',
          sample_rate: 16000,
          channels: 1,
          bit_depth: 16,
        }
      })))
    })

    doubaoWs.on('message', (data) => {
      buffer = Buffer.concat([buffer, data])
      while (buffer.length >= 12) {
        const msg = unpackDoubao(buffer)
        if (!msg) break
        buffer = buffer.slice(msg.totalLen)
        handleDoubaoMessage(msg)
      }
    })

    doubaoWs.on('error', (err) => {
      console.error('[doubao] 错误:', err.message)
      sendToBrowser({ type: 'error', message: '豆包服务连接失败: ' + err.message })
    })

    doubaoWs.on('close', (code) => {
      console.log('[doubao] 断开, code:', code)
      sendToBrowser({ type: 'state', state: 'disconnected' })
    })
  }

  function handleDoubaoMessage(msg) {
    switch (msg.type) {
      case 0x91: { // FullServerResponse (JSON)
        const evt = msg.payload.event
        if (evt === 'ConnectionStarted') {
          // 连接成功，发送 StartSession
          startSession()
        } else if (evt === 'SessionStarted') {
          sendToBrowser({ type: 'state', state: 'listening' })
        } else if (evt === 'SessionFinished') {
          sendToBrowser({ type: 'state', state: 'idle' })
        }
        break
      }
      case 0x92: { // AudioOnlyServer (TTS 音频)
        sendToBrowser(msg.payload) // 二进制音频直接转发
        break
      }
      case 0x93: { // TextOnlyServer (ASR 结果)
        const payload = msg.payload
        try {
          const asr = JSON.parse(payload.toString('utf-8'))
          if (asr.payload?.result?.text) {
            sendToBrowser({ type: 'asr', text: asr.payload.result.text })
          }
        } catch {}
        break
      }
      case 0x94: // AudioOnlyServerLast (最后一段音频)
        break
      case 0xF0: // Error
        try {
          const err = JSON.parse(msg.payload.toString('utf-8'))
          sendToBrowser({ type: 'error', message: err.payload?.message || '豆包服务错误' })
        } catch {}
        break
    }
  }

  function startSession() {
    const model = config?.model || '2.2.0.0'
    const speaker = config?.speaker || 'xiaohe'

    doubaoWs.send(packDoubao(0x01, JSON.stringify({
      event: 'StartSession',
      reqid: crypto.randomUUID(),
      payload: {
        model,
        dialog: {
          bot_name: config?.botName || 'AI助手',
          system_role: config?.systemRole || '你是一个友好的AI语音助手',
          speaking_style: config?.speakingStyle || '1',
          input_mod: 'auto',
        },
        tts: { speaker },
        asr: { enable_hotword: false, vad_silence_ms: 600 },
      }
    })))
  }

  function sendToBrowser(data) {
    if (browserWs.readyState === WebSocket.OPEN) {
      if (Buffer.isBuffer(data)) {
        browserWs.send(data)
      } else {
        browserWs.send(JSON.stringify(data))
      }
    }
  }

  // 处理浏览器消息
  browserWs.on('message', (data) => {
    // 文本消息 = JSON 控制命令
    if (typeof data === 'string' || (Buffer.isBuffer(data) && data[0] === 0x7B)) {
      try {
        const msg = JSON.parse(data.toString())
        switch (msg.type) {
          case 'config':
            config = msg
            connectDoubao()
            break
          case 'stop':
            if (doubaoWs && doubaoWs.readyState === WebSocket.OPEN) {
              doubaoWs.send(packDoubao(0x01, JSON.stringify({
                event: 'FinishSession',
                reqid: crypto.randomUUID(),
                payload: {}
              })))
            }
            break
          case 'interrupt':
            // 打断：发送 StopSession 然后重新 StartSession
            if (doubaoWs && doubaoWs.readyState === WebSocket.OPEN) {
              doubaoWs.send(packDoubao(0x01, JSON.stringify({
                event: 'FinishSession',
                reqid: crypto.randomUUID(),
                payload: {}
              })))
              setTimeout(() => startSession(), 200)
            }
            break
        }
      } catch {}
    } else if (Buffer.isBuffer(data)) {
      // 二进制 = PCM 音频数据，封帧后转发给豆包
      if (doubaoWs && doubaoWs.readyState === WebSocket.OPEN) {
        doubaoWs.send(packDoubao(0x02, data))
      }
    }
  })

  browserWs.on('close', () => {
    if (doubaoWs) {
      try { doubaoWs.close() } catch {}
    }
    console.log('[doubao] 客户端断开')
  })

  browserWs.on('error', () => {
    if (doubaoWs) {
      try { doubaoWs.close() } catch {}
    }
  })
}

module.exports = { createDoubaoProxy }
