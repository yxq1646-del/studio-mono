<template>
  <div class="vb" :class="{ 'vb--listening': listening }">
    <button
      v-if="isSupported"
      class="vb__btn"
      :title="listening ? '停止录音' : '语音输入'"
      @click="toggle"
    >
      <!-- 麦克风图标 -->
      <svg v-if="!listening" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
      <!-- 停止图标 -->
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
      </svg>
    </button>

    <!-- 波纹动画 -->
    <div v-if="listening" class="vb__ripple">
      <span v-for="i in 5" :key="i" class="vb__ripple-ring" :style="{ animationDelay: `${i * 0.15}s` }" />
    </div>

    <!-- 实时转写 -->
    <div v-if="listening" class="vb__overlay">
      <div class="vb__overlay-inner">
        <div class="vb__waves">
          <span v-for="i in 7" :key="i" class="vb__wave-bar" :style="{ animationDelay: `${i * 0.08}s` }" />
        </div>
        <p class="vb__text" :class="{ 'vb__text--interim': interim }">
          {{ displayText || '正在聆听...' }}
        </p>
        <div class="vb__actions">
          <button class="vb__action-btn vb__action-btn--cancel" @click="cancel">取消</button>
          <button class="vb__action-btn vb__action-btn--confirm" @click="confirm" :disabled="!transcript.trim()">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSpeechRecognition } from '@/composables/useSpeechRecognition'

const emit = defineEmits(['result'])

const { isSupported, isListening, transcript, interimTranscript, start, stop, abort } =
  useSpeechRecognition({ lang: 'zh-CN' })

const listening = computed(() => isListening.value)
const interim = computed(() => interimTranscript.value)
const displayText = computed(() => transcript.value + interimTranscript.value)

function toggle() {
  if (isListening.value) {
    confirm()
  } else {
    start()
  }
}

function confirm() {
  const text = transcript.value.trim()
  stop()
  if (text) {
    emit('result', text)
  }
}

function cancel() {
  abort()
}
</script>

<style scoped>
.vb {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.vb__btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}
.vb__btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.vb--listening .vb__btn {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* 波纹 */
.vb__ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.vb__ripple-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border-radius: 50%;
  border: 2px solid #ef4444;
  animation: ripple 1.5s ease-out infinite;
  opacity: 0;
}
@keyframes ripple {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(3); opacity: 0; }
}

/* 录音浮层 */
.vb__overlay {
  position: fixed;
  inset: 0;
  z-index: 40000;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.vb__overlay-inner {
  text-align: center;
  max-width: 420px;
  width: 100%;
  padding: 40px;
}

/* 声波动画 */
.vb__waves {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 64px;
  margin-bottom: 24px;
}
.vb__wave-bar {
  width: 4px;
  height: 16px;
  background: #ef4444;
  border-radius: 2px;
  animation: wave 0.6s ease-in-out infinite alternate;
}
@keyframes wave {
  0% { height: 8px; opacity: 0.4; }
  100% { height: 48px; opacity: 1; }
}

.vb__text {
  font-size: 20px;
  color: #e2e8f0;
  min-height: 32px;
  line-height: 1.6;
}
.vb__text--interim { color: #94a3b8; }

.vb__actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}
.vb__action-btn {
  padding: 12px 32px;
  font-size: 15px;
  border-radius: 100px;
  cursor: pointer;
  border: none;
  font-weight: 500;
  transition: opacity 0.3s;
}
.vb__action-btn:hover { opacity: 0.85; }
.vb__action-btn--cancel {
  background: rgba(255,255,255,0.1);
  color: #94a3b8;
}
.vb__action-btn--confirm {
  background: #3b82f6;
  color: #fff;
}
.vb__action-btn--confirm:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
