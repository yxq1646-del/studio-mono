<template>
  <div class="cv">
    <!-- 侧栏 -->
    <aside class="cv__sidebar">
      <div class="cv__brand">
        <h2 class="cv__logo">{{ selectedAgentName || 'AI 助手' }}</h2>
      </div>
      <div class="cv__agent-selector">
        <button class="cv__agent-btn" @click="showAgentPicker = !showAgentPicker">
          <span>{{ selectedAgentId ? '切换智能体' : '🤖 选择智能体' }}</span>
        </button>
        <div v-if="showAgentPicker" class="cv__agent-dropdown">
          <div
            v-for="agent in agents"
            :key="agent.id"
            class="cv__agent-item"
            :class="{ 'cv__agent-item--active': agent.id === selectedAgentId }"
            @click="selectAgent(agent)"
          >
            <span class="cv__agent-name">{{ agent.name }}</span>
            <span class="cv__agent-desc">{{ agent.description }}</span>
          </div>
          <p v-if="!agents.length" class="cv__agent-empty">暂无智能体</p>
          <div class="cv__agent-actions">
            <button class="cv__agent-create-btn" @click="openAgentForm">+ 创建智能体</button>
          </div>
        </div>
      </div>
      <button class="cv__new-btn" @click="handleNewChat">+ 新对话</button>
      <div class="cv__conv-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="cv__conv"
          :class="{ 'cv__conv--active': conv.id === activeId }"
          @click="store.switchTo(conv.id)"
        >
          <span class="cv__conv-title">{{ conv.title || '新对话' }}</span>
          <span class="cv__conv-time">{{ formatTime(conv.updated_at) }}</span>
          <button class="cv__conv-share" @click.stop="handleShare(conv)" title="分享对话">🔗</button>
          <button class="cv__conv-del" @click.stop="store.deleteConversation(conv.id)">×</button>
        </div>
        <p v-if="conversations.length === 0" class="cv__empty-sidebar">暂无对话</p>
      </div>
      <div class="cv__sidebar-footer">
        <button class="cv__api-btn" @click="showApiKeyDialog = true">🔑 API Key</button>
        <a href="/" class="cv__home-link">← 返回首页</a>
      </div>
    </aside>

    <!-- 聊天区 -->
    <div class="cv__main">
      <!-- 顶部工具栏 -->
      <div class="cv__toolbar">
        <button class="cv__voice-mode-btn" :class="{ 'cv__voice-mode-btn--active': voiceMode }" @click="toggleVoiceMode" title="实时语音对话">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          <span>语音对话</span>
        </button>
        <div class="cv__toolbar-spacer" />
        <button v-if="tts.supported.value" class="cv__tts-toggle" :class="{ 'cv__tts-toggle--on': autoTTS }" @click="autoTTS = !autoTTS" title="自动朗读回复">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.49 4.49 0 0 0 2.5-3.5zM14 3.23v2.06a7.007 7.007 0 0 1 0 13.42v2.06A9.01 9.01 0 0 0 14 3.23z"/>
          </svg>
          {{ autoTTS ? '自动朗读: 开' : '自动朗读: 关' }}
        </button>
      </div>

      <div v-if="messages.length === 0" class="cv__welcome">
        <h1 class="cv__welcome-title">AI 智能助手</h1>
        <p class="cv__welcome-sub">输入消息开始对话，支持多轮上下文记忆和流式输出</p>
        <div class="cv__suggestions">
          <button v-for="s in suggestions" :key="s" class="cv__suggestion" @click="handleSend(s)">
            {{ s }}
          </button>
        </div>
      </div>

      <div ref="msgList" class="cv__messages" v-else>
        <div
          v-for="m in messages"
          :key="m.id"
          class="cv__msg"
          :class="'cv__msg--' + m.role"
        >
          <div class="cv__msg-role">{{ m.role === 'user' ? '你' : 'AI' }}</div>
          <div class="cv__msg-content" v-html="renderMarkdown(m.content)"></div>
          <!-- TTS 朗读按钮 -->
          <button
            v-if="m.role === 'assistant' && m.content && tts.supported.value"
            class="cv__msg-speak"
            :class="{ 'cv__msg-speak--playing': tts.speaking.value }"
            @click="toggleSpeakMessage(m)"
            :title="tts.speaking.value ? '停止' : '朗读'"
          >
            <svg v-if="!tts.speaking.value" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
          </button>
        </div>
        <div v-if="streaming" class="cv__typing">● ● ●</div>
      </div>

      <!-- 附件预览 -->
      <div v-if="attachments.length" class="cv__attachments">
        <div v-for="(a, i) in attachments" :key="i" class="cv__att-item">
          <img v-if="a.type === 'image'" :src="a.base64" class="cv__att-img" />
          <span v-else class="cv__att-doc">📄 {{ a.filename }}</span>
          <button class="cv__att-remove" @click="store.removeAttachment(i)">×</button>
        </div>
      </div>

      <div class="cv__input-area">
        <label class="cv__file-btn" title="添加文件">
          📎
          <input
            ref="fileInput"
            type="file"
            accept="image/*,.docx,.pptx,.txt,.md,.pdf"
            class="cv__file-input"
            @change="onFileChange"
          />
        </label>
        <VoiceButton @result="onVoiceResult" />
        <textarea
          v-model="input"
          class="cv__input"
          placeholder="输入消息…（回车发送，Shift+回车换行）"
          rows="1"
          :disabled="streaming"
          @keydown.enter.exact.prevent="handleSend(input)"
          @input="autoResize"
        ></textarea>
        <button
          v-if="!streaming"
          class="cv__send"
          :disabled="!input.trim() && !attachments.length"
          @click="handleSend(input)"
        >发送</button>
        <button v-else class="cv__stop" @click="store.stopStreaming">停止</button>
      </div>
    </div>

    <!-- API 设置弹窗 -->
    <Teleport to="body">
      <div v-if="showApiKeyDialog" class="cv__modal" @click.self="showApiKeyDialog = false">
        <div class="cv__modal-card">
          <h3>API 设置</h3>
          <p class="cv__modal-sub">密钥仅保存在浏览器本地，不会上传服务器</p>

          <div class="cv__modal-field">
            <label>服务商</label>
            <select v-model="providerSelect" class="cv__modal-select" @change="onProviderChange">
              <option value="v3cm">API V3 (中转站)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="custom">自定义</option>
            </select>
          </div>

          <div class="cv__modal-field" v-if="providerSelect === 'custom'">
            <label>API 地址</label>
            <input v-model="baseUrlInput" type="text" placeholder="https://api.v3.cm" class="cv__modal-input" />
          </div>

          <div class="cv__modal-field" v-if="providerSelect === 'custom'">
            <label>模型名称</label>
            <input v-model="modelInput" type="text" placeholder="claude-opus-4-7" class="cv__modal-input" />
          </div>

          <div class="cv__modal-field">
            <label>API Key</label>
            <input v-model="keyInput" type="password" :placeholder="keyPlaceholder" class="cv__modal-input" />
          </div>

          <div class="cv__modal-actions">
            <button class="cv__modal-cancel" @click="showApiKeyDialog = false">取消</button>
            <button class="cv__modal-save" @click="saveKey">保存</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 创建智能体弹窗 -->
    <Teleport to="body">
      <div v-if="showAgentForm" class="cv__modal" @click.self="showAgentForm = false">
        <div class="cv__modal-card">
          <h3>创建智能体</h3>
          <div class="cv__modal-field"><label>名称*</label><input v-model="agentForm.name" class="cv__modal-input" placeholder="例如：编程助手" /></div>
          <div class="cv__modal-field"><label>描述</label><input v-model="agentForm.description" class="cv__modal-input" placeholder="一句话描述用途" /></div>
          <div class="cv__modal-field"><label>System Prompt*</label><textarea v-model="agentForm.system_prompt" class="cv__modal-input" rows="3" placeholder="定义智能体的角色和行为"></textarea></div>
          <div class="cv__modal-field"><label>服务商</label>
            <select v-model="agentForm.provider" class="cv__modal-select">
              <option value="v3cm">API V3 (中转站)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div class="cv__modal-actions">
            <button class="cv__modal-cancel" @click="showAgentForm = false">取消</button>
            <button class="cv__modal-save" @click="createAgent">创建</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 实时语音面板 -->
    <RealtimeVoice
      :show="voiceMode"
      :state="voiceState"
      :transcript="voiceTranscript"
      :error="voiceError"
      @start="startVoice"
      @stop="stopVoice"
      @interrupt="voice.interrupt()"
      @close="voiceMode = false; stopVoice()"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import VoiceButton from '@/projects/ai-assistant/components/VoiceButton.vue'
