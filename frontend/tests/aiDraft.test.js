import test from 'node:test'
import assert from 'node:assert/strict'
import { createAiDraftApi, draftControl } from '../src/api/aiDraft.js'

const date = '2026-10-04'
const record = { type: 'expense', amount: '25.00', date, category: '餐饮', note: '午饭' }
const ready = { model: 'glm-4-flash-250414', status: 'ready', records: [record], question: '' }
const clarification = { model: 'glm-4-flash-250414', status: 'needs_input', records: [], question: '午饭花了多少钱？' }
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

test('明确纠正本机保留组，追加再发送完整候选，不覆盖原草稿', async () => {
  let response = ready, outgoing
  const api = createAiDraftApi({ request: async (m, p, options) => { outgoing = options.body; return response } }, { makeId })
  const original = (await api.parse('午饭25元', { date })).group
  const before = JSON.stringify(original)
  response = { ...ready, records: [{ ...record, amount: '20.00' }] }
  const changed = await api.parse('午饭改成20', { date, group: original })
  assert.equal(changed.group.id, original.id); assert.equal(changed.group.items[0].id, original.items[0].id)
  assert.equal(changed.group.items[0].amountCents, 2000); assert.equal(JSON.stringify(original), before)
  response = clarification
  const pending = await api.parse('再加一笔地铁', { date, group: changed.group })
  assert.deepEqual(outgoing.context, [{ ...record, amount: '20.00' }])
  assert.equal(pending.group.status, 'needs_input'); assert.equal(pending.group.items[0].amountCents, 2000)
})
test('单笔改价不请求模型、不丢其他候选；歧义改价选择编号再应用', async () => {
  let calls = 0
  const api = createAiDraftApi({ request: async () => { calls++; return { ...ready, records: [record, { ...record, amount: '18.00', note: '咖啡' }] } } }, { makeId })
  const first = await api.parse('午饭25，咖啡18', { date })
  const changed = await api.parse('咖啡改成16', { date, group: first.group })
  assert.equal(calls, 1); assert.equal(changed.group.items.length, 2); assert.equal(changed.group.items[0].amountCents, 2500)
  assert.equal(changed.group.items[1].amountCents, 1600); assert.equal(changed.group.status, 'ready')
  const ambiguous = await api.parse('那笔改成15', { date, group: first.group })
  assert.equal(ambiguous.group.pending.kind, 'target')
  const selected = await api.parse('第2笔', { date, group: ambiguous.group })
  assert.equal(selected.group.items[0].amountCents, 2500); assert.equal(selected.group.items[1].amountCents, 1500)
  assert.equal(selected.group.status, 'ready'); assert.equal(calls, 1)
})

test('模型少返回一笔时保留原组，含修改字样的追加仍请求模型', async () => {
  let calls = 0, response = { ...ready, records: [record, { ...record, amount: '18.00', note: '咖啡' }] }
  const api = createAiDraftApi({ request: async () => { calls++; return response } }, { makeId })
  const original = (await api.parse('午饭25，咖啡18', { date })).group
  const before = JSON.stringify(original)
  response = ready
  await assert.rejects(api.parse('再加一笔地铁3元', { date, group: original }), /不完整/)
  assert.equal(JSON.stringify(original), before)
  response = clarification
  const pending = await api.parse('再加一笔，咖啡改成拿铁，20元', { date, group: original })
  assert.equal(calls, 3); assert.equal(pending.group.pending.kind, 'ai')
  assert.equal(JSON.stringify(original), before)
})

test('多段纠正交给真实接口，不把第二笔金额误改到第一笔', async () => {
  let calls = 0, response = { ...ready, records: [record, { ...record, amount: '18.00', note: '咖啡' }] }
  const api = createAiDraftApi({ request: async () => { calls++; return response } }, { makeId })
  const original = (await api.parse('午饭25，咖啡18', { date })).group
  const before = JSON.stringify(original)
  response = { ...ready, records: [{ ...record, amount: '20.00' }, { ...record, amount: '18.00', note: '咖啡', date: '2026-10-03' }] }
  const changed = await api.parse('咖啡改成昨天，午饭改成20', { date, group: original })
  assert.equal(calls, 2)
  assert.equal(changed.group.items[0].amountCents, 2000); assert.equal(changed.group.items[0].date, date)
  assert.equal(changed.group.items[1].amountCents, 1800); assert.equal(changed.group.items[1].date, '2026-10-03')
  assert.equal(JSON.stringify(original), before)
})

test('单笔千分位改价与日期纠正保留金额、其他条目和原业务时间', async () => {
  let calls = 0
  const api = createAiDraftApi({ request: async () => {
    calls++; return { ...ready, records: [record, { ...record, amount: '18.00', note: '咖啡' }] }
  } }, { makeId })
  const first = (await api.parse('午饭25，咖啡18', { date })).group
  const amount = (await api.parse('咖啡改成1,200.50', { date, group: first })).group
  assert.equal(amount.items[1].amountCents, 120050); assert.equal(amount.items[0].amountCents, 2500)
  const yesterday = (await api.parse('第2笔改成昨天。', { date, group: amount })).group
  assert.equal(yesterday.items[1].date, '2026-10-03'); assert.equal(yesterday.items[1].amountCents, 120050)
  assert.equal(yesterday.items[0].date, date); assert.equal(yesterday.items[1].time, undefined)
  assert.equal(calls, 1); assert.equal(yesterday.status, 'ready')
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
test('停止整理传递AbortSignal，迟到的成功响应也不能生成新草稿', async () => {
  const controller = new AbortController(); let release, outgoing
  const api = createAiDraftApi({ request: async (m, p, options) => {
    outgoing = options; return new Promise(resolve => { release = resolve })
  } })
  const pending = api.parse('午饭25元', { date, signal: controller.signal })
  assert.equal(outgoing.signal, controller.signal)
  controller.abort(); release(ready)
  await assert.rejects(pending, /已停止/)
  let calls = 0
  const alreadyStopped = createAiDraftApi({ request: async () => { calls++; return ready } })
  await assert.rejects(alreadyStopped.parse('午饭25元', { date, signal: controller.signal }), /已停止/)
  assert.equal(calls, 0)
})
