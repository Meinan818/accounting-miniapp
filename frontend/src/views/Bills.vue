<script setup>
import CategoryIcon from '@/components/common/CategoryIcon.vue'
import ManualEntry from '@/components/record/ManualEntry.vue'
// 1. 导入
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import RecordEditor from '@/components/record/RecordEditor.vue'
import { sumAmounts, legacyCents } from '@/utils/money'
import dayjs from 'dayjs'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import miaoWriting from '@/assets/design/mascot/poses/miao-writing.png'
import receiptKitten from '@/assets/design/mascot/poses/cream-receipt.png'
import BottomNav from '@/components/layout/BottomNav.vue'
import { useRecordStore } from '@/stores/recordStore'
import { formatCurrency } from '@/utils/format'
import { filterRecords } from '@/utils/journal'
import { CATEGORY_OPTIONS } from '@/utils/categories'
import { getCategoryArtwork } from '@/utils/categoryArtwork'

// 2. 组合式函数
const recordStore = useRecordStore()

// 3. 响应式数据
const route = useRoute()
const initialMonth = typeof route.query.month === 'string' && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(route.query.month) ? route.query.month : dayjs().format('YYYY-MM')
const selectedMonth = ref(initialMonth)
const editingRecord = ref(null)
const saving = ref(false)
const saveError = ref('')
const notice = ref('')
const noticeElement = ref(null)
const searchText = ref(typeof route.query.q === 'string' ? route.query.q.slice(0,120) : '')
const searchInput = ref(null)
const selectedType = ref(['income', 'expense'].includes(route.query.type) ? route.query.type : 'all')
const selectedCategory = ref(typeof route.query.category === 'string' ? route.query.category.slice(0,120) : '')

// 4. 计算属性
const monthTitle = computed(() => dayjs(`${selectedMonth.value}-01`).format('YYYY年M月'))
const monthRecords = computed(() => recordStore.records
  .filter((record) => record.date?.startsWith(selectedMonth.value))
  .sort((left, right) => {
    const leftKey = `${left.date} ${left.time || '00:00'}`
    const rightKey = `${right.date} ${right.time || '00:00'}`
    return rightKey.localeCompare(leftKey)
  }))

const monthIncome = computed(() => sumAmounts(monthRecords.value, 'income'))
const monthExpense = computed(() => sumAmounts(monthRecords.value, 'expense'))
const monthBalance = computed(() => (legacyCents(monthIncome.value) - legacyCents(monthExpense.value)) / 100)

const listedRecords = computed(() => filterRecords(monthRecords.value, { query: searchText.value, type: selectedType.value, category: selectedCategory.value }))
const filtering = computed(() => Boolean(searchText.value.trim() || selectedCategory.value || selectedType.value !== 'all'))
const filterCategories = computed(() => {
  const counts = new Map()
  for (const record of monthRecords.value) {
    if (selectedType.value !== 'all' && record.type !== selectedType.value) continue
    const key = JSON.stringify([record.type, record.category])
    if (!counts.has(key)) counts.set(key, { type:record.type, category:record.category, count:0 })
    counts.get(key).count++
  }
  const options = Object.values(CATEGORY_OPTIONS).flat().map(item => item.label)
  return [...counts.values()].sort((a,b) => options.indexOf(a.category) - options.indexOf(b.category))
})
function chooseType(type) { selectedType.value = type; selectedCategory.value = '' }
function chooseCategory(item) {
  const alreadyChosen = selectedType.value === item.type && selectedCategory.value === item.category
  selectedType.value = item.type
  selectedCategory.value = alreadyChosen ? '' : item.category
}
function resetFilters() { selectedType.value = 'all'; selectedCategory.value = ''; searchText.value = '' }
const groupedRecords = computed(() => {
  const groups = new Map()

  listedRecords.value.forEach((record) => {
    if (!groups.has(record.date)) {
      groups.set(record.date, [])
    }

    groups.get(record.date).push(record)
  })

  return [...groups.entries()].map(([date, records]) => ({
    date,
    label: getDateLabel(date),
    income: sumAmounts(records, 'income'),
    expense: sumAmounts(records, 'expense'),
    records,
  }))
})