import RealtimeVoice from '@/projects/ai-assistant/components/RealtimeVoice.vue'
import { useChatStore } from '@/projects/ai-assistant/stores/chat'
import { useAgentStore } from '@/projects/ai-assistant/stores/agents'
import { useRealtimeVoice } from '@/composables/useRealtimeVoice'
import { useTTS } from '@/composables/useTTS'
import { useApi } from '@/composables/useApi'
import { marked } from 'marked'

marked.setOptions({ breaks: true })

const store = useChatStore()
const agentStore = useAgentStore()
const { conversations, activeId, messages, streaming, attachments, selectedAgentId } = storeToRefs(store)
const { agents } = storeToRefs(agentStore)

const voice = useRealtimeVoice()
const tts = useTTS()

const input = ref('')
const fileInput = ref(null)
const msgList = ref(null)
const showApiKeyDialog = ref(false)
const showAgentPicker = ref(false)
const keyInput = ref('')
const providerSelect = ref('v3cm')
const baseUrlInput = ref('')
const modelInput = ref('')
const voiceMode = ref(false)
const autoTTS = ref(false)

const { state: voiceState, transcript: voiceTranscript, error: voiceError } = voice

const selectedAgentName = computed(() => {
  const a = agentStore.agents.find(a => a.id === selectedAgentId.value)
  return a?.name || ''
})

