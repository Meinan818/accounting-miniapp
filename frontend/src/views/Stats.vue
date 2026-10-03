<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ArrowLeft, ChevronLeft, ChevronRight, ReceiptText } from 'lucide-vue-next'
import BottomNav from '@/components/layout/BottomNav.vue'
import miaoWriting from '@/assets/design/mascot/poses/miao-writing.png'
import receiptKitten from '@/assets/design/mascot/poses/cream-receipt.png'
import { useRecordStore } from '@/stores/recordStore'
import { centsText } from '@/utils/money'
import { getMonthStatistics, isValidMonth } from '@/utils/statistics'
const route = useRoute()
const router = useRouter()
const store = useRecordStore()
const currentMonth = () => dayjs().format('YYYY-MM')
const selectedMonth = ref(isValidMonth(route.query.month) ? route.query.month : currentMonth())
const selectedType = ref('expense')
const monthTitle = computed(() => dayjs(selectedMonth.value + '-01').format('YYYY年M月'))
const calculated = computed(() => {
  try { return { data: getMonthStatistics(store.records, selectedMonth.value), error: '' } }
  catch (error) { return { data: null, error: error.message } }
})
const statistics = computed(() => calculated.value.data)
const error = computed(() => store.storageError || calculated.value.error)
const needsWideAmounts = computed(() => statistics.value && [statistics.value.incomeCents, statistics.value.expenseCents, statistics.value.balanceCents].some(value => centsText(value).length > 7))
const categoryRows = computed(() => statistics.value?.categories[selectedType.value] || [])
const typeLabel = computed(() => selectedType.value === 'income' ? '收入' : '支出')
function changeMonth(offset) {
  const next = dayjs(selectedMonth.value + '-01').add(offset, 'month').format('YYYY-MM')
  if (!isValidMonth(next)) return
  selectedMonth.value = next
  router.replace({ query: { ...route.query, month: next } })
}
watch(() => route.query.month, month => { selectedMonth.value = isValidMonth(month) ? month : currentMonth() })
onMounted(() => store.refresh())
</script>

<template>
  <div class="journal-stats">
    <main class="stats-content">
      <header class="stats-header">
        <router-link to="/" class="stats-back" aria-label="返回日历主页"><ArrowLeft :size="20" :stroke-width="1.5" /></router-link>
        <img :src="miaoWriting" alt="猫猫陪你整理收支" class="stats-header-cat" />
        <div><h1 class="stats-title">收支统计</h1><p class="stats-subtitle">喵叽智账 · 本地演示</p></div>
      </header>
      <section class="stats-month-card" aria-label="统计月份">
        <div class="stats-month-nav">
          <button type="button" aria-label="上个月" :disabled="selectedMonth === '1000-01'" @click="changeMonth(-1)"><ChevronLeft :size="22" :stroke-width="1.5" /></button>
          <h2>{{ monthTitle }}</h2>
          <button type="button" aria-label="下个月" :disabled="selectedMonth === '9999-12'" @click="changeMonth(1)"><ChevronRight :size="22" :stroke-width="1.5" /></button>
        </div>
        <template v-if="!error && statistics">
          <dl class="stats-overview" :class="{ 'stats-overview-wide': needsWideAmounts }" aria-label="月度收支统计">
            <div class="stats-total-income"><dt>收入</dt><dd>¥{{ centsText(statistics.incomeCents) }}</dd></div>
            <div class="stats-total-expense"><dt>支出</dt><dd>¥{{ centsText(statistics.expenseCents) }}</dd></div>
            <div class="stats-total-balance"><dt>结余</dt><dd :class="{ negative: statistics.balanceCents < 0 }">¥{{ centsText(statistics.balanceCents) }}</dd></div>
          </dl>
          <div class="stats-count-line"><p>有效账单 <strong>{{ statistics.recordCount }}</strong> 笔</p><router-link :to="{ path: '/bills', query: { month: selectedMonth } }" :aria-label="'查看' + monthTitle + '账单明细'">查看明细 →</router-link></div>
        </template>
      </section>
      <section v-if="error" class="stats-error" role="alert"><h2>统计暂时无法显示</h2><p>{{ error }}</p><button type="button" @click="store.refresh()">重新读取账单</button></section>
      <template v-else-if="statistics">
        <section class="stats-category-card" aria-labelledby="stats-category-title">
          <div class="stats-category-heading"><h2 id="stats-category-title">{{ typeLabel }}分类</h2><div class="stats-type-switch" aria-label="选择分类统计类型"><button v-for="type in ['expense', 'income']" :key="type" type="button" :aria-pressed="selectedType === type" :class="{ selected: selectedType === type }" @click="selectedType = type">{{ type === 'income' ? '收入' : '支出' }}</button></div></div>
          <p class="stats-category-note">{{ statistics[selectedType + 'Count'] }} 笔{{ typeLabel }} · 金额从高到低</p>
          <ol v-if="categoryRows.length" class="stats-category-list">
            <li v-for="item in categoryRows" :key="item.category" class="stats-category-row" :data-category="item.category">
              <div class="stats-category-line"><div class="stats-category-name"><span class="stats-category-stamp" aria-hidden="true"><ReceiptText :size="18" :stroke-width="1.5" /></span><span>{{ item.category }}</span></div><div class="stats-category-value"><strong>¥{{ centsText(item.amountCents) }}</strong><span>{{ item.percent.toFixed(1) }}% · {{ item.count }}笔</span></div></div>
              <div class="stats-bar-track" aria-hidden="true"><span class="stats-bar-fill" :class="selectedType" :style="{ width: item.barPercent + '%' }"></span></div>
            </li>
          </ol>
          <div v-else class="stats-empty"><img :src="receiptKitten" alt="奶油小猫拿着空白小票" /><p>{{ statistics.recordCount === 0 ? '这个月还没有账单' : '这个月还没有' + typeLabel + '账单' }}</p><span>{{ statistics.recordCount === 0 ? '记下第一笔后，这里会自动整理收支。' : '切换收支类型，可以查看已有账单。' }}</span></div>
          <p v-if="categoryRows.length" class="stats-rounding-note">占比按{{ typeLabel }}总额计算，显示到一位小数，四舍五入后可能略有差异。</p>
        </section>
        <p class="stats-storage-note">只统计当前账本的有效账单，未确认草稿和已删除账单不计入。数据保存在当前浏览器。</p>
      </template>
    </main>
    <BottomNav active="saving" />
  </div>
