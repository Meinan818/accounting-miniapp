<script setup>
// 1. 导入
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { ChevronDown } from 'lucide-vue-next'
import bearPeek from '@/assets/design/decoration/bear-peek.png'
import catPeek from '@/assets/design/decoration/cat-peek.png'
import chickAvatar from '@/assets/design/mascot/chick-avatar.png'
import leaves from '@/assets/design/decoration/leaves.png'
import plantSprout from '@/assets/design/decoration/plant-sprout.png'
import titleBrush from '@/assets/design/decoration/title-brush.png'
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
  <div class="journal-home relative min-h-[100dvh] overflow-x-hidden px-4 pt-4">
    <!-- 背景装饰：简化，去掉多余爪印 -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -left-20 -top-12 h-44 w-72 rounded-[50%] bg-warning/15 blur-sm" />
      <div class="absolute -right-16 top-32 h-36 w-56 rounded-[50%] bg-accent-100/60 blur-sm" />
    </div>

    <main class="relative z-10 mx-auto max-w-[var(--zz-home-content-width)]">
      <header class="mb-6 flex items-center justify-between">
        <div class="relative">
          <img :src="titleBrush" alt="" class="absolute -left-2 -top-2 h-[4.2rem] w-[14rem] object-fill opacity-95" />
          <button
            type="button"
            class="relative flex items-center gap-1 px-2 py-2 text-3xl font-black text-[var(--zz-home-ink)]"
            aria-label="切换账簿"
          >
            日常开销
            <ChevronDown :size="25" :stroke-width="2.8" />
          </button>
        </div>
        <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--zz-home-ink)] bg-[var(--zz-home-paper)] shadow-sm">
          <img :src="chickAvatar" alt="小黄鸡" class="h-16 w-16 object-contain" />
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

      <section class="mt-6" aria-label="当天账单">
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

        <div v-else class="flex flex-col items-center py-4 text-center">
          <img :src="chickAvatar" alt="" class="mb-2 h-10 w-10 object-contain" />
          <p class="font-semibold text-gray-600">当前选择日期没有账单记录</p>
          <p class="mt-1 text-sm text-gray-400">点下面中间的 +，和小账说一笔</p>
        </div>
      </section>
    </main>

    <!-- 底部装饰：重新布局，避免拥挤 -->
    <div class="home-scene pointer-events-none fixed left-0 right-0 z-20" aria-hidden="true">
      <div class="relative mx-auto h-24 max-w-[var(--zz-home-content-width)]">
        <img :src="leaves" alt="" class="absolute -left-1 bottom-1 h-14 w-14 object-contain opacity-80" />
        <img :src="plantSprout" alt="" class="absolute bottom-3 right-[29%] h-12 w-12 object-contain" />
        <img :src="catPeek" alt="" class="absolute bottom-0 left-[7%] w-[26%] object-contain" />
        <img :src="bearPeek" alt="" class="absolute bottom-0 right-[7%] w-[26%] object-contain" />
      </div>
    </div>

    <BottomNav active="bill" home-appearance />
  </div>
</template>

<style scoped>
.journal-home {
  background-color: var(--zz-home-bg);
  background-image: radial-gradient(var(--zz-home-paper-grain) 0.5px, transparent 0.9px);
  background-size: 5px 5px;
  padding-bottom: calc(var(--zz-home-bottom-nav-height) + 140px + env(safe-area-inset-bottom, 0px));
}
.home-scene {
  bottom: calc(var(--zz-home-bottom-nav-height) - 20px + env(safe-area-inset-bottom, 0px));
  padding-top: 14px;
  background: linear-gradient(transparent, var(--zz-home-bg) 14px);
  max-width: var(--zz-home-content-width);
  margin-inline: auto;
}
</style>
