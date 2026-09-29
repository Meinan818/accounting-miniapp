/**
 * 格式化金额
 * @param {number} amount
 * @param {number} digits - 小数位数
 */
export function formatAmount(amount, digits = 2) {
  return Number(amount).toFixed(digits)
}

/**
 * 格式化金额显示（添加千分位）
 */
export function formatMoney(amount) {
  const num = Number(amount).toFixed(2)
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化百分比
 */
export function formatPercent(value, total) {
  if (total === 0) return '0%'
  return ((value / total) * 100).toFixed(1) + '%'
}
