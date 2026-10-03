import test from 'node:test'
import assert from 'node:assert/strict'
import { createAiDraftApi, draftControl } from '../src/api/aiDraft.js'

const date = '2026-10-04'
const record = { type: 'expense', amount: '25.00', date, category: '餐饮', note: '午饭' }
const ready = { model: 'glm-4.7-flash', status: 'ready', records: [record], question: '' }
const clarification = { model: 'glm-4.7-flash', status: 'needs_input', records: [], question: '午饭花了多少钱？' }
let sequence = 0
const makeId = prefix => prefix + '-' + ++sequence

test('真实解析只发文字/候选与基准日期，不发送整本账单，也不写入账单', async () => {
  const calls = []
  const api = createAiDraftApi({ request: async (...args) => { calls.push(args); return ready } }, { makeId })
  const result = await api.parse('午饭25元', { date })
  assert.equal(calls.length, 1); assert.equal(calls[0][1], '/api/ai/parse')
  assert.deepEqual(calls[0][2].body, { message: '午饭25元', date, context: [] })
  assert.equal(calls[0][2].requestTimeoutMs, 65000)
  assert.equal(result.group.items[0].amountCents, 2500); assert.equal(result.group.status, 'ready')
  assert.equal(result.group.items[0].time, undefined); assert.match(result.reply, /确认再记下/)
})

test('缺金额追问可恢复，补充时发送原文字及追问，不猜金额', async () => {
  const calls = []
  const api = createAiDraftApi({ request: async (...args) => { calls.push(args); return calls.length === 1 ? clarification : ready } }, { makeId })
  const first = await api.parse('今天吃了午饭', { date })
  assert.equal(first.group.items.length, 0); assert.equal(first.group.pending.kind, 'ai')
  const restored = JSON.parse(JSON.stringify(first.group))
  const second = await api.parse('25元', { date, group: restored })
  assert.equal(second.group.id, first.group.id); assert.equal(second.group.status, 'ready')
  assert.match(calls[1][2].body.message, /今天吃了午饭.*\n本喵追问：午饭花了多少钱？\n用户补充：25元/)
})

test('连续纠正/追加发送当前候选，保留组标识和原草稿直到有效响应', async () => {
  let response = ready, outgoing
  const api = createAiDraftApi({ request: async (m, p, options) => { outgoing = options.body; return response } }, { makeId })
  const original = (await api.parse('午饭25元', { date })).group
  const before = JSON.stringify(original)
  response = { ...ready, records: [{ ...record, amount: '20.00' }] }
  const changed = await api.parse('午饭改成20', { date, group: original })
  assert.equal(changed.group.id, original.id); assert.equal(changed.group.items[0].id, original.items[0].id)
  assert.equal(changed.group.items[0].amountCents, 2000); assert.equal(JSON.stringify(original), before)
  assert.deepEqual(outgoing.context, [record])
  response = clarification
  const pending = await api.parse('再加一笔地铁', { date, group: changed.group })
  assert.equal(pending.group.status, 'needs_input'); assert.equal(pending.group.items[0].amountCents, 2000)
})

test('异常输出不覆盖原草稿，不静默使用模拟结果', async () => {
  for (const response of [{ ...ready, model: 'glm-4.7-flashx' }, { ...ready, records: [] }, { ...clarification, records: [record] },
    { ...ready, records: [{ ...record, amount: 25 }] }, { ...ready, records: [{ ...record, category: '虚构' }] },
    { ...ready, records: [{ ...record, amount: '1,000' }] }, { ...ready, records: [{ ...record, date: '2026-02-30' }] }]) {
    const api = createAiDraftApi({ request: async () => response })
    await assert.rejects(api.parse('午饭25元', { date }))
  }
  let calls = 0
  const api = createAiDraftApi({ request: async () => { calls++; throw Object.assign(new Error('真实AI尚未配置'), { code: 'AI_UNAVAILABLE' }) } })
  await assert.rejects(api.parse('午饭25元', { date }), /尚未配置/); assert.equal(calls, 1)
})

test('身份变化、终态和超过1000字均阻止整理或接收异步结果', async () => {
  let current = true, calls = 0
  const api = createAiDraftApi({ request: async () => { calls++; current = false; return ready } }, { isCurrent: () => current })
  await assert.rejects(api.parse('午饭25元', { date }), /身份已变化/); assert.equal(calls, 1)
  current = true
  await assert.rejects(api.parse('x'.repeat(1001), { date }), /1000字/)
  await assert.rejects(api.parse('修改', { date, group: { status: 'saved' } }), /已结束/)
  assert.equal(calls, 1)
})

test('明确确认和取消由本机控制，修改/消费和统计不会被当作确认', () => {
  assert.equal(draftControl('确认2笔'), 'confirm'); assert.equal(draftControl('取消这组'), 'cancel')
  for (const input of ['买确认礼物25', '午饭改成20', '本月多少', '追加地铁3元']) assert.equal(draftControl(input), null)
})
