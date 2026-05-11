<template>
  <router-link :to="`/pets/${pet.id}`" class="pc">
    <div class="pc__img">
      <LazyImage v-if="pet.image_url" :src="pet.image_url" :alt="pet.name" placeholder-icon="🐾" />
      <div v-else class="pc__img-placeholder">🐾</div>
      <span class="pc__status" :class="'pc__status--' + pet.status">
        {{ statusMap[pet.status] || pet.status }}
      </span>
      <FavButton class="pc__fav" :pet-id="pet.id" />
    </div>
    <div class="pc__body">
      <div class="pc__top">
        <h3 class="pc__name">{{ pet.name }}</h3>
        <span class="pc__species">{{ speciesMap[pet.species] || pet.species }}</span>
      </div>
      <div class="pc__meta">
        <span v-if="pet.breed">{{ pet.breed }}</span>
        <span v-if="pet.age_group">{{ ageMap[pet.age_group] }}</span>
        <span v-if="pet.size_group">{{ sizeMap[pet.size_group] }}</span>
        <span v-if="pet.gender">{{ genderMap[pet.gender] }}</span>
      </div>
      <p class="pc__loc">
        <span>{{ pet.location_city }}</span>
        <span v-if="pet.distance != null" class="pc__distance">{{ formatDistance(pet.distance) }}</span>
      </p>
    </div>
  </router-link>
</template>

<script setup>
import FavButton from './FavButton.vue'
import LazyImage from '@/components/LazyImage.vue'

defineProps({ pet: { type: Object, required: true } })

const statusMap = { available: '待领养', pending: '申请中', adopted: '已领养' }
const speciesMap = { cat: '🐱 猫', dog: '🐶 狗', bird: '🐦 鸟', other: '🐰 其他' }
const ageMap = { baby: '幼年', young: '年轻', adult: '成年', senior: '老年' }
const genderMap = { male: '♂ 公', female: '♀ 母' }
const sizeMap = { small: '小型', medium: '中型', large: '大型' }

function formatDistance(km) {
  if (km == null) return ''
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}
</script>

<style scoped>
.pc {
  display: block;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}
.pc:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.06); }
.pc__img {
  aspect-ratio: 1;
  background: linear-gradient(135deg, #fef9f2, #f5ece0);
  position: relative;
  overflow: hidden;
}
.pc__img img { width: 100%; height: 100%; object-fit: cover; }
.pc__img-placeholder { display: flex; align-items: center; justify-content: center; font-size: 64px; }
.pc__status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 14px;
  font-size: 12px;
  border-radius: 100px;
  background: rgba(45,36,22,0.6);
  color: #fff;
  backdrop-filter: blur(6px);
}
.pc__status--available { background: var(--color-accent); color: #fff; }
.pc__status--adopted { background: rgba(45,36,22,0.5); }
.pc__fav { position: absolute; top: 12px; left: 12px; z-index: 2; }
.pc__body { padding: 20px; }
.pc__top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.pc__name { font-family: var(--font-title); font-size: 22px; color: var(--color-black); }
.pc__species { font-size: 13px; color: var(--color-text-muted); }
.pc__meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.pc__meta span { padding: 4px 12px; font-size: 12px; background: var(--color-bg-alt); border-radius: 100px; color: var(--color-text-muted); }
.pc__loc { font-size: 13px; color: var(--color-text-muted); display: flex; justify-content: space-between; align-items: center; }
.pc__distance { font-size: 12px; color: var(--color-accent); font-weight: 500; }
</style>
