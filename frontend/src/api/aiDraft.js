import { toRecordInput } from './ledger.js'
import { createId, validDate, validateRecord } from '../utils/ledger.js'
import { parseCents } from '../utils/money.js'
import { applyDraftInput, groupReply } from '../utils/draftEngine.js'

// 确认/取消及明确改价采用确定操作，新整理和追加调用真实解析接口。
export function draftControl(text) {
  if (/^(?:取消(?:这组|这些|草稿)?|不记了|这组不记了|算了)[。！!]?$/u.test(text.trim())) return 'cancel'
  if (/^(?:确认(?:记下|记账|保存)?(?:\d+笔)?|就这些[，,]?记下吧|记下吧|保存这组|全部记下)[。！!]?$/u.test(text.trim())) return 'confirm'
  return null
}

export function createAiDraftApi(client, { isCurrent = () => true, makeId = createId } = {}) {
  const beforeSend = () => { if (!isCurrent()) throw new Error('登录身份已变化，本次草稿整理已停止。') }
  async function parse(text, { date, group = null, signal } = {}) {
    const guard = () => {
      beforeSend()
      if (signal?.aborted) throw new Error('本次AI整理已停止，未入账。')
    }
    guard()
    if (group && ['saved', 'cancelled'].includes(group.status)) throw new Error('这组已结束，请创建新草稿。')
    let message = String(text || '').trim()
    if (group?.pending?.kind === 'ai') message = `${group.pending.text}\n本喵追问：${group.pending.question}\n用户补充：${message}`
    if (!message || message.length > 1000 || !validDate(date) || date.startsWith('9999-')) {
      throw new Error('这次整理的文字（含待补充内容）最多1000字，请精简后重试，或取消这组重新描述。')
    }
    const isAddition = /^(?:再加(?:一笔)?|另外加(?:一笔)?|追加)/.test(message)
    // 单笔确定操作不处理多段指令；否则后一句的金额可能误套给前一句的目标。
    const correctionText = message.replace(/\d{1,3}(?:,\d{3})+(?:\.\d+)?/g, token => token.replaceAll(',', ''))
      .replace(/[。！!?？]+$/u, '')
    const multipleClauses = /[，,、;；。\n]|然后|另外|同时|以及|还有|并且|和|与/.test(correctionText)
      || (message.match(/改成|改为|改到|改一下/g) || []).length > 1
    if (group && !isAddition && (group.pending?.kind === 'target' || (group.status === 'ready'
      && !multipleClauses && /改成|改为|改到|改一下|那笔|第[1-5一二三四五]笔.*(?:是|金额|日期)/.test(message)))) {
      // 不让单笔改价的模型结果替换整个组；既有规则只修改明确目标，歧义先问编号。
      const result = applyDraftInput({ ...group, origin: 'ai' }, message, { date, makeId })
      guard()
      return result
    }
    const context = (group?.items || []).map(toRecordInput)
    let response
    try {
      response = await client.request('POST', '/api/ai/parse', {
        body: { message, date, context }, requestTimeoutMs: 65000, beforeSend: guard, signal,
      })
    } catch (error) {
      if (signal?.aborted) throw new Error('本次AI整理已停止，未入账。')
      if (error.code === 'NETWORK_ERROR') throw new Error('AI请求已中断、超时或连接失败，未入账，可以重试整理。')
      throw error
    }
    guard()
    if (response?.model !== 'glm-4-flash-250414' || !['ready', 'needs_input'].includes(response.status)
      || !Array.isArray(response.records) || response.records.length > 5 || typeof response.question !== 'string'
      || response.question.length > 300) throw new Error('AI草稿格式不正确，原草稿没有改变。')
    const next = { id: group?.id || makeId('draft'), createdDate: group?.createdDate || date,
      origin: 'ai', items: [], status: response.status, pending: null }
    if (response.status === 'needs_input') {
      if (response.records.length || !response.question.trim()) throw new Error('AI追问格式不正确，原草稿没有改变。')
      // 追问时保护已有完整候选；原始文字单独限长保存，以便刷新后继续补充。
      next.items = group?.items ? JSON.parse(JSON.stringify(group.items)) : []
      next.pending = { kind: 'ai', text: message, question: response.question }
      return { group: next, reply: response.question }
    }
    if (!response.records.length || response.records.length < (group?.items?.length || 0) || response.question !== '') throw new Error('AI候选账单不完整，原草稿没有改变。')
    next.items = response.records.map((record, index) => {
      if (typeof record?.amount !== 'string' || !/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(record.amount) || typeof record.note !== 'string'
        || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) throw new Error('AI账单字段不正确，原草稿没有改变。')
      const value = validateRecord({ ...record, time: record.time ?? '00:00', remark: record.note })
      return { ...value, ...(record.time == null ? { time: undefined } : {}),
        id: group?.items?.[index]?.id || makeId('item'), amountCents: parseCents(record.amount),
        errors: { amount: '', date: '', time: '' } }
    })
    return { group: next, reply: groupReply(next) }
  }
  return { parse }
}
