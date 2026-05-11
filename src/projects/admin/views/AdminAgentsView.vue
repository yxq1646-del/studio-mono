<template>
  <div class="aav">
    <div class="aav__head">
      <h1 class="aav__title">智能体管理</h1>
      <button class="aav__btn" @click="openForm()">+ 新增智能体</button>
    </div>

    <table v-if="agents.length" class="aav__table">
      <thead>
        <tr>
          <th>ID</th><th>名称</th><th>描述</th><th>服务商</th><th>系统提示词</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in agents" :key="a.id">
          <td>{{ a.id }}</td>
          <td>{{ a.name }}</td>
          <td>{{ a.description || '-' }}</td>
          <td><span class="aav__provider">{{ providerMap[a.provider] || a.provider }}</span></td>
          <td class="aav__prompt-cell">{{ a.system_prompt?.slice(0, 60) || '-' }}{{ a.system_prompt?.length > 60 ? '...' : '' }}</td>
          <td>
            <button class="aav__action" @click="openForm(a)">编辑</button>
            <button class="aav__action aav__action--del" @click="handleDelete(a)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="aav__empty">暂无智能体，点击上方按钮创建</p>

    <Teleport to="body">
      <div v-if="showForm" class="aav__modal" @click.self="showForm = false">
        <div class="aav__modal-card">
          <h2>{{ editing ? '编辑' : '新增' }}智能体</h2>
          <form @submit.prevent="handleSubmit">
            <div class="aav__field"><label>名称*</label><input v-model="form.name" required /></div>
            <div class="aav__field"><label>描述</label><input v-model="form.description" placeholder="一句话描述智能体的用途" /></div>
            <div class="aav__field"><label>系统提示词*</label><textarea v-model="form.system_prompt" rows="4" required placeholder="定义智能体的角色和行为"></textarea></div>
            <div class="aav__field"><label>服务商</label>
              <select v-model="form.provider">
                <option value="deepseek">DeepSeek</option>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div class="aav__field" v-if="form.provider === 'custom'"><label>自定义 API 地址</label><input v-model="form.custom_base_url" placeholder="https://api.example.com" /></div>
            <div class="aav__field" v-if="form.provider === 'custom'"><label>自定义模型名称</label><input v-model="form.custom_model" placeholder="如 gpt-4o、claude-opus-4-7" /></div>
            <div class="aav__actions">
              <button type="button" class="aav__cancel" @click="showForm = false">取消</button>
              <button type="submit" class="aav__btn">{{ editing ? '更新' : '创建' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()
const agents = ref([])
const showForm = ref(false)
const editing = ref(false)
const providerMap = { deepseek: 'DeepSeek', anthropic: 'Anthropic', openai: 'OpenAI', custom: '自定义' }

const form = reactive({ name: '', description: '', system_prompt: '', provider: 'deepseek', custom_base_url: '', custom_model: '' })

async function load() {
  agents.value = await api.get('/agents')
}

function openForm(agent) {
  editing.value = !!agent
  if (agent) Object.assign(form, agent)
  else Object.assign(form, { name: '', description: '', system_prompt: '', provider: 'deepseek', custom_base_url: '', custom_model: '' })
  showForm.value = true
}

async function handleSubmit() {
  if (editing.value) {
    await api.put(`/agents/${form.id}`, form)
  } else {
    await api.post('/agents', form)
  }
  showForm.value = false
  load()
}

async function handleDelete(agent) {
  if (confirm(`确定删除智能体「${agent.name}」吗？关联对话不会删除。`)) {
    await api.del(`/agents/${agent.id}`)
    load()
  }
}

onMounted(load)
</script>

<style scoped>
.aav { max-width: 960px; }
.aav__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.aav__title { font-family: var(--font-title); font-size: 28px; color: var(--color-black); }
.aav__btn { padding: 10px 24px; font-size: 14px; color: var(--color-black); background: var(--color-accent); border: none; border-radius: 8px; cursor: pointer; }
.aav__table { width: 100%; border-collapse: collapse; background: var(--color-white); border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border); }
.aav__table th, .aav__table td { padding: 12px 14px; font-size: 13px; text-align: left; }
.aav__table th { background: var(--color-bg-alt); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-size: 12px; }
.aav__table td { border-top: 1px solid var(--color-border); }
.aav__provider { font-weight: 500; color: var(--color-accent); }
.aav__prompt-cell { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-muted); font-size: 12px; font-family: var(--font-mono); }
.aav__action { padding: 4px 12px; font-size: 12px; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; margin-right: 6px; }
.aav__action--del { color: #cc0000; }
.aav__empty { text-align: center; padding: 48px; color: var(--color-text-muted); }
.aav__modal { position: fixed; inset: 0; z-index: 20000; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
.aav__modal-card { background: var(--color-white); border-radius: 16px; padding: 32px; width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; }
.aav__modal-card h2 { font-family: var(--font-title); font-size: 22px; margin-bottom: 24px; }
.aav__field { margin-bottom: 16px; }
.aav__field label { display: block; font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; }
.aav__field input, .aav__field select, .aav__field textarea { width: 100%; padding: 10px 14px; font-size: 14px; border: 1px solid var(--color-border); border-radius: 8px; outline: none; background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); }
.aav__field input:focus, .aav__field select:focus, .aav__field textarea:focus { border-color: var(--color-accent); }
.aav__actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.aav__cancel { padding: 10px 24px; font-size: 14px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; cursor: pointer; }

@media (max-width: 768px) {
  .aav__head { flex-direction: column; align-items: flex-start; gap: 12px; }
  .aav__title { font-size: 22px; }
  .aav__table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .aav__modal-card { padding: 24px; max-width: 90vw; }
}
</style>
