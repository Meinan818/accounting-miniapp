import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { isSupabaseConfigured, supabase } from '@/api/supabase'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const session = ref(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => Boolean(session.value))

  async function loadSession() {
    if (!isSupabaseConfigured) {
      return
    }

    loading.value = true

    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      session.value = data.session
      user.value = data.session?.user || null
    } catch (error) {
      console.warn('读取登录状态失败：', error.message)
    } finally {
      loading.value = false
    }
  }

  function setSession(newSession) {
    session.value = newSession
    user.value = newSession?.user || null
  }

  function logout() {
    session.value = null
    user.value = null
  }

  return {
    user,
    session,
    loading,
    isLoggedIn,
    loadSession,
    setSession,
    logout,
  }
})
