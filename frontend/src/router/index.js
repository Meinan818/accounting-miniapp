import { createRouter, createWebHistory } from 'vue-router'
import { isSupabaseConfigured } from '@/api/supabase'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/Chat.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/add',
    name: 'Add',
    component: () => import('@/views/Add.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bills',
    name: 'Bills',
    component: () => import('@/views/Bills.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/Stats.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth

  // Supabase 尚未配置时允许浏览占位页面，配置完成后自动启用登录守卫。
  if (requiresAuth && isSupabaseConfigured && !userStore.isLoggedIn) {
    return { name: 'Login' }
  }

  if (to.name === 'Login' && isSupabaseConfigured && userStore.isLoggedIn) {
    return { name: 'Home' }
  }

  return true
})

export default router
