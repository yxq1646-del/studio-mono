import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'

const PROVIDERS = {
  deepseek: { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', provider: 'openai' },
  anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-20250514', provider: 'anthropic' },
  openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com', model: 'gpt-4o', provider: 'openai' },
  custom: { name: '自定义', baseUrl: '', model: '', provider: 'openai' },
}

export const useChatStore = defineStore('chat', () => {
  const api = useApi()

  const conversations = ref([])
  const activeId = ref(null)
  const messages = ref([])
  const streaming = ref(false)
  const showApiKeyDialog = ref(false)
  const attachments = ref([])
  const selectedAgentId = ref(null)

  const apiKey = computed({
    get: () => localStorage.getItem('ai_api_key') || '',
    set: (v) => localStorage.setItem('ai_api_key', v || ''),
  })

  const selectedProvider = ref(localStorage.getItem('ai_provider') || 'deepseek')
  const customBaseUrl = ref(localStorage.getItem('ai_base_url') || '')
  const customModel = ref(localStorage.getItem('ai_model') || '')

  function getProviderConfig() {
    const p = PROVIDERS[selectedProvider.value] || PROVIDERS.custom
    return {
      provider: p.provider,
      baseUrl: selectedProvider.value === 'custom' ? customBaseUrl.value : p.baseUrl,
      model: selectedProvider.value === 'custom' ? customModel.value : p.model,
    }
  }

  function setProvider(provider, baseUrl, model) {
    selectedProvider.value = provider
    customBaseUrl.value = baseUrl || ''
    customModel.value = model || ''
    localStorage.setItem('ai_provider', provider)
    localStorage.setItem('ai_base_url', baseUrl || '')
    localStorage.setItem('ai_model', model || '')
  }

  const activeConversation = computed(() =>
    conversations.value.find(c => c.id === activeId.value) || null
  )

  async function loadConversations() {
    try {
      conversations.value = await api.get('/conversations')
    } catch { /* server may not be ready */ }
  }

  async function createConversation(title, agentId) {
    const conv = await api.post('/conversations', { title, agent_id: agentId || null })
    conversations.value.unshift(conv)
    switchTo(conv.id)
    return conv
  }

  async function deleteConversation(id) {
    await api.del(`/conversations/${id}`)
    conversations.value = conversations.value.filter(c => c.id !== id)
    if (activeId.value === id) {
      activeId.value = null
      messages.value = []
    }
  }

  async function switchTo(id) {
    activeId.value = id
    try {
      const msgs = await api.get(`/conversations/${id}/messages`)
      messages.value = msgs
    } catch {
      messages.value = []
    }
  }

  async function addAttachment(file) {
    // 如果是图片，本地转 base64
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const a = {
            type: 'image',
            filename: file.name,
            mimeType: file.type,
            base64: reader.result,
            text: `[图片: ${file.name}]`,
          }
          attachments.value.push(a)
          resolve(a)
        }
        reader.readAsDataURL(file)
      })
    }

    // 文档交给后端提取
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/files/extract', { method: 'POST', body: form })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || '解析失败')
    }
    const data = await res.json()
    attachments.value.push(data)
    return data
  }

  function removeAttachment(index) {
    attachments.value.splice(index, 1)
  }

  function clearAttachments() {
    attachments.value = []
  }

  async function sendMessage(content) {
    if (!activeId.value) {
      await createConversation(content.slice(0, 30), selectedAgentId.value)
    }
    if (!apiKey.value) {
      showApiKeyDialog.value = true
      return
    }

    const files = [...attachments.value]
    clearAttachments()

    let msgContent = content || '查看附件'
    const docTexts = files.filter(f => f.type === 'document').map(f => f.text)
    const imgNames = files.filter(f => f.type === 'image').map(f => f.text)

    if (docTexts.length > 0) {
      msgContent += '\n\n' + docTexts.join('\n\n---\n\n')
    }
    if (imgNames.length > 0) {
      msgContent += '\n\n' + imgNames.join('\n')
    }

    messages.value.push({ role: 'user', content: msgContent, attachments: files, id: Date.now() })
    try {
      await api.post(`/conversations/${activeId.value}/messages`, { role: 'user', content: msgContent })
    } catch { /* ignore */ }

    const assistantMsg = { role: 'assistant', content: '', id: Date.now() + 1 }
    messages.value.push(assistantMsg)
    streaming.value = true

    const context = []
    // 注入 agent system prompt
    if (selectedAgentId.value) {
      const { useAgentStore } = await import('@/projects/ai-assistant/stores/agents')
      const agent = useAgentStore().agents.find(a => a.id === selectedAgentId.value)
      if (agent?.system_prompt) {
        context.push({ role: 'system', content: agent.system_prompt })
      }
    }
    context.push(...messages.value.slice(0, -1).map(m => ({
      role: m.role, content: m.content
    })))

    // 智能体 provider 覆盖
    let provider, baseUrl, model
    if (selectedAgentId.value) {
      const { useAgentStore } = await import('@/projects/ai-assistant/stores/agents')
      const agent = useAgentStore().agents.find(a => a.id === selectedAgentId.value)
      if (agent) {
        model = agent.custom_model || PROVIDERS[agent.provider]?.model || 'deepseek-chat'
        baseUrl = agent.custom_base_url || PROVIDERS[agent.provider]?.baseUrl || 'https://api.deepseek.com'
        provider = PROVIDERS[agent.provider]?.provider || 'openai'
      }
    }
    if (!provider) {
      const cfg = getProviderConfig()
      provider = cfg.provider
      baseUrl = cfg.baseUrl
      model = cfg.model
    }

    api.stream('/chat',
      { messages: context, apiKey: apiKey.value, provider, baseUrl, model },
      (chunk) => {
        if (chunk.type === 'delta') {
          assistantMsg.content += chunk.text
        }
      },
      async () => {
        streaming.value = false
        try {
          await api.post(`/conversations/${activeId.value}/messages`, { role: 'assistant', content: assistantMsg.content })
        } catch { /* ignore */ }
      },
      (err) => {
        streaming.value = false
        assistantMsg.content += `\n\n*[错误: ${err.message}]*`
      }
    )
  }

  function stopStreaming() {
    streaming.value = false
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'assistant' && !last.content.trim()) {
      messages.value.pop()
    }
  }

  return {
    conversations, activeId, messages, streaming, showApiKeyDialog, attachments, selectedAgentId,
    apiKey, selectedProvider, customBaseUrl, customModel, activeConversation,
    PROVIDERS, getProviderConfig, setProvider,
    loadConversations, createConversation, deleteConversation, switchTo,
    sendMessage, stopStreaming, addAttachment, removeAttachment, clearAttachments
  }
})
