import { centsText, parseCents } from '../utils/money.js'
import { validDate, validateRecord } from '../utils/ledger.js'
import { CATEGORY_OPTIONS, getCategoryMeta } from '../utils/categories.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function toRecordInput(input) {
  const value = validateRecord({ ...input, time: input.time ?? '00:00' })
  if (value.date.startsWith('9999-')) throw new Error('正式账单日期最多到9998年')
  return { type: value.type, amount: centsText(parseCents(value.amount)), date: value.date,
    ...(input.time != null ? { time: value.time } : {}), category: value.category, note: value.remark }
}

export function fromRecordView(value) {
  if (!value || !UUID.test(value.id) || typeof value.amount !== 'string' || !Number.isSafeInteger(value.version) || value.version < 0
    || !validDate(value.date) || !CATEGORY_OPTIONS[value.type]?.some(c => c.label === value.category)
    || typeof value.note !== 'string' || value.note.length > 200
    || (value.time != null && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.time))) {
    throw new Error('服务账单格式不正确，暂不替换当前账本。')
  }
  const amount = parseCents(value.amount) / 100
  return { id: value.id, type: value.type, amount, date: value.date, ...(value.time ? { time: value.time } : {}),
    category: value.category, icon: getCategoryMeta(value.category, value.type).icon,
    remark: value.note || '', description: value.note || value.category, version: value.version }
}

// 先持久化确认意图再发请求；超时/重开页面仍复用同键，不使用演示账本键。
export function createLedgerApi(client, { storage, owner, newUuid = () => globalThis.crypto.randomUUID(), isCurrent = () => true } = {}) {
  if (!/^\d+$/.test(String(owner))) throw new Error('缺少正式账号身份')
  const key = `miaoji_account_write_intents_v1_${owner}`
  const beforeSend = () => { if (!isCurrent()) throw new Error('登录身份已变化，本次操作没有发送。') }
  function intents() {
    const raw = storage.getItem(key)
    if (raw === null) return {}
    const value = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.values(value).some(v => !v || !UUID.test(v.requestId) || typeof v.content !== 'string'
        || (v.draftVersion != null && (!Number.isSafeInteger(v.draftVersion) || v.draftVersion < 0)))) {
      throw new Error('确认记录无法读取，原内容已保护，请勿清除存储。')
    }
    return value
  }
  function intent(batchId, content) {
    if (typeof batchId !== 'string' || !batchId || ['__proto__', 'constructor', 'prototype'].includes(batchId)) throw new Error('缺少有效确认标识')
    const values = intents()
    if (Object.hasOwn(values, batchId)) {
      if (values[batchId].content !== content) throw new Error('这次确认的内容已改变，请先核对账单，不要重新入账。')
      return values[batchId].requestId
    }
    const requestId = newUuid()
    if (!UUID.test(requestId)) throw new Error('无法生成安全的确认标识')
    values[batchId] = { requestId, content }
    try { storage.setItem(key, JSON.stringify(values)) }
    catch { throw new Error('确认标识无法保存，尚未发送入账请求。请保留草稿后再试。') }
    return requestId
  }
  function rememberDraftVersion(batchId, version) {
    const values = intents()
    const saved = values[batchId]
    if (!saved) throw new Error('确认标识已变化，请保留内容并核对账单。')
    if (saved.draftVersion != null && saved.draftVersion !== version) throw new Error('服务端草稿版本已变化，请重新核对，不要重复入账。')
    if (saved.draftVersion == null) {
      values[batchId] = { ...saved, draftVersion: version }
      try { storage.setItem(key, JSON.stringify(values)) }
      catch { throw new Error('草稿版本无法保存，尚未发送确认请求。请保留内容后再试。') }
    }
    return values[batchId].draftVersion
  }
  async function createBatch(inputs, batchId) {
    if (!Array.isArray(inputs) || inputs.length < 1 || inputs.length > 5) throw new Error('每次确认1–5笔账单')
    const ids = inputs.map((value, index) => String(value.id ?? index))
    if (new Set(ids).size !== ids.length) throw new Error('草稿编号重复')
    const body = { records: inputs.map(toRecordInput) }
    const requestId = intent(batchId, JSON.stringify(body))
    const draft = await client.request('PUT', `/api/drafts/${requestId}`, { body, beforeSend })
    if (draft?.id !== requestId || !Number.isSafeInteger(draft.version) || draft.version < 0
      || !['OPEN', 'CONFIRMED'].includes(draft.status) || !Array.isArray(draft.records) || draft.records.length !== body.records.length
      || draft.records.some((record, index) => ['type', 'amount', 'date', 'category', 'note', 'time']
        .some(field => (record?.[field] ?? null) !== (body.records[index][field] ?? null)))) {
      throw new Error('服务端草稿状态或内容不一致，请保留原操作并核对账单。')
    }
    beforeSend()
    const version = rememberDraftVersion(batchId, draft.version)
    const response = await client.request('POST', `/api/drafts/${requestId}/confirm`, {
      body: { version }, headers: { 'Idempotency-Key': requestId }, beforeSend })
    const receipt = response?.records
    if (!Array.isArray(receipt) || receipt.length !== inputs.length) throw new Error('保存回执不完整，请用原操作重试。')
    return receipt.map((value, index) => ({ ...fromRecordView(value), draftGroupId: batchId, draftItemId: ids[index] }))
  }
  async function update(current, input) {
    const response = await client.request('PUT', `/api/records/${current.id}`, { body: { version: current.version, record: toRecordInput(input) }, beforeSend })
    return { ...current, ...fromRecordView(response) }
  }
  async function remove(current) {
    return client.request('DELETE', `/api/records/${current.id}?version=${current.version}`, { beforeSend })
  }
  return { createBatch, update, remove }
}
