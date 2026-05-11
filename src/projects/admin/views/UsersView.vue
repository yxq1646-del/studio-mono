<template>
  <div class="uv">
    <div class="uv__head">
      <h1 class="uv__title">用户管理</h1>
      <button class="uv__btn" @click="openForm()">+ 新增用户</button>
      <button class="uv__btn uv__btn--export" @click="exportExcel">📥 导出表格</button>
    </div>

    <div class="uv__filters">
      <input v-model="search" class="uv__search" placeholder="搜索用户名 / 邮箱..." @input="onSearch" />
      <select v-model="roleFilter" class="uv__select" @change="load">
        <option value="">全部角色</option>
        <option value="admin">管理员</option>
        <option value="editor">编辑者</option>
        <option value="viewer">访客</option>
      </select>
      <select v-model="statusFilter" class="uv__select" @change="load">
        <option value="">全部状态</option>
        <option value="active">正常</option>
        <option value="disabled">禁用</option>
      </select>
    </div>

    <table v-if="users.length" class="uv__table">
      <thead>
        <tr>
          <th>用户名</th>
          <th>显示名</th>
          <th>邮箱</th>
          <th>角色</th>
          <th>状态</th>
          <th>最后登录</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td class="uv__username">{{ u.username }}</td>
          <td>{{ u.display_name }}</td>
          <td>{{ u.email || '-' }}</td>
          <td><span class="uv__role" :class="'uv__role--' + u.role">{{ roleMap[u.role] || u.role }}</span></td>
          <td><span class="uv__status" :class="'uv__status--' + u.status">{{ u.status === 'active' ? '正常' : '禁用' }}</span></td>
          <td class="uv__time">{{ u.last_login_at || '-' }}</td>
          <td>
            <button class="uv__action" @click="openForm(u)">编辑</button>
            <button v-if="u.status === 'active'" class="uv__action uv__action--del" @click="handleDelete(u)">禁用</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else-if="!loading" class="uv__empty">暂无用户</p>

    <div class="uv__pager" v-if="total > pageSize">
      <button :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
      <span>{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="goPage(page + 1)">下一页</button>
    </div>

    <!-- 表单弹窗 -->
    <Teleport to="body">
      <div v-if="showForm" class="uv__modal" @click.self="showForm = false">
        <div class="uv__modal-card">
          <h2 class="uv__modal-title">{{ editingUser ? '编辑用户' : '新增用户' }}</h2>
          <form @submit.prevent="handleSubmit">
            <div class="uv__field">
              <label>用户名</label>
              <input v-model="form.username" type="text" required :disabled="!!editingUser" />
            </div>
            <div class="uv__field">
              <label>显示名称</label>
              <input v-model="form.display_name" type="text" required />
            </div>
            <div class="uv__field">
              <label>邮箱</label>
              <input v-model="form.email" type="email" />
            </div>
            <div class="uv__field">
              <label>密码{{ editingUser ? '（留空不修改）' : '' }}</label>
              <input v-model="form.password" type="password" :required="!editingUser" />
            </div>
            <div class="uv__field">
              <label>角色</label>
              <select v-model="form.role">
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div class="uv__field" v-if="editingUser">
              <label>状态</label>
              <select v-model="form.status">
                <option value="active">正常</option>
                <option value="disabled">禁用</option>
              </select>
            </div>
            <p v-if="formError" class="uv__form-error">{{ formError }}</p>
            <div class="uv__form-actions">
              <button type="button" class="uv__btn-cancel" @click="showForm = false">取消</button>
              <button type="submit" class="uv__btn">{{ editingUser ? '更新' : '创建' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '@/projects/admin/stores/admin'
import { useApi } from '@/composables/useApi'

const admin = useAdminStore()
const api = useApi()
const { users, total, page, pageSize, loading } = storeToRefs(admin)

const search = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const showForm = ref(false)
const editingUser = ref(null)
const formError = ref('')

const roleMap = { admin: '管理员', editor: '编辑者', viewer: '访客' }

const form = reactive({
  username: '', display_name: '', email: '', password: '', role: 'viewer', status: 'active'
})

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 300)
}

function load() {
  admin.fetchUsers({ search: search.value, role: roleFilter.value, status: statusFilter.value })
}

function openForm(user) {
  editingUser.value = user || null
  if (user) {
    Object.assign(form, {
      username: user.username,
      display_name: user.display_name,
      email: user.email || '',
      password: '',
      role: user.role,
      status: user.status,
    })
  } else {
    Object.assign(form, {
      username: '', display_name: '', email: '', password: '', role: 'viewer', status: 'active'
    })
  }
  formError.value = ''
  showForm.value = true
}

async function handleSubmit() {
  formError.value = ''
  try {
    if (editingUser.value) {
      await admin.updateUser(editingUser.value.id, { ...form, password: form.password || undefined })
    } else {
      await admin.createUser(form)
    }
    showForm.value = false
  } catch (e) {
    formError.value = e.message
  }
}

async function handleDelete(user) {
  if (confirm(`确定禁用用户「${user.username}」吗？`)) {
    await admin.deleteUser(user.id)
  }
}

function exportExcel() {
  const role = roleFilter.value ? `&role=${roleFilter.value}` : ''
  const status = statusFilter.value ? `&status=${statusFilter.value}` : ''
  window.open(`/api/export/users?${role}${status}`, '_blank')
}

function goPage(p) {
  admin.fetchUsers({ search: search.value, role: roleFilter.value, status: statusFilter.value, page: p })
}

onMounted(load)
</script>

<style scoped>
.uv { max-width: 960px; }
.uv__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.uv__title { font-family: var(--font-title); font-size: 28px; color: var(--color-black); }
.uv__btn {
  padding: 10px 24px;
  font-size: 14px;
  color: var(--color-black);
  background: var(--color-accent);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}
.uv__btn--export { background: var(--color-bg-alt); color: var(--color-text); }
.uv__filters { display: flex; gap: 12px; margin-bottom: 24px; }
.uv__search, .uv__select {
  padding: 10px 16px;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-white);
  color: var(--color-text);
  outline: none;
}
.uv__search { flex: 1; max-width: 280px; }
.uv__select { min-width: 120px; }
.uv__table { width: 100%; border-collapse: collapse; background: var(--color-white); border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border); }
.uv__table th, .uv__table td { padding: 14px 16px; text-align: left; font-size: 14px; }
.uv__table th { background: var(--color-bg-alt); color: var(--color-text-muted); font-weight: 500; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
.uv__table td { border-top: 1px solid var(--color-border); }
.uv__username { font-weight: 600; color: var(--color-black); }
.uv__role { display: inline-block; padding: 2px 10px; font-size: 12px; border-radius: 100px; background: var(--color-bg-alt); }
.uv__role--admin { background: var(--color-accent); color: var(--color-black); }
.uv__status { display: inline-block; padding: 2px 10px; font-size: 12px; border-radius: 100px; }
.uv__status--active { background: rgba(196,240,0,0.15); color: #5a8a00; }
.uv__status--disabled { background: rgba(255,0,0,0.08); color: #cc0000; }
.uv__time { font-family: var(--font-mono); font-size: 12px; color: var(--color-text-muted); }
.uv__action { padding: 4px 12px; font-size: 12px; color: var(--color-text); background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; margin-right: 6px; }
.uv__action--del { color: #cc0000; }
.uv__pager { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 24px; font-size: 14px; color: var(--color-text-muted); }
.uv__pager button { padding: 8px 18px; font-size: 13px; background: var(--color-white); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; }
.uv__empty { text-align: center; padding: 48px; color: var(--color-text-muted); }

.uv__modal { position: fixed; inset: 0; z-index: 20000; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 24px; }
.uv__modal-card { background: var(--color-white); border-radius: 16px; padding: 36px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.uv__modal-title { font-family: var(--font-title); font-size: 22px; margin-bottom: 24px; color: var(--color-black); }
.uv__field { margin-bottom: 16px; }
.uv__field label { display: block; font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; }
.uv__field input, .uv__field select { width: 100%; padding: 10px 14px; font-size: 14px; border: 1px solid var(--color-border); border-radius: 8px; outline: none; background: var(--color-bg); color: var(--color-text); }
.uv__field input:focus, .uv__field select:focus { border-color: var(--color-accent); }
.uv__form-error { color: #ff4444; font-size: 13px; margin-bottom: 16px; }
.uv__form-actions { display: flex; justify-content: flex-end; gap: 12px; }
.uv__btn-cancel { padding: 10px 24px; font-size: 14px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; cursor: pointer; }

@media (max-width: 768px) {
  .uv__head { flex-direction: column; align-items: flex-start; gap: 12px; }
  .uv__title { font-size: 22px; }
  .uv__filters { flex-direction: column; }
  .uv__search { max-width: 100%; }
  .uv__select { min-width: 0; }
  .uv__table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .uv__modal-card { padding: 24px; max-width: 90vw; }
}
</style>
