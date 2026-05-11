import { ref, onUnmounted } from 'vue'

export function useRealtimeVoice() {
  const state = ref('idle') // idle | listening | thinking | speaking | error
  const transcript = ref('')
  const errorMsg = ref('')

  let recognition = null
  let active = false

  function getApiKey() {
    return localStorage.getItem('ai_api_key') || ''
  }

  function getBaseUrl() {
    return localStorage.getItem('ai_base_url') || 'https://api.v3.cm'
  }

  function getModel() {
    return localStorage.getItem('ai_model') || 'claude-opus-4-7'
  }

  async function start() {
    if (active) return

    const apiKey = getApiKey()
    if (!apiKey) {
      errorMsg.value = '请先设置 API Key'
      state.value = 'error'
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      errorMsg.value = '浏览器不支持语音识别，请使用 Chrome'
      state.value = 'error'
      return
    }

    active = true
    errorMsg.value = ''
    transcript.value = ''
    state.value = 'listening'

    startListening()
  }

  function startListening() {
    if (!active) return

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else interim += t
      }
      transcript.value = final || interim
    }

    recognition.onend = () => {
      if (!active) return
      const text = transcript.value.trim()
      if (text) {
        // 用户说完，获取 AI 回复
        getAIResponse(text)
      } else {
        // 没说话，继续监听
        scheduleRelisten(300)
      }
    }

    recognition.onerror = (event) => {
      if (!active) return
      if (event.error === 'no-speech' || event.error === 'aborted') {
        scheduleRelisten(500)
        return
      }
      if (event.error === 'not-allowed') {
        errorMsg.value = '麦克风权限被拒绝'
        state.value = 'error'
        active = false
        return
      }
      // 其他错误，重试
      scheduleRelisten(800)
    }

    try {
      recognition.start()
    } catch {
      // 已经在运行中
    }
  }

  function scheduleRelisten(delay) {
    if (!active) return
    setTimeout(() => {
      if (active && state.value === 'listening') {
        startListening()
      }
    }, delay)
  }

  async function getAIResponse(userText) {
    if (!userText.trim() || !active) return

    state.value = 'thinking'

    try {
      const apiKey = getApiKey()
      const baseUrl = getBaseUrl()
      const model = getModel()

      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: userText }],
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error?.message || `API 错误 [${res.status}]`)
      }

      const data = await res.json()
      const replyText = data.choices?.[0]?.message?.content || ''

      if (replyText) {
        transcript.value = replyText
        speakTTS(replyText)
      } else {
        errorMsg.value = 'AI 返回为空'
        state.value = 'error'
        active = false
      }
    } catch (err) {
      errorMsg.value = err.message
      state.value = 'error'
      active = false
    }
  }

  function speakTTS(text) {
    if (!active) return
    state.value = 'speaking'

    // 确保 voices 已加载
    const voices = speechSynthesis.getVoices()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = /[一-鿿]/.test(text) ? 'zh-CN' : 'en-US'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    const pref = voices.find(v =>
      utterance.lang.startsWith('zh') ? v.lang.startsWith('zh-CN') : v.lang.startsWith('en-US')
    )
    if (pref) utterance.voice = pref

    utterance.onend = () => {
      if (!active) return
      // 朗读完毕，清空显示，重新开始监听
      transcript.value = ''
      state.value = 'listening'
      scheduleRelisten(400)
    }

    utterance.onerror = (e) => {
      if (!active) return
      // TTS 出错不阻塞，继续监听
      transcript.value = ''
      state.value = 'listening'
      scheduleRelisten(400)
    }

    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }

  function stop() {
    active = false
    if (recognition) {
      try { recognition.abort() } catch {}
      recognition = null
    }
    speechSynthesis.cancel()
    state.value = 'idle'
    transcript.value = ''
    errorMsg.value = ''
  }

  function interrupt() {
    speechSynthesis.cancel()
    if (recognition) {
      try { recognition.abort() } catch {}
    }
    state.value = 'listening'
    transcript.value = ''
    if (active) {
      scheduleRelisten(300)
    }
  }

  onUnmounted(() => {
    stop()
  })

  return { state, transcript, errorMsg, start, stop, interrupt }
}
