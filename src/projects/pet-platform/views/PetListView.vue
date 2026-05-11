<template>
  <div class="pl">
    <div class="section-wrapper">
      <div class="pl__head">
        <span class="pl__label">宠物流转平台</span>
        <h1 class="pl__title">宠物流转平台</h1>
        <p class="pl__sub">找到你的毛孩子伙伴</p>
      </div>

      <AISearchBar @filter="onAIFilter" />

      <div class="pl__filters">
        <input v-model="search" class="pl__search" placeholder="搜索宠物名称..." @input="onSearch" />
        <select v-model="speciesFilter" class="pl__select" @change="load">
          <option value="">全部种类</option>
          <option value="cat">🐱 猫</option>
          <option value="dog">🐶 狗</option>
          <option value="bird">🐦 鸟</option>
          <option value="other">🐰 其他</option>
        </select>
        <select v-model="sizeFilter" class="pl__select" @change="load">
          <option value="">全部体型</option>
          <option value="small">小型</option>
          <option value="medium">中型</option>
          <option value="large">大型</option>
        </select>
        <button
          class="pl__near-btn"
          :class="{ 'pl__near-btn--active': nearMode }"
          @click="toggleNear"
          :disabled="locating"
        >
          {{ locating ? '定位中...' : nearMode ? '📍 已按距离排序' : '📍 附近宠物' }}
        </button>
      </div>

      <div v-if="loading" class="pl__loading">加载中...</div>

      <div v-else class="pl__grid">
        <PetCard v-for="pet in pets" :key="pet.id" :pet="pet" />
      </div>

      <p v-if="!loading && pets.length === 0" class="pl__empty">暂无符合条件的宠物</p>

      <div class="pl__pager" v-if="total > 12">
        <button :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
        <span>{{ page }} / {{ Math.ceil(total / 12) }}</span>
        <button :disabled="page >= Math.ceil(total / 12)" @click="goPage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetStore } from '@/projects/pet-platform/stores/pets'
import { useFavoriteStore } from '@/projects/pet-platform/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import PetCard from '@/projects/pet-platform/components/PetCard.vue'
import AISearchBar from '@/projects/pet-platform/components/AISearchBar.vue'

const store = usePetStore()
const favStore = useFavoriteStore()
const auth = useAuthStore()
const { pets, total, page, loading } = storeToRefs(store)

const search = ref('')
const speciesFilter = ref('')
const sizeFilter = ref('')
const nearMode = ref(false)
const locating = ref(false)
const userLat = ref(0)
const userLng = ref(0)

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 300)
}

async function load() {
  const params = { search: search.value, species: speciesFilter.value, size: sizeFilter.value }
  if (nearMode.value && userLat.value && userLng.value) {
    params.nearLat = userLat.value
    params.nearLng = userLng.value
  }
  await store.fetchPets(params)
  if (auth.isLoggedIn && pets.value.length > 0) {
    favStore.checkFavBatch(pets.value.map(p => p.id))
  }
}

async function toggleNear() {
  if (nearMode.value) {
    nearMode.value = false
    userLat.value = 0
    userLng.value = 0
    load()
    return
  }
  // 请求地理位置
  if (!navigator.geolocation) {
    alert('您的浏览器不支持地理定位')
    return
  }
  locating.value = true
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
      })
    })
    userLat.value = pos.coords.latitude
    userLng.value = pos.coords.longitude
    nearMode.value = true
    load()
  } catch {
    alert('无法获取位置信息，请检查浏览器权限设置')
  } finally {
    locating.value = false
  }
}

function onAIFilter({ ids }) {
  // AI 返回的 ID 列表：在 store 中按 ID 筛选
  if (ids.length > 0) {
    speciesFilter.value = ''
    sizeFilter.value = ''
    store.fetchPets({ search: '', species: '', size: '', status: '', pageSize: 50 })
    // 前端过滤（后端已返回全部数据）
    setTimeout(() => {
      pets.value = pets.value.filter(p => ids.includes(p.id))
    }, 500)
  }
}

function goPage(p) {
  store.fetchPets({ search: search.value, species: speciesFilter.value, size: sizeFilter.value, page: p })
}

onMounted(load)
</script>

<style scoped>
.pl {
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
.pl__head { margin-bottom: 48px; }
.pl__label { font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--color-text-muted); font-family: var(--font-mono); }
.pl__title { font-family: var(--font-title); font-size: clamp(40px, 6vw, 72px); color: var(--color-black); margin-top: 8px; }
.pl__sub { font-size: 18px; color: var(--color-text-muted); margin-top: 12px; }
.pl__filters { display: flex; gap: 12px; margin-bottom: 40px; flex-wrap: wrap; }
.pl__search { flex: 1; max-width: 300px; padding: 12px 18px; font-size: 14px; border: 1px solid var(--color-border); border-radius: 100px; background: var(--color-white); color: var(--color-text); outline: none; }
.pl__search:focus { border-color: var(--color-accent); }
.pl__select { padding: 12px 18px; font-size: 14px; border: 1px solid var(--color-border); border-radius: 100px; background: var(--color-white); color: var(--color-text); outline: none; cursor: pointer; }
.pl__near-btn {
  padding: 12px 20px;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: 100px;
  background: var(--color-white);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}
.pl__near-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.pl__near-btn--active { background: var(--color-accent); color: var(--color-black); border-color: var(--color-accent); }
.pl__near-btn:disabled { opacity: 0.6; cursor: wait; }
.pl__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.pl__loading, .pl__empty { text-align: center; padding: 64px; color: var(--color-text-muted); font-size: 16px; }
.pl__pager { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 40px; font-size: 14px; }
.pl__pager button { padding: 10px 24px; font-size: 14px; background: var(--color-white); border: 1px solid var(--color-border); border-radius: 100px; cursor: pointer; }

@media (max-width: 768px) {
  .pl { padding: 100px 0 60px; }
  .pl__title { font-size: 32px; }
  .pl__filters { flex-direction: column; }
  .pl__search { max-width: 100%; }
  .pl__grid { grid-template-columns: 1fr; gap: 16px; }
  .pl__loading, .pl__empty { padding: 40px 16px; }
}
</style>
