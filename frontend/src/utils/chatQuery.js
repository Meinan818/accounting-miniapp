import dayjs from 'dayjs'
import { findCategoryMatch } from './categories.js'
import { getMonthStatistics } from './statistics.js'
import { centsText } from './money.js'

// Query presentation only: the same pure aggregation as Stats, never a second ledger.
export function getMonthQueryReply(text, records, month = dayjs().format('YYYY-MM')) {
  if (/上个月|下个月|去年|今年|昨天|前天|今天|明天|后天|本周|这周|上周|下周|上月|下月|本年|年度|\d{4}[-年]|\d{1,2}月/.test(text)) {
    return '这版查询先支持本月汇总；其他日期请到明细切月查看。本喵不会拿本月数据冒充其他日期。'
  }
  const statistics = getMonthStatistics(records, month)
  const type = /收入/.test(text) ? 'income' : 'expense'
  const category = findCategoryMatch(text, type)
  const cents = category
    ? statistics.categories[type].find(item => item.category === category.label)?.amountCents || 0
    : statistics[type + 'Cents']
  if (category) return type === 'income'
    ? '本月' + category.label + '收入合计 ¥' + centsText(cents) + '。'
    : '本月' + category.label + '共花了 ¥' + centsText(cents) + '。'
  return '本月' + (type === 'income' ? '收入' : '支出') + '合计 ¥' + centsText(cents) + '。'
}
