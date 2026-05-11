<template>
  <section id="about" class="about section-padding">
    <div class="section-wrapper">
      <div ref="header" class="about__header">
        <span class="about__label">关于</span>
        <h2 class="about__heading">关于我</h2>
      </div>

      <div class="about__grid">
        <!-- 头像区域 -->
        <div ref="avatar" class="about__avatar">
          <div class="about__avatar-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 4-7 8-7s8 3 8 7"/>
            </svg>
          </div>
        </div>

        <!-- 简介文字 -->
        <div ref="bio" class="about__bio">
          <p class="about__intro">
            你好，我是 <span class="about__name">yang</span>。
          </p>
          <p class="about__text">
            一名热衷于创意技术与视觉表达的全栈开发者。
            我相信好的产品源于<span class="about__em">代码与设计的深度融合</span>，
            而不是把两者割裂开来。
          </p>
          <p class="about__text">
            从交互原型到生产级代码，从视觉细节到系统架构，
            我享受<span class="about__em">从零到一</span>构建数字体验的整个过程。
          </p>
          <p class="about__text">
            目前在寻找有趣的合作机会，欢迎随时联系。
          </p>
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
const avatar = ref(null)
const bio = ref(null)

onMounted(() => {
  gsap.from(header.value, {
    scrollTrigger: { trigger: header.value, start: 'top 85%', once: true },
    y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
  })

  gsap.from(avatar.value, {
    scrollTrigger: { trigger: avatar.value, start: 'top 82%', once: true },
    scale: 0.8, opacity: 0, duration: 0.9, ease: 'power3.out',
  })

  gsap.from('.about__text', {
    scrollTrigger: { trigger: bio.value, start: 'top 82%', once: true },
    y: 30, opacity: 0, stagger: 0.2, duration: 0.8, ease: 'power3.out',
  })
})
</script>

<style scoped>
.about {
  background: var(--color-white);
}

.about__header {
  margin-bottom: 72px;
}

.about__label {
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.about__heading {
  font-family: var(--font-title);
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 400;
  margin-top: 12px;
  color: var(--color-black);
}

.about__grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 80px;
  align-items: start;
}

.about__avatar {
  position: sticky;
  top: calc(var(--nav-height) + 40px);
}

.about__avatar-placeholder {
  width: 100%;
  aspect-ratio: 1;
  background: var(--color-bg-alt);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.about__bio {
  max-width: 600px;
}

.about__intro {
  font-family: var(--font-title);
  font-size: clamp(24px, 3.5vw, 36px);
  color: var(--color-black);
  margin-bottom: 32px;
}

.about__name {
  color: var(--color-accent);
}

.about__text {
  font-size: 16px;
  color: var(--color-text-muted);
  line-height: 1.9;
  margin-bottom: 20px;
}

.about__em {
  color: var(--color-text);
  font-weight: 500;
}

@media (max-width: 768px) {
  .about__grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .about__avatar {
    position: static;
    max-width: 200px;
  }

  .about__header { margin-bottom: 48px; }
}
</style>
