import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'

export const useFavoriteStore = defineStore('favorites', () => {
  const api = useApi()
  const auth = useAuthStore()

  const favorites = ref([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const favoritedIds = ref(new Set())

  async function fetchFavorites(params = {}) {
    if (!auth.isLoggedIn) return
    loading.value = true
    try {
      const q = new URLSearchParams({
        page: params.page || page.value,
        pageSize: 12,
      })
      const data = await api.get(`/favorites?${q}`)
      favorites.value = data.list
      total.value = data.total
      page.value = data.page
    } finally {
      loading.value = false
    }
  }

  async function toggleFav(petId) {
    if (!auth.isLoggedIn) throw new Error('请先登录')
    const data = await api.post('/favorites', { pet_id: petId })
    if (data.favorited) {
      favoritedIds.value.add(petId)
    } else {
      favoritedIds.value.delete(petId)
    }
    return data
  }

  async function checkFav(petId) {
    if (!auth.isLoggedIn) return false
    const data = await api.get(`/favorites/check/${petId}`)
    if (data.favorited) {
      favoritedIds.value.add(petId)
    }
    return data.favorited
  }

  async function checkFavBatch(petIds) {
    if (!auth.isLoggedIn || petIds.length === 0) return
    const data = await api.post('/favorites/check-batch', { pet_ids: petIds })
    favoritedIds.value = new Set(data.favoritedIds)
  }

  return { favorites, total, page, loading, favoritedIds, fetchFavorites, toggleFav, checkFav, checkFavBatch }
})
