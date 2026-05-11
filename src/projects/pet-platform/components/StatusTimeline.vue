<template>
  <div class="st" v-if="logs.length > 0">
    <h3 class="st__title">状态时间线</h3>
    <div class="st__list">
      <div
        v-for="(log, i) in logs"
        :key="log.id"
        class="st__item"
        :class="{ 'st__item--first': i === 0, 'st__item--last': i === logs.length - 1 }"
      >
        <div class="st__dot" :class="`st__dot--${log.to_status}`" />
        <div class="st__content">
          <div class="st__status-row">
            <span class="st__badge" :class="`st__badge--${log.to_status}`">
              {{ statusMap[log.to_status] || log.to_status }}
            </span>
            <span v-if="log.from_status" class="st__arrow">← {{ statusMap[log.from_status] || log.from_status }}</span>
            <span v-else class="st__arrow">← 新建</span>
          </div>
          <p v-if="log.remark" class="st__remark">{{ log.remark }}</p>
          <span class="st__time">{{ formatTime(log.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ logs: { type: Array, default: () => [] } })

const statusMap = {
  available: '待领养',
  pending: '申请中',
  adopted: '已领养',
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  if (isNaN(d.getTime())) return t
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<style scoped>
.st {
  margin-top: 48px;
  --color-bg: #fef9f2;
  --color-bg-alt: #f5ece0;
  --color-text: #3d3529;
  --color-text-muted: #8b7e6b;
  --color-accent: #f59e0b;
  --color-white: #ffffff;
  --color-black: #2d2416;
  --color-border: #e8dccf;
  --color-green: #10b981;
  --color-blue: #3b82f6;
  --color-red: #ef4444;
}
.st__title {
  font-family: 'Georgia', 'Noto Serif SC', serif;
  font-size: 20px;
  color: var(--color-black);
  margin-bottom: 24px;
}
.st__list {
  position: relative;
  padding-left: 28px;
}
.st__item {
  position: relative;
  padding-bottom: 24px;
}
.st__item:last-child { padding-bottom: 0; }
.st__item::before {
  content: '';
  position: absolute;
  left: -22px;
  top: 12px;
  width: 2px;
  height: calc(100% + 0px);
  background: var(--color-border);
}
.st__item--last::before { display: none; }

.st__dot {
  position: absolute;
  left: -28px;
  top: 6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-white);
  z-index: 1;
}
.st__dot--available { border-color: var(--color-accent); background: var(--color-accent); }
.st__dot--pending { border-color: var(--color-blue); background: var(--color-blue); }
.st__dot--adopted { border-color: var(--color-green); background: var(--color-green); }

.st__content { padding-left: 8px; }
.st__status-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.st__badge {
  display: inline-block;
  padding: 2px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 100px;
}
.st__badge--available { background: rgba(245, 158, 11, 0.12); color: #b45309; }
.st__badge--pending { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
.st__badge--adopted { background: rgba(16, 185, 129, 0.12); color: #059669; }

.st__arrow { font-size: 12px; color: var(--color-text-muted); }
.st__remark { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.st__time { font-size: 12px; color: var(--color-text-muted); }
</style>
