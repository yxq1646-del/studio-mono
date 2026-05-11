<template>
  <Teleport to="body">
    <Transition name="voice">
      <div v-if="show" class="rvoice">
        <div class="rvoice__backdrop" @click="close" />

        <div class="rvoice__panel">
          <!-- 状态指示 -->
          <div class="rvoice__status">
            <span class="rvoice__badge" :class="'rvoice__badge--' + state">
              {{ stateLabel }}
            </span>
          </div>

          <!-- 转写文本 -->
          <div class="rvoice__transcript" :class="{ 'rvoice__transcript--empty': !transcript }">
            {{ transcript || placeholder }}
          </div>

          <!-- 声波动画 -->
          <div class="rvoice__waves" v-if="state === 'listening' || state === 'speaking'">
            <span
              v-for="i in 12"
              :key="i"
              class="rvoice__bar"
              :style="{ animationDelay: `${i * 0.06}s` }"
            />
          </div>

          <!-- 主控按钮 -->
          <button
            class="rvoice__btn"
            :class="'rvoice__btn--' + state"
            @click="handleMainAction"
          >
            <!-- 麦克风图标 -->
            <svg v-if="state === 'idle'" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <!-- 聆听中：波纹指示 -->
            <svg v-else-if="state === 'listening'" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
            <!-- 思考中：旋转 -->
            <svg v-else-if="state === 'thinking'" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rvoice__spinner">
              <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" />
            </svg>
            <!-- 说话中 / 错误 / 结束：停止图标 -->
            <svg v-else width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>

          <!-- 控制按钮 -->
          <div class="rvoice__controls">
            <button
              v-if="state === 'speaking'"
              class="rvoice__ctrl-btn"
              @click="$emit('interrupt')"
            >
              打断
            </button>
            <button
              v-if="state === 'error'"
              class="rvoice__ctrl-btn"
              @click="$emit('start')"
            >
              重试
            </button>
            <button class="rvoice__ctrl-btn rvoice__ctrl-btn--secondary" @click="close">
              关闭
            </button>
          </div>

          <!-- 错误信息 -->
          <p v-if="error" class="rvoice__error">{{ error }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  state: { type: String, default: 'idle' },
  transcript: { type: String, default: '' },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'start', 'stop', 'interrupt'])

const stateLabel = computed(() => {
  const map = {
    idle: '点击开始语音对话',
    listening: '正在聆听...',
    thinking: 'AI 思考中...',
    speaking: 'AI 回复中...',
    error: '出错了',
  }
  return map[props.state] || props.state
})

const placeholder = computed(() => {
  const map = {
    idle: '点击下方按钮开始',
    listening: '请说话...',
    thinking: '正在生成回复...',
    speaking: '',
    error: '',
  }
  return map[props.state] || ''
})

function handleMainAction() {
  if (props.state === 'idle') {
    emit('start')
  } else if (props.state === 'error') {
    emit('start')
  } else {
    emit('stop')
  }
}

function close() {
  emit('stop')
  emit('close')
}
</script>

<style scoped>
.rvoice {
  position: fixed;
  inset: 0;
  z-index: 50000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rvoice__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(20px);
}
.rvoice__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  max-width: 480px;
  width: 100%;
  padding: 48px 32px;
}

.rvoice__status { display: flex; gap: 8px; }
.rvoice__badge {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 100px;
  letter-spacing: 0.04em;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.12);
}
.rvoice__badge--listening { color: #22c55e; background: rgba(34, 197, 94, 0.12); }
.rvoice__badge--speaking { color: #3b82f6; background: rgba(59, 130, 246, 0.12); }
.rvoice__badge--thinking { color: #f59e0b; background: rgba(245, 158, 11, 0.12); }
.rvoice__badge--idle { color: #a78bfa; background: rgba(167, 139, 250, 0.12); }
.rvoice__badge--error { color: #ef4444; background: rgba(239, 68, 68, 0.12); }

.rvoice__transcript {
  font-size: 22px;
  color: #f1f5f9;
  text-align: center;
  line-height: 1.7;
  min-height: 60px;
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
}
.rvoice__transcript--empty { color: #64748b; }

/* 声波 */
.rvoice__waves {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 80px;
}
.rvoice__bar {
  width: 5px;
  min-height: 8px;
  background: var(--color-accent, #3b82f6);
  border-radius: 3px;
  animation: voiceWave 0.8s ease-in-out infinite alternate;
}
@keyframes voiceWave {
  0% { height: 8px; opacity: 0.35; }
  100% { height: 72px; opacity: 1; }
}

/* 主按钮 */
.rvoice__btn {
  width: 88px;
  height: 88px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s;
  position: relative;
}
.rvoice__btn--idle {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
  animation: pulse 2s infinite;
}
.rvoice__btn--listening {
  background: rgba(34, 197, 94, 0.18);
  color: #22c55e;
  box-shadow: 0 0 32px rgba(34, 197, 94, 0.3);
  animation: pulseGreen 1.5s infinite;
}
.rvoice__btn--speaking {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  box-shadow: 0 0 32px rgba(59, 130, 246, 0.3);
}
.rvoice__btn--thinking {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}
.rvoice__btn--error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(139, 92, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
}
@keyframes pulseGreen {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.rvoice__spinner { animation: spin 1.4s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.rvoice__controls { display: flex; gap: 12px; }
.rvoice__ctrl-btn {
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 100px;
  background: rgba(255,255,255,0.06);
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.3s;
}
.rvoice__ctrl-btn:hover { background: rgba(255,255,255,0.12); }
.rvoice__ctrl-btn--secondary { color: #64748b; }

.rvoice__error {
  font-size: 13px;
  color: #ef4444;
  text-align: center;
  max-width: 320px;
  word-break: break-all;
}

/* 过渡动画 */
.voice-enter-active { transition: opacity 0.3s ease; }
.voice-leave-active { transition: opacity 0.25s ease; }
.voice-enter-from, .voice-leave-to { opacity: 0; }
</style>