const highlightedId = computed(() => typeof route.query.added === 'string' ? route.query.added : '')
const recordElements = new Map()
function setRecordElement(id, element) { if (element) recordElements.set(id, element); else recordElements.delete(id) }
watch([highlightedId, selectedMonth], async ([id]) => {
  if (!id || !monthRecords.value.some(record => record.id === id)) return
  notice.value = '新账单已保存，已定位到刚刚记下的这一笔。'
  resetFilters()
  await nextTick()
  const element = recordElements.get(id)
  element?.scrollIntoView({ block: 'center', behavior: 'auto' })
  element?.focus({ preventScroll: true })
}, { immediate: true })

function edit(record) { editingRecord.value = { ...record }; saveError.value = ''; notice.value = '' }
function saveEdit(input) {
  if (saving.value || !editingRecord.value) return
  saving.value = true
  try { const updated = recordStore.updateRecord(editingRecord.value.id, input); selectedMonth.value = updated.date.slice(0, 7); editingRecord.value = null; notice.value = '已保存修改：首页、明细和聊天查询已同步。' }
  catch (e) { saveError.value = e.message }
  finally { saving.value = false }
}

async function deleteEdit() {
  if (saving.value || !editingRecord.value) return
  if (typeof recordStore.deleteRecord !== 'function') { saveError.value = '当前页面仍使用旧版本数据模块。请先退出编辑并刷新页面，原账单尚未删除。'; return }
  saving.value = true; saveError.value = ''
  try { recordStore.deleteRecord(editingRecord.value.id); editingRecord.value = null; notice.value = '这笔账单已删除：首页、明细和聊天查询已同步。'; await nextTick(); noticeElement.value?.focus() }
  catch (e) { saveError.value = e.message }
  finally { saving.value = false }
}

// 5. 方法
async function clearSearch() {
  searchText.value = ''
  await nextTick()
  searchInput.value?.focus()
}

