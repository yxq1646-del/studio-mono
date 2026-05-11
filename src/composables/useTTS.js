import { ref } from 'vue'

export function useTTS() {
  const speaking = ref(false)
  const supported = ref('speechSynthesis' in window)

  function speak(text) {
    if (!supported.value || !text?.trim()) return

    speechSynthesis.cancel()
    speaking.value = true

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = /[一-鿿]/.test(text) ? 'zh-CN' : 'en-US'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    // 预加载语音列表
    const voices = speechSynthesis.getVoices()
    const pref = voices.find(v =>
      utterance.lang.startsWith('zh') ? v.lang.startsWith('zh-CN') : v.lang.startsWith('en-US')
    )
    if (pref) utterance.voice = pref

    utterance.onend = () => { speaking.value = false }
    utterance.onerror = () => { speaking.value = false }

    speechSynthesis.speak(utterance)
  }

  function stop() {
    speechSynthesis.cancel()
    speaking.value = false
  }

  return { speaking, supported, speak, stop }
}
