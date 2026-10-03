import test from 'node:test'
import assert from 'node:assert/strict'
import { getMonthQueryReply } from '../src/utils/chatQuery.js'
const record = (overrides = {}) => ({ id: 'r', type: 'expense', amount: .1, category: '餐饮', date: '2026-10-03', ...overrides })
test('聊天查询复用统计整数分，不计已删除或其他月份', () => {
  const records = [record(), record({ amount: .2 }), record({ amount: 50, deletedAt: '2026-10-03T00:00:00Z' }), record({ amount: 40, date: '2026-09-03' })]
  assert.equal(getMonthQueryReply('查询本月支出', records, '2026-10'), '本月支出合计 ¥0.30。')
  assert.equal(getMonthQueryReply('本月餐饮花了多少', records, '2026-10'), '本月餐饮共花了 ¥0.30。')
})
test('收入分类/总收入与无账单查询使用实际账本', () => {
  const records = [record({ type: 'income', category: '工资', amount: 100 }), record({ amount: 20 })]
  assert.equal(getMonthQueryReply('本月工资收入多少', records, '2026-10'), '本月工资收入合计 ¥100.00。')
  assert.equal(getMonthQueryReply('查询本月收入', records, '2026-10'), '本月收入合计 ¥100.00。')
  assert.equal(getMonthQueryReply('查询本月交通支出', records, '2026-10'), '本月交通共花了 ¥0.00。')
  assert.equal(getMonthQueryReply('查询本月支出', [], '2026-10'), '本月支出合计 ¥0.00。')
})
test('其他日期范围明确不拿本月冒充', () => {
  for (const text of ['查询昨天支出','查询今天支出','查询上个月支出','查询2026-09支出','查询9月支出','查询今年收入','查询明天支出','查询这周支出','查询上月支出']) {
    assert.match(getMonthQueryReply(text, null, '2026-10'), /不会拿本月数据冒充/)
  }
})
test('损坏账单或超安全范围不显示假零结果', () => {
  assert.throws(() => getMonthQueryReply('查询本月支出', [record({ amount: 'bad' })], '2026-10'), /金额/)
  const records = Array.from({ length: 100000 }, () => record({ amount: 999999999.99 }))
  assert.throws(() => getMonthQueryReply('查询本月支出', records, '2026-10'), /安全范围/)
})
test('查询不改账本或历史文本，既有未来业务日期仍计入所属月', () => {
  const records = [record({ amount: 12, date: '2026-10-25' })], original = JSON.stringify(records)
  assert.match(getMonthQueryReply('查询本月支出', records, '2026-10'), /12.00/)
  assert.equal(JSON.stringify(records), original)
})
