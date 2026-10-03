import { computed, onScopeDispose, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { isValidMonth } from './statistics.js'

export function useBillQuery(route, currentMonth = () => dayjs().format('YYYY-MM')) {
  const selectedMonth = ref(isValidMonth(route.query.month) ? route.query.month : currentMonth())
  const searchText = ref(typeof route.query.q === 'string' ? route.query.q.slice(0, 120) : '')
  const selectedType = ref(['income', 'expense'].includes(route.query.type) ? route.query.type : 'all')
  const selectedCategory = ref(typeof route.query.category === 'string' ? route.query.category.slice(0, 120) : '')
  watch([() => route.query.month, () => route.query.q, () => route.query.type, () => route.query.category], () => {
    selectedMonth.value = isValidMonth(route.query.month) ? route.query.month : currentMonth()
    searchText.value = typeof route.query.q === 'string' ? route.query.q.slice(0, 120) : ''
    selectedType.value = ['income', 'expense'].includes(route.query.type) ? route.query.type : 'all'
    selectedCategory.value = typeof route.query.category === 'string' ? route.query.category.slice(0, 120) : ''
  }, { flush: 'sync' })
  function changeMonth(offset) {
    if (!Number.isInteger(offset)) return false
    const next = dayjs(selectedMonth.value + '-01').add(offset, 'month').format('YYYY-MM')
    if (!isValidMonth(next)) return false
    selectedMonth.value = next
    selectedCategory.value = ''
    return true
  }
  return { selectedMonth, searchText, selectedType, selectedCategory, changeMonth }
}

export function useManualRecordSave(store, router, batchId) {
  const saving = ref(false), error = ref(''), savedRecord = ref(null)
  let active = true
  onScopeDispose(() => { active = false })
  async function navigateSaved() {
    const saved = savedRecord.value
    const failure = await router.push({ path: '/bills', query: { month: saved.date.slice(0, 7), added: saved.id } })
    if (!active) return false
    if (failure) throw new Error('账单已保存，暂时未能打开明细，请重试打开；无需再次入账。')
    return true
  }
  async function save(record, originalBatchId = batchId) {
    if (!active || saving.value) return false
    saving.value = true; error.value = ''
    try {
      if (!savedRecord.value) {
        const saved = await store.addRecord(record, { batchId: originalBatchId, source: 'manual' })
        if (!active) return false
        savedRecord.value = saved
      }
      return await navigateSaved()
    } catch (failure) {
      if (active) error.value = savedRecord.value ? '账单已保存，暂时未能打开明细，请重试打开；无需再次入账。' : failure.message
      return false
    } finally { if (active) saving.value = false }
  }
  return { saving, error, savedRecord, save }
}

export function useStatsMonthNavigation(route, router, currentMonth = () => dayjs().format('YYYY-MM')) {
  const selectedMonth = computed(() => isValidMonth(route.query.month) ? route.query.month : currentMonth())
  const pendingMonth = ref('')
  const navigationError = ref('')
  const navigationMonth = computed(() => pendingMonth.value || selectedMonth.value)
  let generation = 0
  let active = true
  onScopeDispose(() => { active = false; generation++ })
  async function changeMonth(offset) {
    if (!active || !Number.isInteger(offset)) return false
    const next = dayjs(navigationMonth.value + '-01').add(offset, 'month').format('YYYY-MM')
    if (!isValidMonth(next)) return false
    const current = ++generation
    pendingMonth.value = next; navigationError.value = ''
    try {
      const failure = await router.replace({ query: { ...route.query, month: next } })
      if (!active || current !== generation) return false
      if (failure || selectedMonth.value !== next) {
        navigationError.value = '月份未能切换，仍显示原月份，请重试。'
        return false
      }
      return true
    } catch {
      if (active && current === generation) navigationError.value = '月份暂时无法切换，仍显示原月份，请重试。'
      return false
    } finally {
      if (active && current === generation) pendingMonth.value = ''
    }
  }
  return { selectedMonth, pendingMonth, navigationMonth, navigationError, changeMonth }
}

// 页面滚动与账单定位各自负责，防止导航回顶覆盖保存后的新行。
export function getScrollPosition(to, from, savedPosition) {
  if (savedPosition) return savedPosition
  if (to.path === from.path) return false
  if (to.path === '/bills' && typeof to.query?.added === 'string' && to.query.added) return false
  return { left: 0, top: 0 }
}
