import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useAdminStore = defineStore('admin', () => {
  const api = useApi()

  const users = ref([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)
  const stats = ref(null)

  async function fetchUsers(params = {}) {
    loading.value = true
    try {
      const q = new URLSearchParams({
        page: params.page || page.value,
        pageSize: params.pageSize || pageSize.value,
        search: params.search || '',
        role: params.role || '',
        status: params.status || '',
      })
      const data = await api.get(`/users?${q}`)
      users.value = data.list
      total.value = data.total
      page.value = data.page
    } finally {
      loading.value = false
    }
  }

  async function createUser(body) {
    await api.post('/users', body)
    await fetchUsers()
  }

  async function updateUser(id, body) {
    await api.put(`/users/${id}`, body)
    await fetchUsers()
  }

  async function deleteUser(id) {
    await api.del(`/users/${id}`)
    await fetchUsers()
  }

  async function fetchStats() {
    stats.value = await api.get('/stats')
  }

  return { users, total, page, pageSize, loading, stats, fetchUsers, createUser, updateUser, deleteUser, fetchStats }
})
