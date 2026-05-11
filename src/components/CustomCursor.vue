<template>
  <div ref="cursor" class="cursor" :class="{ 'cursor--hidden': hidden }">
    <!-- 光标圆点 -->
    <div ref="dot" class="cursor__dot"></div>
    <!-- 光标外圈 -->
    <div ref="ring" class="cursor__ring"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'

const cursor = ref(null)
const dot = ref(null)
const ring = ref(null)
const hidden = ref(false)

const pos = { x: -100, y: -100 }   // 目标位置
const cur = { x: -100, y: -100 }   // 当前位置（用于 GSAP 动画）

let rafId = null

function onMouseMove(e) {
  pos.x = e.clientX
  pos.y = e.clientY
  hidden.value = false
}

function onMouseLeave() {
  hidden.value = true
}

function onMouseEnter() {
  hidden.value = false
}

/** 处理光标变形 — 监听带有 data-cursor 属性的元素 */
function onElementEnter(e) {
  const el = e.target.closest?.('[data-cursor]')
  if (!el) return
  const type = el.dataset.cursor

  switch (type) {
    case 'circle':
      // 变成大圆
      gsap.to(ring.value, { width: 72, height: 72, borderRadius: '50%', borderColor: 'var(--color-accent)', duration: 0.35, ease: 'power2.out' })
      gsap.to(dot.value, { scale: 0, duration: 0.25 })
      break
    case 'text':
      // 变成文字跟随
      gsap.to(ring.value, { width: 80, height: 30, borderRadius: '6px', borderColor: 'var(--color-text)', duration: 0.35, ease: 'power2.out' })
      gsap.to(dot.value, { scale: 0, duration: 0.25 })
      break
    case 'view':
      // 变成放大镜样式
      gsap.to(ring.value, { width: 64, height: 64, borderRadius: '50%', borderColor: 'var(--color-black)', duration: 0.35, ease: 'power2.out' })
      gsap.to(dot.value, { scale: 0, duration: 0.25 })
      break
    default:
      gsap.to(ring.value, { width: 36, height: 36, borderRadius: '50%', borderColor: 'var(--color-text-muted)', duration: 0.35, ease: 'power2.out' })
      gsap.to(dot.value, { scale: 0.6, duration: 0.25 })
  }
}

function onElementLeave() {
  // 恢复默认光标
  gsap.to(ring.value, { width: 36, height: 36, borderRadius: '50%', borderColor: 'var(--color-text-muted)', duration: 0.35, ease: 'power2.out' })
  gsap.to(dot.value, { scale: 1, duration: 0.25 })
}

/** 动画循环 — GSAP 快速缓动跟随 */
function animate() {
  // 使用 lerp 让光标平滑跟随
  cur.x += (pos.x - cur.x) * 0.18
  cur.y += (pos.y - cur.y) * 0.18

  if (cursor.value) {
    cursor.value.style.left = cur.x + 'px'
    cursor.value.style.top = cur.y + 'px'
  }
  rafId = requestAnimationFrame(animate)
}

onMounted(() => {
  // 触摸设备不需要自定义光标
  if ('ontouchstart' in window) {
    if (cursor.value) cursor.value.style.display = 'none'
    return
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true })
  document.addEventListener('mouseleave', onMouseLeave)
  document.addEventListener('mouseenter', onMouseEnter)

  // 对任何带 data-cursor 属性的元素绑定悬停事件
  document.addEventListener('mouseover', onElementEnter, { capture: true })
  document.addEventListener('mouseout', onElementLeave, { capture: true })

  rafId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseleave', onMouseLeave)
  document.removeEventListener('mouseenter', onMouseEnter)
  document.removeEventListener('mouseover', onElementEnter, { capture: true })
  document.removeEventListener('mouseout', onElementLeave, { capture: true })
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.cursor {
  position: fixed;
  z-index: 99999;
  pointer-events: none;
  transform: translate(-50%, -50%);
  transition: opacity 0.25s;
  will-change: left, top;
}

.cursor--hidden {
  opacity: 0;
}

.cursor__dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: var(--color-black);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.cursor__ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--color-text-muted);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
</style>
