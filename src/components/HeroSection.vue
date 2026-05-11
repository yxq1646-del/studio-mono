<template>
  <section id="hero" class="hero">
    <div class="hero__inner section-wrapper">
      <!-- 标签行 -->
      <p ref="tagline" class="hero__tagline">
        <span class="hero__tag-dot"></span>
        CREATE · BUILD · EXPLORE
      </p>

      <!-- 大字标题 — 字符逐个入场 -->
      <h1 ref="title" class="hero__title">
        <span
          v-for="(char, i) in titleChars"
          :key="i"
          ref="charEls"
          class="hero__char"
        >{{ char }}</span>
      </h1>

      <!-- 打字机副标题 -->
      <p ref="typewriter" class="hero__typewriter">
        <span class="hero__typed">{{ typedText }}</span>
        <span ref="caret" class="hero__caret">|</span>
      </p>

      <!-- 滚动提示 -->
      <div ref="scrollHint" class="hero__scroll">
        <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
          <rect x="1" y="1" width="22" height="38" rx="11" stroke="currentColor" stroke-width="1.5"/>
          <circle ref="scrollDot" cx="12" cy="12" r="3" fill="currentColor"/>
        </svg>
      </div>
    </div>

    <!-- 背景装饰文字 -->
    <div class="hero__bg-text" aria-hidden="true">PORT<br/>FOLIO</div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'

const titleChars = "Hello, I'm yang".split('')
const typedText = ref('')
const fullText = '一名热爱创意技术与视觉表达的全栈开发者，专注于构建简洁而富有表现力的数字体验。'
const charEls = ref([])
const caret = ref(null)
const tagline = ref(null)
const title = ref(null)
const scrollHint = ref(null)
const scrollDot = ref(null)

onMounted(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  // 1. 标签行入场
  tl.from(tagline.value, { y: 20, opacity: 0, duration: 0.6 })

  // 2. 每个字符入场 — 带旋转 + 位移
  tl.from('.hero__char', {
    y: 80,
    rotateX: -50,
    opacity: 0,
    duration: 0.7,
    stagger: 0.04,
    ease: 'back.out(1.3)',
  }, '-=0.1')

  // 3. 打字机效果
  tl.add(() => {
    let i = 0
    const interval = setInterval(() => {
      typedText.value += fullText[i]
      i++
      if (i >= fullText.length) {
        clearInterval(interval)
        // 光标闪烁
        gsap.to(caret.value, { opacity: 0, repeat: -1, yoyo: true, duration: 0.6, ease: 'steps(1)' })
      }
    }, 60)
  }, '-=0.2')

  // 4. 滚动提示
  tl.from(scrollHint.value, { opacity: 0, y: 10, duration: 0.6 })

  // 5. 滚动小球上下弹
  gsap.to(scrollDot.value, {
    cy: 28,
    repeat: -1,
    yoyo: true,
    duration: 1.5,
    ease: 'power1.inOut',
    attr: { cy: 28 },
  })

  // 6. 背景大字视差（mousemove 驱动）
  const bgText = document.querySelector('.hero__bg-text')
  if (bgText) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      gsap.to(bgText, { x, y, duration: 1.2, ease: 'power2.out' })
    }, { passive: true })
  }
})
</script>

<style scoped>
.hero {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
  background: var(--color-bg);
}

.hero__inner {
  position: relative;
  z-index: 2;
  padding-top: var(--nav-height);
}

/* 标签行 */
.hero__tagline {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--color-text-muted);
  margin-bottom: 32px;
  font-family: var(--font-mono);
}

.hero__tag-dot {
  width: 8px;
  height: 8px;
  background: var(--color-accent);
  border-radius: 50%;
}

/* 大字标题 */
.hero__title {
  font-family: var(--font-title);
  font-size: clamp(56px, 10vw, 140px);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: var(--color-black);
  perspective: 400px;
  margin-bottom: 40px;
}

.hero__char {
  display: inline-block;
  white-space: pre;
}

/* 打字机 */
.hero__typewriter {
  font-size: clamp(16px, 2vw, 20px);
  color: var(--color-text-muted);
  max-width: 540px;
  line-height: 1.7;
}

.hero__caret {
  color: var(--color-accent);
  font-weight: 300;
}

/* 滚动提示 */
.hero__scroll {
  position: absolute;
  bottom: 48px;
  left: 0;
  color: var(--color-text-muted);
}

/* 背景大字 */
.hero__bg-text {
  position: absolute;
  right: -4%;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-title);
  font-size: clamp(180px, 28vw, 400px);
  font-weight: 700;
  line-height: 0.8;
  color: rgba(0, 0, 0, 0.025);
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  will-change: transform;
}

@media (max-width: 768px) {
  .hero__bg-text { display: none; }
  .hero__title { font-size: clamp(40px, 12vw, 72px); }
}
</style>
