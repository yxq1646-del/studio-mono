import { ref, onUnmounted } from 'vue'

const AUDIO_SAMPLE_RATE = 24000
const AUDIO_CHANNELS = 1

export function useRealtimeVoice() {
  const state = ref('idle') // idle | connecting | listening | thinking | speaking | error
  const transcript = ref('')
  const errorMsg = ref('')
  const volume = ref(0)

  let ws = null
  let audioCtx = null
  let stream = null
  let processor = null
  let audioQueue = []
  let playing = false
  let currentSource = null
  let mediaRecorder = null

  function getApiKey() {
    return localStorage.getItem('ai_api_key') || ''
  }

  function getBaseUrl() {
    return localStorage.getItem('ai_base_url') || 'https://api.v3.cm'
  }

  function getVoiceModel() {
    return localStorage.getItem('ai_voice_model') || 'gpt-4o-realtime-preview-2024-12-17'
  }

  async function start() {
    if (state.value === 'listening' || state.value === 'speaking') return

    try {
      state.value = 'connecting'
      errorMsg.value = ''
      transcript.value = ''

      const apiKey = getApiKey()
      if (!apiKey) {
        errorMsg.value = '请先设置 API Key'
        state.value = 'error'
        return
      }

      // 获取麦克风
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: AUDIO_SAMPLE_RATE, channelCount: AUDIO_CHANNELS, echoCancellation: true, noiseSuppression: true }
      })

      audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: AUDIO_SAMPLE_RATE })

      // 连接 WebSocket
      const wsUrl = getBaseUrl().replace('https://', 'wss://').replace('http://', 'ws://')
      const model = getVoiceModel()

      // 尝试通过查询参数传递认证
      ws = new WebSocket(`${wsUrl}/v1/realtime?model=${model}`)

      // 浏览器 WebSocket 不支持自定义 header，使用服务端代理方式
      // 如果 relay 需要 header 认证则走本地代理
      ws.onopen = async () => {
        state.value = 'listening'

        // 发送 session 配置
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a helpful voice assistant. Respond concisely in the user\'s language.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500 },
            temperature: 0.8,
          }
        }))

        // 开始捕获音频
        startAudioCapture()
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          handleMessage(msg)
        } catch {}
      }

      ws.onerror = () => {
        // WebSocket 连接失败，可能是 relay 不支持 realtime
        // 回退到浏览器 TTS 模式
        stopAudioCapture()
        cleanupWebSocket()
        startFallbackMode()
      }

      ws.onclose = () => {
        if (state.value !== 'error') {
          cleanup()
        }
      }

    } catch (err) {
      errorMsg.value = err.message
      state.value = 'error'
      cleanup()
    }
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case 'session.updated':
        // session 配置成功
        break

      case 'input_audio_buffer.speech_started':
        transcript.value = ''
        break

      case 'input_audio_buffer.speech_stopped':
        state.value = 'thinking'
        break

      case 'response.audio_transcript.delta':
        transcript.value += msg.delta || ''
        break

      case 'response.audio.delta':
        if (msg.delta) {
          playAudioDelta(msg.delta)
        }
        break

      case 'response.audio.done':
        state.value = 'listening'
        break

      case 'response.text.delta':
        transcript.value += msg.delta || ''
        break

      case 'response.done':
        if (state.value === 'speaking' || state.value === 'thinking') {
          state.value = 'listening'
        }
        break

      case 'error':
        errorMsg.value = msg.error?.message || '未知错误'
        state.value = 'error'
        break
    }
  }

  function startAudioCapture() {
    if (!audioCtx || !stream) return

    const source = audioCtx.createMediaStreamSource(stream)

    // 使用 ScriptProcessorNode 捕获 PCM 数据
    processor = audioCtx.createScriptProcessor(4096, AUDIO_CHANNELS, AUDIO_CHANNELS)
    let buffer = []

    processor.onaudioprocess = (event) => {
      if (state.value !== 'listening' && state.value !== 'speaking') return

      const input = event.inputBuffer.getChannelData(0)
      // 转换为 PCM16
      const pcm16 = new Int16Array(input.length)
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]))
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }

      // 计算音量
      let sum = 0
      for (let i = 0; i < pcm16.length; i++) sum += Math.abs(pcm16[i])
      volume.value = (sum / pcm16.length) / 32768

      // Base64 编码并发送
      const base64 = arrayBufferToBase64(pcm16.buffer)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64
        }))
      }
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

  function playAudioDelta(base64Audio) {
    if (!audioCtx) return

    const pcmData = base64ToArrayBuffer(base64Audio)
    const int16 = new Int16Array(pcmData)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF)
    }

    const buffer = audioCtx.createBuffer(1, float32.length, AUDIO_SAMPLE_RATE)
    buffer.getChannelData(0).set(float32)

    audioQueue.push(buffer)
    if (!playing) playNextInQueue()
  }

  function playNextInQueue() {
    if (!audioCtx || audioQueue.length === 0) {
      playing = false
      return
    }
    playing = true
    state.value = 'speaking'

    const buffer = audioQueue.shift()
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    source.connect(audioCtx.destination)
    currentSource = source

    source.onended = () => {
      currentSource = null
      if (audioQueue.length > 0) {
        playNextInQueue()
      } else {
        playing = false
        if (state.value === 'speaking') {
          state.value = 'listening'
        }
      }
    }

    source.start()
  }

  // ===== 回退模式：浏览器 TTS + STT =====
  let recognition = null
  let fallbackActive = false

  function startFallbackMode() {
    state.value = 'listening'
    fallbackActive = true

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      errorMsg.value = '浏览器不支持语音识别'
      state.value = 'error'
      return
    }

    recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }
      transcript.value = final || interim
    }

    recognition.onend = () => {
      // 当用户说完话后，通过 TTS 回复
      if (transcript.value.trim() && fallbackActive) {
        speakResponse(transcript.value)
      }
      if (fallbackActive) {
        setTimeout(() => {
          if (fallbackActive && state.value === 'listening') {
            recognition.start()
          }
        }, 500)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' && fallbackActive) {
        setTimeout(() => {
          if (fallbackActive) recognition.start()
        }, 1000)
      }
    }

    recognition.start()
  }

  async function speakResponse(userText) {
    if (!userText.trim()) return

    state.value = 'thinking'

    try {
      // 使用常规 chat API 获取回复
      const apiKey = getApiKey()
      const baseUrl = getBaseUrl()
      const model = localStorage.getItem('ai_model') || 'claude-opus-4-7'

      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: userText }]
        })
      })

      if (!res.ok) {
        throw new Error(`API 错误: ${res.status}`)
      }

      const data = await res.json()
      const replyText = data.choices?.[0]?.message?.content || ''

      if (replyText) {
        transcript.value = replyText
        // 使用浏览器 TTS 朗读
        speakWithTTS(replyText)
      }
    } catch (err) {
      errorMsg.value = err.message
      state.value = 'error'
    }
  }

  function speakWithTTS(text) {
    state.value = 'speaking'

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = detectLanguage(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0

    // 选择合适的声音
    const voices = speechSynthesis.getVoices()
    const preferredVoice = voices.find(v =>
      (utterance.lang.startsWith('zh') && v.lang.startsWith('zh-CN')) ||
      (utterance.lang.startsWith('en') && v.lang.startsWith('en-US'))
    )
    if (preferredVoice) utterance.voice = preferredVoice

    utterance.onend = () => {
      state.value = 'listening'
      // 重新开始监听
      if (fallbackActive && recognition && state.value === 'listening') {
        setTimeout(() => recognition.start(), 300)
      }
    }

    utterance.onerror = () => {
      state.value = 'listening'
    }

    speechSynthesis.speak(utterance)
  }

  function detectLanguage(text) {
    // 简单的语言检测
    const hasChinese = /[一-鿿]/.test(text)
    return hasChinese ? 'zh-CN' : 'en-US'
  }

  // ===== 公共方法 =====

  function stop() {
    cleanup()
  }

  function pause() {
    if (currentSource && audioCtx) {
      // 暂停播放
      speechSynthesis.cancel()
    }
    if (recognition) {
      recognition.stop()
    }
    state.value = 'idle'
  }

  function resume() {
    if (fallbackActive && state.value === 'idle') {
      state.value = 'listening'
      recognition?.start()
    }
  }

  function interrupt() {
    // 打断当前语音
    if (playing && currentSource) {
      currentSource.stop()
      currentSource = null
      playing = false
      audioQueue = []
    }
    speechSynthesis.cancel()
    state.value = 'listening'

    if (fallbackActive && recognition) {
      recognition.start()
    }
  }

  function cleanup() {
    fallbackActive = false
    stopAudioCapture()
    cleanupWebSocket()
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      stream = null
    }
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {})
      audioCtx = null
    }
    if (recognition) {
      recognition.abort()
      recognition = null
    }
    audioQueue = []
    playing = false
    currentSource = null
    speechSynthesis.cancel()
    state.value = 'idle'
  }

  function cleanupWebSocket() {
    if (ws) {
      ws.onopen = null
      ws.onmessage = null
      ws.onerror = null
      ws.onclose = null
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
      ws = null
    }
  }

  onUnmounted(() => {
    cleanup()
  })

  return { state, transcript, errorMsg, volume, start, stop, pause, resume, interrupt }
}

// ===== 工具函数 =====

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
