<template>
  <div class="aav">
    <h1 class="aav__title">领养审核</h1>

    <div class="aav__filters">
      <select v-model="statusFilter" class="aav__select" @change="load">
        <option value="">全部状态</option>
        <option value="pending">待审核</option>
        <option value="approved">已通过</option>
        <option value="rejected">已拒绝</option>
      </select>
    </div>

    <table v-if="list.length" class="aav__table">
      <thead>
        <tr>
          <th>宠物</th><th>申请人</th><th>电话</th><th>邮箱</th>
          <th>住房</th><th>经验</th><th>理由</th><th>状态</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in list" :key="a.id">
          <td>{{ a.pet_name }}</td>
          <td>{{ a.applicant_name }}</td>
          <td>{{ a.applicant_phone }}</td>
          <td>{{ a.applicant_email || '-' }}</td>
          <td>{{ housingMap[a.housing_type] || '-' }}</td>
          <td>{{ a.has_experience ? '有' : '无' }}</td>
          <td class="aav__reason">{{ a.reason?.slice(0, 40) || '-' }}{{ a.reason?.length > 40 ? '...' : '' }}</td>
          <td><span :class="'aav__status--' + a.status">{{ statusMap[a.status] }}</span></td>
          <td v-if="a.status === 'pending'">
            <button class="aav__action aav__action--ok" @click="review(a.id, 'approved')">通过</button>
            <button class="aav__action aav__action--no" @click="review(a.id, 'rejected')">拒绝</button>
          </td>
          <td v-else>-</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="aav__empty">暂无数据</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()
const list = ref([])
const statusFilter = ref('pending')
const statusMap = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
const housingMap = { apartment: '公寓', house: '独栋', shared: '合租' }

async function load() {
  const data = await api.get(`/adoptions?status=${statusFilter.value}`)
  list.value = data.list
}

async function review(id, status) {
  await api.put(`/adoptions/${id}`, { status })
  load()
}

onMounted(load)
</script>

<style scoped>
.aav { max-width: 1100px; }
.aav__title { font-family: var(--font-title); font-size: 28px; color: var(--color-black); margin-bottom: 24px; }
.aav__filters { margin-bottom: 24px; }
.aav__select { padding: 10px 16px; font-size: 14px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-white); outline: none; }
.aav__table { width: 100%; border-collapse: collapse; background: var(--color-white); border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border); }
.aav__table th, .aav__table td { padding: 12px 14px; font-size: 13px; text-align: left; }
.aav__table th { background: var(--color-bg-alt); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-size: 12px; white-space: nowrap; }
.aav__table td { border-top: 1px solid var(--color-border); }
.aav__reason { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aav__status--pending { color: #f0a040; font-weight: 500; }
.aav__status--approved { color: #4a9e4a; }
.aav__status--rejected { color: #cc0000; }
.aav__action { padding: 4px 12px; font-size: 12px; border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; margin-right: 6px; }
.aav__action--ok { background: rgba(74,158,74,0.1); color: #4a9e4a; border-color: rgba(74,158,74,0.3); }
.aav__action--no { background: rgba(204,0,0,0.06); color: #cc0000; border-color: rgba(204,0,0,0.2); }
.aav__empty { text-align: center; padding: 48px; color: var(--color-text-muted); }

@media (max-width: 768px) {
  .aav__title { font-size: 22px; }
  .aav__table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
</style>
