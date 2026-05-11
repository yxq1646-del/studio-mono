<template>
  <div class="sv">
    <div class="sv__container">
      <div v-if="loading" class="sv__status">加载中...</div>
      <div v-else-if="error" class="sv__status">{{ error }}</div>
      <template v-else>
        <h1 class="sv__title">{{ title }}</h1>
        <p class="sv__sub">🔗 分享的 AI 对话记录</p>

        <div class="sv__messages">
          <div v-for="(m, i) in messages" :key="i" class="sv__msg" :class="'sv__msg--' + m.role">
            <div class="sv__msg-role">{{ m.role === 'user' ? '你' : 'AI' }}</div>
            <div class="sv__msg-content" v-html="renderMarkdown(m.content)"></div>
          </div>
        </div>

        <div class="sv__footer">
          <a href="/chat" class="sv__btn">开始你自己的对话 →</a>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { marked } from 'marked'

marked.setOptions({ breaks: true })

const route = useRoute()
const api = useApi()

const title = ref('')
const messages = ref([])
const loading = ref(true)
const error = ref('')

function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
}

onMounted(async () => {
  try {
    const data = await api.get(`/share/${route.params.token}`)
    title.value = data.title
    messages.value = data.messages
  } catch (err) {
    error.value = '分享链接无效或已失效'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.sv {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  padding: 48px 24px;
}
.sv__container { max-width: 720px; margin: 0 auto; }
.sv__status { text-align: center; padding: 80px 0; font-size: 16px; color: #64748b; }
.sv__title { font-family: 'Georgia', 'Noto Serif SC', serif; font-size: 32px; color: #f1f5f9; margin-bottom: 8px; }
.sv__sub { font-size: 14px; color: #64748b; margin-bottom: 40px; }
.sv__messages { margin-bottom: 48px; }
.sv__msg { margin-bottom: 28px; }
.sv__msg--user .sv__msg-content {
  background: #1e293b;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid #1e3a5f;
}
.sv__msg-role { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; color: #64748b; }
.sv__msg--assistant .sv__msg-role { color: #3b82f6; }
.sv__msg-content { font-size: 15px; line-height: 1.8; }
.sv__msg-content :deep(p) { margin-bottom: 12px; }
.sv__msg-content :deep(code) { padding: 2px 6px; background: #1e293b; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
.sv__msg-content :deep(pre) { padding: 16px 20px; background: #0f172a; color: #3b82f6; border: 1px solid #1e3a5f; border-radius: 10px; overflow-x: auto; margin: 12px 0; }
.sv__msg-content :deep(pre code) { background: none; padding: 0; color: inherit; }
.sv__footer { text-align: center; padding: 40px 0; border-top: 1px solid #1e3a5f; }
.sv__btn { display: inline-block; padding: 14px 32px; background: #3b82f6; color: #fff; border-radius: 100px; font-size: 15px; font-weight: 500; transition: opacity 0.3s; }
.sv__btn:hover { opacity: 0.85; }

@media (max-width: 768px) {
  .sv { padding: 32px 16px; }
  .sv__title { font-size: 24px; }
}
</style>
