<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ChevronRight } from 'lucide-vue-next'
import NotebookBack from '@/components/common/NotebookBack.vue'
import CatNavIcon from '@/components/common/CatNavIcon.vue'
import JournalSticker from '@/components/common/JournalSticker.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import miaoAvatar from '@/assets/design/mascot/miao-avatar.png'
import { useRecordStore } from '@/stores/recordStore'
import { getMonthStatistics } from '@/utils/statistics'
import { getRecentDays } from '@/utils/journal'
import { centsText } from '@/utils/money'
import packageInfo from '../../package.json'
import { DEFAULT_PROFILE, readLocalProfile, saveLocalProfile, createProfilePhoto } from '@/utils/localProfile'
import { SERVER_MODE } from '@/api/mode'
import { useAuthStore } from '@/stores/authStore'
import { createProfileApi } from '@/api/profile'
import { useLocalDay } from '@/utils/calendar'
import { useLedgerReload } from '@/utils/navigation'

const store = useRecordStore()
const { reloading, reloadError, reloadRecords } = useLedgerReload(store)
const auth = SERVER_MODE ? useAuthStore() : null
const profileOwner = auth?.user?.id
let disposed = false
const profileOwnerCurrent = ref(!SERVER_MODE || Boolean(profileOwner))
if (SERVER_MODE) watch(() => auth.user?.id, value => {
  if (value !== profileOwner) profileOwnerCurrent.value = false
}, { flush: 'sync' })
const isCurrentProfile = () => !disposed && profileOwnerCurrent.value && (!SERVER_MODE || auth.user?.id === profileOwner)
const remoteProfile = auth ? createProfileApi(auth.api, { owner: profileOwner, isCurrent: isCurrentProfile }) : null
const { today } = useLocalDay()
const month = computed(() => today.value.slice(0, 7))
const monthTitle = computed(() => dayjs(month.value + '-01').format('YYYY年M月'))
const appVersion = packageInfo.version
const calculated = computed(() => {
  try { return { data: getMonthStatistics(store.records, month.value), error: '' } }
  catch (error) { return { data: null, error: error.message } }
})
const statistics = computed(() => calculated.value.data)
const error = computed(() => store.storageError || reloadError.value || calculated.value.error)
const wideAmounts = computed(() => statistics.value && [statistics.value.incomeCents, statistics.value.expenseCents].some(value => centsText(value).length > 9))
const recentDays = computed(() => getRecentDays(store.records, today.value))
const recordedDays = computed(() => recentDays.value.filter(day => day.count > 0).length)
const profile = ref({ ...DEFAULT_PROFILE })
const profileError = ref(SERVER_MODE ? '正在读取账号资料…' : '')
const profileNotice = ref('')
const profileDialog = ref(null)
const profileForm = ref({ ...DEFAULT_PROFILE })
const editError = ref('')
const profileConflict = ref(false)
const photoInput = ref(null)
const processingPhoto = ref(false)
const savingProfile = ref(false)
const loadingProfile = ref(false)
const openingProfile = ref(false)
let profileReadGeneration = 0
let photoRequest = 0
let profileSnapshot = null
const avatars = [{ key: 'cat', label: '猫猫' }, { key: 'paw', label: '爪印' }, { key: 'flower', label: '小花' }]
async function loadProfile() {
  if (!isCurrentProfile()) return false
  const request = ++profileReadGeneration
  const isCurrentRead = () => !disposed && request === profileReadGeneration && (!remoteProfile || isCurrentProfile())
  loadingProfile.value = true
  try {
    if (remoteProfile) {
      const result = await remoteProfile.read()
      if (!isCurrentRead()) return false
      profile.value = result; profileError.value = ''; return true
    }
    const result = readLocalProfile(window.localStorage)
    if (!isCurrentRead()) return false
    profile.value = result.profile; profileSnapshot = result.snapshot; profileError.value = result.error
    return !result.error
  } catch (error) {
    if (isCurrentRead()) profileError.value = (remoteProfile ? '账号' : '本地') + '资料暂时无法读取。' + error.message
    return false
  } finally { if (isCurrentRead()) loadingProfile.value = false }
}
async function openProfile() {
  if (!isCurrentProfile() || openingProfile.value || savingProfile.value || profileDialog.value?.open) return false
  openingProfile.value = true
  try {
    if (!await loadProfile() || !isCurrentProfile() || !profileDialog.value) return false
    profileForm.value = { ...profile.value }; editError.value = ''; profileNotice.value = ''; profileConflict.value = false
    profileDialog.value.showModal()
    return true
  } finally { if (isCurrentProfile()) openingProfile.value = false }
}
function closeProfile(event) { if (savingProfile.value) { event?.preventDefault?.(); return }; photoRequest++; processingPhoto.value = false; profileDialog.value?.close() }
async function choosePhoto(event) {
  if (!isCurrentProfile() || !profileDialog.value?.open || savingProfile.value) return
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const request = ++photoRequest
  processingPhoto.value = true; editError.value = ''
  try {
    const photo = await createProfilePhoto(file)
    if (isCurrentProfile() && request === photoRequest && profileDialog.value?.open) profileForm.value = { ...profileForm.value, avatar: 'photo', photo }
  } catch (error) { if (isCurrentProfile() && request === photoRequest) editError.value = error.message }
  finally { if (isCurrentProfile() && request === photoRequest) processingPhoto.value = false }
}
async function saveProfile() {
  if (!isCurrentProfile() || processingPhoto.value || savingProfile.value) return
  // An earlier read cannot replace the version established by this save.
  profileReadGeneration++; loadingProfile.value = false
  savingProfile.value = true
  try {
    if (remoteProfile) {
      const saved = await remoteProfile.save(profile.value, profileForm.value)
      if (!isCurrentProfile()) return
      profile.value = saved; profileError.value = ''
      savingProfile.value = false; closeProfile(); profileNotice.value = '资料已保存到当前账号。'; return
    }
    const result = saveLocalProfile(window.localStorage, profileForm.value, profileSnapshot)
    profile.value = result.profile; profileSnapshot = result.snapshot; profileError.value = ''
    savingProfile.value = false; closeProfile(); profileNotice.value = '本地资料已保存，只保存在当前浏览器。'
  } catch (error) {
    if (disposed || (remoteProfile && !isCurrentProfile())) return
    editError.value = error.message
    profileConflict.value = error.code === 'STALE_PROFILE'
    if (error.partialProfile) {
      profile.value = error.partialProfile
      profileForm.value = { ...profileForm.value, photo: error.partialProfile.photo }
    }
    if (remoteProfile) await loadProfile()
  }
  finally { if (isCurrentProfile()) savingProfile.value = false }
}
onBeforeUnmount(() => { disposed = true; photoRequest++; profileReadGeneration++ })
const loggingOut = ref(false)
const logoutError = ref('')
async function logout() {
  if (!auth || !isCurrentProfile() || loggingOut.value) return
  loggingOut.value = true; logoutError.value = ''
  try { await auth.logout() }
  catch (failure) { if (isCurrentProfile()) logoutError.value = failure.message }
  finally { if (isCurrentProfile()) loggingOut.value = false }
}
const entries = [
  { title: '账单明细', note: '查看和修改已经记下的小账单', icon: 'receipt', to: '/bills' },
  { title: '收支统计', note: '按月份看看钱花在哪里', icon: 'chart', to: '/stats' },
  { title: '和本喵聊聊', note: '说说开销，核对后再记账', icon: 'chat', to: '/chat' },
]
onMounted(() => { reloadRecords(); loadProfile() })
</script>

