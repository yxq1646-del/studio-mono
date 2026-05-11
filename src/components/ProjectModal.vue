<template>
  <div ref="overlay" class="modal-overlay" @click.self="emit('close')">
    <div ref="modal" class="modal">
      <!-- 关闭按钮 -->
      <button ref="closeBtn" class="modal__close" data-cursor="circle" @click="emit('close')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- 色块头部 -->
      <div class="modal__hero" :style="{ background: project.color }"></div>

      <!-- 内容 -->
      <div class="modal__body">
        <span class="modal__category">{{ project.category }}</span>
        <h2 class="modal__title">{{ project.title }}</h2>
        <p class="modal__desc">{{ project.desc }}</p>

        <!-- 标签 -->
        <div class="modal__tags">
          <span v-for="tag in project.tags" :key="tag" class="modal__tag">{{ tag }}</span>
        </div>

        <!-- 进入项目 -->
        <button v-if="project.route" class="modal__launch" @click="emit('launch')">
          进入项目 →
        </button>

        <!-- 年份 -->
        <span class="modal__year">{{ project.year }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'

const props = defineProps({
  project: { type: Object, required: true },
})

const emit = defineEmits(['close', 'launch'])

const overlay = ref(null)
const modal = ref(null)
const closeBtn = ref(null)

onMounted(() => {
  // 弹性弹出动画
  const tl = gsap.timeline()

  tl.from(overlay.value, { opacity: 0, duration: 0.3 })
    .from(modal.value, {
      scale: 0.85,
      y: 40,
      opacity: 0,
      duration: 0.6,
      ease: 'back.out(1.4)',
    }, '-=0.15')

  // 内容元素
  tl.from('.modal__hero', { height: 0, duration: 0.6, ease: 'power3.inOut' }, '-=0.2')
    .from('.modal__category', { y: 16, opacity: 0, duration: 0.4 })
    .from('.modal__title', { y: 16, opacity: 0, duration: 0.4 }, '-=0.2')
    .from('.modal__desc', { y: 16, opacity: 0, duration: 0.4 }, '-=0.2')
    .from('.modal__tags span', { y: 10, opacity: 0, stagger: 0.06, duration: 0.3 }, '-=0.1')
    .from('.modal__year', { y: 10, opacity: 0, duration: 0.3 })

  // 关闭按钮入场
  gsap.from(closeBtn.value, { rotate: -90, opacity: 0, duration: 0.5, ease: 'back.out(1.4)', delay: 0.3 })
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 24px;
}

.modal {
  position: relative;
  width: 100%;
  max-width: 720px;
  background: var(--color-white);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.2);
}

.modal__close {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 50%;
  color: #fff;
  transition: background 0.3s;
}

.modal__close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.modal__hero {
  height: 200px;
}

.modal__body {
  padding: 40px;
}

.modal__category {
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.modal__title {
  font-family: var(--font-title);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 400;
  color: var(--color-black);
  margin: 12px 0 20px;
}

.modal__desc {
  font-size: 16px;
  color: var(--color-text-muted);
  line-height: 1.8;
}

.modal__tags {
  display: flex;
  gap: 10px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.modal__tag {
  padding: 6px 16px;
  background: var(--color-bg-alt);
  border-radius: 100px;
  font-size: 13px;
  color: var(--color-text);
}

.modal__launch {
  display: inline-block;
  margin-top: 24px;
  padding: 12px 32px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-black);
  background: var(--color-accent);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: opacity 0.3s;
}
.modal__launch:hover { opacity: 0.85; }

.modal__year {
  display: block;
  margin-top: 20px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .modal__body { padding: 28px 24px; }
  .modal__hero { height: 140px; }
}
</style>
