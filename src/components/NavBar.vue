<template>
  <nav ref="nav" class="navbar" :class="{ 'navbar--scrolled': isScrolled }">
    <div class="navbar__inner section-wrapper">
      <a href="/" class="navbar__logo" data-cursor="circle" @click.prevent="router.push('/')">
        <span class="navbar__logo-mono">Y</span>
      </a>

      <ul class="navbar__links">
        <li v-for="(item, i) in navItems" :key="i">
          <a href="#" class="navbar__link" data-cursor="text"
            @click.prevent="item.action">
            {{ item.label }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'

const route = useRoute()
const router = useRouter()
const nav = ref(null)
const isScrolled = ref(false)

const isHomePage = computed(() => route.path === '/')

const navItems = computed(() => {
  if (isHomePage.value) {
    return [
      { action: () => scrollTo('hero'), label: '首页' },
      { action: () => scrollTo('work'), label: '作品' },
      { action: () => scrollTo('skills'), label: '技能' },
      { action: () => scrollTo('about'), label: '关于' },
      { action: () => scrollTo('footer'), label: '联系' },
    ]
  }
  return [
    { action: () => router.push('/'), label: '首页' },
    { action: () => router.push('/chat'), label: 'AI 助手' },
  ]
})

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

let ticking = false
function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      isScrolled.value = window.scrollY > 50
      ticking = false
    })
    ticking = true
  }
}

onMounted(() => {
  gsap.from(nav.value, { y: -60, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.4 })
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: var(--nav-height);
  transition: background 0.4s, box-shadow 0.4s;
  mix-blend-mode: difference;
}

.navbar--scrolled {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
  mix-blend-mode: normal;
}

.navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.navbar__logo-mono {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-black);
  color: var(--color-accent);
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 700;
  border-radius: 8px;
  transition: transform 0.3s, background 0.3s;
}

.navbar__logo-mono:hover {
  transform: scale(1.08);
}

.navbar__links {
  display: flex;
  gap: 48px;
}

.navbar__link {
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text);
  opacity: 0.6;
  transition: opacity 0.3s;
}

.navbar__link:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .navbar__links { gap: 24px; }
  .navbar__link { font-size: 11px; }
}
@media (max-width: 480px) {
  .navbar__links { gap: 16px; }
  .navbar__link { font-size: 10px; }
  .navbar__logo-mono { width: 32px; height: 32px; font-size: 16px; }
}
</style>
