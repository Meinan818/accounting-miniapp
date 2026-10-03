<script setup>
import { computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ArrowLeft, ChevronRight } from 'lucide-vue-next'
import CatNavIcon from '@/components/common/CatNavIcon.vue'
import JournalSticker from '@/components/common/JournalSticker.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import miaoAvatar from '@/assets/design/mascot/miao-avatar.png'
import { useRecordStore } from '@/stores/recordStore'
import { getMonthStatistics } from '@/utils/statistics'
import { getRecentDays } from '@/utils/journal'
import { centsText } from '@/utils/money'
import packageInfo from '../../package.json'

const store = useRecordStore()
const month = dayjs().format('YYYY-MM')
const monthTitle = dayjs(month + '-01').format('YYYY年M月')
const appVersion = packageInfo.version
const calculated = computed(() => {
  try { return { data: getMonthStatistics(store.records, month), error: '' } }
  catch (error) { return { data: null, error: error.message } }
})
const statistics = computed(() => calculated.value.data)
const error = computed(() => store.storageError || calculated.value.error)
const wideAmounts = computed(() => statistics.value && [statistics.value.incomeCents, statistics.value.expenseCents].some(value => centsText(value).length > 9))
const recentDays = computed(() => getRecentDays(store.records, dayjs().format('YYYY-MM-DD')))
const recordedDays = computed(() => recentDays.value.filter(day => day.count > 0).length)
const entries = [
  { title: '账单明细', note: '查看和修改已经记下的小账单', icon: 'receipt', to: '/bills' },
  { title: '收支统计', note: '按月份看看钱花在哪里', icon: 'chart', to: '/stats' },
  { title: '和本喵聊聊', note: '说说开销，核对后再记账', icon: 'chat', to: '/chat' },
]
onMounted(() => store.refresh())
</script>

<template>
  <div class="journal-profile notebook-evolution">
    <main class="profile-content">
      <header class="profile-header">
        <router-link to="/" class="profile-back" aria-label="返回日历主页"><ArrowLeft :size="20" :stroke-width="1.5" /></router-link>
        <div><h1 class="profile-title">我的小账本</h1><p class="profile-subtitle">喵叽智账 · 本地演示</p></div>
      </header>

      <p class="edition-ribbon profile-edition-label">本喵的手账护照</p>
      <section class="profile-identity" aria-label="本地账本说明">
        <img :src="miaoAvatar" alt="手绘猫猫陪你记账" class="profile-avatar" />
        <JournalSticker kind="flower" tone="lilac" class="profile-flower" /><div><h2>每一笔，都好好记下</h2><p>这里是当前浏览器里的小账本。<br />本喵陪你整理，你来确认。</p><span class="profile-local-badge">当前是本地演示 · 正式版须账号密码登录</span></div>
      </section>

      <section class="profile-ledger-card" aria-labelledby="profile-ledger-title">
        <div class="profile-section-heading"><h2 id="profile-ledger-title">账本小概况</h2><span>{{ monthTitle }}</span></div>
        <div v-if="error" class="profile-error" role="alert">
          <p>账本概况暂时无法读取</p><p>{{ error }}</p>
          <button type="button" @click="store.refresh()">重新读取账单</button>
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

      <section class="profile-info-card" aria-labelledby="profile-data-title">
        <h2 id="profile-data-title">这本小账，存在哪里？</h2>
        <p>账单和对话保存在<strong>当前浏览器</strong>，还没有账号、云同步或真实 AI。更换浏览器、设备或清除站点数据，可能无法找回原内容。</p>
        <p>遇到读取或保存提示时，先保留内容，<strong>不要清除存储</strong>。暂不提供自动备份或恢复功能。</p>
      </section>

      <section class="profile-help-card" aria-labelledby="profile-help-title">
        <h2 id="profile-help-title">记账小贴士</h2>
        <ul><li>聊天是主入口，每组最多5笔，确认前不入账。</li><li>问“本月总支出”可以查汇总，目前只支持本月。</li><li>点明细里的分类贴纸可以筛选；统计中的同款贴纸能直接翻开对应小票。</li><li>手动记账是备用；改错或删除，可点明细里的整条账单。</li></ul>
      </section>
      <footer class="profile-about">喵叽智账 · 前端演示 v{{ appVersion }}<br /><span>好好记账，也好好生活</span></footer>
    </main>
    <BottomNav active="profile" />
  </div>
</template>

<style scoped>
.profile-footprint-item { min-height:58px; text-decoration:none; }
.profile-footprint-item:focus-visible { outline:2px solid #88624d; outline-offset:2px; }
.profile-footprints { position:relative; margin-top:22px; padding:17px 13px 13px; border:1px dashed #bfba9c; border-radius:4px 18px 5px 16px; background:#f3f3e7; }.profile-footprint-row { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:3px; margin-top:13px; }.profile-footprint-item { min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; padding:4px 0; color:#a39a84; font-size:10px; }.profile-footprint-item.recorded { color:#667457; }.profile-footprint-item .journal-sticker { width:27px; height:27px; }.profile-footprint-dot { width:27px; height:27px; border:1px dashed #c7c4aa; border-radius:50%; background:#fbfaf1; }.profile-footprints > p { margin-top:9px; font-size:10px; line-height:1.8; color:#817c63; }

.profile-edition-label { margin-bottom: 14px; }.profile-flower { position:absolute; right:-5px; top:-15px; width:39px; height:39px; opacity:.8; }

.journal-profile { min-height: 100dvh; padding: 18px 16px calc(var(--zz-home-bottom-nav-height) + 26px + env(safe-area-inset-bottom, 0px)); background: var(--zz-home-bg); color: var(--zz-home-ink); font-family: var(--zz-home-font); font-weight: 400; }
.profile-content { max-width: var(--zz-home-content-width); margin-inline: auto; }
.profile-header { display: flex; gap: 12px; align-items: center; margin-bottom: 24px; }
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
