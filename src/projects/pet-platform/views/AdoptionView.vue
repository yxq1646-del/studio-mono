<template>
  <div class="av" v-if="pet">
    <div class="section-wrapper">
      <a :href="`/pets/${pet.id}`" class="av__back">← 返回详情</a>
      <div class="av__grid">
        <div class="av__summary">
          <div class="av__pet-card">
            <img v-if="pet.image_url" :src="pet.image_url" :alt="pet.name" />
            <h3>{{ pet.name }}</h3>
            <p>{{ speciesMap[pet.species] }} · {{ pet.breed }}</p>
          </div>
        </div>
        <div class="av__form-wrap">
          <h1 class="av__title">领养申请</h1>
          <p class="av__sub">填写以下信息，我们会尽快审核</p>
          <form class="av__form" @submit.prevent="handleSubmit">
            <div class="av__field">
              <label>姓名 *</label>
              <input v-model="form.applicant_name" type="text" required />
            </div>
            <div class="av__field">
              <label>电话 *</label>
              <input v-model="form.applicant_phone" type="tel" required />
            </div>
            <div class="av__field">
              <label>邮箱</label>
              <input v-model="form.applicant_email" type="email" />
            </div>
            <div class="av__field">
              <label>住房类型</label>
              <select v-model="form.housing_type">
                <option value="">请选择</option>
                <option value="apartment">公寓</option>
                <option value="house">独栋房屋</option>
                <option value="shared">合租</option>
              </select>
            </div>
            <div class="av__field">
              <label class="av__check">
                <input type="checkbox" v-model="form.has_experience" />
                有养宠经验
              </label>
            </div>
            <div class="av__field">
              <label>申请理由</label>
              <textarea v-model="form.reason" rows="4" placeholder="说说你为什么想领养 TA..."></textarea>
            </div>
            <p v-if="error" class="av__error">{{ error }}</p>
            <p v-if="success" class="av__success">申请已提交！我们会尽快联系你。</p>
            <button v-if="!success" type="submit" class="av__btn" :disabled="submitting">
              {{ submitting ? '提交中...' : '提交申请' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePetStore } from '@/projects/pet-platform/stores/pets'

const route = useRoute()
const store = usePetStore()
const pet = ref(null)
const error = ref('')
const success = ref(false)
const submitting = ref(false)
const speciesMap = { cat: '🐱 猫', dog: '🐶 狗', bird: '🐦 鸟', other: '🐰 其他' }

const form = reactive({
  pet_id: null,
  applicant_name: '',
  applicant_phone: '',
  applicant_email: '',
  housing_type: '',
  has_experience: false,
  reason: '',
})

onMounted(async () => {
  pet.value = await store.fetchPet(route.params.id)
  form.pet_id = pet.value.id
})

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await store.submitAdoption({ ...form })
    success.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.av {
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
.av__back { display: inline-block; margin-bottom: 40px; font-size: 15px; color: var(--color-text-muted); }
.av__back:hover { color: var(--color-accent); }
.av__grid { display: grid; grid-template-columns: 300px 1fr; gap: 64px; }
.av__pet-card { background: var(--color-white); border-radius: 16px; overflow: hidden; border: 1px solid var(--color-border); }
.av__pet-card img { width: 100%; aspect-ratio: 1; object-fit: cover; }
.av__pet-card h3 { font-family: var(--font-title); font-size: 22px; padding: 16px 20px 4px; color: var(--color-black); }
.av__pet-card p { font-size: 14px; padding: 0 20px 16px; color: var(--color-text-muted); }
.av__title { font-family: var(--font-title); font-size: 36px; color: var(--color-black); }
.av__sub { font-size: 16px; color: var(--color-text-muted); margin: 8px 0 32px; }
.av__field { margin-bottom: 20px; }
.av__field label { display: block; font-size: 14px; color: var(--color-text); margin-bottom: 6px; }
.av__field input, .av__field select, .av__field textarea {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-family: var(--font-body);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-white);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.3s;
}
.av__field input:focus, .av__field select:focus, .av__field textarea:focus { border-color: var(--color-accent); }
.av__check { display: flex; align-items: center; gap: 8px; }
.av__check input { width: auto; }
.av__error { color: #ff4444; font-size: 14px; margin-bottom: 16px; }
.av__success { color: #4a9e4a; font-size: 15px; padding: 16px; background: rgba(74,158,74,0.08); border-radius: 8px; margin-bottom: 16px; }
.av__btn {
  padding: 14px 48px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-black);
  background: var(--color-accent);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: opacity 0.3s;
}
.av__btn:hover { opacity: 0.85; }
.av__btn:disabled { opacity: 0.5; }
@media (max-width: 768px) {
  .av__grid { grid-template-columns: 1fr; gap: 32px; }
}
</style>
