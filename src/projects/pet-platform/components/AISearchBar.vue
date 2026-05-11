<template>
  <div class="ais">
    <div class="ais__input-wrap">
      <span class="ais__icon">🤖</span>
      <input
        v-model="query"
        class="ais__input"
        placeholder="AI 智能搜索：如「适合公寓的小型犬」「北京地区的猫咪」..."
        @keydown.enter="search"
      />
      <button class="ais__agent-btn" @click="showAgents = !showAgents" title="选择智能体">
        {{ selectedAgentName || '智能体' }}
      </button>
      <button class="ais__btn" @click="search" :disabled="loading || !query.trim()">
        {{ loading ? '思考中...' : '搜索' }}
      </button>
    </div>
    <div v-if="showAgents" class="ais__agent-drop">
      <div
        v-for="a in agents"
        :key="a.id"
        class="ais__agent-item"
        :class="{ 'ais__agent-item--active': a.id === selectedAgent?.id }"
        @click="pickAgent(a)"
      >
        <span class="ais__agent-name">{{ a.name }}</span>
        <span class="ais__agent-desc">{{ a.description || a.system_prompt?.slice(0, 40) }}</span>
      </div>
      <p v-if="!agents.length" class="ais__agent-empty">暂无智能体</p>
    </div>
    <p v-if="result" class="ais__result" :class="{ 'ais__result--error': isError }">{{ result }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAgentStore } from '@/projects/ai-assistant/stores/agents'
import { useChatStore } from '@/projects/ai-assistant/stores/chat'

const emit = defineEmits(['filter'])
const agentStore = useAgentStore()
const chatStore = useChatStore()
const query = ref('')
const loading = ref(false)
const result = ref('')
const isError = ref(false)
const showAgents = ref(false)
const selectedAgent = ref(null)

const selectedAgentName = computed(() => selectedAgent.value?.name || '')

const agents = computed(() => agentStore.agents)

function pickAgent(agent) {
  selectedAgent.value = agent
  showAgents.value = false
}

const PROVIDERS = {
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', provider: 'openai' },
  anthropic: { baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-20250514', provider: 'anthropic' },
  openai: { baseUrl: 'https://api.openai.com', model: 'gpt-4o', provider: 'openai' },
  custom: { baseUrl: '', model: '', provider: 'openai' },
}

async function search() {
  const q = query.value.trim()
  if (!q) return
  loading.value = true
  result.value = ''
  isError.value = false

  try {
    let apiKey, provider, baseUrl, model

    if (selectedAgent.value) {
      const a = selectedAgent.value
      const p = PROVIDERS[a.provider] || PROVIDERS.custom
      provider = p.provider
      baseUrl = a.custom_base_url || p.baseUrl
      model = a.custom_model || p.model
    } else {
      const cfg = chatStore.getProviderConfig()
      provider = cfg.provider
      baseUrl = cfg.baseUrl
      model = cfg.model
    }
    apiKey = chatStore.apiKey

    if (!apiKey) {
      alert('请先在 AI 聊天页面设置 API Key')
      loading.value = false
      return
    }

    const res = await fetch('/api/pets?status=available&pageSize=50')
    const data = await res.json()
    const petList = data.list.map(p =>
      `ID:${p.id} | ${p.name} | ${p.species} | ${p.breed || ''} | 年龄:${p.age_group || ''} | 体型:${p.size_group || ''} | 城市:${p.location_city || ''} | ${p.description?.slice(0, 60) || ''}`
    ).join('\n')

    let systemPrompt = ''
    if (selectedAgent.value?.system_prompt) {
      systemPrompt = selectedAgent.value.system_prompt + '\n\n'
    }

    const prompt = `${systemPrompt}以下是一个宠物领养平台的宠物列表。用户说：「${q}」\n请从列表中找出最匹配的 3-5 只宠物，只需回复它们的 ID（逗号分隔），不要其他内容。\n\n${petList}`

    const response = await fetch('/api/chat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey, provider, baseUrl, model })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || '请求失败')
    }

    const json = await response.json()
    const text = json.text || ''
    const ids = text.match(/\d+/g)?.map(Number) || []
    result.value = `AI 推荐了 ${ids.length} 只宠物`
    emit('filter', { ids })
  } catch (err) {
    isError.value = true
    result.value = `搜索失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  agentStore.loadAgents()
})
</script>

<style scoped>
.ais { margin-bottom: 24px; position: relative; }
.ais__input-wrap { display: flex; gap: 10px; align-items: center; }
.ais__icon { font-size: 20px; flex-shrink: 0; }
.ais__input {
  flex: 1;
  padding: 14px 20px;
  font-size: 15px;
  border: 2px solid var(--color-border);
  border-radius: 100px;
  background: var(--color-white);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.3s;
}
.ais__input:focus { border-color: var(--color-accent); }
.ais__agent-btn {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.3s;
}
.ais__agent-btn:hover { border-color: var(--color-accent); }
.ais__agent-drop {
  position: absolute;
  left: 30px;
  top: 52px;
  z-index: 1000;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 280px;
  max-height: 220px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.ais__agent-item {
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.2s;
}
.ais__agent-item:last-child { border-bottom: none; }
.ais__agent-item:hover { background: var(--color-bg); }
.ais__agent-item--active { background: var(--color-bg); }
.ais__agent-name { display: block; font-size: 13px; color: var(--color-text); font-weight: 500; }
.ais__agent-desc { display: block; font-size: 11px; color: var(--color-text-muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ais__agent-empty { padding: 16px; text-align: center; font-size: 13px; color: var(--color-text-muted); }
.ais__btn {
  padding: 14px 28px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-black);
  background: var(--color-accent);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.3s;
}
.ais__btn:hover { opacity: 0.85; }
.ais__btn:disabled { opacity: 0.5; }
.ais__result { margin-top: 10px; font-size: 14px; color: var(--color-text-muted); padding-left: 36px; }
.ais__result--error { color: #ef4444; }
</style>
