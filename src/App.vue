<template>
  <!-- 页面加载遮罩 -->
  <div ref="loader" class="loader">
    <div class="loader__inner">
      <span ref="loaderM" class="loader__m">Y</span>
    </div>
  </div>

  <CustomCursor />

  <component :is="layout">
    <router-view v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
  </component>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import CustomCursor from '@/components/CustomCursor.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const route = useRoute()
const loader = ref(null)
const loaderM = ref(null)

const layout = computed(() => {
  const m = route.meta.layout
  if (m === 'none') return 'div'
  return DefaultLayout
})

onMounted(() => {
  if (loader.value) {
    const tl = gsap.timeline({
      onComplete: () => {
        if (loader.value) loader.value.style.display = 'none'
      },
    })
    tl.from(loaderM.value, {
      rotate: -180, scale: 0, opacity: 0,
      duration: 0.8, ease: 'back.out(1.4)',
    })
    tl.to(loaderM.value, {
      rotate: 90, scale: 1.2,
      duration: 0.5, ease: 'power2.in',
    })
    tl.to(loader.value, {
      y: '-100%', duration: 0.7, ease: 'power3.inOut',
    }, '+=0.15')
  }
})
</script>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
}
.loader__inner {
  display: flex;
}
.loader__m {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--color-black);
  color: var(--color-accent);
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: 700;
  border-radius: 16px;
}

/* 页面过渡 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
