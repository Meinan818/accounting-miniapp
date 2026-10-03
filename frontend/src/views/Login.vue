<script setup>
import { ref } from 'vue'
import { SERVER_MODE } from '@/api/mode'
import { useAuthStore } from '@/stores/authStore'
import CatNavIcon from '@/components/common/CatNavIcon.vue'
import miaoAvatar from '@/assets/design/mascot/miao-avatar.png'
const auth = useAuthStore()
const registering = ref(false)
const username = ref('')
const password = ref('')
const confirmation = ref('')
const saving = ref(false)
const error = ref('')
async function submit() {
  if (saving.value || !SERVER_MODE) return
  error.value = ''
  if (!/^[A-Za-z0-9_]{3,32}$/.test(username.value)) { error.value = '账号请使用3–32位字母、数字或下划线。'; return }
  if (!/^[\x21-\x7E]{12,64}$/.test(password.value)) { error.value = '密码请使用12–64位英文字符、数字或符号，不包含空格。'; return }
  if (registering.value && password.value !== confirmation.value) { error.value = '两次密码不一致。'; return }
  saving.value = true
  try {
    const success = await (registering.value ? auth.register(username.value, password.value) : auth.login(username.value, password.value))
    if (success) { password.value = ''; confirmation.value = ''; window.location.replace('/') }
  } catch (failure) { error.value = failure.message }
  finally { saving.value = false }
}
</script>
<template>
  <main class="login-page notebook-evolution">
    <section class="login-card">
      <img :src="miaoAvatar" alt="猫猫陪你记账" class="login-cat" />
      <p class="login-eyebrow">属于你的小账本</p><h1>喵叽智账</h1>
      <template v-if="SERVER_MODE">
        <p>{{ registering ? '准备一本新的小账本' : '欢迎回来，翻开今天的小日子' }}</p>
        <form @submit.prevent="submit">
          <fieldset :disabled="saving">
            <label>账号<input v-model="username" aria-label="账号" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="32" required /></label>
            <label>密码<input v-model="password" aria-label="密码" type="password" :autocomplete="registering ? 'new-password' : 'current-password'" maxlength="64" required /></label>
            <label v-if="registering">确认密码<input v-model="confirmation" aria-label="确认密码" type="password" autocomplete="new-password" maxlength="64" required /></label>
            <p class="login-hint">账号3–32位字母、数字或下划线；密码12–64位英文字符、数字或符号。</p>
            <p v-if="error || auth.error" class="login-error" role="alert">{{ error || auth.error }}</p>
            <button class="login-submit" type="submit">{{ saving ? '正在打开账本…' : registering ? '注册并打开账本' : '登录我的账本' }}</button>
            <button class="login-switch" type="button" @click="registering = !registering; error = ''; auth.error = ''; password = ''; confirmation = ''">{{ registering ? '已经有账号，去登录' : '第一次来，注册账号' }}</button>
          </fieldset>
        </form>
        <p class="login-data-note"><CatNavIcon kind="profile" />原浏览器演示账本和照片保留，不会自动导入这个账号。聊天整理暂用规则演示。</p>
      </template>
      <template v-else><p>当前打开的是本地演示版。</p><router-link to="/" class="login-submit">打开本地小账本</router-link></template>
    </section>
  </main>
</template>
<style scoped>
.login-page { display:grid; place-items:center; min-height:100dvh; padding:28px 16px; background:#fff5ed; color:#775968; font-family:var(--zz-home-font); }
.login-card { width:100%; max-width:420px; padding:28px 24px; background:#fffaf5; border:2px solid #e6c4cc; border-radius:32px 27px 34px 26px; box-shadow:0 7px 0 #f0d5dd,0 16px 40px #dbc6bd33; text-align:center; }
.login-cat { width:84px; height:84px; object-fit:contain; margin:auto; }.login-eyebrow { font-size:12px; color:#b48599; margin-top:12px; }h1 { font-size:27px; font-weight:700; margin:4px 0 10px; }
fieldset { border:0; padding:0; min-width:0; }label { display:grid; gap:7px; text-align:left; margin-top:18px; font-size:14px; }input { width:100%; min-height:46px; border:1.5px solid #dec3cf; background:#fffdf9; border-radius:14px; padding:10px 12px; color:#775968; }
input:focus-visible,button:focus-visible,a:focus-visible { outline:2px solid #ba859c; outline-offset:3px; }.login-hint,.login-data-note { font-size:12px; line-height:1.8; margin-top:16px; color:#9e8490; }.login-data-note .cat-nav-icon { width:24px; height:24px; vertical-align:middle; }
.login-submit { display:block; width:100%; min-height:48px; padding:12px; margin-top:18px; border:1.5px solid #d4a4b5; border-radius:16px; background:#f6ccd9; box-shadow:0 4px 0 #e5b0c3; font-weight:700; }.login-switch { min-height:44px; margin-top:14px; padding:8px; font-size:13px; }.login-error { margin-top:16px; color:#a34f66; font-size:13px; overflow-wrap:anywhere; }fieldset:disabled { opacity:.65; }
</style>
