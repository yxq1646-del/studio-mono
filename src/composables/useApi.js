import { useAuthStore } from '@/stores/auth'

const BASE = '/api'

export function useApi() {
  const auth = useAuthStore()

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`
    }
    const res = await fetch(`${BASE}${path}`, { ...options, headers })
    if (res.status === 401) {
      auth.logout()
      throw new Error('登录已过期')
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || '请求失败')
    }
    return res.json()
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    del: (path) => request(path, { method: 'DELETE' }),

    stream(path, body, onChunk, onDone, onError) {
      const headers = { 'Content-Type': 'application/json' }
      if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`

      fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.text()
            onError(new Error(err))
            return
          }
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) { onDone?.(); break }
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.type === 'done') { onDone?.(); return }
                  if (data.type === 'error') { onError(new Error(data.message)); return }
                  onChunk(data)
                } catch { /* ignore */ }
              }
            }
          }
        })
        .catch(onError)
    }
  }
}
