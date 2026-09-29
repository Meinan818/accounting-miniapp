<script setup>
// 1. 导入
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { ChevronDown, PawPrint } from 'lucide-vue-next'
import CalendarCard from '@/components/calendar/CalendarCard.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import { useRecordStore } from '@/stores/recordStore'
import { formatCurrency } from '@/utils/format'

// 2. 组合式函数
const recordStore = useRecordStore()

// 3. 响应式数据
const today = dayjs().format('YYYY-MM-DD')
const todayMonth = today.slice(0, 7)
const calendarMonth = ref(todayMonth)
const selectedDate = ref(today)

// 4. 计算属性
const visibleMonthRecords = computed(() => recordStore.records.filter((record) => (
  record.date?.startsWith(calendarMonth.value)
)))

const monthIncome = computed(() => visibleMonthRecords.value
  .filter((record) => record.type === 'income')
  .reduce((total, record) => total + Number(record.amount || 0), 0))

const monthExpense = computed(() => visibleMonthRecords.value
  .filter((record) => record.type === 'expense')
  .reduce((total, record) => total + Number(record.amount || 0), 0))

const selectedRecords = computed(() => recordStore.records
  .filter((record) => record.date === selectedDate.value)
  .sort((left, right) => String(left.time).localeCompare(String(right.time))))

const selectedDateLabel = computed(() => {
  const date = dayjs(selectedDate.value)

  if (date.isSame(dayjs(), 'day')) {
    return `今天 · ${date.format('M月D日')}`
  }

  return date.format('M月D日 dddd')
})

// 5. 方法
function handleMonthChange(month) {
  calendarMonth.value = month
  selectedDate.value = month === todayMonth ? today : `${month}-01`
}

function getRecordSign(record) {
  return record.type === 'income' ? '+' : '-'
}
</script>

<template>
  <div class="paper-surface relative min-h-[100dvh] overflow-x-hidden px-4 pb-48 pt-5">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -left-20 -top-12 h-44 w-72 rounded-[50%] bg-warning/20 blur-sm" />
      <div class="absolute -right-16 top-24 h-36 w-56 rounded-[50%] bg-accent-100/70 blur-sm" />
      <div class="absolute -left-14 top-[34rem] h-36 w-52 rounded-[50%] bg-income-light/50 blur-sm" />
      <PawPrint class="absolute left-8 top-36 h-12 w-12 rotate-[-20deg] text-warning/20" />
      <PawPrint class="absolute right-12 top-24 h-8 w-8 rotate-[18deg] text-warning/20" />
      <PawPrint class="absolute left-1/2 top-[35rem] h-10 w-10 rotate-[10deg] text-warning/20" />
    </div>

    <main class="relative z-10 mx-auto max-w-2xl">
      <header class="mb-5 flex items-center justify-between">
        <div class="rounded-[45%_55%_48%_52%] bg-warning/45 px-4 py-2 shadow-sm">
          <button
            type="button"
            class="flex items-center gap-1 text-2xl font-black text-gray-900"
            aria-label="切换账簿"
          >
            日常开销
            <ChevronDown :size="25" :stroke-width="2.8" />
          </button>
        </div>
        <div class="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-hand bg-white text-3xl shadow-md">
          🐣
        </div>
      </header>

      <CalendarCard
        :month="calendarMonth"
        :selected-date="selectedDate"
        :records="recordStore.records"
        :income="monthIncome"
        :expense="monthExpense"
        @update:month="handleMonthChange"
        @update:selected-date="selectedDate = $event"
      />

      <section class="mt-7">
        <div class="mb-3 flex items-end justify-between px-1">
          <div>
            <p class="text-xs font-medium text-gray-400">当天账单</p>
            <h2 class="text-xl font-bold text-gray-900">{{ selectedDateLabel }}</h2>
          </div>
          <span class="rounded-full bg-white px-3 py-1 text-xs text-gray-500 shadow-sm">
            {{ selectedRecords.length }} 笔
          </span>
        </div>

        <div v-if="selectedRecords.length" class="space-y-3">
          <article
            v-for="record in selectedRecords"
            :key="record.id"
            class="flex items-center justify-between rounded-2xl border-[2.5px] border-hand bg-white px-4 py-3 shadow-[3px_4px_0_rgba(31,41,55,0.12)]"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-full bg-cream-dark text-2xl">
                {{ record.icon || '📝' }}
              </div>
              <div>
                <p class="font-semibold text-gray-900">{{ record.category }}</p>
                <p class="text-xs text-gray-500">{{ record.time || '--:--' }} · {{ record.remark || '无备注' }}</p>
              </div>
            </div>
            <p
              class="font-mono text-lg font-bold"
              :class="record.type === 'income' ? 'text-income-dark' : 'text-accent-500'"
            >
              {{ getRecordSign(record) }}{{ formatCurrency(record.amount) }}
            </p>
          </article>
        </div>

        <div v-else class="flex flex-col items-center py-10 text-center">
          <div class="mb-3 text-5xl">🐣</div>
          <p class="font-semibold text-gray-600">当前选择日期没有账单记录</p>
          <p class="mt-1 text-sm text-gray-400">点下面中间的 +，和小账说一笔</p>
        </div>
      </section>
    </main>

    <div class="pointer-events-none fixed bottom-24 left-1/2 z-20 flex w-[min(94vw,38rem)] -translate-x-1/2 items-end justify-between px-6">
      <span class="text-6xl drop-shadow-sm">🐱</span>
      <span class="mb-3 text-4xl">🌱</span>
      <span class="text-6xl drop-shadow-sm">🐻</span>
    </div>

    <BottomNav active="bill" />
  </div>
</template>
