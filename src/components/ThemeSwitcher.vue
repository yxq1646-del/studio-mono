<template>
  <div class="theme-switcher">
    <span class="theme-switcher__label">Accent</span>
    <div class="theme-switcher__dots">
      <button
        v-for="color in colors"
        :key="color.value"
        class="theme-switcher__dot"
        :class="{ 'is-active': active === color.value }"
        :style="{ background: color.value }"
        :aria-label="'切换到 ' + color.name + ' 主题'"
        @click="switchTheme(color)"
      ></button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import gsap from 'gsap'

const colors = [
  { name: '荧光绿', value: '#c4f000', rgb: '196, 240, 0' },
  { name: '珊瑚橙', value: '#ff6b4a', rgb: '255, 107, 74' },
  { name: '电光蓝', value: '#4a9eff', rgb: '74, 158, 255' },
  { name: '紫罗兰', value: '#b066ff', rgb: '176, 102, 255' },
]

const active = ref(colors[0].value)

function switchTheme(color) {
  // 先做一个微小的弹跳动画
  const dot = document.querySelector(`.theme-switcher__dot[style*="${color.value}"]`)
  if (dot) {
    gsap.to(dot, { scale: 1.4, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' })
  }

  // 更新 CSS 变量
  const root = document.documentElement
  root.style.setProperty('--color-accent', color.value)
  root.style.setProperty('--color-accent-rgb', color.rgb)

  active.value = color.value
}
</script>

<style scoped>
.theme-switcher {
  display: flex;
  align-items: center;
  gap: 14px;
}

.theme-switcher__label {
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.theme-switcher__dots {
  display: flex;
  gap: 10px;
}

.theme-switcher__dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: border-color 0.3s, transform 0.2s;
}

.theme-switcher__dot:hover {
  transform: scale(1.15);
}

.theme-switcher__dot.is-active {
  border-color: var(--color-text);
}
</style>
