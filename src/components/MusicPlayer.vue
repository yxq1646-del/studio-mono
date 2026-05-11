<template>
  <div class="mp" :class="{ 'mp--playing': isPlaying }" :title="isPlaying ? '暂停音乐' : '播放音乐'">
    <button class="mp__btn" @click="toggle">
      <!-- 播放图标 -->
      <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5,3 19,12 5,21"/>
      </svg>
      <!-- 暂停图标（带波纹） -->
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <rect x="5" y="3" width="5" height="18" rx="1"/>
        <rect x="14" y="3" width="5" height="18" rx="1"/>
      </svg>
    </button>
    <!-- 播放时的小点点动画 -->
    <span v-if="isPlaying" class="mp__dot mp__dot--1" />
    <span v-if="isPlaying" class="mp__dot mp__dot--2" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isPlaying = ref(false)
let audio = null

// 离开首页自动停止
watch(() => route.path, (path) => {
  if (path !== '/' && audio) {
    audio.pause()
    isPlaying.value = false
  }
})

function toggle() {
  if (!audio) return
  if (isPlaying.value) {
    audio.pause()
    isPlaying.value = false
  } else {
    audio.volume = 0.35
    audio.play().then(() => {
      isPlaying.value = true
    }).catch(() => {})
  }
}

onMounted(() => {
  audio = new Audio('/audio/bgm.mp3')
  audio.loop = true
})

onUnmounted(() => {
  if (audio) {
    audio.pause()
    audio.src = ''
    audio = null
  }
  isPlaying.value = false
})
</script>

<style scoped>
.mp {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

@media (max-width: 768px) {
  .mp {
    bottom: 16px;
    right: 16px;
  }
}

.mp__btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(128, 128, 128, 0.25);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.35s;
  position: relative;
  z-index: 2;
}
.mp__btn:hover {
  border-color: rgba(128, 128, 128, 0.5);
  color: #555;
  transform: scale(1.08);
}
.mp--playing .mp__btn {
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
  background: rgba(255, 255, 255, 0.85);
}

/* 播放时的呼吸点 */
.mp__dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #3b82f6;
  opacity: 0;
  top: 50%;
  left: 50%;
  pointer-events: none;
}
.mp__dot--1 {
  animation: mpDot 1.8s ease-out infinite;
  animation-delay: 0s;
}
.mp__dot--2 {
  animation: mpDot 1.8s ease-out infinite;
  animation-delay: 0.6s;
}
@keyframes mpDot {
  0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(8); opacity: 0; }
}
</style>
