<script setup>
import CatNavIcon from '@/components/common/CatNavIcon.vue'
import JournalSticker from '@/components/common/JournalSticker.vue'
import ManualEntry from '@/components/record/ManualEntry.vue'
// 1. 导入
import { computed } from 'vue'
import dayjs from 'dayjs'
import CategoryIcon from '@/components/common/CategoryIcon.vue'
import miaoAvatar from '@/assets/design/mascot/miao-avatar.png'
import miaoConfused from '@/assets/design/mascot/poses/miao-confused.png'
import CalendarCard from '@/components/calendar/CalendarCard.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import { useRecordStore } from '@/stores/recordStore'
import { formatCurrency } from '@/utils/format'
import { sumAmounts } from '@/utils/money'
import { SERVER_MODE } from '@/api/mode'
import { useLedgerReload } from '@/utils/navigation'
import { useHomeCalendar } from '@/utils/calendar'

// 2. 组合式函数
const recordStore = useRecordStore()
const { reloading, reloadError, reloadRecords } = useLedgerReload(recordStore)

// 3. 响应式数据
const { today, calendarMonth, selectedDate, weekdayLabel, returnToday, handleMonthChange, handleDateChange } = useHomeCalendar()

// 4. 计算属性
const visibleMonthRecords = computed(() => recordStore.records.filter((record) => (
  record.date?.startsWith(calendarMonth.value)
)))

const todayRecords = computed(() => recordStore.records.filter(record => record.date === today.value))
const todayExpense = computed(() => sumAmounts(todayRecords.value, 'expense'))
const monthIncome = computed(() => sumAmounts(visibleMonthRecords.value, 'income'))
const monthExpense = computed(() => sumAmounts(visibleMonthRecords.value, 'expense'))

const selectedRecords = computed(() => recordStore.records
  .filter((record) => record.date === selectedDate.value)
  .sort((left, right) => String(left.time).localeCompare(String(right.time))))

const selectedDateLabel = computed(() => {
  const date = dayjs(selectedDate.value)

  if (date.isSame(dayjs(today.value), 'day')) {
    return `今天 · ${date.format('M月D日')}`
  }

  return date.format('M月D日 dddd')
})

// 5. 方法

function getRecordSign(record) {
  return record.type === 'income' ? '+' : '-'
}
</script>

<template>
  <div class="journal-home notebook-evolution">
    <main class="home-content">
      <header class="home-header">
        <img :src="miaoAvatar" alt="手绘猫猫" class="home-header-cat" />
        <div>
          <h1 class="home-title">喵叽智账</h1>
          <p class="home-subtitle">日常开销 · {{ SERVER_MODE ? '当前账号' : '本地演示' }}</p>
        </div>
        <span class="home-header-note">每一笔，都好好记下</span>
      </header>

      <section class="home-desk-hero desk-note" aria-label="今日记账便签">
        <div class="home-date-bookmark" aria-label="今天的日期"><span>{{ dayjs(today).format('M月') }}</span><strong>{{ dayjs(today).format('DD') }}</strong><span>{{ weekdayLabel }}</span></div>
        <div class="home-note-copy"><p class="edition-kicker">每天一页 · 慢慢记下</p><h2>把小开销，写成小日子</h2><p v-if="!recordStore.storageError" class="home-today-line">今天 {{ todayRecords.length }} 笔 · 支出 {{ formatCurrency(todayExpense) }}</p><p v-else class="home-today-line">先保留账本，再慢慢整理</p><router-link to="/chat" class="journal-action home-chat-action">和本喵聊着记 <span aria-hidden="true">↗</span></router-link></div>
        <JournalSticker kind="spark" tone="honey" class="home-hero-sticker" />
      </section>
      <div class="home-tools"><ManualEntry class="home-manual-link" /><button type="button" class="home-return-today" @click="returnToday"><CatNavIcon kind="calendar" /><span>回到今天</span></button></div>
      <div v-if="recordStore.storageError || reloadError" class="home-storage-error" role="alert" :aria-busy="reloading"><p>{{ recordStore.storageError || reloadError }}</p><button type="button" class="home-return-today" :disabled="reloading" @click="reloadRecords(true)">{{ reloading ? '正在读取…' : '重新读取账单' }}</button></div>

      <CalendarCard v-if="!recordStore.storageError"
        :month="calendarMonth"
        :today="today"
        :selected-date="selectedDate"
        :records="recordStore.records"
        :income="monthIncome"
        :expense="monthExpense"
        @update:month="handleMonthChange"
        @update:selected-date="handleDateChange"
      />

      <section v-if="!recordStore.storageError" class="home-ledger" aria-label="当天账单">
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
              <span class="home-record-stamp" aria-hidden="true"><CategoryIcon :category="record.category" :type="record.type" /></span>
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
          <img :src="miaoConfused" alt="摊爪的猫猫" />
          <div>
            <p>这天还没有小账单</p>
            <p class="home-subtitle">点下面的 +，本喵陪你记一笔</p>
          </div>
        </div>
      </section>
    </main>

    <BottomNav active="bill" />
  </div>
</template>

<style scoped>
.home-desk-hero { display: flex; align-items: center; gap: 14px; padding: 16px 15px 15px 12px; margin: 14px 0 20px; overflow: hidden; }
.home-date-bookmark { width: 64px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 9px 4px 12px; border: 1px solid #cbb99b; border-radius: 4px 4px 16px 3px; background: #e5ebda; color: #657859; transform: rotate(-4deg); }
.home-date-bookmark strong { font-weight: 400; font-size: 32px; line-height: 1.15; font-variant-numeric: tabular-nums; }.home-date-bookmark span { font-size: 11px; }
.home-note-copy { min-width: 0; position: relative; z-index: 1; }.home-note-copy h2 { font-size: 16px; font-weight: 400; margin: 3px 0 6px; line-height: 1.7; }.home-today-line { color: var(--zz-home-ink-soft); font-size: 11px; line-height: 1.8; }
.home-chat-action { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; margin-top: 5px; color: #755743; padding: 0 10px; border: 1px solid #d3b694; border-radius: 13px 6px 14px 7px; background: #f6e3c9; box-shadow: 2px 2px 0 #e4d1b7; font-size: 12px; text-decoration: none; }
.home-hero-sticker { position: absolute; right: -3px; top: 3px; opacity: .6; }
.home-tools { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 21px; }.home-tools .home-manual-link { margin-bottom: 0; }
.home-return-today { min-height: 44px; padding: 8px 10px; font-size: 12px; color: #786650; border-bottom: 1px dashed #bcaa94; }.home-return-today:focus-visible, .home-chat-action:focus-visible { outline: 2px solid #785746; outline-offset: 3px; }
@media(max-width:359px) { .home-desk-hero { gap: 10px; padding-inline: 10px; }.home-date-bookmark { width: 53px; }.home-note-copy h2 { font-size: 14px; }.home-today-line { font-size: 10px; } }

.home-manual-link { margin-bottom: 18px; }
.home-storage-error { font-size: 12px; color: #aa594d; margin-bottom: 12px; }
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
.home-empty img { width: 84px; height: 84px; object-fit: contain; flex-shrink: 0; }
@media (max-width: 359px) {
  .journal-home { padding-inline: 12px; }
  .home-header { gap: 8px; }
  .home-header-cat { width: 56px; height: 53px; }
  .home-header-note { display: none; }
}
</style>
