import { computed, onScopeDispose, ref } from 'vue'
import dayjs from 'dayjs'
import { isValidMonth } from './statistics.js'

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
