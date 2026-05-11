import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    component: () => import('@/views/HomeView.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/admin',
    redirect: '/admin/login',
  },
  {
    path: '/admin/login',
    component: () => import('@/projects/admin/views/LoginView.vue'),
    meta: { layout: 'none' }
  },
  {
    path: '/admin/dashboard',
    component: () => import('@/projects/admin/views/DashboardView.vue'),
    meta: { layout: 'admin', requiresAuth: true }
  },
  {
    path: '/admin/users',
    component: () => import('@/projects/admin/views/UsersView.vue'),
    meta: { layout: 'admin', requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/admin/pets',
    component: () => import('@/projects/admin/views/AdminPetsView.vue'),
    meta: { layout: 'admin', requiresAuth: true, roles: ['admin', 'editor'] }
  },
  {
    path: '/admin/adoptions',
    component: () => import('@/projects/admin/views/AdminAdoptionsView.vue'),
    meta: { layout: 'admin', requiresAuth: true, roles: ['admin', 'editor'] }
  },
  {
    path: '/admin/agents',
    component: () => import('@/projects/admin/views/AdminAgentsView.vue'),
    meta: { layout: 'admin', requiresAuth: true, roles: ['admin', 'editor'] }
  },
  {
    path: '/admin/logs',
    component: () => import('@/projects/admin/views/AdminLogsView.vue'),
    meta: { layout: 'admin', requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/pets',
    component: () => import('@/projects/pet-platform/views/PetListView.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/pets/:id',
    component: () => import('@/projects/pet-platform/views/PetDetailView.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/pets/:id/adopt',
    component: () => import('@/projects/pet-platform/views/AdoptionView.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/favorites',
    component: () => import('@/projects/pet-platform/views/FavoritesView.vue'),
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

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next('/admin/login')
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return next('/admin/dashboard')
  }
  next()
})

export default router
