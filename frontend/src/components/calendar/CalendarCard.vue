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
    return 'bg-accent-400 text-white shadow-[inset_0_-4px_0_rgba(255,255,255,0.22)]'
  }

  if (cell.isSelected) {
    return 'border-2 border-primary-400 bg-primary-50 text-primary-700'
  }

  if (!cell.isCurrentMonth) {
    return 'bg-[#faf6ee] text-gray-300'
  }

  return 'bg-[#f4f0e9] text-gray-900 hover:bg-primary-50'
}

function getDayNumberClass(cell) {
  if (cell.isToday || cell.isSelected) {
    return ''
  }

  if (cell.weekday === 0) {
    return 'text-accent-500'
  }

  if (cell.weekday === 6) {
    return 'text-blue-500'
  }

  return 'text-gray-900'
}
</script>

<template>
  <section class="relative rounded-[30px] border-[3px] border-hand bg-white/95 p-5 pt-7 shadow-[5px_6px_0_rgba(31,41,55,0.12)]">
    <span class="absolute -top-3 left-16 h-9 w-5 rounded-full border-[3px] border-hand bg-warning/70" />
    <span class="absolute -top-3 right-16 h-9 w-5 rounded-full border-[3px] border-hand bg-warning/70" />

    <div class="mb-4 flex items-center justify-between">
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-full text-hand transition-all hover:bg-cream-dark active:scale-95"
        aria-label="上个月"
        @click="changeMonth(-1)"
      >
        <ChevronLeft :size="32" :stroke-width="2.4" />
      </button>

      <h2 class="rounded-full bg-cream-dark/80 px-6 py-2 text-2xl font-bold text-gray-900">{{ monthTitle }}</h2>

      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-full text-hand transition-all hover:bg-cream-dark active:scale-95"
        aria-label="下个月"
        @click="changeMonth(1)"
      >
        <ChevronRight :size="32" :stroke-width="2.4" />
      </button>
    </div>

    <div class="mb-2 grid grid-cols-7 text-center text-base font-semibold">
      <span v-for="(weekday, index) in weekdays" :key="weekday" :class="index === 0 ? 'text-accent-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'">
        {{ weekday }}
      </span>
    </div>

    <div class="grid grid-cols-7 gap-x-1.5 gap-y-2">
      <button
        v-for="cell in calendarCells"
        :key="cell.date"
        type="button"
        class="relative flex aspect-square items-center justify-center rounded-[14px] text-base font-bold transition-all active:scale-95"
        :class="getDayClass(cell)"
        @click="selectDate(cell)"
      >
        <span :class="getDayNumberClass(cell)">{{ cell.day }}</span>
        <span
          v-if="cell.hasRecord"
          class="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-warning-dark"
        />
      </button>
    </div>

    <div class="mt-5 border-t border-dashed border-gray-300 pt-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="flex items-center gap-3 rounded-2xl bg-income-light/70 px-4 py-3">
          <span class="text-3xl">💵</span>
          <div>
            <p class="text-xs text-gray-600">本月收入</p>
            <p class="font-mono text-lg font-bold text-income-dark">{{ `¥${income.toFixed(2)}` }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 rounded-2xl bg-accent-100/80 px-4 py-3">
          <span class="text-3xl">🪙</span>
          <div>
            <p class="text-xs text-gray-600">本月支出</p>
            <p class="font-mono text-lg font-bold text-accent-500">{{ `¥${expense.toFixed(2)}` }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
