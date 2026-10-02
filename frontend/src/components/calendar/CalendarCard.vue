<script setup>
// 1. 导入
import { computed } from 'vue'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import calendarClip from '@/assets/design/calendar/calendar-clip.png'
import calendarFrame from '@/assets/design/calendar/calendar-frame.png'
import expenseCoin from '@/assets/design/calendar/expense-coin.png'
import incomeCash from '@/assets/design/calendar/income-cash.png'
import monthPill from '@/assets/design/calendar/month-pill.png'

// 2. Props
const props = defineProps({
  month: { type: String, required: true },
  selectedDate: { type: String, required: true },
  records: { type: Array, default: () => [] },
  income: { type: Number, default: 0 },
  expense: { type: Number, default: 0 },
})

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
  if (cell.isToday) {
    return 'calendar-day-today'
  }

  if (cell.isSelected) {
    return 'calendar-day-selected'
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

  if (cell.weekday === 0) {
    return 'text-[var(--zz-home-pink)]'
  }

  if (cell.weekday === 6) {
    return 'text-blue-500'
  }

  return 'text-[var(--zz-home-ink)]'
}
</script>

<template>
  <section class="journal-calendar relative flex flex-col" aria-label="记账日历">
    <img :src="calendarFrame" alt="" class="pointer-events-none absolute inset-0 h-full w-full" />
    <img :src="calendarClip" alt="" class="calendar-clip pointer-events-none absolute left-[9%]" />
    <img :src="calendarClip" alt="" class="calendar-clip pointer-events-none absolute right-[9%] -scale-x-100" />

    <div class="relative mb-3 flex items-center justify-between">
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--zz-home-ink)] transition-all hover:bg-cream-dark active:scale-95"
        aria-label="上个月"
        @click="changeMonth(-1)"
      >
        <ChevronLeft :size="32" :stroke-width="2.4" />
      </button>

      <h2 class="relative flex h-11 w-[65%] items-center justify-center text-xl font-black text-[var(--zz-home-ink)] sm:text-2xl">
        <img :src="monthPill" alt="" class="absolute inset-0 h-full w-full object-fill" />
        <span class="relative">{{ monthTitle }}</span>
      </h2>

      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--zz-home-ink)] transition-all hover:bg-cream-dark active:scale-95"
        aria-label="下个月"
        @click="changeMonth(1)"
      >
        <ChevronRight :size="32" :stroke-width="2.4" />
      </button>
    </div>

    <div class="relative mb-2 grid grid-cols-7 text-center text-sm font-semibold">
      <span v-for="(weekday, index) in weekdays" :key="weekday" :class="index === 0 ? 'text-accent-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'">
        {{ weekday }}
      </span>
    </div>

    <div class="calendar-grid relative grid grid-cols-7">
      <button
        v-for="cell in calendarCells"
        :key="cell.date"
        type="button"
        class="calendar-day relative flex items-center justify-center text-sm font-bold transition-all active:scale-95"
        :class="getDayClass(cell)"
        :aria-label="cell.date"
        :aria-pressed="cell.isSelected"
        :aria-current="cell.isToday ? 'date' : undefined"
        @click="selectDate(cell)"
      >
        <span :class="getDayNumberClass(cell)">{{ cell.day }}</span>
        <span
          v-if="cell.hasRecord"
          class="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-warning-dark"
        />
      </button>
    </div>

    <div class="relative mt-auto pt-4">
      <div class="grid grid-cols-2 gap-2">
        <div class="calendar-summary flex min-w-0 items-center gap-1.5 rounded-[22px] bg-[var(--zz-home-income-panel)] px-2 py-3">
          <img :src="incomeCash" alt="" class="h-9 w-9 shrink-0 object-contain" />
          <div class="min-w-0">
            <p class="text-xs text-[var(--zz-home-ink-soft)]">本月收入</p>
            <p class="calendar-amount font-bold text-[var(--zz-home-green)]">{{ `¥${income.toFixed(2)}` }}</p>
          </div>
        </div>
        <div class="calendar-summary flex min-w-0 items-center gap-1.5 rounded-[22px] bg-[var(--zz-home-expense-panel)] px-2 py-3">
          <img :src="expenseCoin" alt="" class="h-9 w-9 shrink-0 object-contain" />
          <div class="min-w-0">
            <p class="text-xs text-[var(--zz-home-ink-soft)]">本月支出</p>
            <p class="calendar-amount font-bold text-[var(--zz-home-pink)]">{{ `¥${expense.toFixed(2)}` }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.journal-calendar {
  width: 100%;
  min-width: 0;
  aspect-ratio: 1034 / 1255;
  min-height: 390px;
  padding: 22px 19px 22px;
  border-radius: 30px;
  background-color: var(--zz-home-paper);
  background-image: radial-gradient(var(--zz-home-paper-grain) 0.5px, transparent 0.9px);
  background-size: 5px 5px;
  box-shadow: 4px 5px 0 var(--zz-home-shadow-color);
}
.calendar-clip { top: -14px; width: 21px; height: 34px; }
.calendar-grid { flex: 1; grid-template-rows: repeat(6, minmax(28px, 1fr)); gap: var(--zz-home-grid-gap-y) var(--zz-home-grid-gap-x); }
.calendar-day { min-height: 28px; border-radius: 8px; }
.calendar-day-normal { background: var(--zz-home-day-bg); }
.calendar-day-normal:hover { background: var(--zz-home-title-brush); }
.calendar-day-outside { background: var(--zz-home-day-outside-bg); color: var(--zz-home-day-muted); }
.calendar-day-outside span { color: inherit; }
.calendar-day-today { background: var(--zz-home-pink); color: white; }
.calendar-day-selected { background: var(--zz-home-title-brush); outline: 2px solid var(--zz-home-pink); outline-offset: -2px; }
.calendar-amount { font-size: clamp(13px, 4vw, 20px); overflow-wrap: anywhere; line-height: 1.3; }
button:focus-visible { outline: 2px solid var(--zz-home-ink); outline-offset: 2px; }
</style>
