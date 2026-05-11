<template>
  <div class="fav-page">
    <div class="section-wrapper">
      <div class="fav-page__head">
        <a href="/pets" class="fav-page__back">← 返回宠物列表</a>
        <h1 class="fav-page__title">❤️ 我的收藏</h1>
        <p class="fav-page__sub">你关注的毛孩子</p>
      </div>

      <div v-if="!auth.isLoggedIn" class="fav-page__login">
        <p>请先登录查看收藏列表</p>
        <router-link to="/admin/login" class="fav-page__login-btn">去登录</router-link>
      </div>

      <div v-else-if="loading" class="fav-page__status">加载中...</div>

      <div v-else-if="favorites.length === 0" class="fav-page__empty">
        <p class="fav-page__empty-icon">💔</p>
        <p>还没有收藏任何宠物</p>
        <router-link to="/pets" class="fav-page__browse-btn">去逛逛</router-link>
      </div>

      <template v-else>
        <div class="fav-page__grid">
          <PetCard v-for="item in favorites" :key="item.fav_id" :pet="item" />
        </div>

        <div class="fav-page__pager" v-if="total > 12">
          <button :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
          <span>{{ page }} / {{ Math.ceil(total / 12) }}</span>
          <button :disabled="page >= Math.ceil(total / 12)" @click="goPage(page + 1)">下一页</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFavoriteStore } from '@/projects/pet-platform/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import PetCard from '@/projects/pet-platform/components/PetCard.vue'

const favStore = useFavoriteStore()
const auth = useAuthStore()
const { favorites, total, page, loading } = storeToRefs(favStore)

function goPage(p) {
  favStore.fetchFavorites({ page: p })
}

onMounted(() => {
  if (auth.isLoggedIn) {
    favStore.fetchFavorites()
  }
})
</script>

<style scoped>
.fav-page {
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
.fav-page__head { margin-bottom: 48px; }
.fav-page__back { display: inline-block; margin-bottom: 24px; font-size: 15px; color: var(--color-text-muted); transition: color 0.3s; }
.fav-page__back:hover { color: var(--color-accent); }
.fav-page__title { font-family: var(--font-title); font-size: clamp(32px, 5vw, 56px); color: var(--color-black); }
.fav-page__sub { font-size: 16px; color: var(--color-text-muted); margin-top: 8px; }
.fav-page__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.fav-page__status, .fav-page__empty { text-align: center; padding: 64px; color: var(--color-text-muted); font-size: 16px; }
.fav-page__empty-icon { font-size: 48px; margin-bottom: 16px; }
.fav-page__browse-btn { display: inline-block; margin-top: 16px; padding: 12px 32px; background: var(--color-accent); color: var(--color-black); font-weight: 600; border-radius: 100px; font-size: 14px; }
.fav-page__login { text-align: center; padding: 64px; }
.fav-page__login p { font-size: 16px; color: var(--color-text-muted); margin-bottom: 16px; }
.fav-page__login-btn { display: inline-block; padding: 12px 32px; background: var(--color-accent); color: var(--color-black); font-weight: 600; border-radius: 100px; font-size: 14px; }
.fav-page__pager { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 40px; font-size: 14px; }
.fav-page__pager button { padding: 10px 24px; font-size: 14px; background: var(--color-white); border: 1px solid var(--color-border); border-radius: 100px; cursor: pointer; }

@media (max-width: 768px) {
  .fav-page { padding: 100px 0 60px; }
  .fav-page__title { font-size: 28px; }
  .fav-page__grid { grid-template-columns: 1fr; gap: 16px; }
  .fav-page__status, .fav-page__empty, .fav-page__login { padding: 40px 16px; }
}
</style>
