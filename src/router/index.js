import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/HomeView.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/chat',
    component: () => import('@/projects/ai-assistant/views/ChatView.vue'),
    meta: { layout: 'none' }
  },
  {
    path: '/share/:token',
    component: () => import('@/projects/ai-assistant/views/ShareView.vue'),
    meta: { layout: 'none' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
