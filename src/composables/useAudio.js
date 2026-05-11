import { ref, onMounted, onUnmounted } from 'vue'

const DEFAULT_VOLUME = 0.4

export function useAudio(src, { loop = true, volume = DEFAULT_VOLUME } = {}) {
  const audio = ref(null)
  const isPlaying = ref(false)

  function play() {
    if (!audio.value || isPlaying.value) return
    audio.value.volume = volume
    audio.value.play().then(() => {
      isPlaying.value = true
    }).catch(() => {})
  }

  function tryAutoplay() {
    if (!audio.value) return
    audio.value.volume = volume
    audio.value.play().then(() => {
      isPlaying.value = true
    }).catch(() => {})
  }

  function onUserGesture() {
    play()
  }

  onMounted(() => {
    audio.value = new Audio(src)
    if (loop) audio.value.loop = true

    tryAutoplay()

    if (!isPlaying.value) {
      const events = ['click', 'touchstart', 'keydown', 'scroll']
      events.forEach(e => window.addEventListener(e, onUserGesture, { once: true }))
    }
  })

  onUnmounted(() => {
    if (audio.value) {
      audio.value.pause()
      audio.value.src = ''
      audio.value = null
    }
    window.removeEventListener('click', onUserGesture)
    window.removeEventListener('touchstart', onUserGesture)
    window.removeEventListener('keydown', onUserGesture)
    window.removeEventListener('scroll', onUserGesture)
  })

  return { audio, isPlaying, play }
}
