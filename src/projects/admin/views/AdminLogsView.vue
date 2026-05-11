<template>
  <div class="al">
    <h1 class="al__title">系统日志</h1>

    <div class="al__filters">
      <select v-model="actionFilter" class="al__select" @change="load(1)">
        <option value="">全部操作</option>
        <option v-for="a in actionTypes" :key="a" :value="a">{{ actionLabel(a) }}</option>
      </select>
      <input v-model="usernameFilter" class="al__input" placeholder="搜索用户..." @input="onSearch" />
      <input v-model="dateFrom" type="date" class="al__date" @change="load(1)" />
      <span class="al__date-sep">至</span>
      <input v-model="dateTo" type="date" class="al__date" @change="load(1)" />
    </div>

    <div v-if="loading" class="al__loading">加载中...</div>

    <table v-else class="al__table">
      <thead>
        <tr>
          <th>时间</th>
          <th>用户</th>
          <th>操作</th>
          <th>详情</th>
          <th>IP</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in logs" :key="log.id">
          <td class="al__time">{{ formatTime(log.created_at) }}</td>
          <td>{{ log.username || '-' }}</td>
          <td><span class="al__action" :class="'al__action--' + actionClass(log.action)">{{ actionLabel(log.action) }}</span></td>
          <td class="al__detail">{{ log.detail }}</td>
          <td class="al__ip">{{ log.ip || '-' }}</td>
        </tr>
        <tr v-if="logs.length === 0">
          <td colspan="5" class="al__empty">暂无日志</td>
        </tr>
      </tbody>
    </table>

    <div class="al__pager" v-if="total > 20">
      <button :disabled="page <= 1" @click="load(page - 1)">上一页</button>
      <span>{{ page }} / {{ Math.ceil(total / 20) }}</span>
      <button :disabled="page >= Math.ceil(total / 20)" @click="load(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

const logs = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const actionTypes = ref([])

const actionFilter = ref('')
const usernameFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(1), 300)
}

async function load(p = 1) {
  loading.value = true
  try {
    const q = new URLSearchParams({
      page: p,
      pageSize: 20,
      action: actionFilter.value,
      username: usernameFilter.value,
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
    })
    const data = await api.get(`/logs?${q}`)
    logs.value = data.list
    total.value = data.total
    page.value = data.page
    if (actionTypes.value.length === 0 && data.actionTypes) {
      actionTypes.value = data.actionTypes
    }
  } finally {
    loading.value = false
  }
}

function actionLabel(a) {
  const map = {
    login: '登录',
    login_failed: '登录失败',
    adoption_approved: '通过领养',
    adoption_rejected: '拒绝领养',
    adoption_updated: '更新领养',
    pet_delete: '下架宠物',
    user_create: '创建用户',
    user_delete: '删除用户',
  }
  return map[a] || a
}

function actionClass(a) {
  if (a.includes('failed') || a.includes('rejected') || a.includes('delete')) return 'danger'
  if (a.includes('login') && !a.includes('failed')) return 'info'
  if (a.includes('approved')) return 'success'
  return ''
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  if (isNaN(d.getTime())) return t
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(() => load())
</script>

<style scoped>
.al {
  padding: 32px;
  --color-bg: #fafafa;
  --color-white: #fff;
  --color-black: #111;
  --color-text: #333;
  --color-text-muted: #888;
  --color-accent: #10b981;
  --color-border: #e5e5e5;
  --color-danger: #ef4444;
  --color-info: #3b82f6;
  --color-success: #10b981;
}
.al__title { font-family: var(--font-title); font-size: 28px; color: var(--color-black); margin-bottom: 28px; }
.al__filters { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
.al__select, .al__input, .al__date {
  padding: 8px 14px;
  font-size: 13px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-white);
  color: var(--color-text);
  outline: none;
}
.al__select { min-width: 140px; }
.al__input { min-width: 160px; }
.al__date-sep { font-size: 13px; color: var(--color-text-muted); }
.al__loading, .al__empty { text-align: center; padding: 48px; color: var(--color-text-muted); }

.al__table { width: 100%; border-collapse: collapse; font-size: 13px; }
.al__table th { text-align: left; padding: 12px 16px; border-bottom: 2px solid var(--color-border); color: var(--color-text-muted); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
.al__table td { padding: 12px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text); }
.al__time { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; }
.al__detail { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.al__ip { font-size: 12px; color: var(--color-text-muted); font-family: var(--font-mono); }

.al__action { display: inline-block; padding: 2px 10px; font-size: 12px; border-radius: 100px; background: var(--color-bg); }
.al__action--danger { background: rgba(239,68,68,0.08); color: var(--color-danger); }
.al__action--info { background: rgba(59,130,246,0.08); color: var(--color-info); }
.al__action--success { background: rgba(16,185,129,0.08); color: var(--color-success); }

.al__pager { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; font-size: 14px; }
.al__pager button { padding: 8px 20px; font-size: 13px; background: var(--color-white); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; }

@media (max-width: 768px) {
  .al { padding: 16px; }
  .al__title { font-size: 22px; }
  .al__filters { flex-direction: column; }
  .al__select, .al__input { width: 100%; min-width: 0; }
  .al__table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
</style>
