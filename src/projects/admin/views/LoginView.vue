<template>
  <div class="login">
    <!-- 背景粒子 -->
    <div class="login__particles">
      <span v-for="i in 20" :key="i" class="login__particle" :style="particleStyle(i)" />
    </div>

    <!-- 毛玻璃卡片 -->
    <div ref="card" class="login__card" :class="{ 'login__card--shake': shaking }">
      <!-- 品牌区 -->
      <div ref="brand" class="login__brand">
        <div class="login__logo">
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#logo-grad)" />
            <path d="M14 34L24 14L34 34H14Z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" fill="none" />
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0%" stop-color="#10b981" />
                <stop offset="100%" stop-color="#059669" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="login__title">后台管理系统</h1>
        <p class="login__welcome">欢迎回来，请登录</p>
      </div>

      <!-- 表单 -->
      <form class="login__form" @submit.prevent="handleLogin">
        <!-- 用户名 -->
        <div ref="fieldUser" class="login__field" :class="{ 'login__field--error': error && !username, 'login__field--focus': activeField === 'user' }">
          <div class="login__input-wrap">
            <svg class="login__input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              v-model="username"
              class="login__input"
              type="text"
              autocomplete="username"
              @focus="activeField = 'user'"
              @blur="activeField = ''"
            />
            <label class="login__float-label" :class="{ 'login__float-label--up': activeField === 'user' || username }">用户名</label>
            <span class="login__border-line" />
          </div>
        </div>

        <!-- 密码 -->
        <div ref="fieldPass" class="login__field" :class="{ 'login__field--error': error && !password, 'login__field--focus': activeField === 'pass' }">
          <div class="login__input-wrap">
            <svg class="login__input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <input
              v-model="password"
              class="login__input"
              :type="showPwd ? 'text' : 'password'"
              autocomplete="current-password"
              @focus="activeField = 'pass'"
              @blur="activeField = ''"
            />
            <label class="login__float-label" :class="{ 'login__float-label--up': activeField === 'pass' || password }">密码</label>
            <button type="button" class="login__eye" @click="showPwd = !showPwd" tabindex="-1">
              <!-- 睁眼 -->
              <svg v-if="showPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <!-- 闭眼 -->
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
            <span class="login__border-line" />
          </div>
        </div>

        <!-- 错误提示 -->
        <p v-if="error" ref="errorMsg" class="login__error">{{ error }}</p>

        <!-- 记住我 & 忘记密码 -->
        <div ref="rowExtra" class="login__extra">
          <label class="login__remember">
            <input type="checkbox" v-model="rememberMe" />
            <span class="login__checkmark" />
            记住我
          </label>
          <a href="#" class="login__forgot" @click.prevent>忘记密码？</a>
        </div>

        <!-- 登录按钮 -->
        <button ref="btn" class="login__btn" type="submit" :disabled="loading" @click="ripple">
          <span v-if="loading" class="login__btn-spinner" />
          <span>{{ loading ? '登录中...' : '登 录' }}</span>
        </button>
      </form>

      <!-- 底部链接 -->
      <div ref="footer" class="login__footer">
        <p>还没有账号？<a href="#" @click.prevent>联系管理员开通</a></p>
      </div>
    </div>

    <!-- 返回首页 -->
    <a href="/" class="login__home">← 返回首页</a>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import gsap from 'gsap'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPwd = ref(false)
const rememberMe = ref(false)
const activeField = ref('')
const shaking = ref(false)

// DOM refs for GSAP
const card = ref(null)
const brand = ref(null)
const fieldUser = ref(null)
const fieldPass = ref(null)
const rowExtra = ref(null)
const btn = ref(null)
const footerEl = ref(null)
const errorMsg = ref(null)

function particleStyle(i) {
  const size = 2 + Math.random() * 4
  return {
    left: `${Math.random() * 100}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${6 + Math.random() * 8}s`,
    opacity: Math.random() * 0.4 + 0.1,
  }
}

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请填写完整信息'
    triggerShake()
    return
  }
  loading.value = true
  error.value = ''
  try {
    await auth.login(username.value, password.value)
    router.push('/admin/dashboard')
  } catch (e) {
    error.value = e.message
    triggerShake()
  } finally {
    loading.value = false
  }
}

function triggerShake() {
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 500)
}

function ripple(e) {
  // 简单涟漪：无需额外DOM，CSS :active + transition处理
}

// ===== GSAP 入场动画 =====
onMounted(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  tl.from(card.value, {
    y: 60, opacity: 0, duration: 0.8,
  })

  tl.from(brand.value, {
    y: 24, opacity: 0, duration: 0.5,
  }, '-=0.3')

  const fields = [fieldUser.value, fieldPass.value]
  fields.forEach((el, i) => {
    if (!el) return
    tl.from(el, {
      x: -28, opacity: 0, duration: 0.45,
    }, `-=0.25`)
  })

  tl.from(rowExtra.value, {
    y: 12, opacity: 0, duration: 0.4,
  }, '-=0.2')

  tl.from(btn.value, {
    y: 20, opacity: 0, scale: 0.95, duration: 0.5,
  }, '-=0.15')

  tl.from(footerEl.value, {
    y: 12, opacity: 0, duration: 0.4,
  }, '-=0.2')
})
</script>