function changeMonth(offset) {
  notice.value = ''
  selectedCategory.value = ''
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
  <div class="journal-bills notebook-evolution">
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
          <p class="bills-subtitle">喵叽智账 · 本地演示</p>
        </div>
      </header>

      <ManualEntry class="bills-manual-link" />
      <p v-if="recordStore.storageError" class="bills-alert" role="alert">{{ recordStore.storageError }}</p>
      <p v-if="notice" ref="noticeElement" class="bills-notice" role="status" tabindex="-1">{{ notice }}</p>

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

        <dl v-if="!recordStore.storageError" class="bills-totals">
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

      <section class="bills-search-card" aria-label="只读账单搜索"><label for="bills-search" class="edition-kicker">翻翻本月的小票</label><div class="bills-search-row"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" stroke-linecap="round" /></svg><input ref="searchInput" id="bills-search" v-model="searchText" type="search" maxlength="120" aria-label="搜索本月账单" placeholder="分类、备注、日期或金额…" :disabled="Boolean(recordStore.storageError)" /><button v-if="searchText" type="button" aria-label="清除搜索条件" @click="clearSearch">清除</button></div></section>
      <section v-if="!recordStore.storageError && monthRecords.length" class="bills-filter-shelf" aria-label="按收支和分类筛选">
        <div class="bills-filter-heading"><span>挑一张分类贴纸</span><div class="bills-type-tabs" aria-label="筛选收支"><button v-for="type in ['all','expense','income']" :key="type" type="button" :aria-pressed="selectedType === type" :class="{ selected:selectedType === type }" @click="chooseType(type)">{{ type === 'all' ? '全部' : type === 'income' ? '收入' : '支出' }}</button></div></div>
        <div class="bills-filter-chips hide-scrollbar" aria-label="分类贴纸，可左右滑动"><button v-for="item in filterCategories" :key="item.type + item.category" type="button" class="bills-category-chip" :class="{ selected:selectedType === item.type && selectedCategory === item.category }" :aria-pressed="selectedType === item.type && selectedCategory === item.category" :aria-label="'筛选' + (item.type === 'income' ? '收入' : '支出') + '分类：' + item.category" :style="{ '--chip-paper':getCategoryArtwork(item.category,item.type).paper }" @click="chooseCategory(item)"><CategoryIcon :category="item.category" :type="item.type" /><span>{{ item.category }}</span><small>{{ item.count }}</small></button></div>
      </section>
      <div v-if="filtering && !recordStore.storageError" class="bills-filter-result"><p class="bills-search-feedback" role="status">{{ selectedCategory || (selectedType === 'all' ? '全部分类' : selectedType === 'income' ? '收入' : '支出') }} · 找到 {{ listedRecords.length }} 笔<br><span>只筛选小票，本月收支汇总不变</span></p><button type="button" @click="resetFilters">查看全部</button></div>
      <p class="bills-storage-note">账单保存在当前浏览器；这里的修改会同步到首页和聊天查询</p>
      <p v-if="groupedRecords.length" class="bills-edit-hint">点账单可编辑</p>

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
              :data-record-id="record.id"
              :ref="element => setRecordElement(record.id, element)"
              class="bills-record"
              :class="{ 'bills-record-highlighted': record.id === highlightedId }"
              role="button"
              tabindex="0"
              :aria-label="'编辑账单：' + record.category + '，' + (record.remark || '无备注') + '，' + formatCurrency(record.amount)"
              @click="edit(record)"
              @keydown.enter.prevent="edit(record)"
              @keydown.space.prevent="edit(record)"
            >
              <div class="bills-record-main">
                <span class="bills-record-stamp" aria-hidden="true"><CategoryIcon :category="record.category" :type="record.type" /></span>
                <div class="bills-record-text">
                  <p>{{ record.category }} <span v-if="record.id === highlightedId" class="bills-added-tag">刚刚记下</span></p>
                  <p class="bills-subtitle">{{ record.time || '--:--' }} · {{ record.remark || '无备注' }}</p>
                </div>
              </div>
              <div class="bills-record-actions">
              <p
                class="bills-record-amount"
                :class="record.type === 'income' ? 'bills-income' : 'bills-expense'"
              >
                {{ getSign(record) }}{{ formatCurrency(record.amount) }}
              </p>
                <ChevronRight class="bills-record-chevron" :size="16" :stroke-width="1.5" aria-hidden="true" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section v-else-if="!recordStore.storageError" class="bills-empty" aria-label="无账单">
        <img :src="receiptKitten" alt="拿着小票的奶油猫" />
        <p>{{ filtering ? '这张分类贴纸下，还没有小票' : '这个月还没有小账单' }}</p>
        <p class="bills-subtitle">{{ filtering ? '换一张贴纸、调整关键词，或查看全部' : '点下面的 +，本喵帮你记一笔' }}</p>
      </section>
    </main>

    <RecordEditor v-if="editingRecord" :key="editingRecord.id" :record="editingRecord" :saving="saving" :error="saveError" allow-delete @delete="deleteEdit" @save="saveEdit" @close="editingRecord = null" />
    <BottomNav active="detail" />
  </div>
</template>

<style scoped>
.bills-filter-shelf { margin-top:18px; }
.bills-filter-heading { display:flex; align-items:center; justify-content:space-between; gap:6px; color:#846450; font-size:12px; }
.bills-type-tabs { display:flex; gap:3px; border:1px solid #e5cbb5; border-radius:15px; background:#fff7ec; padding:3px; }
.bills-type-tabs button { min-height:38px; padding:0 11px; border-radius:12px; }
.bills-type-tabs button.selected { background:#f4d2d9; color:#814d60; box-shadow:0 2px 0 #e8bac6; }
.bills-filter-chips { display:flex; gap:9px; overflow-x:auto; padding:13px 2px 9px; }
.bills-category-chip { display:flex; align-items:center; gap:5px; position:relative; flex:0 0 auto; padding:7px 11px 7px 6px; min-height:52px; border:1.5px solid #e2c8b4; border-radius:18px; background:#fffaf1; box-shadow:0 3px 0 #edd9c4; color:#775440; font-size:12px; }
.bills-category-chip .category-icon { width:34px; height:34px; }
.bills-category-chip small { color:#8b7262; font-size:10px; padding-left:2px; }
.bills-category-chip.selected { background:var(--chip-paper); border-color:#b68b77; box-shadow:0 3px 0 #d5b4a1; }
.bills-filter-result { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:9px; padding:11px 12px; border-radius:14px; background:#fff1e0; }
.bills-filter-result .bills-search-feedback { margin:0; color:#815b46; }
.bills-filter-result .bills-search-feedback span { color:#a18470; }
.bills-filter-result button { flex-shrink:0; min-height:44px; padding:6px 10px; border:1px solid #dfbfa7; border-radius:12px; background:#fffaf0; font-size:12px; }
.bills-type-tabs button:focus-visible, .bills-category-chip:focus-visible, .bills-filter-result button:focus-visible { outline:2px solid #91664e; outline-offset:2px; }
.bills-search-card { position: relative; margin-top: 21px; padding: 13px 13px 11px; background: #ede6f0; border: 1px solid #c8b8d0; border-radius: 9px 16px 10px 15px; }
.bills-search-card::before { content: ''; position:absolute; width:44px; height:14px; background:#f3e3bc; opacity:.8; top:-7px; left:17px; transform:rotate(-5deg); }
.bills-search-row { display: flex; align-items: center; gap: 9px; margin-top: 4px; min-height:44px; color:#8a7591; }.bills-search-row input { min-width:0; width:100%; font-size:14px; background:transparent; color:#624f6b; outline:none; }.bills-search-row input:focus-visible { outline: none; }
.bills-search-card:focus-within { border-color: #94749f; box-shadow: 0 0 0 3px #e5d9ec80; }
.bills-search-row button:focus-visible { outline: 2px solid #92749f; outline-offset: 2px; border-radius: 8px; }.bills-search-row input::placeholder { color:#755d7d; opacity:1; }
@media (prefers-reduced-motion: no-preference) {
  .bills-search-card { transition: border-color 160ms ease, box-shadow 160ms ease; }
  .bills-record { transition: background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease; }
}
.bills-record:active { border-color: #c5a58f; box-shadow: 1px 2px 0 #e9ddcc; }
.bills-search-row button { min-height:44px; min-width:44px; font-size:12px; flex-shrink:0; }.bills-search-feedback { margin-top:5px; font-size:11px; line-height:1.8; color:#7b6984; }

.bills-manual-link { margin-bottom: 18px; }
.bills-record-actions { display: flex; flex-direction: row; align-items: flex-end; gap: 5px; flex-shrink: 0; min-width: 75px; max-width: 43%; }
.bills-record-chevron { flex-shrink: 0; color: #b6a18d; }
.bills-edit-hint { margin: 7px 0 0; text-align: center; font-size: 12px; color: var(--zz-home-ink-soft); }
.bills-record[role="button"] { cursor: pointer; }
.bills-record:hover { background: #fff8ed; }
.bills-record:focus-visible { outline: 2px solid var(--zz-home-ink); outline-offset: 3px; }
.bills-alert { color: #aa594d; font-size: 12px; margin-bottom: 12px; }
.bills-notice { font-size: 12px; margin-bottom: 12px; padding: 10px 12px; border: 1px solid #d7d9ba; border-radius: 12px; background: #f2f4e5; line-height: 1.8; }
.bills-record.bills-record-highlighted { border-color: #ce9e8c; background: #fff4e5; }
.bills-added-tag { display: inline-block; margin-left: 4px; padding: 2px 5px; border-radius: 6px; background: #f8dfd5; color: #a16556; font-size: 11px; vertical-align: middle; }
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
.bills-record-amount { flex-shrink: 0; max-width: none; width: auto; text-align: right; font-size: 16px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
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
