<script setup>
// 1. 导入
import { computed } from 'vue'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

// 2. Props
const props = defineProps({
  month: { type: String, required: true },
  selectedDate: { type: String, required: true },
  records: { type: Array, default: () => [] },
  income: { type: Number, default: 0 },
  expense: { type: Number, default: 0 },
})

const wideAmounts = computed(() => Math.max(props.income, props.expense).toFixed(2).length > 9)

// 3. Emits
const emit = defineEmits(['update:month', 'update:selected-date'])

// 4. 计算属性
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const monthTitle = computed(() => dayjs(`${props.month}-01`).format('YYYY年M月'))
const calendarCells = computed(() => {
  const firstDate = dayjs(`${props.month}-01`)
  const startDate = firstDate.subtract(firstDate.day(), 'day')
  const today = dayjs().format('YYYY-MM-DD')

  return Array.from({ length: 42 }, (_, index) => {
    const date = startDate.add(index, 'day')
    const dateString = date.format('YYYY-MM-DD')

    return {
      date: dateString,
      day: date.date(),
      weekday: date.day(),
      isCurrentMonth: date.format('YYYY-MM') === props.month,
      isToday: dateString === today,
      isSelected: dateString === props.selectedDate,
      hasRecord: props.records.some((record) => record.date === dateString),
    }
  })
})

// 5. 方法
function changeMonth(offset) {
  emit('update:month', dayjs(`${props.month}-01`).add(offset, 'month').format('YYYY-MM'))
}

function selectDate(cell) {
  emit('update:selected-date', cell.date)

  if (!cell.isCurrentMonth) {
    emit('update:month', cell.date.slice(0, 7))
  }
}

function getDayClass(cell) {
  if (cell.isSelected) {
    return 'calendar-day-selected'
  }

  if (cell.isToday) {
    return 'calendar-day-today'
  }

  if (!cell.isCurrentMonth) {
    return 'calendar-day-outside'
  }

  return 'calendar-day-normal'
}

function getDayNumberClass(cell) {
  if (cell.isToday || cell.isSelected) {
    return ''
  }

  if (cell.weekday === 0 || cell.weekday === 6) {
    return 'calendar-weekend'
  }

  return ''
}
</script>

