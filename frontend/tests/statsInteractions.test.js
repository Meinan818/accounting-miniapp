// 实际Stats setup离线执行；日期/滚动替身不代表GUI或实际隔夜验收。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { computed, effectScope, nextTick, onScopeDispose, reactive, ref, watch } from 'vue'
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
function scene(query = {}, dateClock = {}) {
  const scope = effectScope(), route = reactive({ query }), scrolls = [], calls = []
  const store = reactive({ records: structuredClone(records), storageError: '', refresh: async () => { calls.push('refresh'); return true } })
  const router = { replace: async ({ query }) => { route.query = query } }
  const bindings = { computed, nextTick, onScopeDispose, ref, watch, dayjs, centsText, getMonthReview, useStatsMonthNavigation, useLedgerReload, SERVER_MODE: false,
    onMounted() {}, matchMedia: () => ({ matches: true }), useRecordStore: () => store, useRoute: () => route, useRouter: () => router,
    useLocalDay: () => useLocalDay({ eventTarget: null, ...dateClock }) }
  const view = scope.run(() => new Function(...Object.keys(bindings), script +
    ';return {selectedMonth, selectedDay, selectedType, review, statistics, monthTitle, dayChart, changeMonth, slideDays, keepChartPosition}')(...Object.values(bindings)))
  view.dayChart.value = { clientWidth: 200, set scrollLeft(value) { scrolls.push(value) }, scrollBy: options => calls.push(options) }
  return { view, store, route, calls, scrolls, dispose: () => scope.stop() }
}

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
