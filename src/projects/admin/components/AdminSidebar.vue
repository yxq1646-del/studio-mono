<template>
  <nav class="as" @click="onNavClick">
    <div class="as__brand">
      <span class="as__logo">Y</span>
      <span class="as__name">后台管理</span>
    </div>
    <div class="as__nav">
      <router-link to="/admin/dashboard" class="as__link" active-class="as__link--active">
        <span class="as__icon">📊</span> 仪表盘
      </router-link>
      <router-link to="/admin/users" class="as__link" active-class="as__link--active" v-if="auth.user?.role === 'admin'">
        <span class="as__icon">👥</span> 用户管理
      </router-link>
      <router-link to="/admin/pets" class="as__link" active-class="as__link--active">
        <span class="as__icon">🐾</span> 宠物管理
      </router-link>
      <router-link to="/admin/adoptions" class="as__link" active-class="as__link--active">
        <span class="as__icon">📋</span> 领养审核
      </router-link>
      <router-link to="/admin/agents" class="as__link" active-class="as__link--active">
        <span class="as__icon">🤖</span> 智能体管理
      </router-link>
      <router-link to="/admin/logs" class="as__link" active-class="as__link--active" v-if="auth.user?.role === 'admin'">
        <span class="as__icon">📜</span> 系统日志
      </router-link>
    </div>
    <div class="as__footer">
      <span class="as__user">{{ auth.user?.display_name }}</span>
      <button class="as__logout" @click="handleLogout">退出</button>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['nav'])

const router = useRouter()
const auth = useAuthStore()

function onNavClick(e) {
  if (e.target.closest('.as__link')) {
    emit('nav')
  }
}

function handleLogout() {
  auth.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.as {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-white);
  border-right: 1px solid var(--color-border);
  padding: 24px 20px;
}
.as__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
}
.as__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  background: var(--color-black);
  color: var(--color-accent);
  font-family: var(--font-title);
  font-size: 18px; font-weight: 700;
  border-radius: 8px;
}
.as__name {
  font-family: var(--font-title);
  font-size: 18px;
  color: var(--color-black);
}
.as__nav { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.as__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text-muted);
  border-radius: 8px;
  transition: background 0.3s, color 0.3s;
}
.as__link:hover { background: var(--color-bg); color: var(--color-text); }
.as__link--active { background: var(--color-black); color: var(--color-accent); }
.as__icon { font-size: 18px; }
.as__footer {
  border-top: 1px solid var(--color-border);
  padding-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.as__user { font-size: 13px; color: var(--color-text); }
.as__logout {
  padding: 6px 14px;
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}
.as__logout:hover { background: var(--color-border); }
</style>
