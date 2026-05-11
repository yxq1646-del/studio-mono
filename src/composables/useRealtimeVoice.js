import { ref, onUnmounted } from 'vue'

const PCM_SAMPLE_RATE = 16000

export function useRealtimeVoice() {
  const state = ref('idle') // idle | connecting | listening | thinking | speaking | error
  const transcript = ref('')
  const errorMsg = ref('')

  let ws = null
  let audioCtx = null
  let stream = null
  let processor = null
  let active = false
  let audioQueue = []
  let playing = false

  function getWsUrl() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${location.host}/api/voice`
  }

  async function start() {
    if (active) return
    active = true
    errorMsg.value = ''
    transcript.value = ''
    state.value = 'connecting'

    // 获取麦克风 (PCM 16kHz mono)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: PCM_SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      })
    } catch (err) {
      errorMsg.value = '麦克风权限被拒绝: ' + err.message
      state.value = 'error'
      active = false
      return
    }

    // 连接代理
    ws = new WebSocket(getWsUrl())

    ws.onopen = () => {
      // 发送配置，触发代理连接豆包
      ws.send(JSON.stringify({
        type: 'config',
        model: '2.2.0.0',
        speaker: 'xiaohe',
        botName: 'AI助手',
        systemRole: '你是一个友好的AI语音助手，用简洁自然的中文回复。',
      }))
    }

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data)
          handleServerMessage(msg)
        } catch { return }
        return
      }
      // 二进制 = TTS 音频
      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then(buf => playAudioChunk(new Uint8Array(buf)))
      } else if (event.data instanceof ArrayBuffer) {
        playAudioChunk(new Uint8Array(event.data))
      }
    }

    ws.onerror = () => {
      errorMsg.value = '语音服务连接失败'
      state.value = 'error'
      active = false
    }

    ws.onclose = () => {
      if (active && state.value !== 'error') {
        state.value = 'idle'
      }
      active = false
    }
  }

  function handleServerMessage(msg) {
    switch (msg.type) {
      case 'state':
        if (msg.state === 'connected') state.value = 'connecting'
        else if (msg.state === 'listening') {
          state.value = 'listening'
          startAudioCapture()
        }
        else if (msg.state === 'idle' || msg.state === 'disconnected') {
          state.value = 'idle'
          stopAudioCapture()
        }
        break

      case 'asr':
        if (msg.text) {
          transcript.value = msg.text
          state.value = 'thinking'
        }
        break

      case 'error':
        errorMsg.value = msg.message
        state.value = 'error'
        break
    }
  }

  // ===== 音频捕获 =====
  function startAudioCapture() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: PCM_SAMPLE_RATE })
    }
    if (!stream || processor) return

    const source = audioCtx.createMediaStreamSource(stream)
    processor = audioCtx.createScriptProcessor(4096, 1, 1)

    processor.onaudioprocess = (event) => {
      if (!active || !ws || ws.readyState !== WebSocket.OPEN) return
      if (state.value !== 'listening' && state.value !== 'speaking') return

      const input = event.inputBuffer.getChannelData(0)
      // 转 PCM16 小端
      const pcm16 = new Int16Array(input.length)
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]))
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }
      ws.send(pcm16.buffer)
    }

    source.connect(processor)
    processor.connect(audioCtx.destination)
  }

  function stopAudioCapture() {
    if (processor) {
      processor.disconnect()
      processor = null
    }
  }

  // ===== 音频播放 =====
  function playAudioChunk(pcmData) {
    if (!audioCtx) return

    const int16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF)
    }

    const buffer = audioCtx.createBuffer(1, float32.length, PCM_SAMPLE_RATE)
    buffer.getChannelData(0).set(float32)

    audioQueue.push(buffer)
    if (audioQueue.length === 1 && !playing) playNextInQueue()
  }

  function playNextInQueue() {
    if (!audioCtx || audioQueue.length === 0) {
      playing = false
      if (state.value === 'speaking' && active) state.value = 'listening'
      return
    }
    playing = true
    if (state.value !== 'error') state.value = 'speaking'

    const buffer = audioQueue.shift()
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    source.connect(audioCtx.destination)

    source.onended = () => {
      if (audioQueue.length > 0) {
        playNextInQueue()
      } else {
        playing = false
        if (state.value === 'speaking' && active) state.value = 'listening'
      }
    }

    source.start()
  }

  // ===== 公共 API =====

  function stop() {
    active = false
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop' }))
    }
    stopAudioCapture()
    if (ws) { try { ws.close() } catch {}; ws = null }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
    if (audioCtx && audioCtx.state !== 'closed') { audioCtx.close().catch(() => {}); audioCtx = null }
    audioQueue = []
    playing = false
    processor = null
    state.value = 'idle'
    transcript.value = ''
    errorMsg.value = ''
  }

  function interrupt() {
    // 打断：发送 interrupt 给代理 + 清空播放队列
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'interrupt' }))
    }
    audioQueue = []
    playing = false
    transcript.value = ''
    state.value = 'listening'
  }

  onUnmounted(() => { stop() })

  return { state, transcript, errorMsg, start, stop, interrupt }
}
