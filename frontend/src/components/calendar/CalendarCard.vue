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
    return 'bg-accent-400 text-white shadow-sm'
  }

  if (cell.isSelected) {
    return 'border-2 border-primary-400 bg-primary-50 text-primary-700'
  }

  if (!cell.isCurrentMonth) {
    return 'bg-gray-50 text-gray-300'
  }

  return 'bg-gray-100 text-gray-900 hover:bg-primary-50'
}
</script>

<template>
  <section class="rounded-[28px] border-[3px] border-hand bg-white/95 p-4 shadow-[5px_6px_0_rgba(31,41,55,0.12)]">
    <div class="mb-4 flex items-center justify-between">
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-full text-hand transition-colors hover:bg-cream-dark active:scale-95"
        aria-label="上个月"
        @click="changeMonth(-1)"
      >
        <ChevronLeft :size="30" :stroke-width="2.4" />
      </button>

      <h2 class="text-xl font-bold text-gray-900">{{ monthTitle }}</h2>

      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-full text-hand transition-colors hover:bg-cream-dark active:scale-95"
        aria-label="下个月"
        @click="changeMonth(1)"
      >
        <ChevronRight :size="30" :stroke-width="2.4" />
      </button>
    </div>

    <div class="mb-2 grid grid-cols-7 text-center text-sm font-medium text-gray-500">
      <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
    </div>

    <div class="grid grid-cols-7 gap-1.5">
      <button
        v-for="cell in calendarCells"
        :key="cell.date"
        type="button"
        class="relative flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition-all active:scale-95"
        :class="getDayClass(cell)"
        @click="selectDate(cell)"
      >
        {{ cell.day }}
        <span v-if="cell.hasRecord" class="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary-500" />
      </button>
    </div>

    <div class="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-4 text-sm">
      <p class="text-gray-600">
        本月收入：
        <span class="font-mono font-semibold text-income-dark">{{ `¥${income.toFixed(2)}` }}</span>
      </p>
      <p class="text-gray-600">
        本月支出：
        <span class="font-mono font-semibold text-accent-500">{{ `¥${expense.toFixed(2)}` }}</span>
      </p>
    </div>
  </section>
</template>
