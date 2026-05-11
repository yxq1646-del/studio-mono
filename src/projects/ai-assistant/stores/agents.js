import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useAgentStore = defineStore('agents', () => {
  const api = useApi()
  const agents = ref([])
  const loading = ref(false)

  async function loadAgents() {
    loading.value = true
    try {
      agents.value = await api.get('/agents')
    } catch { /* server may not be ready */ }
    finally { loading.value = false }
  }

  return { agents, loading, loadAgents }
})
