<template>
  <section id="work" class="work section-padding">
    <div class="section-wrapper">
      <div ref="header" class="work__header">
        <span class="work__label">Projects</span>
        <h2 class="work__heading">个人项目</h2>
      </div>

      <div class="work__list">
        <article
          v-for="(project, i) in projects"
          :key="i"
          :ref="el => cardRefs[i] = el"
          class="work-card"
          data-cursor="view"
          @mousemove="(e) => onCardHover(e, i)"
          @mouseleave="onCardLeave(i)"
          @click="openProject(i)"
        >
          <div
            :ref="el => previewRefs[i] = el"
            class="work-card__preview"
            :style="{ background: project.color }"
          >
            <span class="work-card__preview-label">VIEW</span>
          </div>

          <div class="work-card__inner">
            <span class="work-card__index">{{ String(i + 1).padStart(2, '0') }}</span>
            <div class="work-card__info">
              <h3 class="work-card__title">{{ project.title }}</h3>
              <span class="work-card__cat">{{ project.category }}</span>
            </div>
            <span class="work-card__year">{{ project.year }}</span>
          </div>
        </article>
      </div>
    </div>

    <ProjectModal
      v-if="activeProject !== null"
      :project="projects[activeProject]"
      @close="closeProject"
      @launch="goToProject"
    />
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ProjectModal from './ProjectModal.vue'

gsap.registerPlugin(ScrollTrigger)

const router = useRouter()

const header = ref(null)
const cardRefs = ref({})
const previewRefs = ref({})
const activeProject = ref(null)

const projects = [
  {
    title: 'AI 智能助手',
    category: 'AI · 智能对话 · 实时语音',
    year: '2025',
    color: '#4a9eff',
    desc: '基于大语言模型的智能对话应用，支持多轮对话、上下文记忆、流式输出、Markdown 渲染、实时语音对话和自定义智能体。',
    tags: ['Vue 3', 'LLM API', 'SSE 流式', '实时语音', '智能体'],
    route: '/chat',
  },
]

onMounted(() => {
  gsap.from(header.value, {
    scrollTrigger: { trigger: header.value, start: 'top 85%', once: true },
    y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
  })

  gsap.from('.work-card', {
    scrollTrigger: { trigger: '.work__list', start: 'top 82%', once: true },
    y: 60, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
  })
})

function onCardHover(e, i) {
  const preview = previewRefs.value[i]
  if (!preview) return

  const x = e.clientX + 20
  const y = e.clientY - 60

  gsap.to(preview, {
    left: x + 'px',
    top: y + 'px',
    scale: 1,
    opacity: 1,
    duration: 0.3,
    ease: 'power2.out',
  })
}

function onCardLeave(i) {
  const preview = previewRefs.value[i]
  if (!preview) return

  gsap.to(preview, {
    scale: 0.6,
    opacity: 0,
    duration: 0.25,
    ease: 'power2.in',
  })
}

function openProject(i) {
  activeProject.value = i
  document.body.style.overflow = 'hidden'
}

function goToProject() {
  const project = projects[activeProject.value]
  closeProject()
  if (project?.route) {
    router.push(project.route)
  }
}

function closeProject() {
  activeProject.value = null
  document.body.style.overflow = ''
}
</script>

<style scoped>
.work {
  background: var(--color-bg-alt);
}

.work__header {
  margin-bottom: 80px;
}

.work__label {
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.work__heading {
  font-family: var(--font-title);
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 400;
  margin-top: 12px;
  color: var(--color-black);
}

.work__list {
  display: flex;
  flex-direction: column;
}

.work-card {
  position: relative;
  cursor: none;
  padding: 40px 0;
  border-top: 1px solid var(--color-border);
  transition: background 0.3s;
}

.work-card:last-child {
  border-bottom: 1px solid var(--color-border);
}

.work-card:hover {
  background: rgba(0, 0, 0, 0.02);
}

.work-card__inner {
  display: grid;
  grid-template-columns: 60px 1fr 60px;
  align-items: center;
  gap: 40px;
  position: relative;
  z-index: 1;
}

.work-card__index {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--color-text-muted);
}

.work-card__title {
  font-family: var(--font-title);
  font-size: clamp(28px, 3.5vw, 48px);
  font-weight: 400;
  color: var(--color-black);
  transition: color 0.3s;
}

.work-card:hover .work-card__title {
  color: var(--color-accent);
}

.work-card__cat {
  display: block;
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.work-card__year {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: right;
}

.work-card__preview {
  position: fixed;
  z-index: 1500;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(0.6);
  opacity: 0;
  pointer-events: none;
  will-change: left, top, transform, opacity;
}

.work-card__preview-label {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--color-black);
  font-weight: 600;
}

@media (max-width: 768px) {
  .work__header { margin-bottom: 48px; }
  .work-card__inner {
    grid-template-columns: 40px 1fr;
    gap: 20px;
  }
  .work-card__year { display: none; }
  .work-card__preview { display: none; }
}
</style>