<template>
  <section class="journal-calendar relative flex flex-col" aria-label="记账日历">
    <div class="calendar-heading">
      <button
        type="button"
        class="calendar-month-button active:scale-95"
        aria-label="上个月"
        @click="changeMonth(-1)"
      >
        <ChevronLeft :size="22" :stroke-width="1.5" />
      </button>

      <h2 class="calendar-month-title">
        {{ monthTitle }}
      </h2>

      <button
        type="button"
        class="calendar-month-button active:scale-95"
        aria-label="下个月"
        @click="changeMonth(1)"
      >
        <ChevronRight :size="22" :stroke-width="1.5" />
      </button>
    </div>

    <div class="calendar-totals">
      <div class="calendar-summary-grid grid grid-cols-2 gap-2" :class="{ 'calendar-summary-grid-wide': wideAmounts }">
        <div class="calendar-summary calendar-summary-income">
          <div class="min-w-0">
            <p class="text-xs text-[var(--zz-home-ink-soft)]">本月收入</p>
            <p class="calendar-amount text-[var(--zz-home-green)]">{{ `¥${income.toFixed(2)}` }}</p>
          </div>
        </div>
        <div class="calendar-summary calendar-summary-expense">
          <div class="min-w-0">
            <p class="text-xs text-[var(--zz-home-ink-soft)]">本月支出</p>
            <p class="calendar-amount text-[var(--zz-home-pink)]">{{ `¥${expense.toFixed(2)}` }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="calendar-weekdays">
      <span v-for="(weekday, index) in weekdays" :key="weekday" :class="{ 'calendar-weekend': index === 0 || index === 6 }">
        {{ weekday }}
      </span>
    </div>

    <div class="calendar-grid relative grid grid-cols-7">
      <button
        v-for="cell in calendarCells"
        :key="cell.date"
        type="button"
        class="calendar-day relative flex items-center justify-center active:scale-95"
        :class="getDayClass(cell)"
        :aria-label="cell.date"
        :aria-pressed="cell.isSelected"
        :aria-current="cell.isToday ? 'date' : undefined"
        @click="selectDate(cell)"
      >
        <span :class="getDayNumberClass(cell)">{{ cell.day }}</span>
        <span v-if="cell.isToday" class="calendar-today-label" aria-hidden="true">今</span>
        <span
          v-if="cell.hasRecord"
          class="calendar-record-dot"
        />
      </button>
    </div>


  </section>
</template>

<style scoped>
.journal-calendar {
  width: 100%;
  min-width: 0;
  padding: 22px 14px 16px;
  border: 1.5px solid var(--zz-home-line);
  border-radius: 16px 19px 20px 15px;
  background-color: var(--zz-home-paper);
  box-shadow: 3px 4px 0 var(--zz-home-title-brush);
}
.journal-calendar::before { content: ''; position: absolute; width: 76px; height: 20px; top: -9px; left: calc(50% - 38px); border: 1px dashed var(--zz-home-line); border-radius: 2px 4px 3px 2px; background: var(--zz-home-pink-soft); transform: rotate(-4deg); pointer-events: none; }
.calendar-heading { display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 12px; }
.calendar-month-button { display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 14px 11px 15px 12px; color: var(--zz-home-ink); }
.calendar-month-button:hover { background: var(--zz-home-title-brush); }
.calendar-month-title { padding: 5px 12px; min-width: 0; font-size: 18px; font-weight: 400; border-radius: 14px 11px 15px 12px; background: var(--zz-home-title-brush); color: var(--zz-home-ink); }
.calendar-weekdays { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); text-align: center; gap: 2px; margin-bottom: 8px; font-size: 12px; color: var(--zz-home-ink-soft); }
.calendar-weekend { color: var(--zz-home-pink); }
.calendar-grid { grid-template-rows: repeat(6, minmax(38px, 1fr)); gap: var(--zz-home-grid-gap-y) var(--zz-home-grid-gap-x); }
.calendar-day { min-width: 0; min-height: 38px; gap: 2px; border: 1px solid transparent; border-radius: 13px 10px 14px 11px; font-size: 14px; font-weight: 400; color: var(--zz-home-ink); }
.calendar-day-normal { background: transparent; }
.calendar-day-normal:hover { background: var(--zz-home-title-brush); }
.calendar-day-outside { background: transparent; color: var(--zz-home-day-muted); }
.calendar-day-outside span { color: inherit; }
.calendar-day-today { border-color: var(--zz-home-line); background: var(--zz-home-title-brush); }
.calendar-day-selected { border-color: var(--zz-home-line); background: var(--zz-home-pink-soft); }
.calendar-today-label { font-size: 11px; color: var(--zz-home-ink-soft); }
.calendar-record-dot { position: absolute; bottom: 3px; width: 4px; height: 4px; border-radius: 50%; background: var(--zz-home-ink-soft); }
.calendar-totals { margin: 2px 0 15px; padding-bottom: 14px; border-bottom: 1px dashed var(--zz-home-line); }
.calendar-summary { min-width: 0; padding: 10px 12px; border-radius: 14px 11px 15px 12px; }
.calendar-summary-grid-wide { grid-template-columns: 1fr; }.calendar-summary-grid-wide .calendar-summary > div { display:flex; align-items:center; justify-content:space-between; gap:8px; }.calendar-summary-grid-wide .calendar-amount { margin-top:0; }
.calendar-summary-income { background: var(--zz-home-income-panel); }
.calendar-summary-expense { background: var(--zz-home-expense-panel); }
.calendar-amount { margin-top: 3px; font-size: clamp(14px, 4vw, 19px); font-weight: 400; font-variant-numeric: tabular-nums; white-space: nowrap; line-height: 1.4; }
button:focus-visible { outline: 2px solid var(--zz-home-ink); outline-offset: 2px; }
@media (pointer: coarse) { .calendar-day { min-height: 42px; } }
</style>
