<template>
  <footer id="footer" class="footer">
    <div class="section-wrapper">
      <!-- 大字 CTA -->
      <div ref="cta" class="footer__cta">
        <h2 class="footer__heading">联系我</h2>
        <a href="mailto:hello@example.com" class="footer__email" data-cursor="circle">
          hello@example.com
          <svg class="footer__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M7 17L17 7 M7 7H17V17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>

      <!-- 分割线 -->
      <hr ref="divider" class="footer__divider" />

      <!-- 底部行 -->
      <div ref="bottom" class="footer__bottom">
        <div class="footer__left">
          <span class="footer__logo-mono">Y</span>
          <span class="footer__copy">&copy; 2026 yang</span>
        </div>

        <!-- 社交链接 -->
        <div class="footer__socials">
          <a v-for="s in socials" :key="s.label" href="#" class="footer__social" data-cursor="text">
            {{ s.label }}
          </a>
        </div>

        <!-- 主题切换 -->
        <ThemeSwitcher />
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ThemeSwitcher from './ThemeSwitcher.vue'

gsap.registerPlugin(ScrollTrigger)

const cta = ref(null)
const divider = ref(null)
const bottom = ref(null)

const socials = [
  { label: 'GitHub', url: '#' },
  { label: 'Twitter', url: '#' },
  { label: 'LinkedIn', url: '#' },
  { label: 'Bento', url: '#' },
]

onMounted(() => {
  // CTA 入场
  gsap.from(cta.value, {
    scrollTrigger: { trigger: cta.value, start: 'top 88%', once: true },
    y: 50, opacity: 0, duration: 0.9, ease: 'power3.out',
  })

  // 分割线
  gsap.from(divider.value, {
    scrollTrigger: { trigger: divider.value, start: 'top 95%', once: true },
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 1,
    ease: 'power3.inOut',
  })

  // 底部信息
  gsap.from(bottom.value, {
    scrollTrigger: { trigger: bottom.value, start: 'top 95%', once: true },
    y: 20, opacity: 0, duration: 0.7, ease: 'power3.out',
  })
})
</script>

<style scoped>
.footer {
  background: var(--color-black);
  color: var(--color-white);
  padding: 100px 0 40px;
}

/* ===== CTA ===== */
.footer__cta {
  margin-bottom: 64px;
}

.footer__heading {
  font-family: var(--font-title);
  font-size: clamp(48px, 8vw, 100px);
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: var(--color-white);
}

.footer__email {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-title);
  font-size: clamp(20px, 2.5vw, 28px);
  color: var(--color-accent);
  margin-top: 24px;
  transition: gap 0.3s;
}

.footer__email:hover {
  gap: 14px;
}

.footer__arrow {
  transition: transform 0.3s;
}

.footer__email:hover .footer__arrow {
  transform: translate(3px, -3px);
}

/* ===== 分割线 ===== */
.footer__divider {
  border: none;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin-bottom: 36px;
  transform-origin: left center;
}

/* ===== 底部行 ===== */
.footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
}

.footer__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer__logo-mono {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-accent);
  color: var(--color-black);
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 700;
  border-radius: 6px;
}

.footer__copy {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.footer__socials {
  display: flex;
  gap: 24px;
}

.footer__social {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s;
}

.footer__social:hover {
  color: var(--color-accent);
}

@media (max-width: 768px) {
  .footer { padding: 64px 0 32px; }
  .footer__cta { margin-bottom: 48px; }
  .footer__bottom { flex-direction: column; align-items: flex-start; }
}
</style>
