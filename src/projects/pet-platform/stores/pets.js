import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const usePetStore = defineStore('pets', () => {
  const api = useApi()

  const pets = ref([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const currentPet = ref(null)

  async function fetchPets(params = {}) {
    loading.value = true
    try {
      const q = new URLSearchParams({
        page: params.page || page.value,
        pageSize: params.pageSize || 12,
        species: params.species || '',
        size: params.size || '',
        status: params.status || 'available',
        search: params.search || '',
      })
      if (params.nearLat) q.set('nearLat', params.nearLat)
      if (params.nearLng) q.set('nearLng', params.nearLng)
      const data = await api.get(`/pets?${q}`)
      pets.value = data.list
      total.value = data.total
      page.value = data.page
    } finally {
      loading.value = false
    }
  }

  async function fetchPet(id) {
    currentPet.value = await api.get(`/pets/${id}`)
    return currentPet.value
  }

  async function submitAdoption(body) {
    return await api.post('/adoptions', body)
  }

  return { pets, total, page, loading, currentPet, fetchPets, fetchPet, submitAdoption }
})
