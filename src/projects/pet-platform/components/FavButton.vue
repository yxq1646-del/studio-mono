<template>
  <button
    class="fav-btn"
    :class="{ 'fav-btn--active': isFav }"
    :title="isFav ? '取消收藏' : '收藏'"
    @click.prevent.stop="handleClick"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" :fill="isFav ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFavoriteStore } from '@/projects/pet-platform/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const props = defineProps({ petId: { type: Number, required: true } })
const emit = defineEmits(['toggle'])

const favStore = useFavoriteStore()
const auth = useAuthStore()
const router = useRouter()
const isFav = ref(false)

onMounted(async () => {
  if (auth.isLoggedIn) {
    isFav.value = favStore.favoritedIds.has(props.petId)
  }
})

async function handleClick() {
  if (!auth.isLoggedIn) {
    router.push('/admin/login')
    return
  }
  try {
    const data = await favStore.toggleFav(props.petId)
    isFav.value = data.favorited
    emit('toggle', data)
  } catch { /* handled by useApi */ }
}
</script>

<style scoped>
.fav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(6px);
}
.fav-btn:hover { transform: scale(1.15); color: #ef4444; }
.fav-btn--active { color: #ef4444; background: rgba(255,255,255,0.95); }
</style>