<template>
  <div class="journal-profile notebook-evolution">
    <main class="profile-content">
      <header class="profile-header">
        <NotebookBack />
        <div><h1 class="profile-title">我的小账本</h1><p class="profile-subtitle">喵叽智账 · {{ SERVER_MODE ? '当前账号' : '本地演示' }}</p></div>
      </header>

      <p v-if="!profileOwnerCurrent" class="profile-error" role="alert">登录身份已变化，<a href="/profile">重新打开个人页</a>后再查看资料。</p>
      <section v-if="profileOwnerCurrent" class="profile-identity" aria-label="本地账本说明">
        <div class="profile-person-avatar"><img v-if="profile.avatar === 'photo'" :src="profile.photo" alt="自定义照片头像" class="profile-custom-photo" /><CatNavIcon v-else-if="profile.avatar === 'cat'" kind="profile" /><JournalSticker v-else :kind="profile.avatar" :tone="profile.avatar === 'flower' ? 'lilac' : 'pink'" /></div>
        <JournalSticker kind="flower" tone="lilac" class="profile-flower" />
        <div class="profile-person-copy"><span class="profile-id-eyebrow">MY LITTLE JOURNAL</span><h2>{{ profile.nickname }}</h2><p>{{ profile.signature || '给生活留一点小空白。' }}</p><span class="profile-local-badge">{{ SERVER_MODE ? auth.user?.username : '本地资料 · 尚未登录' }}</span><button class="profile-edit-button" type="button" :disabled="Boolean(profileError) || openingProfile || loadingProfile || savingProfile" :aria-busy="openingProfile" @click="openProfile">{{ openingProfile ? '正在读取资料…' : SERVER_MODE ? '编辑账号资料' : '编辑本地资料' }} <ChevronRight :size="14" /></button></div>
      </section>
      <p v-if="profileNotice" class="profile-notice" role="status">{{ profileNotice }}</p>
      <div v-if="profileError" class="profile-error" role="alert"><p>{{ profileError }}</p><button type="button" :disabled="loadingProfile || savingProfile" @click="loadProfile">{{ loadingProfile ? '正在读取…' : '重新读取资料' }}</button></div>
      <section v-if="!SERVER_MODE" class="profile-account-note" aria-label="账号状态"><CatNavIcon kind="home" /><div><h2>小账本，先住在这里</h2><p>当前账单留在这个浏览器。正式账号登录与个人资料同步正在规划，尚未接通。</p></div><img :src="miaoAvatar" alt="" /></section>

      <section v-if="SERVER_MODE" class="profile-account-note"><CatNavIcon kind="profile" /><div><h2>这是你的正式账号</h2><p>账单和资料保存在本机服务，原浏览器演示数据保留。</p><button type="button" :disabled="loggingOut || !profileOwnerCurrent" :aria-busy="loggingOut" @click="logout">{{ loggingOut ? '正在退出…' : '退出当前账号' }}</button><p v-if="logoutError" class="profile-error" role="alert">{{ logoutError }}</p></div></section>
      <section class="profile-ledger-card" aria-labelledby="profile-ledger-title">
        <div class="profile-section-heading"><h2 id="profile-ledger-title">账本小概况</h2><span>{{ monthTitle }}</span></div>
        <div v-if="error" class="profile-error" role="alert" :aria-busy="reloading">
          <p>账本概况暂时无法读取</p><p>{{ error }}</p>
          <button v-if="store.storageError || reloadError" type="button" :disabled="reloading" @click="reloadRecords(true)">{{ reloading ? '正在读取…' : '重新读取账单' }}</button>
        </div>
        <template v-else-if="statistics">
          <p class="profile-record-count">当前有效账单 <strong>{{ store.records.length }}</strong> 笔<span>本月 {{ statistics.recordCount }} 笔</span></p>
          <dl class="profile-summary" :class="{ 'profile-summary-wide': wideAmounts }">
            <div class="profile-income cat-money-note cat-money-note-income"><dt>本月收入</dt><dd>¥{{ centsText(statistics.incomeCents) }}</dd></div>
            <div class="profile-expense cat-money-note cat-money-note-expense"><dt>本月支出</dt><dd>¥{{ centsText(statistics.expenseCents) }}</dd></div>
          </dl>
          <p v-if="!store.records.length" class="profile-empty">还没有账单，去和本喵聊一句“午饭25元”吧～</p>
          <p class="profile-summary-note">未确认草稿和已删除账单不计入。</p>
        </template>
      </section>

      <section v-if="!error" class="profile-footprints" aria-labelledby="profile-footprints-title"><div class="profile-section-heading"><h2 id="profile-footprints-title">最近7天的小足迹</h2><span>{{ recordedDays }}个日期有记录</span></div><div class="profile-footprint-row"><router-link v-for="day in recentDays" :key="day.date" :to="{path:'/bills',query:{month:day.date.slice(0,7),q:day.date}}" class="profile-footprint-item" :class="{ recorded: day.count > 0 }" :aria-label="'查看' + day.date + '的' + day.count + '笔有效账单'"><JournalSticker :tone="day.count ? 'pink' : 'sage'" :class="{ 'profile-footprint-muted': !day.count }" /><span>{{ day.day }}</span></router-link></div><p>点爪印翻开当天小票。按业务日期整理，不是连续打卡；未确认和已删除的不计入。</p></section>
      <section class="profile-entry-card" aria-labelledby="profile-entry-title">
        <h2 id="profile-entry-title">常用入口</h2>
        <router-link v-for="entry in entries" :key="entry.to" :to="entry.to" class="profile-entry">
          <span class="profile-entry-icon" aria-hidden="true"><CatNavIcon :kind="entry.icon" /></span>
          <span class="profile-entry-copy"><span class="profile-entry-title">{{ entry.title }}</span><span class="profile-entry-note">{{ entry.note }}</span></span>
          <ChevronRight :size="18" :stroke-width="1.5" aria-hidden="true" />
        </router-link>
      </section>

      <section v-if="!SERVER_MODE" class="profile-info-card" aria-labelledby="profile-data-title">
        <h2 id="profile-data-title">这本小账，存在哪里？</h2>
        <p>账单和对话保存在<strong>当前浏览器</strong>，还没有账号、云同步或真实 AI。更换浏览器、设备或清除站点数据，可能无法找回原内容。</p>
        <p>遇到读取或保存提示时，先保留内容，<strong>不要清除存储</strong>。暂不提供自动备份或恢复功能。</p>
      </section>

      <section class="profile-help-card" aria-labelledby="profile-help-title">
        <h2 id="profile-help-title">记账小贴士</h2>
        <ul><li>聊天是主入口，每组最多5笔，确认前不入账。</li><li>问“本月总支出”可以查汇总，目前只支持本月。</li><li>点明细里的分类贴纸可以筛选；统计中的同款贴纸能直接翻开对应小票。</li><li>手动记账是备用；改错或删除，可点明细里的整条账单。</li></ul>
      </section>
      <footer class="profile-about">喵叽智账 · {{ SERVER_MODE ? '账号开发版' : '前端演示' }} v{{ appVersion }}<br /><span>好好记账，也好好生活</span></footer>
    </main>
    <dialog v-if="profileOwnerCurrent" ref="profileDialog" class="profile-editor" aria-labelledby="profile-editor-title" @cancel="closeProfile">
      <header><div><p>属于你的手账名片</p><h2 id="profile-editor-title">{{ SERVER_MODE ? '编辑账号资料' : '编辑本地资料' }}</h2></div><button type="button" aria-label="关闭资料编辑" @click="closeProfile">×</button></header>
      <form @submit.prevent="saveProfile">
        <fieldset :disabled="processingPhoto || savingProfile"><legend>头像贴纸，或自己的照片</legend><div class="profile-avatar-options"><button v-for="avatar in avatars" :key="avatar.key" type="button" :aria-label="'头像：' + avatar.label" :aria-pressed="profileForm.avatar === avatar.key" @click="profileForm.avatar = avatar.key"><CatNavIcon v-if="avatar.key === 'cat'" kind="profile" /><JournalSticker v-else :kind="avatar.key" :tone="avatar.key === 'flower' ? 'lilac' : 'pink'" /><span>{{ avatar.label }}</span></button></div>
          <div class="profile-photo-choice"><img v-if="profileForm.avatar === 'photo'" :src="profileForm.photo" alt="自定义头像预览" /><button type="button" @click="photoInput.click()">{{ processingPhoto ? '正在处理照片…' : profileForm.avatar === 'photo' ? '更换照片' : '选择照片' }}</button><input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" aria-label="选择头像照片" hidden @change="choosePhoto" /></div><p class="profile-editor-note">JPG / PNG / WebP，10MB以内。照片会居中裁成头像，保存前可以取消。{{ SERVER_MODE ? '确认保存后上传到当前账号。' : '只在本机处理。' }}</p>
        </fieldset>
        <label>昵称 <span>最多20个字</span><input :disabled="savingProfile" v-model="profileForm.nickname" aria-label="昵称" autocomplete="off" required /></label>
        <label>一句签名 <span>最多60个字，可留空</span><textarea :disabled="savingProfile" v-model="profileForm.signature" aria-label="一句签名" rows="3" /></label>
        <p class="profile-editor-note">{{ SERVER_MODE ? '保存到当前登录账号；不会改变账单和对话。' : '仅保存在当前浏览器，不代表注册或登录；不会改变账单和对话。' }}</p>
        <p v-if="editError" class="profile-error" role="alert">{{ editError }}</p>
        <div v-if="profileConflict" class="profile-error" role="status">
          <p>资料已在别处更新。你填写的内容仍保留，请对照后再保存。</p>
          <template v-if="!profileError"><p>当前昵称：{{ profile.nickname }}</p><p>当前签名：{{ profile.signature || '未填写' }}</p><p>当前头像：{{ profile.avatar === 'photo' ? '照片' : avatars.find(avatar => avatar.key === profile.avatar)?.label }}</p></template>
          <p v-else>最新资料暂时无法读取，请稍后重试；你的输入没有丢失。</p>
        </div>
        <div v-if="remoteProfile && profileError" class="profile-error"><p>{{ profileError }}</p><button type="button" :disabled="savingProfile || loadingProfile" @click="loadProfile">{{ loadingProfile ? '正在读取…' : '重新读取最新资料' }}</button></div>
        <div class="profile-editor-actions"><button type="button" @click="closeProfile">取消</button><button type="submit" :disabled="processingPhoto || savingProfile">{{ SERVER_MODE ? '保存账号资料' : '保存本地资料' }}</button></div>
      </form>
    </dialog>
    <BottomNav active="profile" />
  </div>
