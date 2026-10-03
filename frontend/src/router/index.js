import { createRouter, createWebHistory } from 'vue-router'
import { getScrollPosition } from '@/utils/navigation'
import { SERVER_MODE } from '@/api/mode'
import { useAuthStore } from '@/stores/authStore'
import { useRecordStore } from '@/stores/recordStore'

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
  scrollBehavior: getScrollPosition,
})

if (SERVER_MODE) router.beforeEach(async to => {
  const auth = useAuthStore()
  if (['unknown', 'unavailable'].includes(auth.status)) {
    try { await auth.restore() } catch { if (to.name !== 'Login') return { name: 'Login' } }
  }
  if (to.meta.requiresAuth && !auth.user) return { name: 'Login' }
  if (to.name === 'Login' && auth.user) return { name: 'Home' }
  if (to.meta.requiresAuth) await useRecordStore().refresh()
})

export default router
