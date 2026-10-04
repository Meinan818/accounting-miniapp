// 实际Stats setup离线执行；日期/滚动替身不代表GUI或实际隔夜验收。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { computed, effectScope, nextTick, onScopeDispose, reactive, ref, watch } from 'vue'
import * as Vue from 'vue'
import { compile } from '@vue/compiler-dom'
import { renderToString } from '@vue/server-renderer'
import dayjs from 'dayjs'
import { centsText } from '../src/utils/money.js'
import { getMonthReview } from '../src/utils/monthReview.js'
import { useStatsMonthNavigation, useLedgerReload } from '../src/utils/navigation.js'
import { useLocalDay } from '../src/utils/calendar.js'

const script = readFileSync(new URL('../src/views/Stats.vue', import.meta.url), 'utf8')
  .split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
const records = [
  { id: 'oct', type: 'expense', date: '2026-10-31', category: '餐饮', amount: 0.29 },
  { id: 'nov', type: 'expense', date: '2026-11-01', category: '餐饮', amount: 0.31 },
]
function scene(query = {}, dateClock = {}, { server = false, delayedNavigation = false } = {}) {
  const scope = effectScope(), route = reactive({ query }), scrolls = [], calls = []
  const auth = reactive({ user: { id: 'synthetic-owner' } }), navigations = []
  const store = reactive({ records: structuredClone(records), storageError: '', refresh: async () => { calls.push('refresh'); return true } })
  const router = { replace: async ({ query }) => {
    if (delayedNavigation) return new Promise((resolve, reject) => navigations.push({ resolve, reject, query }))
    route.query = query
  } }
  const bindings = { computed, nextTick, onScopeDispose, ref, watch, dayjs, centsText, getMonthReview, useStatsMonthNavigation, useLedgerReload, SERVER_MODE: server, useAuthStore: () => auth,
    onMounted() {}, matchMedia: () => ({ matches: true }), useRecordStore: () => store, useRoute: () => route, useRouter: () => router,
    useLocalDay: () => useLocalDay({ eventTarget: null, ...dateClock }) }
  const view = scope.run(() => new Function(...Object.keys(bindings), script +
    ';return {selectedMonth, selectedDay, selectedType, review, statistics, monthTitle, dayChart, changeMonth, slideDays, keepChartPosition, pendingMonth, navigationError, ownerCurrent, selectDay, selectType, navigationMonth, pointedDay, maximumDayExpense, error, needsWideAmounts, categoryRows, leadingCategory, typeLabel, reloading, reloadRecords}')(...Object.values(bindings)))
  view.dayChart.value = { clientWidth: 200, set scrollLeft(value) { scrolls.push(value) }, scrollBy: options => calls.push(options) }
  return { view, store, route, calls, scrolls, auth, navigations, dispose: () => scope.stop() }
}

test('正式Stats图表等待期间身份首次变化并切回，旧自动定位和箭头入口不滚动', async () => {
  const env = scene({ month: '2026-10' }, {}, { server: true })
  try {
    env.store.records.push({ ...records[0], id: 'new', amount: 1 })
    await nextTick(() => { env.auth.user = null; env.auth.user = { id: 'synthetic-owner' } })
    await nextTick(); env.view.slideDays(1)
    assert.deepEqual(env.scrolls, []); assert.deepEqual(env.calls, [])
  } finally { env.dispose() }
})
test('正式Stats身份切回后旧切月入口不导航', async () => {
  const env = scene({ month: '2026-10' }, {}, { server: true, delayedNavigation: true })
  try {
    env.auth.user = null; env.auth.user = { id: 'synthetic-owner' }
    const pending = env.view.changeMonth(1); env.navigations[0]?.resolve({ type: 4 })
    assert.equal(await pending, false); assert.equal(env.navigations.length, 0)
    assert.equal(env.view.pendingMonth.value, '')
  } finally { env.dispose() }
})
test('正式Stats切月等待身份变化，旧失败不回填错误或清原pending快照', async () => {
  for (const outcome of ['false', 'reject']) {
    const env = scene({ month: '2026-10' }, {}, { server: true, delayedNavigation: true })
    try {
      const pending = env.view.changeMonth(1)
      assert.equal(env.view.pendingMonth.value, '2026-11')
      env.auth.user = null; env.auth.user = { id: 'synthetic-owner' }
      if (outcome === 'reject') env.navigations[0].reject(Error('synthetic-navigation'))
      else env.navigations[0].resolve({ type: 4 })
      assert.equal(await pending, false); assert.equal(env.view.navigationError.value, '')
      assert.equal(env.view.pendingMonth.value, '2026-11')
    } finally { env.dispose() }
  }
})