</template>

<style scoped>
.journal-stats { min-height: 100dvh; padding: 18px 16px calc(var(--zz-home-bottom-nav-height) + 26px + env(safe-area-inset-bottom, 0px)); background: var(--zz-home-bg); color: var(--zz-home-ink); font-family: var(--zz-home-font); font-weight: 400; }
.stats-content { max-width: var(--zz-home-content-width); margin-inline: auto; }
.stats-header { display: flex; align-items: center; gap: 9px; margin-bottom: 26px; }
.stats-back { display: grid; place-items: center; flex: 0 0 44px; height: 44px; border: 1px solid var(--zz-home-line); border-radius: 16px 13px 17px 14px; background: var(--zz-home-paper); }
.stats-header-cat { width: 72px; height: 78px; flex-shrink: 0; object-fit: contain; transform: rotate(-3deg); }
.stats-title { position: relative; isolation: isolate; width: fit-content; font-size: 24px; font-weight: 400; letter-spacing: 1px; white-space: nowrap; }
.stats-title::before { content: ''; position: absolute; inset: 9px -5px 1px; z-index: -1; background: var(--zz-home-title-brush); border-radius: 62% 45% 58% 42%; transform: rotate(-2deg); }
.stats-subtitle { margin-top: 5px; color: var(--zz-home-ink-soft); font-size: 12px; }
.stats-month-card, .stats-category-card { position: relative; border: 1.5px solid var(--zz-home-line); border-radius: 16px 19px 20px 15px; background: var(--zz-home-paper); box-shadow: 3px 4px 0 var(--zz-home-title-brush); }
.stats-month-card { padding: 22px 14px 16px; }
.stats-month-card::before { content: ''; position: absolute; top: -9px; left: calc(50% - 38px); width: 76px; height: 20px; border: 1px dashed var(--zz-home-line); border-radius: 2px 4px 3px 2px; background: var(--zz-home-pink-soft); transform: rotate(-4deg); pointer-events: none; }
.stats-month-nav { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 14px; }
.stats-month-nav button { display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 14px 11px 15px 12px; }
.stats-month-nav button:hover { background: var(--zz-home-title-brush); }
.stats-month-nav h2 { padding: 5px 12px; background: var(--zz-home-title-brush); border-radius: 14px 11px 15px 12px; font-size: 18px; font-weight: 400; }
.stats-overview { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.stats-overview > div { min-width: 0; padding: 11px 8px; border-radius: 14px 11px 15px 12px; text-align: center; }
.stats-overview dt { color: var(--zz-home-ink-soft); font-size: 12px; }
.stats-overview dd { margin-top: 4px; font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.stats-overview-wide { grid-template-columns: 1fr; }
.stats-overview-wide > div { display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: right; }
.stats-overview-wide dd { margin-top: 0; white-space: nowrap; }
.stats-total-income { background: var(--zz-home-income-panel); color: var(--zz-home-green); }
.stats-total-expense { background: var(--zz-home-expense-panel); color: var(--zz-home-pink); }
.stats-total-balance { background: var(--zz-home-title-brush); }
.negative { color: var(--zz-home-pink); }
.stats-count-line { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-top: 15px; color: var(--zz-home-ink-soft); font-size: 12px; }
.stats-count-line strong { font-weight: 400; color: var(--zz-home-ink); font-variant-numeric: tabular-nums; }
.stats-count-line a { display: inline-flex; align-items: center; min-height: 44px; padding: 4px 8px; border: 1px dashed var(--zz-home-line); border-radius: 10px; color: var(--zz-home-ink); }
.stats-category-card { margin-top: 24px; padding: 16px; }
.stats-category-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.stats-category-heading h2 { font-size: 18px; font-weight: 400; }
.stats-type-switch { display: flex; gap: 4px; padding: 3px; border: 1px solid var(--zz-home-line); border-radius: 13px; background: var(--zz-home-title-brush); }
.stats-type-switch button { min-height: 44px; min-width: 50px; padding: 7px 10px; border-radius: 10px; font-size: 13px; }
.stats-type-switch .selected { background: var(--zz-home-pink-soft); color: var(--zz-home-ink); }
.stats-type-switch button:last-child.selected { background: var(--zz-home-income-panel); }
.stats-category-note { margin: 10px 0 3px; font-size: 12px; color: var(--zz-home-ink-soft); }
.stats-category-list { display: grid; gap: 17px; margin-top: 16px; }
.stats-category-row { min-width: 0; }
.stats-category-line { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
.stats-category-name { display: flex; align-items: start; gap: 9px; min-width: 0; font-size: 14px; overflow-wrap: anywhere; }
.stats-category-name > span:last-child { min-width: 0; align-self: center; }
.stats-category-stamp { display: grid; place-items: center; flex: 0 0 30px; height: 32px; border: 1px dashed var(--zz-home-line); border-radius: 10px 8px 11px 9px; background: var(--zz-home-title-brush); }
.stats-category-value { display: grid; flex-shrink: 0; gap: 4px; max-width: 60%; text-align: right; font-size: 12px; color: var(--zz-home-ink-soft); overflow-wrap: anywhere; }
.stats-category-value strong { font-size: 15px; font-weight: 400; font-variant-numeric: tabular-nums; color: var(--zz-home-ink); }
.stats-bar-track { height: 7px; margin-top: 9px; overflow: hidden; border-radius: 6px; background: #f5eee1; }
.stats-bar-fill { display: block; height: 100%; border-radius: inherit; background: #edbdb2; }
.stats-bar-fill.income { background: #bacda5; }
.stats-rounding-note, .stats-storage-note { font-size: 12px; color: var(--zz-home-ink-soft); line-height: 1.9; }
.stats-rounding-note { margin-top: 18px; }
.stats-storage-note { margin: 18px 4px 0; }
.stats-empty { padding: 22px 4px 12px; text-align: center; }
.stats-empty img { width: 96px; height: 96px; margin: 0 auto 12px; object-fit: contain; }
.stats-empty p { font-size: 15px; }
.stats-empty span { display: block; margin-top: 8px; font-size: 12px; line-height: 1.8; color: var(--zz-home-ink-soft); }
.stats-error { margin-top: 22px; padding: 18px; border: 1px dashed #c39380; border-radius: 16px; background: #fff8ed; }
.stats-error h2 { font-size: 17px; font-weight: 400; }.stats-error p { margin: 12px 0; font-size: 13px; line-height: 1.8; }.stats-error button { min-height: 44px; padding: 8px 12px; border: 1px solid var(--zz-home-line); border-radius: 10px; }
button:disabled { opacity: .4; cursor: not-allowed; }
a:focus-visible, button:focus-visible { outline: 2px solid var(--zz-home-ink); outline-offset: 3px; }
@media (max-width: 359px) { .journal-stats { padding-inline: 12px; }.stats-header { gap: 7px; }.stats-header-cat { width: 58px; height: 65px; }.stats-title { font-size: 23px; }.stats-category-card { padding: 14px; }.stats-type-switch button { min-width: 46px; padding-inline: 8px; } }
</style>
