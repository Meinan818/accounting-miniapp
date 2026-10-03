import { computed, onScopeDispose, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { validDate } from './ledger.js'
import { isValidMonth } from './statistics.js'

export function shiftCalendarMonth(month, offset) {
  if (!isValidMonth(month) || !Number.isSafeInteger(offset)) return null
  const next = dayjs(`${month}-01`).add(offset, 'month').format('YYYY-MM')
  return isValidMonth(next) ? next : null
}

export function getCalendarCells(month, selectedDate, today, records = []) {
  if (!isValidMonth(month)) return []
  const first = dayjs(`${month}-01`), start = first.subtract(first.day(), 'day')
  const dates = new Set((Array.isArray(records) ? records : []).filter(record => record && !record.deletedAt).map(record => record.date))
  return Array.from({ length: 42 }, (_, index) => {
    const date = start.add(index, 'day'), value = date.format('YYYY-MM-DD')
    const isDisabled = !validDate(value)
    return { date: value, day: date.date(), weekday: date.day(), isCurrentMonth: value.slice(0, 7) === month,
      isToday: !isDisabled && value === today, isSelected: !isDisabled && value === selectedDate,
      hasRecord: !isDisabled && dates.has(value), isDisabled }
  })
}

export function useLocalDay({ now = () => dayjs().format('YYYY-MM-DD'), eventTarget = globalThis.window,
  documentTarget = globalThis.document, timers = globalThis } = {}) {
  const initial = now()
  if (!validDate(initial)) throw new Error('本机日期无法读取。')
  const today = ref(initial)
  let active = true
  function refreshToday() {
    if (!active) return
    const next = now()
    if (validDate(next)) today.value = next
  }
  const visible = () => { if (documentTarget?.visibilityState !== 'hidden') refreshToday() }
  let interval = null
  if (eventTarget?.addEventListener) {
    eventTarget.addEventListener('focus', refreshToday)
    documentTarget?.addEventListener('visibilitychange', visible)
    interval = timers.setInterval(refreshToday, 60000)
  }
  onScopeDispose(() => {
    active = false
    if (interval !== null) timers.clearInterval(interval)
    eventTarget?.removeEventListener('focus', refreshToday)
    documentTarget?.removeEventListener('visibilitychange', visible)
  })
  return { today, refreshToday }
}

export function useHomeCalendar(options = {}) {
  const { today, refreshToday } = useLocalDay(options)
  const todayMonth = computed(() => today.value.slice(0, 7))
  const calendarMonth = ref(todayMonth.value), selectedDate = ref(today.value)
  const weekdayLabel = computed(() => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayjs(today.value).day()])
  let active = true
  onScopeDispose(() => { active = false })
  watch(today, (next, previous) => {
    if (selectedDate.value === previous && calendarMonth.value === previous.slice(0, 7)) {
      selectedDate.value = next; calendarMonth.value = next.slice(0, 7)
    }
  }, { flush: 'sync' })
  function returnToday() {
    if (!active) return
    refreshToday(); calendarMonth.value = todayMonth.value; selectedDate.value = today.value
  }
  function handleMonthChange(month) {
    if (!active || !isValidMonth(month)) return
    refreshToday(); calendarMonth.value = month
    selectedDate.value = month === todayMonth.value ? today.value : `${month}-01`
  }
  function handleDateChange(date) {
    if (!active || !validDate(date)) return
    calendarMonth.value = date.slice(0, 7); selectedDate.value = date
  }
  return { today, todayMonth, calendarMonth, selectedDate, weekdayLabel, refreshToday, returnToday, handleMonthChange, handleDateChange }
}