test('正式Stats正常选日/类型保持，身份变化及离页后旧点击不修改原选择快照', () => {
  const env = scene({ month: '2026-10' }, {}, { server: true })
  try {
    env.view.selectDay('2026-10-31'); env.view.selectType('income')
    assert.equal(env.view.selectedDay.value, '2026-10-31'); assert.equal(env.view.selectedType.value, 'income')
    env.auth.user = { id: 'other' }; env.auth.user = { id: 'synthetic-owner' }
    env.view.selectDay('2026-10-15'); env.view.selectType('expense')
    env.route.query = { month: '2026-11' }
    assert.equal(env.view.selectedDay.value, '2026-10-31'); assert.equal(env.view.selectedType.value, 'income')
  } finally { env.dispose() }
  env.view.selectDay('2026-11-01'); env.view.selectType('expense')
  assert.equal(env.view.selectedDay.value, '2026-10-31'); assert.equal(env.view.selectedType.value, 'income')
})

test('实际Stats完整模板身份变化撤下旧金额/分类/选日/切月入口，切回不复活且保留账本', async () => {
  const env = scene({ month: '2026-10' }, {}, { server: true })
  const content = readFileSync(new URL('../src/views/Stats.vue', import.meta.url), 'utf8')
  const template = content.slice(content.indexOf('<template>') + 10, content.lastIndexOf('</template>'))
  const stub = { render: () => Vue.h('span') }
  const component = { components: Object.fromEntries(['NotebookBack', 'BottomNav', 'ChevronLeft', 'ChevronRight', 'CategoryIcon', 'CategoryWheel', 'CatNavIcon', 'JournalSticker'].map(name => [name, stub])),
    setup: () => ({ ...env.view, centsText, SERVER_MODE: true, JOURNAL_COLORS: ['#fff'], miaoWriting: 'synthetic', receiptKitten: 'synthetic' }),
    render: new Function('Vue', compile(template, { mode: 'function' }).code)(Vue) }
  component.components.RouterLink = { props: ['to'], render() { return Vue.h('a', this.$slots.default?.()) } }
  component.render._rc = true
  const render = () => renderToString(Vue.createSSRApp(component))
  try {
    assert.match(await render(), /¥0.29/); assert.match(await render(), /餐饮/)
    env.auth.user = null
    const expired = await render()
    env.auth.user = { id: 'synthetic-owner' }
    const returned = await render()
    for (const html of [expired, returned]) {
      assert.doesNotMatch(html, /¥0.29|餐饮|上个月|review-day-chart/)
      assert.match(html, /登录身份已变化/)
    }
    assert.deepEqual(env.store.records, records); assert.deepEqual(env.calls, [])
  } finally { env.dispose() }
})

test('统计默认本月跨月更新概况并重置旧选日，保留收支类别且释放日期时钟', async () => {
  const OriginalDate = globalThis.Date
  let time = new OriginalDate('2026-10-31T12:00:00'), day = '2026-10-31', cleared = false, env
  globalThis.Date = class extends OriginalDate {
    constructor(...args) { super(...(args.length ? args : [time.getTime()])) }
    static now() { return time.getTime() }
  }
  const events = new Map()
  try {
    env = scene({}, { now: () => day, documentTarget: null,
      eventTarget: { addEventListener: (name, listener) => events.set(name, listener), removeEventListener: name => events.delete(name) },
      timers: { setInterval: () => 8, clearInterval: id => { assert.equal(id, 8); cleared = true } } })
    assert.equal(env.view.selectedMonth.value, '2026-10')
    assert.equal(env.view.statistics.value.expenseCents, 29)
    env.view.selectedDay.value = '2026-10-31'; env.view.selectedType.value = 'income'
    time = new OriginalDate('2026-11-01T12:00:00'); day = '2026-11-01'; events.get('focus')?.()
    await nextTick(); await nextTick()
    assert.equal(env.view.selectedMonth.value, '2026-11')
    assert.equal(env.view.monthTitle.value, '2026年11月')
    assert.equal(env.view.statistics.value.expenseCents, 31)
    assert.equal(env.view.selectedDay.value, '')
    assert.equal(env.view.selectedType.value, 'income')
    assert.deepEqual(env.calls, [])
    env.dispose()
    assert.equal(events.size, 0)
    assert.equal(cleared, true)
  } finally { env?.dispose(); globalThis.Date = OriginalDate }
})

