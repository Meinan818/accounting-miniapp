<script setup>
// 1. 导入
import { computed, onBeforeUnmount, ref } from 'vue'
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
const quickTip = ref('')
let quickTipTimer = null

const quickActions = [
  { icon: '🐣', label: '小账铺', tip: '小账铺正在装修中' },
  { icon: '🧾', label: '小票', tip: '小票夹正在整理中' },
  { icon: '📅', label: '签到', tip: '签到奖励正在准备中' },
  { icon: '🪙', label: '攒钱', tip: '攒钱计划正在准备中' },
]

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

function handleQuickAction(action) {
  quickTip.value = action.tip

  if (quickTipTimer) {
    window.clearTimeout(quickTipTimer)
  }

  quickTipTimer = window.setTimeout(() => {
    quickTip.value = ''
  }, 1800)
}

function getRecordSign(record) {
  return record.type === 'income' ? '+' : '-'
}

// 6. 生命周期
onBeforeUnmount(() => {
  if (quickTipTimer) {
    window.clearTimeout(quickTipTimer)
  }
})
</script>

<template>
  <div class="paper-surface relative min-h-[100dvh] overflow-x-hidden px-4 pb-36 pt-5">
    <div class="pointer-events-none absolute inset-0 overflow-hidden text-warning/20">
      <PawPrint class="absolute left-8 top-36 h-12 w-12 rotate-[-20deg]" />
      <PawPrint class="absolute right-12 top-24 h-8 w-8 rotate-[18deg]" />
      <PawPrint class="absolute left-1/2 top-[34rem] h-10 w-10 rotate-[10deg]" />
      <PawPrint class="absolute right-8 top-[44rem] h-12 w-12 rotate-[-12deg]" />
    </div>

    <main class="relative z-10 mx-auto max-w-2xl">
      <header class="mb-5 flex items-center justify-between">
        <button
          type="button"
          class="flex items-center gap-1 text-2xl font-bold text-gray-900"
          aria-label="切换账簿"
        >
          日常开销
          <ChevronDown :size="24" :stroke-width="2.5" />
        </button>
        <div class="flex h-11 w-11 items-center justify-center rounded-full border-2 border-hand bg-white text-2xl shadow-sm">
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

      <section class="mt-5">
        <div class="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
          <button
            v-for="action in quickActions"
            :key="action.label"
            type="button"
            class="flex min-w-[132px] items-center gap-3 whitespace-nowrap rounded-xl border-[3px] border-hand bg-white px-4 py-3 text-left shadow-[3px_4px_0_rgba(31,41,55,0.12)] transition-transform active:scale-95"
            @click="handleQuickAction(action)"
          >
            <span class="text-2xl">{{ action.icon }}</span>
            <span class="font-semibold text-gray-900">{{ action.label }}</span>
          </button>
        </div>
        <p v-if="quickTip" class="mt-1 text-center text-xs font-medium text-primary-600">
          {{ quickTip }}
        </p>
      </section>

      <section class="mt-7">
        <div class="mb-3 flex items-end justify-between">
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
            class="flex items-center justify-between rounded-xl border-2 border-hand bg-white px-4 py-3 shadow-[2px_3px_0_rgba(31,41,55,0.1)]"
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


    <BottomNav active="bill" />
  </div>
</template>