<style scoped>
/* ====== 背景 ====== */
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* ====== 背景粒子 ====== */
.login__particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.login__particle {
  position: absolute;
  bottom: -12px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.25);
  animation: particleFloat linear infinite;
}
@keyframes particleFloat {
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
}

/* ====== 毛玻璃卡片 ====== */
.login__card {
  width: 100%;
  max-width: 420px;
  padding: 44px 40px 36px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

/* 抖动 */
.login__card--shake {
  animation: shake 0.5s ease-in-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 50%, 90% { transform: translateX(-6px); }
  30%, 70% { transform: translateX(6px); }
}

/* ====== 品牌区 ====== */
.login__brand {
  text-align: center;
  margin-bottom: 36px;
}
.login__logo {
  display: inline-flex;
  margin-bottom: 20px;
  filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3));
}
.login__title {
  font-family: 'Georgia', 'Noto Serif SC', serif;
  font-size: 26px;
  font-weight: 400;
  color: #f1f5f9;
  margin-bottom: 6px;
  letter-spacing: 0.04em;
}
.login__welcome {
  font-size: 14px;
  color: rgba(148, 163, 184, 0.8);
}

/* ====== 输入框区域 ====== */
.login__form {
  display: flex;
  flex-direction: column;
}
.login__field {
  margin-bottom: 22px;
}
.login__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

/* 图标 */
.login__input-icon {
  position: absolute;
  left: 14px;
  z-index: 2;
  color: rgba(148, 163, 184, 0.5);
  transition: all 0.35s;
  pointer-events: none;
}
.login__field--focus .login__input-icon {
  color: #10b981;
  transform: scale(1.12);
}

/* 输入框 */
.login__input {
  width: 100%;
  padding: 16px 44px 16px 44px;
  font-size: 15px;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.04);
  border: none;
  border-radius: 12px;
  outline: none;
  transition: background 0.3s;
  font-family: inherit;
}
.login__input:focus {
  background: rgba(255, 255, 255, 0.07);
}

/* 浮动标签 */
.login__float-label {
  position: absolute;
  left: 44px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  color: rgba(148, 163, 184, 0.5);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}
.login__float-label--up {
  top: 0;
  transform: translateY(-120%) scale(0.8);
  color: #10b981;
  font-size: 13px;
}

/* 底部绿色下划线 */
.login__border-line {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 1px;
}
.login__border-line::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 0;
  height: 2px;
  background: #10b981;
  border-radius: 1px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(-50%);
}
.login__field--focus .login__border-line::after {
  width: 100%;
}
.login__field--error .login__border-line::after {
  background: #ef4444;
  width: 100%;
}

/* 密码眼睛按钮 */
.login__eye {
  position: absolute;
  right: 12px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: rgba(148, 163, 184, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
  border-radius: 50%;
}
.login__eye:hover {
  color: #e2e8f0;
}

/* ====== 错误提示 ====== */
.login__error {
  color: #ef4444;
  font-size: 13px;
  margin: -8px 0 16px;
  padding-left: 4px;
}

/* ====== 记住我 & 忘记密码 ====== */
.login__extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.login__remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(148, 163, 184, 0.8);
  cursor: pointer;
  user-select: none;
}
.login__remember input {
  display: none;
}
.login__checkmark {
  width: 16px;
  height: 16px;
  border: 1.5px solid rgba(148, 163, 184, 0.4);
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}
.login__remember input:checked + .login__checkmark {
  background: #10b981;
  border-color: #10b981;
}
.login__remember input:checked + .login__checkmark::after {
  content: '';
  width: 5px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translateY(-0.5px);
}
.login__forgot {
  font-size: 13px;
  color: rgba(148, 163, 184, 0.7);
  transition: color 0.3s;
  text-decoration: none;
}
.login__forgot:hover {
  color: #10b981;
  text-decoration: underline;
}

/* ====== 登录按钮 ====== */
.login__btn {
  width: 100%;
  padding: 15px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 30px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.35s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  letter-spacing: 0.3em;
}
.login__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.35);
}
.login__btn:active {
  transform: translateY(0);
}
.login__btn:disabled {
  opacity: 0.7;
  cursor: wait;
  transform: none;
  box-shadow: none;
}

/* 加载旋转 */
.login__btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ====== 底部 ====== */
.login__footer {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: rgba(148, 163, 184, 0.6);
}
.login__footer a {
  color: #10b981;
  transition: color 0.3s;
}
.login__footer a:hover {
  color: #34d399;
}

/* ====== 返回首页 ====== */
.login__home {
  position: absolute;
  top: 28px;
  left: 28px;
  font-size: 13px;
  color: rgba(148, 163, 184, 0.6);
  transition: color 0.3s;
  z-index: 2;
}
.login__home:hover {
  color: #e2e8f0;
}

/* ====== 移动端适配 ====== */
@media (max-width: 480px) {
  .login__card {
    max-width: 100%;
    padding: 36px 28px 28px;
    border-radius: 20px;
  }
  .login__title {
    font-size: 22px;
  }
  .login__input {
    padding: 15px 40px 15px 40px;
    font-size: 14px;
  }
}
</style>