test('统计显式历史月份跨月仍保留月份/选日，手动切月沿用路由且不发账单写入', async () => {
  let day = '2026-10-31', tick
  const env = scene({ month: '2026-10' }, { now: () => day, documentTarget: null,
    eventTarget: { addEventListener() {}, removeEventListener() {} },
    timers: { setInterval: callback => { tick = callback; return 8 }, clearInterval() {} } })
  try {
    assert.equal(env.view.statistics.value.expenseCents, 29)
    env.view.selectedDay.value = '2026-10-31'
    day = '2026-11-01'; tick?.(); await nextTick()
    assert.equal(env.view.selectedMonth.value, '2026-10')
    assert.equal(env.view.selectedDay.value, '2026-10-31')
    assert.equal(await env.view.changeMonth(1), true)
    assert.equal(env.route.query.month, '2026-11')
    assert.equal(env.view.statistics.value.expenseCents, 31)
    assert.equal(env.view.selectedDay.value, '')
    assert.deepEqual(env.calls, [])
  } finally { env.dispose() }
})

test('统计图表等待渲染时用户选日，旧自动峰值定位不覆盖用户查看位置', async () => {
  const env = scene({ month: '2026-10' })
  try {
    assert.equal(env.view.review.value.peak.date, '2026-10-31')
    env.store.records.push({ ...records[0], id: 'new', date: '2026-10-15', amount: 1 })
    await nextTick(() => { env.view.selectedDay.value = '2026-10-10' })
    await nextTick()
    assert.deepEqual(env.scrolls, [])
    assert.equal(env.view.selectedDay.value, '2026-10-10')
  } finally { env.dispose() }
})

test('统计自动峰值定位保持正常，但等待期间手动翻动不被旧定位覆盖', async () => {
  const env = scene({ month: '2026-10' })
  try {
    env.store.records.push({ ...records[0], id: 'new', date: '2026-10-15', amount: 1 })
    await nextTick(); await nextTick()
    assert.deepEqual(env.scrolls, [608]); env.scrolls.length = 0
    env.store.records.push({ ...records[0], id: 'new2', date: '2026-10-16', amount: 2 })
    await nextTick(() => env.view.slideDays(1)); await nextTick()
    assert.deepEqual(env.calls, [{ left: 343, behavior: 'auto' }])
    assert.deepEqual(env.scrolls, [])
  } finally { env.dispose() }
})

test('统计图表等待期间离页不滚动，旧翻动入口也不操作保留的图表引用', async () => {
  const env = scene({ month: '2026-10' })
  env.store.records.push({ ...records[0], id: 'new', date: '2026-10-15', amount: 1 })
  await nextTick(() => env.dispose()); await nextTick()
  env.view.slideDays(1)
  assert.deepEqual(env.scrolls, []); assert.deepEqual(env.calls, [])
})

test('统计定位等待期间切月，仅最新月份滚动一次', async () => {
  const env = scene({ month: '2026-10' })
  try {
    env.store.records.push({ ...records[0], id: 'new', date: '2026-10-15', amount: 1 })
    await nextTick(() => { env.route.query = { month: '2026-11' } })
    await nextTick(); await nextTick()
    assert.equal(env.view.selectedMonth.value, '2026-11')
    assert.deepEqual(env.scrolls, [0])
  } finally { env.dispose() }
})

test('手动触摸/滚轮查看后同月更新保持位置，切月恢复自动峰值定位', async () => {
  const env = scene({ month: '2026-10' })
  try {
    env.view.keepChartPosition()
    env.store.records.push({ ...records[0], id: 'new', date: '2026-10-15', amount: 1 })
    await nextTick(); await nextTick()
    assert.deepEqual(env.scrolls, [])
    env.route.query = { month: '2026-11' }
    await nextTick(); await nextTick()
    assert.deepEqual(env.scrolls, [0]); assert.deepEqual(env.calls, [])
  } finally { env.dispose() }
})
