<script setup>
// 1. 导入
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { ArrowLeft, ChevronLeft, ChevronRight, ReceiptText } from 'lucide-vue-next'
import BottomNav from '@/components/layout/BottomNav.vue'
import { useRecordStore } from '@/stores/recordStore'
import { formatCurrency } from '@/utils/format'

// 2. 组合式函数
const recordStore = useRecordStore()

// 3. 响应式数据
const selectedMonth = ref(dayjs().format('YYYY-MM'))

// 4. 计算属性
const monthTitle = computed(() => dayjs(`${selectedMonth.value}-01`).format('YYYY年M月'))
const monthRecords = computed(() => recordStore.records
  .filter((record) => record.date?.startsWith(selectedMonth.value))
  .sort((left, right) => {
    const leftKey = `${left.date} ${left.time || '00:00'}`
    const rightKey = `${right.date} ${right.time || '00:00'}`
    return rightKey.localeCompare(leftKey)
  }))

const monthIncome = computed(() => monthRecords.value
  .filter((record) => record.type === 'income')
  .reduce((total, record) => total + Number(record.amount || 0), 0))

const monthExpense = computed(() => monthRecords.value
  .filter((record) => record.type === 'expense')
  .reduce((total, record) => total + Number(record.amount || 0), 0))

const monthBalance = computed(() => monthIncome.value - monthExpense.value)

const groupedRecords = computed(() => {
  const groups = new Map()

  monthRecords.value.forEach((record) => {
    if (!groups.has(record.date)) {
      groups.set(record.date, [])
    }

    groups.get(record.date).push(record)
  })

  return [...groups.entries()].map(([date, records]) => ({
    date,
    label: getDateLabel(date),
    income: records
      .filter((record) => record.type === 'income')
      .reduce((total, record) => total + Number(record.amount || 0), 0),
    expense: records
      .filter((record) => record.type === 'expense')
      .reduce((total, record) => total + Number(record.amount || 0), 0),
    records,
  }))
})

// 5. 方法
function changeMonth(offset) {
  selectedMonth.value = dayjs(`${selectedMonth.value}-01`).add(offset, 'month').format('YYYY-MM')
}

function getDateLabel(date) {
  const target = dayjs(date)
  const today = dayjs().startOf('day')

  if (target.isSame(today, 'day')) {
    return '今天'
  }

  if (target.isSame(today.subtract(1, 'day'), 'day')) {
    return '昨天'
  }

  return target.format('M月D日 dddd')
}

function getSign(record) {
  return record.type === 'income' ? '+' : '-'
}
</script>

<template>
  <div class="paper-surface min-h-[100dvh] px-4 pb-32 pt-5">
    <main class="mx-auto max-w-2xl">
      <header class="mb-5 flex items-center gap-3">
        <router-link
          to="/"
          class="flex h-11 w-11 items-center justify-center rounded-full border-2 border-hand bg-white text-gray-900 shadow-sm active:scale-95"
          aria-label="返回日历主页"
        >
          <ArrowLeft :size="21" />
        </router-link>
        <div>
          <p class="text-xs font-medium text-gray-400">账本流水</p>
          <h1 class="text-2xl font-bold text-gray-900">账单明细</h1>
        </div>
      </header>

      <section class="rounded-2xl border-[3px] border-hand bg-white/95 p-4 shadow-[4px_5px_0_rgba(31,41,55,0.12)]">
        <div class="mb-4 flex items-center justify-between">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full text-hand hover:bg-cream-dark active:scale-95"
            aria-label="上个月"
            @click="changeMonth(-1)"
          >
            <ChevronLeft :size="26" :stroke-width="2.4" />
          </button>
          <h2 class="text-lg font-bold text-gray-900">{{ monthTitle }}</h2>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full text-hand hover:bg-cream-dark active:scale-95"
            aria-label="下个月"
            @click="changeMonth(1)"
          >
            <ChevronRight :size="26" :stroke-width="2.4" />
          </button>
        </div>

        <dl class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-xl bg-income-light px-2 py-3">
            <dt class="text-xs text-gray-600">收入</dt>
            <dd class="mt-1 font-mono text-sm font-bold text-income-dark">{{ formatCurrency(monthIncome) }}</dd>
          </div>
          <div class="rounded-xl bg-expense-light px-2 py-3">
            <dt class="text-xs text-gray-600">支出</dt>
            <dd class="mt-1 font-mono text-sm font-bold text-expense-dark">{{ formatCurrency(monthExpense) }}</dd>
          </div>
          <div class="rounded-xl bg-cream-dark px-2 py-3">
            <dt class="text-xs text-gray-600">结余</dt>
            <dd class="mt-1 font-mono text-sm font-bold text-gray-900">{{ formatCurrency(monthBalance) }}</dd>
          </div>
        </dl>
      </section>

      <div class="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <ReceiptText :size="15" />
        下拉刷新将在接入后端后启用
      </div>

      <section v-if="groupedRecords.length" class="mt-5 space-y-5">
        <div v-for="group in groupedRecords" :key="group.date">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-1 px-1">
            <h3 class="font-bold text-gray-700">{{ group.label }}</h3>
            <div class="flex items-center gap-2 font-mono text-xs">
              <span v-if="group.income" class="text-income-dark">
                收入 +{{ formatCurrency(group.income) }}
              </span>
              <span v-if="group.expense" class="text-expense-dark">
                支出 -{{ formatCurrency(group.expense) }}
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <article
              v-for="record in group.records"
              :key="record.id"
              class="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-cream-dark text-2xl">
                  {{ record.icon || '📝' }}
                </div>
                <div class="min-w-0">
                  <p class="truncate font-semibold text-gray-900">{{ record.category }}</p>
                  <p class="truncate text-xs text-gray-500">{{ record.time || '--:--' }} · {{ record.remark || '无备注' }}</p>
                </div>
              </div>
              <p
                class="ml-3 flex-shrink-0 font-mono text-base font-bold"
                :class="record.type === 'income' ? 'text-income-dark' : 'text-expense-dark'"
              >
                {{ getSign(record) }}{{ formatCurrency(record.amount) }}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section v-else class="flex flex-col items-center py-16 text-center">
        <div class="mb-3 text-5xl">🐣</div>
        <p class="font-semibold text-gray-600">这个月还没有账单哦~</p>
        <p class="mt-1 text-sm text-gray-400">回到日历主页，从小账那里记一笔吧</p>
      </section>
    </main>

    <BottomNav active="detail" />
  </div>
</template>
