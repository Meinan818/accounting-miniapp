/**
 * 格式化日期
 * @param {Date|string} date
 * @param {string} format - 格式: 'YYYY-MM-DD', 'YYYY-MM', 'MM-DD'
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
}

/**
 * 获取当前月份
 */
export function getCurrentMonth() {
  return formatDate(new Date(), 'YYYY-MM')
}

/**
 * 获取月份的第一天和最后一天
 */
export function getMonthRange(month) {
  const [year, m] = month.split('-')
  const lastDay = new Date(year, m, 0).getDate()
  return {
    start: `${month}-01`,
    end: `${month}-${lastDay}`
  }
}
