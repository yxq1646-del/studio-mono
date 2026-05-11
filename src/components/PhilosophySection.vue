<template>
  <section id="philosophy" class="philosophy section-padding">
    <div class="section-wrapper">
      <div ref="content" class="philosophy__content">
        <!-- 段落 1 -->
        <p ref="para1" class="philosophy__text">
          我相信<span class="philosophy__em">代码是手段，体验才是目的</span>。
          技术选型、架构设计、视觉呈现——每一步都应当服务于
          <span class="philosophy__em">使用者的感受</span>。
        </p>

        <!-- 段落 2 -->
        <p ref="para2" class="philosophy__text">
          在这个技术日新月异的时代，保持好奇心比追逐潮流更重要。
          深入理解底层原理，才可能做出<span class="philosophy__em">真正优雅的方案</span>。
        </p>

        <!-- 段落 3 -->
        <p ref="para3" class="philosophy__text philosophy__text--lg">
          为意义<br />而创造。
        </p>

        <!-- 署名 -->
        <p ref="signature" class="philosophy__sig">
          — yang
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const para1 = ref(null)
const para2 = ref(null)
const para3 = ref(null)
const signature = ref(null)

onMounted(() => {
  // 所有段落统一配置：从模糊 + 透明到清晰
  const paragraphs = [para1.value, para2.value, para3.value, signature.value]

  paragraphs.forEach((el) => {
    if (!el) return
    gsap.fromTo(el,
      { filter: 'blur(8px)', opacity: 0, y: 30 },
      {
        filter: 'blur(0px)',
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 82%',
          once: true,
        },
      }
    )
  })
})
</script>

<style scoped>
.philosophy {
  background: var(--color-bg);
}

.philosophy__content {
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
}

.philosophy__text {
  font-family: var(--font-title);
  font-size: clamp(20px, 2.8vw, 28px);
  line-height: 1.7;
  color: var(--color-text);
  margin-bottom: 48px;
  will-change: filter, transform, opacity;
}

.philosophy__text--lg {
  font-size: clamp(36px, 6vw, 72px);
  line-height: 1.15;
  color: var(--color-black);
  font-weight: 400;
  margin-bottom: 32px;
}

.philosophy__em {
  color: var(--color-accent);
  font-style: italic;
}

.philosophy__sig {
  font-size: 15px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .philosophy__text { font-size: 18px; margin-bottom: 32px; }
  .philosophy__text--lg { font-size: 28px; }
}
</style>
