import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope } from 'vue'
import { useHomeCalendar } from '../src/utils/calendar.js'

function scene(date = '2026-10-31') {
  const events = new Map(), scope = effectScope()
  let current = date, tick, cleared = false
  const window = { addEventListener: (key, fn) => events.set(key, fn), removeEventListener: key => events.delete(key) }
  const document = { ...window, visibilityState: 'visible' }
  const calendar = scope.run(() => useHomeCalendar({ now: () => current, eventTarget: window, documentTarget: document,
    timers: { setInterval: (fn, ms) => { assert.equal(ms, 60000); tick = fn; return 1 }, clearInterval: id => { assert.equal(id, 1); cleared = true } } }))
  return { calendar, events, document, setDate: date => { current = date }, tick: () => tick(),
    dispose: () => scope.stop(), cleared: () => cleared }
}

test('首页跨日与跨月更新今日汇总、星期及默认选择', () => {
  const state = scene()
  try {
    assert.equal(state.calendar.weekdayLabel.value, '周六')
    state.setDate('2026-11-01'); state.tick()
    assert.equal(state.calendar.today.value, '2026-11-01')
    assert.equal(state.calendar.todayMonth.value, '2026-11')
    assert.equal(state.calendar.calendarMonth.value, '2026-11')
    assert.equal(state.calendar.selectedDate.value, '2026-11-01')
    assert.equal(state.calendar.weekdayLabel.value, '周日')
  } finally { state.dispose() }
})

test('跨日不抢用户正在看的历史月份，回到今天先核最新日期', () => {
  const state = scene()
  try {
    state.calendar.handleMonthChange('2026-09')
    state.calendar.selectedDate.value = '2026-09-12'
    state.setDate('2026-11-01'); state.events.get('focus')()
    assert.equal(state.calendar.calendarMonth.value, '2026-09')
    assert.equal(state.calendar.selectedDate.value, '2026-09-12')
    state.setDate('2026-11-02'); state.calendar.returnToday()
    assert.equal(state.calendar.selectedDate.value, '2026-11-02')
    assert.equal(state.calendar.calendarMonth.value, '2026-11')
  } finally { state.dispose() }
})

test('后台恢复核日期，非法时钟保留旧日，离页释放全部监听与定时器', () => {
  const state = scene('2026-12-31')
  state.document.visibilityState = 'hidden'; state.setDate('2027-01-01')
  state.events.get('visibilitychange')()
  assert.equal(state.calendar.today.value, '2026-12-31')
  state.document.visibilityState = 'visible'; state.events.get('visibilitychange')()
  assert.equal(state.calendar.today.value, '2027-01-01')
  state.setDate('2027-02-30'); state.tick()
  assert.equal(state.calendar.today.value, '2027-01-01')
  state.calendar.handleMonthChange('0001-01')
  assert.equal(state.calendar.calendarMonth.value, '2027-01')
  state.dispose()
  assert.equal(state.events.size, 0); assert.equal(state.cleared(), true)
  state.setDate('2027-01-02'); state.tick(); state.calendar.returnToday()
  assert.equal(state.calendar.today.value, '2027-01-01')
})
