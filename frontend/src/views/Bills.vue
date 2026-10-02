<script setup>
// 1. 导入
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { ArrowLeft, ChevronLeft, ChevronRight, ReceiptText } from 'lucide-vue-next'
import miaoWriting from '@/assets/design/mascot/poses/miao-writing.png'
import receiptKitten from '@/assets/design/mascot/poses/cream-receipt.png'
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
  <div class="journal-bills">
    <main class="bills-content">
      <header class="bills-header">
        <router-link
          to="/"
          class="bills-back active:scale-95"
          aria-label="返回日历主页"
        >
          <ArrowLeft :size="20" :stroke-width="1.5" />
        </router-link>
        <img :src="miaoWriting" alt="猫猫抱着账本陪你看明细" class="bills-header-cat" />
        <div class="bills-heading-text">
          <h1 class="bills-title">账单明细</h1>
          <p class="bills-subtitle">喵子智账 · 本地演示</p>
        </div>
      </header>

      <section class="bills-summary" aria-label="月度账单汇总">
        <div class="bills-month">
          <button
            type="button"
            class="bills-month-button active:scale-95"
            aria-label="上个月"
            @click="changeMonth(-1)"
          >
            <ChevronLeft :size="22" :stroke-width="1.5" />
          </button>
          <h2>{{ monthTitle }}</h2>
          <button
            type="button"
            class="bills-month-button active:scale-95"
            aria-label="下个月"
            @click="changeMonth(1)"
          >
            <ChevronRight :size="22" :stroke-width="1.5" />
          </button>
        </div>

        <dl class="bills-totals">
          <div class="bills-total-income">
            <dt>收入</dt>
            <dd class="bills-income">{{ formatCurrency(monthIncome) }}</dd>
          </div>
          <div class="bills-total-expense">
            <dt>支出</dt>
            <dd class="bills-expense">{{ formatCurrency(monthExpense) }}</dd>
          </div>
          <div class="bills-total-balance">
            <dt>结余</dt>
            <dd>{{ formatCurrency(monthBalance) }}</dd>
          </div>
        </dl>
      </section>

      <p class="bills-storage-note">账单保存在当前浏览器，记下后会同步到这里</p>

      <section v-if="groupedRecords.length" class="bills-groups" aria-label="按日账单">
        <div v-for="group in groupedRecords" :key="group.date" class="bills-day-group">
          <div class="bills-day-heading">
            <h3>{{ group.label }}</h3>
            <div class="bills-day-totals">
              <span v-if="group.income" class="bills-income">
                收入 +{{ formatCurrency(group.income) }}
              </span>
              <span v-if="group.expense" class="bills-expense">
                支出 -{{ formatCurrency(group.expense) }}
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <article
              v-for="record in group.records"
              :key="record.id"
              class="bills-record"
            >
              <div class="bills-record-main">
                <span class="bills-record-stamp" aria-hidden="true"><ReceiptText :size="20" :stroke-width="1.5" /></span>
                <div class="bills-record-text">
                  <p>{{ record.category }}</p>
                  <p class="bills-subtitle">{{ record.time || '--:--' }} · {{ record.remark || '无备注' }}</p>
                </div>
              </div>
              <p
                class="bills-record-amount"
                :class="record.type === 'income' ? 'bills-income' : 'bills-expense'"
              >
                {{ getSign(record) }}{{ formatCurrency(record.amount) }}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section v-else class="bills-empty" aria-label="无账单">
        <img :src="receiptKitten" alt="拿着小票的奶油猫" />
        <p>这个月还没有小账单</p>
        <p class="bills-subtitle">点下面的 +，本喵帮你记一笔</p>
      </section>
    </main>

    <BottomNav active="detail" home-appearance />
  </div>
</template>

