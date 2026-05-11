import { ref, onUnmounted } from 'vue'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useSpeechRecognition(options = {}) {
  const lang = options.lang || 'zh-CN'
  const continuous = options.continuous ?? false
  const interimResults = options.interimResults ?? true

  const isSupported = ref(!!SpeechRecognition)
  const isListening = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const error = ref('')

  let recognition = null

  function init() {
    if (!SpeechRecognition) return
    if (recognition) return

    recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = interimResults

    recognition.onresult = (event) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += t
        } else {
          interim += t
        }
      }
      if (final) transcript.value += final
      interimTranscript.value = interim
    }

    recognition.onerror = (event) => {
      error.value = event.error
      isListening.value = false
      if (event.error === 'no-speech') {
        error.value = ''
      }
    }

    recognition.onend = () => {
      isListening.value = false
    }
  }

  function start() {
    if (!SpeechRecognition) {
      error.value = 'not-supported'
      return
    }
    init()
    error.value = ''
    transcript.value = ''
    interimTranscript.value = ''
    try {
      recognition.start()
      isListening.value = true
    } catch {
      // already started
    }
  }

  function stop() {
    if (recognition) {
      recognition.stop()
      isListening.value = false
    }
  }

  function abort() {
    if (recognition) {
      recognition.abort()
      isListening.value = false
      transcript.value = ''
      interimTranscript.value = ''
    }
  }

  onUnmounted(() => {
    if (recognition) recognition.abort()
  })

  return { isSupported, isListening, transcript, interimTranscript, error, start, stop, abort }
}
