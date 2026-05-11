<template>
  <div class="apv">
    <div class="apv__head">
      <h1 class="apv__title">宠物管理</h1>
      <button class="apv__btn" @click="openForm()">+ 新增宠物</button>
      <button class="apv__btn apv__btn--export" @click="exportExcel">📥 导出表格</button>
    </div>

    <table v-if="pets.length" class="apv__table">
      <thead>
        <tr>
          <th>ID</th><th>图片</th><th>名称</th><th>种类</th><th>品种</th>
          <th>状态</th><th>城市</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in pets" :key="p.id">
          <td>{{ p.id }}</td>
          <td><img v-if="p.image_url" :src="p.image_url" class="apv__thumb" /></td>
          <td>{{ p.name }}</td>
          <td>{{ p.species }}</td>
          <td>{{ p.breed || '-' }}</td>
          <td><span :class="'apv__status--' + p.status">{{ statusMap[p.status] }}</span></td>
          <td>{{ p.location_city }}</td>
          <td>
            <button class="apv__action" @click="openForm(p)">编辑</button>
            <button class="apv__action apv__action--del" @click="handleDelete(p)">下架</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="apv__empty">加载中...</p>

    <!-- 表单弹窗 -->
    <Teleport to="body">
      <div v-if="showForm" class="apv__modal" @click.self="showForm = false">
        <div class="apv__modal-card">
          <h2>{{ editing ? '编辑' : '新增' }}宠物</h2>
          <form @submit.prevent="handleSubmit">
            <div class="apv__row">
              <div class="apv__field"><label>名称*</label><input v-model="form.name" required /></div>
              <div class="apv__field"><label>种类*</label>
                <select v-model="form.species"><option value="cat">猫</option><option value="dog">狗</option><option value="bird">鸟</option><option value="other">其他</option></select>
              </div>
            </div>
            <div class="apv__row">
              <div class="apv__field"><label>品种</label><input v-model="form.breed" /></div>
              <div class="apv__field"><label>年龄</label>
                <select v-model="form.age_group"><option value="">-</option><option value="baby">幼年</option><option value="young">年轻</option><option value="adult">成年</option><option value="senior">老年</option></select>
              </div>
            </div>
            <div class="apv__row">
              <div class="apv__field"><label>性别</label>
                <select v-model="form.gender"><option value="">-</option><option value="male">公</option><option value="female">母</option></select>
              </div>
              <div class="apv__field"><label>体型</label>
                <select v-model="form.size_group"><option value="">-</option><option value="small">小型</option><option value="medium">中型</option><option value="large">大型</option></select>
              </div>
            </div>
            <div class="apv__field"><label>城市</label><input v-model="form.location_city" /></div>
            <div class="apv__field"><label>图片 URL</label><input v-model="form.image_url" placeholder="https://..." /></div>
            <div class="apv__field"><label>描述</label><textarea v-model="form.description" rows="3"></textarea></div>
            <div class="apv__field" v-if="editing"><label>状态</label>
              <select v-model="form.status"><option value="available">可领养</option><option value="pending">申请中</option><option value="adopted">已领养</option></select>
            </div>
            <div class="apv__actions">
              <button type="button" class="apv__cancel" @click="showForm = false">取消</button>
              <button type="submit" class="apv__btn">{{ editing ? '更新' : '创建' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'

const api = useApi()
const auth = useAuthStore()
const pets = ref([])
const showForm = ref(false)
const editing = ref(false)
const statusMap = { available: '可领养', pending: '申请中', adopted: '已领养' }

const form = reactive({ name: '', species: 'cat', breed: '', age_group: '', gender: '', size_group: '', description: '', image_url: '', location_city: '', status: 'available' })

async function load() {
  const data = await api.get('/pets?status=&pageSize=50')
  pets.value = data.list
}

function openForm(pet) {
  editing.value = !!pet
  if (pet) Object.assign(form, pet)
  else Object.assign(form, { name: '', species: 'cat', breed: '', age_group: '', gender: '', size_group: '', description: '', image_url: '', location_city: '', status: 'available' })
  showForm.value = true
}

async function handleSubmit() {
  if (editing.value) {
    await api.put(`/pets/${form.id}`, form)
  } else {
    await api.post('/pets', form)
  }
  showForm.value = false
  load()
}

function exportExcel() {
  window.open('/api/export/pets', '_blank')
}

async function handleDelete(pet) {
  if (confirm(`确定下架「${pet.name}」吗？`)) {
    await api.del(`/pets/${pet.id}`)
    load()
  }
}

onMounted(load)
</script>

<style scoped>
.apv { max-width: 960px; }
.apv__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.apv__title { font-family: var(--font-title); font-size: 28px; color: var(--color-black); }
.apv__btn { padding: 10px 24px; font-size: 14px; color: var(--color-black); background: var(--color-accent); border: none; border-radius: 8px; cursor: pointer; }
.apv__table { width: 100%; border-collapse: collapse; background: var(--color-white); border-radius: 12px; overflow: hidden; border: 1px solid var(--color-border); }
.apv__table th, .apv__table td { padding: 12px 14px; font-size: 13px; text-align: left; }
.apv__table th { background: var(--color-bg-alt); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-size: 12px; }
.apv__table td { border-top: 1px solid var(--color-border); }
.apv__thumb { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; }
.apv__status--available { color: #4a9e4a; font-weight: 500; }
.apv__status--pending { color: #f0a040; }
.apv__status--adopted { color: var(--color-text-muted); }
.apv__action { padding: 4px 12px; font-size: 12px; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; margin-right: 6px; }
.apv__action--del { color: #cc0000; }
.apv__empty { text-align: center; padding: 48px; color: var(--color-text-muted); }
.apv__modal { position: fixed; inset: 0; z-index: 20000; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
.apv__modal-card { background: var(--color-white); border-radius: 16px; padding: 32px; width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; }
.apv__modal-card h2 { font-family: var(--font-title); font-size: 22px; margin-bottom: 24px; }
.apv__row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.apv__field { margin-bottom: 16px; }
.apv__field label { display: block; font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; }
.apv__field input, .apv__field select, .apv__field textarea { width: 100%; padding: 10px 14px; font-size: 14px; border: 1px solid var(--color-border); border-radius: 8px; outline: none; background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); }
.apv__field input:focus, .apv__field select:focus, .apv__field textarea:focus { border-color: var(--color-accent); }
.apv__actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.apv__cancel { padding: 10px 24px; font-size: 14px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; cursor: pointer; }
.apv__btn--export { background: var(--color-bg-alt); color: var(--color-text); }

@media (max-width: 768px) {
  .apv__head { flex-direction: column; align-items: flex-start; gap: 12px; }
  .apv__title { font-size: 22px; }
  .apv__table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .apv__modal-card { padding: 24px; max-width: 90vw; }
  .apv__row { grid-template-columns: 1fr; }
}
</style>