<style scoped>
.journal-bills { min-height: 100dvh; padding: 18px 16px calc(var(--zz-home-bottom-nav-height) + 26px + env(safe-area-inset-bottom, 0px)); background: var(--zz-home-bg); color: var(--zz-home-ink); font-family: var(--zz-home-font); font-weight: 400; }
.bills-content { max-width: var(--zz-home-content-width); margin-inline: auto; }
.bills-header { display: flex; align-items: center; gap: 9px; margin-bottom: 26px; }
.bills-back { display: grid; place-items: center; flex: 0 0 44px; height: 44px; border: 1px solid var(--zz-home-line); border-radius: 16px 13px 17px 14px; background: var(--zz-home-paper); }
.bills-header-cat { width: 72px; height: 78px; object-fit: contain; flex-shrink: 0; transform: rotate(-3deg); }
.bills-heading-text { min-width: 0; }
.bills-title { position: relative; isolation: isolate; width: fit-content; font-size: 24px; font-weight: 400; letter-spacing: 1px; white-space: nowrap; }
.bills-title::before { content: ''; position: absolute; inset: 9px -5px 1px; z-index: -1; border-radius: 62% 45% 58% 42%; background: var(--zz-home-title-brush); transform: rotate(-2deg); }
.bills-subtitle { margin-top: 5px; font-size: 12px; color: var(--zz-home-ink-soft); overflow-wrap: anywhere; }
.bills-summary { position: relative; padding: 22px 14px 16px; border: 1.5px solid var(--zz-home-line); border-radius: 16px 19px 20px 15px; background: var(--zz-home-paper); box-shadow: 3px 4px 0 var(--zz-home-title-brush); }
.bills-summary::before { content: ''; position: absolute; top: -9px; left: calc(50% - 38px); width: 76px; height: 20px; border: 1px dashed var(--zz-home-line); border-radius: 2px 4px 3px 2px; background: var(--zz-home-pink-soft); transform: rotate(-4deg); pointer-events: none; }
.bills-month { display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 14px; }
.bills-month-button { display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 14px 11px 15px 12px; }
.bills-month-button:hover { background: var(--zz-home-title-brush); }
.bills-month h2 { padding: 5px 12px; background: var(--zz-home-title-brush); border-radius: 14px 11px 15px 12px; font-size: 18px; font-weight: 400; }
.bills-totals { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.bills-totals > div { min-width: 0; padding: 11px 8px; border-radius: 14px 11px 15px 12px; text-align: center; }
.bills-totals dt { color: var(--zz-home-ink-soft); font-size: 12px; }
.bills-totals dd { margin-top: 4px; font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.bills-total-income { background: var(--zz-home-income-panel); }
.bills-total-expense { background: var(--zz-home-expense-panel); }
.bills-total-balance { background: var(--zz-home-title-brush); }
.bills-income { color: var(--zz-home-green); }
.bills-expense { color: var(--zz-home-pink); }
.bills-storage-note { margin: 17px 0 0; color: var(--zz-home-ink-soft); font-size: 12px; text-align: center; }
.bills-groups { display: grid; gap: 22px; margin-top: 22px; }
.bills-day-heading { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 6px 12px; margin: 0 2px 10px; }
.bills-day-heading h3 { font-weight: 400; font-size: 16px; }
.bills-day-totals { display: flex; flex-wrap: wrap; gap: 5px 10px; font-size: 12px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.bills-record { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px; border: 1.5px solid var(--zz-home-line); border-radius: 16px 19px 20px 15px; background: var(--zz-home-paper); box-shadow: 3px 4px 0 var(--zz-home-title-brush); }
.bills-record-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.bills-record-stamp { display: grid; place-items: center; flex: 0 0 36px; height: 38px; border: 1px dashed var(--zz-home-line); border-radius: 11px 9px 12px 10px; background: var(--zz-home-title-brush); }
.bills-record-text { min-width: 0; font-size: 15px; overflow-wrap: anywhere; }
.bills-record-amount { flex-shrink: 0; max-width: 43%; text-align: right; font-size: 16px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.bills-empty { margin-top: 27px; padding: 27px 16px; border: 1px dashed var(--zz-home-line); border-radius: 16px 19px 20px 15px; background: var(--zz-home-paper); text-align: center; font-size: 15px; }
.bills-empty img { display: block; width: 112px; height: 112px; object-fit: contain; margin: 0 auto 13px; }
.bills-back:focus-visible, .bills-month-button:focus-visible { outline: 2px solid var(--zz-home-ink); outline-offset: 3px; }
@media (max-width: 359px) {
  .journal-bills { padding-inline: 12px; }
  .bills-header { gap: 7px; }
  .bills-header-cat { width: 58px; height: 65px; }
  .bills-title { font-size: 23px; }
}
</style>
