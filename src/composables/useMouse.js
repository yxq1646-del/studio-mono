import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 全局鼠标位置追踪组合式函数
 * 以页面左上角为原点返回 { x, y }，用于自定义光标和悬浮预览
 */
export function useMouse() {
  const mouseX = ref(0)
  const mouseY = ref(0)

  function onMouseMove(e) {
    mouseX.value = e.clientX
    mouseY.value = e.clientY
  }

  onMounted(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove)
  })

  return { mouseX, mouseY }
}
