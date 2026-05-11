<template>
  <div class="pd" v-if="pet">
    <div class="section-wrapper">
      <a href="/pets" class="pd__back">← 返回列表</a>
      <div class="pd__grid">
        <div class="pd__img">
          <LazyImage v-if="pet.image_url" :src="pet.image_url" :alt="pet.name" placeholder-icon="🐾" />
          <div v-else class="pd__img-placeholder">🐾</div>
        </div>
        <div class="pd__info">
          <span class="pd__species">{{ speciesMap[pet.species] }}</span>
          <h1 class="pd__name">{{ pet.name }}</h1>
          <div class="pd__meta">
            <span v-if="pet.breed">{{ pet.breed }}</span>
            <span v-if="pet.age_group">{{ ageMap[pet.age_group] }}</span>
            <span v-if="pet.gender">{{ genderMap[pet.gender] }}</span>
            <span v-if="pet.size_group">{{ sizeMap[pet.size_group] }}</span>
          </div>
          <p class="pd__desc">{{ pet.description }}</p>
          <p class="pd__loc">📍 {{ pet.location_city }}</p>
          <p v-if="favMsg" class="pd__fav-msg">{{ favMsg }}</p>
          <div class="pd__actions">
            <FavButton class="pd__fav" :pet-id="pet.id" @toggle="onFavToggle" />
            <router-link
              v-if="pet.status === 'available'"
              :to="`/pets/${pet.id}/adopt`"
              class="pd__adopt-btn"
            >申请领养</router-link>
            <span v-else class="pd__unavailable">该宠物当前不可领养</span>
          </div>
        </div>
      </div>
      <StatusTimeline v-if="timeline.length" :logs="timeline" />
    </div>
  </div>
  <div v-else class="pd__loading">加载中...</div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePetStore } from '@/projects/pet-platform/stores/pets'
import FavButton from '@/projects/pet-platform/components/FavButton.vue'
import LazyImage from '@/components/LazyImage.vue'
import StatusTimeline from '@/projects/pet-platform/components/StatusTimeline.vue'
import { useApi } from '@/composables/useApi'

const route = useRoute()
const store = usePetStore()
const api = useApi()
const pet = computed(() => store.currentPet)
const timeline = ref([])

const favMsg = ref('')
function onFavToggle(data) {
  favMsg.value = data.favorited ? '已收藏 ❤️' : '已取消收藏'
  setTimeout(() => { favMsg.value = '' }, 2000)
}

const speciesMap = { cat: '🐱 猫', dog: '🐶 狗', bird: '🐦 鸟', other: '🐰 其他' }
const ageMap = { baby: '幼年', young: '年轻', adult: '成年', senior: '老年' }
const genderMap = { male: '♂ 公', female: '♀ 母' }
const sizeMap = { small: '小型', medium: '中型', large: '大型' }

onMounted(async () => {
  await store.fetchPet(route.params.id)
  try {
    const data = await api.get(`/pets/${route.params.id}/timeline`)
    timeline.value = data.list
  } catch { /* timeline is optional */ }
})
</script>

<style scoped>
.pd {
  padding: 120px 0 100px; min-height: 100vh;
  --color-bg: #fef9f2;
  --color-bg-alt: #f5ece0;
  --color-text: #3d3529;
  --color-text-muted: #8b7e6b;
  --color-accent: #f59e0b;
  --color-accent-rgb: 245, 158, 11;
  --color-white: #ffffff;
  --color-black: #2d2416;
  --color-border: #e8dccf;
  --font-title: 'Georgia', 'Noto Serif SC', serif;
  background: var(--color-bg);
}
.pd__back { display: inline-block; margin-bottom: 40px; font-size: 15px; color: var(--color-text-muted); transition: color 0.3s; }
.pd__back:hover { color: var(--color-accent); }
.pd__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
.pd__img { aspect-ratio: 1; border-radius: 20px; overflow: hidden; background: var(--color-bg-alt); }
.pd__img img { width: 100%; height: 100%; object-fit: cover; }
.pd__img-placeholder { display: flex; align-items: center; justify-content: center; font-size: 120px; }
.pd__species { font-size: 14px; color: var(--color-text-muted); }
.pd__name { font-family: var(--font-title); font-size: clamp(36px, 5vw, 56px); color: var(--color-black); margin: 8px 0 16px; }
.pd__meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.pd__meta span { padding: 4px 14px; font-size: 13px; background: var(--color-white); border: 1px solid var(--color-border); border-radius: 100px; color: var(--color-text); }
.pd__desc { font-size: 16px; line-height: 1.8; color: var(--color-text-muted); margin-bottom: 20px; }
.pd__loc { font-size: 15px; color: var(--color-text); margin-bottom: 16px; }
.pd__fav-msg { font-size: 14px; color: #ef4444; margin-bottom: 16px; }
.pd__actions { display: flex; align-items: center; gap: 16px; margin-top: 8px; }
.pd__fav { flex-shrink: 0; }
.pd__adopt-btn {
  display: inline-block;
  padding: 16px 48px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-black);
  background: var(--color-accent);
  border-radius: 100px;
  transition: opacity 0.3s;
}
.pd__adopt-btn:hover { opacity: 0.85; }
.pd__unavailable { display: inline-block; padding: 16px 32px; font-size: 15px; background: var(--color-bg-alt); color: var(--color-text-muted); border-radius: 100px; }
.pd__loading { text-align: center; padding: 120px; color: var(--color-text-muted); }
@media (max-width: 768px) {
  .pd { padding: 100px 0 60px; }
  .pd__grid { grid-template-columns: 1fr; gap: 32px; }
  .pd__name { font-size: 28px; }
  .pd__actions { flex-wrap: wrap; }
  .pd__loading { padding: 80px 20px; }
}
</style>
