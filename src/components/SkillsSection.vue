<template>
  <section id="skills" class="skills section-padding">
    <div class="section-wrapper">
      <div ref="header" class="skills__header">
        <span class="skills__label">技术栈</span>
        <h2 class="skills__heading">技能栈</h2>
      </div>

      <div ref="grid" class="skills__grid">
        <div
          v-for="(group, gi) in skillGroups"
          :key="gi"
          :ref="el => groupRefs[gi] = el"
          class="skill-group"
        >
          <h3 class="skill-group__title">{{ group.category }}</h3>
          <div class="skill-group__tags">
            <span
              v-for="(skill, si) in group.skills"
              :key="si"
              class="skill-tag"
              :style="{ transitionDelay: (gi * 0.1 + si * 0.05) + 's' }"
            >{{ skill }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const header = ref(null)
const grid = ref(null)
const groupRefs = ref({})

const skillGroups = [
  {
    category: '前端开发',
    skills: ['Vue 3', 'React', 'TypeScript', 'GSAP', 'Tailwind CSS', 'Vite', 'Rolldown'],
  },
  {
    category: '后端与数据',
    skills: ['Node.js', 'Express', 'SQLite', 'PostgreSQL', 'JWT', 'REST API', 'GraphQL'],
  },
  {
    category: '工具与部署',
    skills: ['Git', 'Docker', 'CI/CD', 'Linux', 'Nginx', 'AWS', 'Vercel'],
  },
]

onMounted(() => {
  gsap.from(header.value, {
    scrollTrigger: { trigger: header.value, start: 'top 85%', once: true },
    y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
  })

  Object.entries(groupRefs.value).forEach(([i, el]) => {
    if (!el) return
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      y: 40, opacity: 0, duration: 0.7, delay: i * 0.1, ease: 'power3.out',
    })
  })

  // 标签悬停微动效
  gsap.from('.skill-tag', {
    scrollTrigger: { trigger: grid.value, start: 'top 88%', once: true },
    y: 16, opacity: 0, stagger: 0.03, duration: 0.5, ease: 'power3.out',
  })
})
</script>

<style scoped>
.skills {
  background: var(--color-bg-alt);
}

.skills__header {
  margin-bottom: 72px;
}

.skills__label {
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.skills__heading {
  font-family: var(--font-title);
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 400;
  margin-top: 12px;
  color: var(--color-black);
}

.skills__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
}

.skill-group__title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 400;
  color: var(--color-black);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.skill-group__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-tag {
  display: inline-block;
  padding: 8px 18px;
  font-size: 14px;
  font-family: var(--font-mono);
  color: var(--color-text);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  transition: background 0.3s, border-color 0.3s, color 0.3s, transform 0.2s;
}

.skill-tag:hover {
  background: var(--color-black);
  border-color: var(--color-black);
  color: var(--color-accent);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .skills__grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .skills__header { margin-bottom: 40px; }
}
</style>
