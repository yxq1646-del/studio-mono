<template>
  <section id="services" class="services section-padding">
    <div class="section-wrapper">
      <!-- 标题 -->
      <div ref="header" class="services__header">
        <span class="services__label">我的能力</span>
        <h2 class="services__heading">专注三件事，<br />做到极致</h2>
      </div>

      <!-- 分割线 -->
      <hr ref="divider" class="services__divider" />

      <!-- 服务列表 -->
      <div ref="list" class="services__list">
        <article
          v-for="(service, i) in services"
          :key="i"
          :ref="el => cardRefs[i] = el"
          class="service-card"
          @mouseenter="hoverColumn(i)"
          @mouseleave="unhoverColumns()"
        >
          <!-- SVG 图标 -->
          <div class="service-card__icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path :d="service.iconPath" stroke="var(--color-black)" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"
                :ref="el => iconRefs[i] = el" />
            </svg>
          </div>

          <h3 class="service-card__title">{{ service.title }}</h3>
          <p class="service-card__desc">{{ service.desc }}</p>

          <ul class="service-card__points">
            <li v-for="point in service.points" :key="point">{{ point }}</li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// DrawSVG 是 GSAP 的付费插件，这里使用 polyfill 方式：手动计算路径长度

gsap.registerPlugin(ScrollTrigger)

const header = ref(null)
const divider = ref(null)
const list = ref(null)
const cardRefs = ref({})
const iconRefs = ref({})

const services = [
  {
    title: '前端架构',
    desc: '用现代技术栈构建高性能、可维护的 Web 应用。',
    points: ['Vue 3 / React 组件开发', 'TypeScript 类型系统设计', '前端工程化与构建优化', '响应式与无障碍设计'],
    iconPath: 'M8 12L16 4L40 28L32 36L8 12Z M16 4L20 8 M40 28L36 32 M8 12L12 8 M12 8L8 12',
  },
  {
    title: '全栈开发',
    desc: '从数据库到 UI，端到端交付完整产品。',
    points: ['Node.js / Python 后端', 'REST / GraphQL API', '数据库设计与优化', '云部署与运维'],
    iconPath: 'M24 4L6 12V36L24 44L42 36V12L24 4Z M24 24V44 M6 12L24 24L42 12',
  },
  {
    title: '后端与数据',
    desc: '构建稳健的 API 服务和数据层架构。',
    points: ['Express / Node.js 后端', 'SQLite / PostgreSQL 数据库', 'JWT 认证与 RBAC 权限', 'RESTful API 设计与实现'],
    iconPath: 'M24 4C14 4 4 14 4 24s10 20 20 20 20-10 20-20S34 4 24 4z M8 24c0-8.8 7.2-16 16-16 M32 8c5.3 5.3 8 12 8 16 M8 24c0-8.8 7.2-16 16-16 M40 24c0 8.8-7.2 16-16 16',
  },
]

onMounted(() => {
  // 标题
  gsap.from(header.value, {
    scrollTrigger: { trigger: header.value, start: 'top 85%', once: true },
    y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
  })

  // 分割线展开
  gsap.from(divider.value, {
    scrollTrigger: { trigger: divider.value, start: 'top 90%', once: true },
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 1.2,
    ease: 'power3.inOut',
  })

  // SVG 描边动效（polyfill：手动设置 strokeDasharray + strokeDashoffset）
  Object.entries(iconRefs.value).forEach(([i, el]) => {
    if (!el) return
    const len = el.getTotalLength()
    el.style.strokeDasharray = len
    el.style.strokeDashoffset = len

    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(el, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' })
      },
    })
  })

  // 卡片入场
  gsap.from('.service-card', {
    scrollTrigger: { trigger: list.value, start: 'top 85%', once: true },
    y: 50, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out',
  })
})

/** 列悬浮联动：当前列高亮，其余淡出 */
function hoverColumn(index) {
  const cards = document.querySelectorAll('.service-card')
  cards.forEach((card, i) => {
    if (i === index) {
      gsap.to(card, { opacity: 1, y: -6, duration: 0.4, ease: 'power2.out' })
      gsap.to(card.querySelector('.service-card__title'), { color: 'var(--color-accent)', duration: 0.4 })
    } else {
      gsap.to(card, { opacity: 0.35, duration: 0.4, ease: 'power2.out' })
    }
  })
}

function unhoverColumns() {
  const cards = document.querySelectorAll('.service-card')
  cards.forEach((card) => {
    gsap.to(card, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
    gsap.to(card.querySelector('.service-card__title'), { color: 'var(--color-black)', duration: 0.4 })
  })
}
</script>

<style scoped>
.services {
  background: var(--color-white);
}

.services__header {
  margin-bottom: 40px;
}

.services__label {
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.services__heading {
  font-family: var(--font-title);
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 400;
  color: var(--color-black);
  margin-top: 12px;
  line-height: 1.1;
}

/* 分割线 */
.services__divider {
  border: none;
  height: 2px;
  background: var(--color-black);
  margin-bottom: 72px;
  transform-origin: left center;
}

/* ===== 三列服务 ===== */
.services__list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 60px;
}

.service-card {
  transition: opacity 0.4s;
  will-change: transform;
}

.service-card__icon {
  margin-bottom: 24px;
}

.service-card__title {
  font-family: var(--font-title);
  font-size: 24px;
  font-weight: 400;
  color: var(--color-black);
  margin-bottom: 12px;
  transition: color 0.4s;
}

.service-card__desc {
  font-size: 15px;
  color: var(--color-text-muted);
  line-height: 1.7;
  margin-bottom: 24px;
}

.service-card__points {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-card__points li {
  font-size: 14px;
  color: var(--color-text-muted);
  padding-left: 16px;
  position: relative;
}

.service-card__points li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  width: 6px;
  height: 1px;
  background: var(--color-text-muted);
}

@media (max-width: 768px) {
  .services__list {
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .services__divider { margin-bottom: 48px; }
}
</style>
