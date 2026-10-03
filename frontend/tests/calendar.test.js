import test from 'node:test'
import assert from 'node:assert/strict'
import { computed, effectScope, reactive } from 'vue'
import dayjs from 'dayjs'
import { readFileSync } from 'node:fs'
import * as calendarUtils from '../src/utils/calendar.js'
import { validDate } from '../src/utils/ledger.js'
const { useHomeCalendar } = calendarUtils

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

test('选相邻月份具体日期不能被切月重置到第一天，非法日期保持原选择', () => {
  const state = scene()
  try {
    state.calendar.handleMonthChange('2026-11')
    state.calendar.handleDateChange('2026-11-02')
    assert.equal(state.calendar.selectedDate.value, '2026-11-02')
    assert.equal(state.calendar.calendarMonth.value, '2026-11')
    state.calendar.handleDateChange('2026-02-30')
    assert.equal(state.calendar.selectedDate.value, '2026-11-02')
  } finally { state.dispose() }
})

function component(props, emit) {
  const file = readFileSync(new URL('../src/components/calendar/CalendarCard.vue', import.meta.url), 'utf8')
  const script = file.split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
  const names = ['computed', 'dayjs', 'defineProps', 'defineEmits', 'validDate', ...Object.keys(calendarUtils)]
  return new Function(...names, script + '; return { selectDate, changeMonth, calendarCells }')(
    computed, dayjs, () => props, () => emit, validDate, ...Object.values(calendarUtils))
}

test('实际日历脚本选相邻月份后保留点击日期，边界切月不发出越界事件', () => {
  const state = scene(), events = []
  try {
    const card = component({ month: '2026-10', selectedDate: '2026-10-31', records: [] }, (name, value) => {
      events.push([name, value])
      if (name === 'update:month') state.calendar.handleMonthChange(value)
      else state.calendar.selectedDate.value = value
    })
    card.selectDate({ date: '2026-11-02', isCurrentMonth: false })
    assert.equal(state.calendar.selectedDate.value, '2026-11-02')
    for (const [month, offset] of [['1000-01', -1], ['9999-12', 1]]) {
      const boundary = component({ month, selectedDate: month + '-01', records: [] }, (...args) => events.push(args))
      const before = events.length; boundary.changeMonth(offset)
      assert.equal(events.length, before)
    }
  } finally { state.dispose() }
})

test('六周日历保留闰日，越界外月格禁用，记录点排除已删除账单', () => {
  const cells = calendarUtils.getCalendarCells('2028-02', '2028-02-29', '2028-02-29', [
    { date: '2028-02-29' }, { date: '2028-02-28', deletedAt: 'synthetic' },
  ])
  assert.equal(cells.length, 42)
  assert.equal(cells.filter(cell => cell.isCurrentMonth).length, 29)
  assert.equal(cells.find(cell => cell.date === '2028-02-29').isSelected, true)
  assert.equal(cells.find(cell => cell.date === '2028-02-29').hasRecord, true)
  assert.equal(cells.find(cell => cell.date === '2028-02-28').hasRecord, false)
  for (const month of ['1000-01', '9999-12']) {
    const boundary = calendarUtils.getCalendarCells(month, month + '-01', month + '-01')
    assert.equal(boundary.length, 42)
    assert.equal(boundary.filter(cell => cell.isDisabled && cell.isCurrentMonth).length, 0)
    assert.ok(boundary.some(cell => cell.isDisabled))
  }
  assert.deepEqual(calendarUtils.getCalendarCells('bad', '', ''), [])
})

test('查看历史日时今日标签随新today属性更新，非法选日不发事件', () => {
  const props = reactive({ month: '2026-10', selectedDate: '2026-10-01', today: '2026-10-04', records: [] })
  const events = [], card = component(props, (...args) => events.push(args))
  assert.equal(card.calendarCells.value.find(cell => cell.isToday).date, '2026-10-04')
  props.today = '2026-10-05'
  assert.equal(card.calendarCells.value.find(cell => cell.isToday).date, '2026-10-05')
  card.selectDate({ date: '2026-02-30', isCurrentMonth: false })
  assert.equal(events.length, 0)
})