const keyPlaceholder = {
  v3cm: 'sk-...',
  deepseek: 'sk-...',
  anthropic: 'sk-ant-...',
  openai: 'sk-...',
  custom: 'your-api-key',
}

const suggestions = [
  '解释一下 Vue 3 的 Composition API',
  '用 50 字介绍一下你自己',
  '写一段递归函数的示例',
]

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  if (isNaN(d.getTime())) return t
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
}

async function handleSend(text) {
  const v = text?.trim()
  if (!v || streaming.value) return
  input.value = ''
  await store.sendMessage(v)
  await nextTick()
  scrollBottom()
}

// Auto-TTS: 流式回复结束后自动朗读
watch(() => streaming.value, (v) => {
  if (!v && autoTTS.value && messages.value.length > 0) {
    const last = messages.value[messages.value.length - 1]
    if (last.role === 'assistant' && last.content) {
      // 去掉 markdown 符号后朗读
      const plain = last.content.replace(/[#*`~>\[\]()!\-\|]/g, ' ').replace(/\s+/g, ' ').trim()
      if (plain) tts.speak(plain)
    }
  }
})

function toggleSpeakMessage(m) {
  if (tts.speaking.value) {
    tts.stop()
  } else {
    const plain = m.content.replace(/[#*`~>\[\]()!\-\|]/g, ' ').replace(/\s+/g, ' ').trim()
    tts.speak(plain)
  }
}

function toggleVoiceMode() {
  if (voiceMode.value) {
    voiceMode.value = false
    voice.stop()
  } else {
    voiceMode.value = true
    // 自动开始语音对话
    nextTick(() => voice.start())
  }
}

function startVoice() {
  voice.start()
}

function stopVoice() {
  voice.stop()
}

function handleNewChat() {
  store.createConversation('新对话', selectedAgentId.value)
}

function selectAgent(agent) {
  store.selectedAgentId = agent.id
  showAgentPicker.value = false
  store.createConversation(agent.name, agent.id)
}

const showAgentForm = ref(false)
const agentForm = reactive({ name: '', description: '', system_prompt: '', provider: 'v3cm' })

function openAgentForm() {
  Object.assign(agentForm, { name: '', description: '', system_prompt: '', provider: 'v3cm' })
  showAgentPicker.value = false
  showAgentForm.value = true
}

const chatApi = useApi()

async function createAgent() {
  if (!agentForm.name || !agentForm.system_prompt) return
  try {
    const agent = await chatApi.post('/agents', { ...agentForm })
    await agentStore.loadAgents()
    showAgentForm.value = false
    selectAgent(agent)
  } catch (err) {
    alert('创建失败: ' + err.message)
  }
}

function onVoiceResult(text) {
  input.value = text
}

async function handleShare(conv) {
  try {
    const data = await chatApi.post(`/conversations/${conv.id}/share`)
    const url = window.location.origin + data.shareUrl
    await navigator.clipboard.writeText(url)
    alert('分享链接已复制到剪贴板！\n' + url)
  } catch (err) {
    alert('分享失败：' + err.message)
  }
}

async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    await store.addAttachment(file)
  } catch (err) {
    alert('文件处理失败: ' + err.message)
  }
  if (fileInput.value) fileInput.value.value = ''
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function scrollBottom() {
  if (msgList.value) {
    msgList.value.scrollTop = msgList.value.scrollHeight
  }
}

function onProviderChange() {
  const p = store.PROVIDERS[providerSelect.value]
  if (p && providerSelect.value !== 'custom') {
    baseUrlInput.value = p.baseUrl
    modelInput.value = p.model
  }
}

function saveKey() {
  store.apiKey = keyInput.value
  store.setProvider(providerSelect.value, baseUrlInput.value, modelInput.value)
  showApiKeyDialog.value = false
}

watch(() => showApiKeyDialog.value, (v) => {
  if (v) {
    keyInput.value = store.apiKey
    providerSelect.value = store.selectedProvider
    baseUrlInput.value = store.customBaseUrl
    modelInput.value = store.customModel
  }
})

watch(messages, () => nextTick(scrollBottom), { deep: true })

onMounted(() => {
  store.loadConversations()
  agentStore.loadAgents()
})
</script>

<style scoped>
.cv {
  display: flex;
  height: 100vh;
  --color-bg: #0f172a;
  --color-bg-alt: #1e293b;
  --color-text: #e2e8f0;
  --color-text-muted: #64748b;
  --color-accent: #3b82f6;
  --color-accent-rgb: 59, 130, 246;
  --color-white: #1a2332;
  --color-black: #f1f5f9;
  --color-border: #1e3a5f;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  background: var(--color-bg);
  color: var(--color-text);
}

/* 侧栏 */
.cv__sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--color-white);
  border-right: 1px solid var(--color-border);
  flex-shrink: 0;
}
.cv__brand { padding: 24px 20px 16px; }
.cv__logo { font-family: var(--font-title); font-size: 22px; color: var(--color-black); }
.cv__agent-selector { position: relative; padding: 0 16px; margin-bottom: 8px; }
.cv__agent-btn {
  width: 100%;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.3s;
}
.cv__agent-btn:hover { border-color: var(--color-accent); }
.cv__agent-dropdown {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 100%;
  z-index: 1000;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  max-height: 220px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.cv__agent-item {
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.2s;
}
.cv__agent-item:last-child { border-bottom: none; }
.cv__agent-item:hover { background: var(--color-bg); }
.cv__agent-item--active { background: var(--color-bg); }
.cv__agent-name { display: block; font-size: 13px; color: var(--color-text); font-weight: 500; }
.cv__agent-desc { display: block; font-size: 11px; color: var(--color-text-muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cv__agent-empty { padding: 16px; text-align: center; font-size: 13px; color: var(--color-text-muted); }
.cv__agent-actions { padding: 6px 8px; border-top: 1px solid var(--color-border); }
.cv__agent-create-btn {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-accent);
  background: none;
  border: 1px dashed var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s;
}
.cv__agent-create-btn:hover { border-color: var(--color-accent); background: var(--color-bg); }
.cv__new-btn {
  margin: 0 16px 16px;
  padding: 12px;
  font-size: 14px;
  color: var(--color-black);
  background: var(--color-accent);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}
.cv__new-btn:hover { opacity: 0.85; }
.cv__conv-list { flex: 1; overflow-y: auto; padding: 0 12px; }
.cv__conv {
  position: relative;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 2px;
  transition: background 0.2s;
}
.cv__conv:hover { background: var(--color-bg); }
.cv__conv--active { background: var(--color-bg); }
.cv__conv-title { display: block; font-size: 14px; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 24px; }
.cv__conv-time { font-size: 11px; color: var(--color-text-muted); }
.cv__conv-del {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  width: 20px; height: 20px; border: none; background: none; font-size: 16px; color: var(--color-text-muted); cursor: pointer; opacity: 0;
  border-radius: 50%;
}
.cv__conv-share {
  position: absolute; right: 32px; top: 50%; transform: translateY(-50%);
  width: 20px; height: 20px; border: none; background: none; font-size: 14px; color: var(--color-text-muted); cursor: pointer; opacity: 0;
  border-radius: 50%;
}
.cv__conv:hover .cv__conv-del,
.cv__conv:hover .cv__conv-share { opacity: 1; }
.cv__empty-sidebar { padding: 24px; text-align: center; font-size: 13px; color: var(--color-text-muted); }
.cv__sidebar-footer { padding: 16px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 8px; }
.cv__api-btn, .cv__home-link {
  padding: 8px 12px; font-size: 13px; color: var(--color-text-muted); background: none; border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; text-align: center; transition: color 0.3s;
}
.cv__api-btn:hover, .cv__home-link:hover { color: var(--color-accent); }

/* 主聊天区 */
.cv__main {
  flex: 1; display: flex; flex-direction: column; min-width: 0;
}

/* 顶部工具栏 */
.cv__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 32px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-white);
}
.cv__toolbar-spacer { flex: 1; }
.cv__voice-mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.cv__voice-mode-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.cv__voice-mode-btn--active {
  background: rgba(59, 130, 246, 0.12);
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.cv__tts-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.cv__tts-toggle:hover { border-color: var(--color-accent); }
.cv__tts-toggle--on {
  border-color: #22c55e;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}

.cv__welcome { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; text-align: center; }
.cv__welcome-title { font-family: var(--font-title); font-size: 40px; color: var(--color-black); }
.cv__welcome-sub { font-size: 16px; color: var(--color-text-muted); margin: 12px 0 32px; }
.cv__suggestions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 560px; }
.cv__suggestion { padding: 10px 20px; font-size: 14px; color: var(--color-text); background: var(--color-white); border: 1px solid var(--color-border); border-radius: 100px; cursor: pointer; transition: border-color 0.3s; }
.cv__suggestion:hover { border-color: var(--color-accent); }
.cv__messages { flex: 1; overflow-y: auto; padding: 32px; }
.cv__msg { margin-bottom: 28px; max-width: 720px; position: relative; }
.cv__msg--user { margin-left: auto; }
.cv__msg-role { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; color: var(--color-text-muted); }
.cv__msg--assistant .cv__msg-role { color: var(--color-accent); }
.cv__msg-content { font-size: 15px; line-height: 1.8; color: var(--color-text); }
.cv__msg-content :deep(p) { margin-bottom: 12px; }
.cv__msg-content :deep(code) { padding: 2px 6px; background: var(--color-bg-alt); border-radius: 4px; font-family: var(--font-mono); font-size: 13px; }
.cv__msg-content :deep(pre) { padding: 16px 20px; background: var(--color-black); color: var(--color-accent); border-radius: 10px; overflow-x: auto; margin: 12px 0; }
.cv__msg-content :deep(pre code) { background: none; padding: 0; color: inherit; }

/* 消息朗读按钮 */
.cv__msg-speak {
  display: none;
  position: absolute;
  right: -32px;
  top: 4px;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--color-bg);
  color: var(--color-text-muted);
  border-radius: 6px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
}
.cv__msg:hover .cv__msg-speak { display: flex; }
.cv__msg-speak:hover { color: var(--color-accent); background: var(--color-bg-alt); }
.cv__msg-speak--playing { display: flex !important; color: #22c55e; }

.cv__typing { color: var(--color-text-muted); font-family: var(--font-mono); font-size: 16px; letter-spacing: 0.2em; animation: blink 1.4s infinite; }

/* 附件预览 */
.cv__attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 32px 0;
  background: var(--color-white);
}
.cv__att-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
}
.cv__att-img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}
.cv__att-doc {
  padding: 6px 12px;
  font-size: 13px;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
}
.cv__att-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border: none;
  background: var(--color-black);
  color: var(--color-white);
  font-size: 12px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 文件上传按钮 */
