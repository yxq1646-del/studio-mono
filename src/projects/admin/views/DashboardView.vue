<template>
  <div class="dv">
    <div class="dv__head">
      <h1 class="dv__title">仪表盘</h1>
      <p class="dv__sub">欢迎回来，{{ auth.user?.display_name }}</p>
    </div>

    <div v-if="stats" class="dv__grid">
      <StatCard label="活跃用户" :value="stats.users.total" />
      <StatCard label="管理员" :value="stats.users.admin" />
      <StatCard label="宠物总数" :value="stats.pets.total" />
      <StatCard label="可领养" :value="stats.pets.available" />
      <StatCard label="待审核领养" :value="stats.adoptions.pending" />
      <StatCard label="对话数" :value="stats.conversations.total" />
    </div>
    <p v-else class="dv__loading">加载中...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/projects/admin/stores/admin'
import StatCard from '@/projects/admin/components/StatCard.vue'

const auth = useAuthStore()
const admin = useAdminStore()
const { stats } = storeToRefs(admin)

onMounted(() => {
  admin.fetchStats()
})
</script>

<style scoped>
.dv { max-width: 960px; }
.dv__head { margin-bottom: 40px; }
.dv__title {
  font-family: var(--font-title);
  font-size: 32px;
  color: var(--color-black);
}
.dv__sub {
  font-size: 15px;
  color: var(--color-text-muted);
  margin-top: 8px;
}
.dv__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}
.dv__loading { color: var(--color-text-muted); font-size: 15px; }

@media (max-width: 768px) {
  .dv__head { margin-bottom: 28px; }
  .dv__title { font-size: 24px; }
  .dv__grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
