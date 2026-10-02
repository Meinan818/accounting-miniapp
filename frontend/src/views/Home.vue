<script setup>
// 1. 导入
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { ReceiptText } from 'lucide-vue-next'
import miaoAvatar from '@/assets/design/mascot/miao-avatar.png'
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
  <div class="journal-home">
    <main class="home-content">
      <header class="home-header">
        <img :src="miaoAvatar" alt="手绘猫猫喵子" class="home-header-cat" />
        <div>
          <h1 class="home-title">喵子智账</h1>
          <p class="home-subtitle">日常开销 · 本地演示</p>
        </div>
        <span class="home-header-note">每一笔，都好好记下</span>
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

      <section class="home-ledger" aria-label="当天账单">
        <div class="home-ledger-heading">
          <div>
            <p class="home-subtitle">当天的小账单</p>
            <h2>{{ selectedDateLabel }}</h2>
          </div>
          <span class="home-count">
            {{ selectedRecords.length }} 笔
          </span>
        </div>

        <div v-if="selectedRecords.length" class="space-y-3">
          <article
            v-for="record in selectedRecords"
            :key="record.id"
            class="home-record"
          >
            <div class="home-record-main">
              <span class="home-record-stamp" aria-hidden="true"><ReceiptText :size="20" :stroke-width="1.5" /></span>
              <div class="home-record-text">
                <p>{{ record.category }}</p>
                <p class="home-subtitle">{{ record.time || '--:--' }} · {{ record.remark || '无备注' }}</p>
              </div>
            </div>
            <p
              class="home-record-amount"
              :class="record.type === 'income' ? 'home-amount-income' : 'home-amount-expense'"
            >
              {{ getRecordSign(record) }}{{ formatCurrency(record.amount) }}
            </p>
          </article>
        </div>

        <div v-else class="home-empty">
          <img :src="miaoAvatar" alt="" />
          <div>
            <p>这天还没有小账单</p>
            <p class="home-subtitle">点下面的 +，和喵子聊着记一笔</p>
          </div>
        </div>
      </section>
    </main>

    <BottomNav active="bill" home-appearance />
  </div>
</template>

<style scoped>
.journal-home {
  min-height: 100dvh;
  padding: 18px 16px calc(var(--zz-home-bottom-nav-height) + 26px + env(safe-area-inset-bottom, 0px));
  background-color: var(--zz-home-bg);
  color: var(--zz-home-ink);
  font-family: var(--zz-home-font);
  font-weight: 400;
}
.home-content { max-width: var(--zz-home-content-width); margin-inline: auto; }
.home-header { display: flex; align-items: center; gap: 10px; margin-bottom: 26px; }
.home-header-cat { width: 66px; height: 62px; object-fit: contain; flex-shrink: 0; transform: rotate(-5deg); }
.home-title { position: relative; isolation: isolate; width: fit-content; font-size: 24px; font-weight: 400; letter-spacing: 1px; white-space: nowrap; }
.home-title::before { content: ''; position: absolute; inset: 9px -5px 1px; z-index: -1; border-radius: 62% 45% 58% 42%; background: var(--zz-home-title-brush); transform: rotate(-2deg); }
.home-subtitle { margin-top: 5px; font-size: 12px; color: var(--zz-home-ink-soft); overflow-wrap: anywhere; }
.home-header-note { margin-left: auto; padding: 5px 8px; border-radius: 9px 6px 8px 5px; background: var(--zz-home-title-brush); color: var(--zz-home-ink-soft); font-size: 11px; transform: rotate(3deg); }
.home-ledger { margin-top: 25px; }
.home-ledger-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 13px; }
.home-ledger-heading h2 { font-size: 18px; font-weight: 400; margin-top: 3px; }
.home-count { padding: 4px 10px; border: 1px solid var(--zz-home-line); border-radius: 11px 9px 12px 10px; background: var(--zz-home-paper); font-size: 12px; color: var(--zz-home-ink-soft); white-space: nowrap; }
.home-record { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1.5px solid var(--zz-home-line); border-radius: 16px 19px 20px 15px; background: var(--zz-home-paper); padding: 13px; box-shadow: 3px 4px 0 var(--zz-home-title-brush); }
.home-record-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.home-record-stamp { display: grid; place-items: center; flex: 0 0 36px; height: 38px; border: 1px dashed var(--zz-home-line); border-radius: 11px 9px 12px 10px; background: var(--zz-home-title-brush); }
.home-record-text { min-width: 0; font-size: 15px; overflow-wrap: anywhere; }
.home-record-amount { flex-shrink: 0; max-width: 43%; text-align: right; font-size: 16px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.home-amount-income { color: var(--zz-home-green); }
.home-amount-expense { color: var(--zz-home-pink); }
.home-empty { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 20px 14px; border: 1px dashed var(--zz-home-line); border-radius: 16px 19px 20px 15px; background: var(--zz-home-paper); font-size: 14px; }
.home-empty img { width: 54px; height: 48px; object-fit: contain; flex-shrink: 0; }
@media (max-width: 359px) {
  .journal-home { padding-inline: 12px; }
  .home-header { gap: 8px; }
  .home-header-cat { width: 56px; height: 53px; }
  .home-header-note { display: none; }
}
</style>
