<template>
  <div class="admin-layout" :class="{ 'admin-layout--open': sidebarOpen }">
    <aside class="admin-layout__sidebar">
      <AdminSidebar @nav="sidebarOpen = false" />
    </aside>
    <!-- 移动端遮罩 -->
    <div class="admin-layout__overlay" @click="sidebarOpen = false" />
    <!-- 移动端汉堡按钮 -->
    <button class="admin-layout__burger" @click="sidebarOpen = !sidebarOpen">
      <span />
      <span />
      <span />
    </button>
    <div class="admin-layout__main">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AdminSidebar from '@/projects/admin/components/AdminSidebar.vue'

const sidebarOpen = ref(false)
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}
.admin-layout__sidebar {
  width: 240px;
  flex-shrink: 0;
  z-index: 1000;
}
.admin-layout__overlay {
  display: none;
}
.admin-layout__burger {
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 2000;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-white);
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
}
.admin-layout__burger span {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--color-text);
  border-radius: 1px;
  transition: all 0.3s;
}
.admin-layout--open .admin-layout__burger span:nth-child(1) {
  transform: rotate(45deg) translate(4px, 4px);
}
.admin-layout--open .admin-layout__burger span:nth-child(2) {
  opacity: 0;
}
.admin-layout--open .admin-layout__burger span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}
.admin-layout__main {
  flex: 1;
  min-width: 0;
  padding: 32px;
}

@media (max-width: 768px) {
  .admin-layout__sidebar {
    position: fixed;
    left: -260px;
    top: 0;
    bottom: 0;
    transition: left 0.3s ease;
  }
  .admin-layout--open .admin-layout__sidebar {
    left: 0;
  }
  .admin-layout--open .admin-layout__overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 999;
  }
  .admin-layout__burger {
    display: flex;
  }
  .admin-layout__main {
    padding: 60px 16px 24px;
  }
}
</style>