</template>

<style scoped>
.profile-custom-photo { width:100%; height:100%; object-fit:cover; border-radius:27px 22px 29px 21px; }
.profile-photo-choice { display:flex; align-items:center; gap:12px; margin-top:14px; }.profile-photo-choice img { width:64px; height:64px; object-fit:cover; border-radius:17px; border:1.5px solid #d6afba; }.profile-photo-choice button { min-height:44px; padding:8px 15px; border:1.5px solid #c9a9c9; border-radius:14px; background:#eee1f2; box-shadow:0 3px 0 #dcc6e0; color:#785982; font-size:12px; }.profile-editor button:disabled { opacity:.5; }
.profile-id-eyebrow { font-size:10px; color:#9b697b; letter-spacing:1.5px; }
.profile-person-avatar { display:grid; place-items:center; width:86px; height:96px; flex-shrink:0; border-radius:29px 24px 31px 23px; background:#fff9eb; border:1.5px solid #dabca5; box-shadow:0 4px 0 #e8c5b6; transform:rotate(-4deg); }
.profile-person-avatar .cat-nav-icon { width:70px; height:70px; }.profile-person-avatar .journal-sticker { width:60px; height:60px; }
.profile-person-copy { min-width:0; flex:1; }.profile-person-copy h2,.profile-person-copy p { overflow-wrap:anywhere; }
.journal-profile .profile-identity { padding:24px 17px; border:1.5px solid #d9a7b2; border-radius:28px 23px 30px 25px; background:radial-gradient(ellipse at 0 0,#e9dff4,transparent 65%),linear-gradient(115deg,#fbe0e7,#fff0dc); box-shadow:0 5px 0 #e7bec7,0 10px 18px #bb809315; }
.journal-profile .profile-identity::after { content:'留一点可爱给自己'; background:#e4edd9; border-color:#b7c6a5; border-radius:8px; letter-spacing:.5px; bottom:-12px; }
.profile-edit-button { display:flex; align-items:center; gap:3px; min-height:44px; margin-top:12px; padding:6px 11px; border:1.5px solid #cca6b2; border-radius:13px; background:#fff9f1; box-shadow:0 3px 0 #e3bbc4; font-size:12px; color:#81525f; }
.profile-edit-button:disabled { opacity:.5; }
.profile-account-note { display:flex; align-items:center; gap:10px; padding:14px 13px; background:#e6efde; border:1.5px solid #c2d0b7; border-radius:20px; margin:23px 0; box-shadow:0 4px 0 #d6e2ca; }
.profile-account-note > .cat-nav-icon { width:37px; height:37px; flex-shrink:0; }.profile-account-note div { flex:1; min-width:0; }.profile-account-note h2 { font-size:13px; }.profile-account-note p { font-size:11px; line-height:1.8; margin-top:4px; color:#61715b; }.profile-account-note img { width:41px; height:49px; object-fit:contain; flex-shrink:0; }
.profile-notice { margin:15px 0; font-size:12px; line-height:1.8; color:#416e52; }
.profile-editor { width:min(440px,calc(100% - 24px)); max-height:calc(100dvh - 32px); margin:auto; padding:23px 20px; color:var(--zz-home-ink); background:#fff9ef; border:1.5px solid #d1a292; border-radius:27px; box-shadow:0 7px 0 #e5c5b2,0 20px 60px #65433333; overflow:auto; }
.profile-editor::backdrop { background:#65433366; backdrop-filter:blur(3px); }.profile-editor header { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:20px; }.profile-editor header p { font-size:11px; color:#9b697b; margin-bottom:4px; }.profile-editor h2 { font-size:20px; }.profile-editor header button { width:44px; height:44px; font-size:25px; border:1px solid #e3c2b5; border-radius:14px; background:#f9dce4; }
.profile-editor fieldset { min-width:0; border:0; padding:0; }.profile-editor legend { font-size:13px; margin-bottom:10px; }.profile-avatar-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }.profile-avatar-options button { display:flex; align-items:center; flex-direction:column; gap:6px; min-height:86px; padding:10px 4px; background:#fffcf5; border:1.5px solid #e1cbb9; border-radius:19px; box-shadow:0 3px 0 #e9d5c4; font-size:12px; }.profile-avatar-options button[aria-pressed=true] { border-color:#b47991; background:#f8dce7; }.profile-avatar-options .cat-nav-icon,.profile-avatar-options .journal-sticker { width:44px; height:44px; }
.profile-editor label { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:7px; margin-top:19px; font-size:13px; }.profile-editor label span { font-size:10px; color:#8c7466; }.profile-editor input,.profile-editor textarea { width:100%; min-width:0; padding:12px; font-size:16px; color:inherit; border:1.5px solid #dac0ac; border-radius:14px; background:#fffdf8; }.profile-editor textarea { resize:vertical; }.profile-editor-note { font-size:11px; line-height:1.9; color:#8c7466; margin-top:14px; }
.profile-editor-actions { display:flex; gap:10px; margin-top:19px; }.profile-editor-actions button { flex:1; min-height:46px; border:1.5px solid #cfac9b; border-radius:15px; background:#fff9ec; box-shadow:0 3px 0 #e7c9b9; font-size:13px; }.profile-editor-actions button[type=submit] { background:#f4c8d6; border-color:#ce9bae; box-shadow:0 3px 0 #e1a9bc; }.profile-editor :is(button,input,textarea):focus-visible,.profile-edit-button:focus-visible { outline:2px solid #9b4c61; outline-offset:3px; }
@media(max-width:359px) { .profile-person-avatar { width:65px; height:77px; }.profile-person-avatar .cat-nav-icon { width:56px; height:56px; }.profile-person-avatar .journal-sticker { width:45px; height:45px; }.journal-profile .profile-identity { gap:11px; padding:20px 12px; }.profile-editor { padding:19px 15px; } }
.profile-footprint-item { min-height:58px; text-decoration:none; }
.profile-footprint-item:focus-visible { outline:2px solid #88624d; outline-offset:2px; }
.profile-footprints { position:relative; margin-top:22px; padding:17px 13px 13px; border:1px dashed #bfba9c; border-radius:4px 18px 5px 16px; background:#f3f3e7; }.profile-footprint-row { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:3px; margin-top:13px; }.profile-footprint-item { min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; padding:4px 0; color:#a39a84; font-size:10px; }.profile-footprint-item.recorded { color:#667457; }.profile-footprint-item .journal-sticker { width:27px; height:27px; }.profile-footprint-dot { width:27px; height:27px; border:1px dashed #c7c4aa; border-radius:50%; background:#fbfaf1; }.profile-footprints > p { margin-top:9px; font-size:10px; line-height:1.8; color:#817c63; }

.profile-flower { position:absolute; right:-5px; top:-15px; width:39px; height:39px; opacity:.8; }

.journal-profile { min-height: 100dvh; padding: 18px 16px calc(var(--zz-home-bottom-nav-height) + 26px + env(safe-area-inset-bottom, 0px)); background: var(--zz-home-bg); color: var(--zz-home-ink); font-family: var(--zz-home-font); font-weight: 400; }
.profile-content { max-width: var(--zz-home-content-width); margin-inline: auto; }
.profile-header { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
.profile-back { display: grid; place-items: center; flex: 0 0 44px; height: 44px; border: 1px solid var(--zz-home-line); border-radius: 16px 13px 17px 14px; background: var(--zz-home-paper); }
.profile-title { position: relative; isolation: isolate; width: fit-content; font-size: 24px; font-weight: 400; letter-spacing: 1px; }
.profile-title::before { content: ''; position: absolute; inset: 10px -5px 1px; z-index: -1; background: var(--zz-home-title-brush); border-radius: 62% 45% 58% 42%; transform: rotate(-2deg); }
.profile-subtitle { margin-top: 5px; font-size: 12px; color: var(--zz-home-ink-soft); }
.profile-identity { display: flex; align-items: center; gap: 15px; margin: 0 0 26px; padding: 5px 6px 12px; }
.profile-avatar { width: 86px; height: 88px; object-fit: contain; flex-shrink: 0; transform: rotate(-4deg); }
.profile-identity h2 { font-size: 17px; font-weight: 400; }
.profile-identity p { margin-top: 7px; font-size: 12px; line-height: 1.9; color: var(--zz-home-ink-soft); }
.profile-local-badge { display: inline-block; margin-top: 8px; padding: 4px 8px; background: var(--zz-home-green-soft); border-radius: 9px 6px 10px 7px; color: var(--zz-home-green); font-size: 11px; }
.profile-ledger-card, .profile-entry-card, .profile-info-card, .profile-help-card { position: relative; padding: 18px 16px; margin-top: 20px; border: 1.5px solid var(--zz-home-line); border-radius: 16px 19px 20px 15px; background: var(--zz-home-paper); box-shadow: 3px 4px 0 var(--zz-home-title-brush); }
.profile-ledger-card::before { content: ''; position: absolute; top: -9px; left: calc(50% - 36px); width: 72px; height: 19px; background: var(--zz-home-pink-soft); border: 1px dashed var(--zz-home-line); border-radius: 3px; transform: rotate(-4deg); }
.profile-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.profile-section-heading h2, .profile-entry-card h2, .profile-info-card h2, .profile-help-card h2 { font-size: 17px; font-weight: 400; }
.profile-section-heading > span { font-size: 12px; color: var(--zz-home-ink-soft); }
.profile-record-count { display: flex; align-items: baseline; flex-wrap: wrap; gap: 5px; margin-top: 17px; font-size: 13px; color: var(--zz-home-ink-soft); }
.profile-record-count strong { color: var(--zz-home-ink); font-size: 20px; font-weight: 400; font-variant-numeric: tabular-nums; }
.profile-record-count > span { margin-left: auto; font-size: 12px; }
.profile-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.profile-summary > div { min-width: 0; padding: 12px 10px; border-radius: 12px 9px 13px 10px; }
.profile-summary dt { font-size: 12px; color: var(--zz-home-ink-soft); }
.profile-summary dd { margin-top: 5px; font-size: 19px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.profile-income { color: var(--zz-home-green); background: var(--zz-home-income-panel); }
.profile-expense { color: var(--zz-home-pink); background: var(--zz-home-expense-panel); }
.profile-summary-wide { grid-template-columns: 1fr; }
.profile-summary-wide > div { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.profile-summary-wide dd { margin: 0; font-size: 18px; }
.profile-summary-note, .profile-empty { margin-top: 12px; color: var(--zz-home-ink-soft); font-size: 12px; line-height: 1.8; }
.profile-entry { display: flex; align-items: center; gap: 11px; min-height: 67px; padding: 12px 0; border-bottom: 1px dashed var(--zz-home-line); }
.profile-entry:last-child { border-bottom: 0; padding-bottom: 1px; }
.profile-entry-icon { display: grid; place-items: center; width: 38px; height: 38px; flex-shrink: 0; border-radius: 12px 9px 13px 10px; background: var(--zz-home-title-brush); }
.profile-entry-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 4px; }
.profile-entry-title { font-size: 14px; }
.profile-entry-note { color: var(--zz-home-ink-soft); font-size: 11px; }
.profile-info-card p { margin-top: 10px; font-size: 12px; line-height: 1.9; color: var(--zz-home-ink-soft); }
.profile-info-card strong { font-weight: 400; color: var(--zz-home-ink); }
.profile-help-card ul { padding-left: 17px; margin-top: 10px; list-style: disc; color: var(--zz-home-ink-soft); font-size: 12px; line-height: 2; }
.profile-about { margin: 24px 0 5px; text-align: center; font-size: 12px; line-height: 1.9; color: var(--zz-home-ink-soft); }
.profile-about span { font-size: 11px; }
.profile-error { margin-top: 12px; font-size: 12px; line-height: 1.9; color: var(--zz-home-pink); }
.profile-error button { min-height: 44px; margin-top: 8px; padding: 7px 12px; border: 1px solid var(--zz-home-line); border-radius: 12px; background: var(--zz-home-title-brush); color: var(--zz-home-ink); }
.profile-entry:focus-visible, .profile-back:focus-visible, .profile-error button:focus-visible { outline: 2px solid var(--zz-home-ink); outline-offset: 4px; }
@media (max-width: 359px) { .profile-avatar { width: 69px; height: 74px; } .profile-identity { gap: 10px; padding-inline: 0; } .profile-identity h2 { font-size: 15px; } .profile-record-count > span { width: 100%; margin-left: 0; } }
</style>
