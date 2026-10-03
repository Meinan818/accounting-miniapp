import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { createApiClient } from '../api/client.js'
import { createSession } from '../api/session.js'
import { SERVER_MODE } from '../api/mode.js'

export const useAuthStore = defineStore('auth', () => {
  let session
  const api = markRaw(createApiClient({ fetcher: (...args) => globalThis.fetch(...args),
    getOwner: () => session?.user.value?.id ?? null, onUnauthorized: () => { if (session.user.value) session.expire() } }))
  session = createSession(api, { onIdentityChange: (next, previous) => {
    // 完整重新载入同时撤销旧页面异步操作和账号缓存，保留所有存储原文。
    if (SERVER_MODE && previous !== null && next === null) window.location.replace('/login')
  } })
  return { ...session, api }
})
