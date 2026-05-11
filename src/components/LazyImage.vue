<template>
  <div ref="root" class="lazy-img" :class="{ 'lazy-img--loaded': loaded }">
    <img
      v-if="loaded && src"
      :src="src"
      :alt="alt"
      :srcset="srcset"
      :sizes="sizes"
      class="lazy-img__img"
      @error="onError"
    />
    <div v-else class="lazy-img__placeholder">
      <slot name="placeholder">
        <span class="lazy-img__placeholder-icon">{{ placeholderIcon }}</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  srcset: { type: String, default: '' },
  sizes: { type: String, default: '' },
  alt: { type: String, default: '' },
  placeholderIcon: { type: String, default: '🐾' },
  rootMargin: { type: String, default: '200px' },
})

const root = ref(null)
const loaded = ref(false)
let observer = null

function onError() {
  loaded.value = false
}

onMounted(() => {
  if (!root.value) return

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loaded.value = true
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: props.rootMargin }
    )
    observer.observe(root.value)
  } else {
    loaded.value = true
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.lazy-img {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fef9f2, #f5ece0);
  overflow: hidden;
}
.lazy-img--loaded { background: none; }
.lazy-img__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.4s;
}
.lazy-img--loaded .lazy-img__img { opacity: 1; }
.lazy-img__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.lazy-img__placeholder-icon {
  font-size: clamp(32px, 10vw, 64px);
}
</style>
