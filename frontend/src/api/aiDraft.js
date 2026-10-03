import { toRecordInput } from './ledger.js'
import { createId, validDate, validateRecord } from '../utils/ledger.js'
import { parseCents } from '../utils/money.js'
import { groupReply } from '../utils/draftEngine.js'

// 只有明确的控制指令在本机处理，金额、追加和纠正交给真实解析接口。
export function draftControl(text) {
  if (/^(?:取消(?:这组|这些|草稿)?|不记了|这组不记了|算了)[。！!]?$/u.test(text.trim())) return 'cancel'
  if (/^(?:确认(?:记下|记账|保存)?(?:\d+笔)?|就这些[，,]?记下吧|记下吧|保存这组|全部记下)[。！!]?$/u.test(text.trim())) return 'confirm'
  return null
}

export function createAiDraftApi(client, { isCurrent = () => true, makeId = createId } = {}) {
  const beforeSend = () => { if (!isCurrent()) throw new Error('登录身份已变化，本次草稿整理已停止。') }
  async function parse(text, { date, group = null } = {}) {
    beforeSend()
    if (group && ['saved', 'cancelled'].includes(group.status)) throw new Error('这组已结束，请创建新草稿。')
    let message = String(text || '').trim()
    if (group?.pending?.kind === 'ai') message = `${group.pending.text}\n本喵追问：${group.pending.question}\n用户补充：${message}`
    if (!message || message.length > 1000 || !validDate(date) || date.startsWith('9999-')) {
      throw new Error('这次整理的文字（含待补充内容）最多1000字，请精简后重试，或取消这组重新描述。')
    }
    const context = (group?.items || []).map(toRecordInput)
    let response
    try {
      response = await client.request('POST', '/api/ai/parse', {
        body: { message, date, context }, requestTimeoutMs: 65000, beforeSend,
      })
    } catch (error) {
      if (error.code === 'NETWORK_ERROR') throw new Error('AI请求已中断、超时或连接失败，未入账，可以重试整理。')
      throw error
    }
    beforeSend()
    if (response?.model !== 'glm-4.7-flash' || !['ready', 'needs_input'].includes(response.status)
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
    if (!response.records.length || response.question !== '') throw new Error('AI候选账单不完整，原草稿没有改变。')
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