.cv__file-input { display: none; }
.cv__file-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg);
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s, background 0.3s;
}
.cv__file-btn:hover { border-color: var(--color-accent); background: var(--color-white); }

/* 输入区 */
.cv__input-area {
  display: flex; align-items: flex-end; gap: 12px; padding: 20px 32px 28px; border-top: 1px solid var(--color-border); background: var(--color-white);
}
.cv__input {
  flex: 1; padding: 14px 20px; font-size: 15px; font-family: var(--font-body); border: 1px solid var(--color-border); border-radius: 14px; background: var(--color-bg); color: var(--color-text); outline: none; resize: none; line-height: 1.5;
}
.cv__input:focus { border-color: var(--color-accent); }
.cv__send, .cv__stop {
  padding: 12px 28px; font-size: 14px; font-weight: 600; border: none; border-radius: 12px; cursor: pointer; flex-shrink: 0;
}
.cv__send { background: var(--color-accent); color: var(--color-black); }
.cv__send:disabled { opacity: 0.4; cursor: default; }
.cv__stop { background: var(--color-text-muted); color: var(--color-white); }

/* 弹窗 */
.cv__modal { position: fixed; inset: 0; z-index: 30000; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 24px; }
.cv__modal-card { background: var(--color-white); border-radius: 16px; padding: 32px; width: 100%; max-width: 420px; }
.cv__modal-card h3 { font-family: var(--font-title); font-size: 20px; color: var(--color-black); margin-bottom: 8px; }
.cv__modal-sub { font-size: 14px; color: var(--color-text-muted); margin-bottom: 20px; }
.cv__modal-field { margin-bottom: 16px; }
.cv__modal-field label { display: block; font-size: 13px; color: var(--color-text); margin-bottom: 6px; }
.cv__modal-input, .cv__modal-select { width: 100%; padding: 12px 16px; font-size: 14px; font-family: var(--font-body); border: 1px solid var(--color-border); border-radius: 8px; outline: none; background: var(--color-bg); color: var(--color-text); }
.cv__modal-input:focus, .cv__modal-select:focus { border-color: var(--color-accent); }
textarea.cv__modal-input { resize: vertical; min-height: 80px; }
.cv__modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.cv__modal-cancel { padding: 10px 24px; font-size: 14px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; cursor: pointer; }
.cv__modal-save { padding: 10px 28px; font-size: 14px; font-weight: 600; color: var(--color-black); background: var(--color-accent); border: none; border-radius: 8px; cursor: pointer; }

@keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

@media (max-width: 768px) {
  .cv__sidebar { display: none; }
  .cv__toolbar { padding: 10px 12px; }
  .cv__voice-mode-btn span { display: none; }
  .cv__input-area { padding: 12px; gap: 8px; }
  .cv__messages { padding: 16px; }
  .cv__welcome { padding: 32px 16px; }
  .cv__welcome-title { font-size: 28px; }
  .cv__msg { max-width: 100%; }
  .cv__send, .cv__stop { padding: 10px 20px; font-size: 13px; }
  .cv__input { font-size: 14px; padding: 12px 16px; }
  .cv__modal-card { margin: 16px; max-height: 85vh; overflow-y: auto; }
}
</style>
