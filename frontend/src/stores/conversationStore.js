import { nextTick, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { createId, validDate, validateRecord } from '../utils/ledger.js'
import { MAX_CENTS } from '../utils/money.js'

const STORAGE_KEY = 'zhizhang_conversation'
function welcome() { return { id: 'welcome-message', role: 'assistant', kind: 'text', content: '本喵来啦～今天买了什么呀？整理好后，由你确认再记下。', createdAt: new Date().toISOString() } }


const isObject = value => value != null && typeof value === 'object' && !Array.isArray(value)
const validId = value => typeof value === 'string' && value.trim().length > 0
const validTime = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
function checkPatch(patch) {
  if (!isObject(patch) || !Object.keys(patch).length) throw new Error('invalid patch')
  for (const [key, value] of Object.entries(patch)) {
    const valid = key === 'amountCents' ? Number.isSafeInteger(value) && value > 0 && value <= MAX_CENTS
      : key === 'date' ? typeof value === 'string' && validDate(value)
      : key === 'time' ? validTime(value)
      : key === 'type' ? ['expense', 'income'].includes(value) : false
    if (!valid) throw new Error('invalid patch')
  }
}
function checkGroup(group) {
  if (!isObject(group) || !validId(group.id) || !Array.isArray(group.items) || !group.items.length || group.items.length > 5
    || !['needs_input', 'ready', 'saved', 'cancelled'].includes(group.status)) throw new Error('invalid group')
  if (group.createdDate !== undefined && (typeof group.createdDate !== 'string' || !validDate(group.createdDate))) throw new Error('invalid date')
  const ids = new Set()
  for (const item of group.items) {
    if (!isObject(item) || !validId(item.id) || ids.has(item.id)) throw new Error('invalid item id')
    ids.add(item.id)
    if (item.type != null && !['expense', 'income'].includes(item.type)) throw new Error('invalid type')
    if (item.amountCents != null && (!Number.isSafeInteger(item.amountCents) || item.amountCents <= 0 || item.amountCents > MAX_CENTS)) throw new Error('invalid amount')
    if (item.date != null && (typeof item.date !== 'string' || !validDate(item.date))) throw new Error('invalid date')
    if (item.time != null && !validTime(item.time)) throw new Error('invalid time')
    for (const field of ['category', 'description', 'remark']) if (item[field] !== undefined && typeof item[field] !== 'string') throw new Error('invalid text')
    if (item.errors !== undefined && (!isObject(item.errors) || Object.values(item.errors).some(e => typeof e !== 'string'))) throw new Error('invalid errors')
    if (['ready', 'saved'].includes(group.status)) validateRecord(item)
  }
  const pending = group.pending
  if (group.status === 'needs_input' && !pending) throw new Error('missing pending context')
  if (group.status !== 'needs_input' && pending != null) throw new Error('unexpected pending context')
  if (pending != null) {
    if (!isObject(pending)) throw new Error('invalid pending context')
    if (pending.kind === 'target') {
      if (!Array.isArray(pending.itemIds) || !pending.itemIds.length || new Set(pending.itemIds).size !== pending.itemIds.length
        || pending.itemIds.some(id => !ids.has(id))) throw new Error('invalid targets')
      checkPatch(pending.patch)
    } else if (!['type', 'date', 'time', 'amountCents'].includes(pending.kind) || !ids.has(pending.itemId)) throw new Error('invalid pending field')
  }
}
// Validate without rewriting, filtering or migrating older messages.
function readHistory() {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
  if (raw == null) return [welcome()]
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('invalid history')
  const ids = new Set(), groups = new Set()
  for (const message of parsed) {
    if (!isObject(message) || !validId(message.id) || ids.has(message.id)
      || !['user', 'assistant'].includes(message.role)
      || !['text', 'record', 'draft-group'].includes(message.kind)
      || (message.content !== undefined && typeof message.content !== 'string')
      || (message.confirmed !== undefined && typeof message.confirmed !== 'boolean')) throw new Error('invalid message')
    ids.add(message.id)
    if (message.kind === 'record' && !isObject(message.record)) throw new Error('invalid legacy record')
    if (message.kind === 'draft-group') {
      checkGroup(message.group)
      if (groups.has(message.group.id)) throw new Error('duplicate group')
      groups.add(message.group.id)
    }
  }
  return parsed
}

export const useConversationStore = defineStore('conversation', () => {
  const persistenceError = ref('')
  const restorationBlocked = ref(false)
  let sessionChanged = false
  let restoring = false
  let initial = [welcome()]
  function blockedMessage() {
    persistenceError.value = '旧对话暂无法读取，已保护原内容。新对话仅留本次页面，刷新前请先备份。账单仍可在明细查看。'
  }
  try { initial = readHistory() }
  catch { restorationBlocked.value = true; blockedMessage() }
  const messages = ref(initial)
  const isThinking = ref(false)
  const mascotMood = ref('happy')
  function addMessage(message) {
    const entry = { id: message.id || createId('message'), role: message.role || 'assistant', kind: message.kind || 'text',
      content: message.content || '', record: message.record || null, confirmed: Boolean(message.confirmed),
      group: message.group || null, createdAt: message.createdAt || new Date().toISOString() }
    messages.value.push(entry)
    return entry
  }
  function updateRecord(id, record) { const m = messages.value.find(m => m.id === id); if (m) m.record = { ...record } }
  function markRecordConfirmed(id) { const m = messages.value.find(m => m.id === id); if (m) m.confirmed = true }
  function updateGroup(id, group) { const m = messages.value.find(m => m.id === id); if (m) m.group = group }
  function setThinking(v) { isThinking.value = Boolean(v) }
  function setMascotMood(v) { mascotMood.value = v }
  function clearConversation() { messages.value = [welcome()]; mascotMood.value = 'happy' }
  function persist(value) {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      persistenceError.value = ''; return true
    } catch {
      persistenceError.value = '对话暂未保存到浏览器，刷新可能丢失未确认草稿；已入账的数据仍以明细为准。'
      return false
    }
  }
  async function retryPersistence() {
    // Drain queued deep-watch writes before deciding whether re-reading is safe.
    await nextTick()
    if (!restorationBlocked.value) return persist(messages.value)
    if (sessionChanged) {
      persistenceError.value = '原对话仍受保护，本页已有新消息或草稿；为避免覆盖任一份内容，暂不能重新读取。请先备份两份内容，不要刷新或清除存储。'
      return false
    }
    try {
      const recovered = readHistory()
      restoring = true
      messages.value = recovered
      await nextTick()
      restorationBlocked.value = false; persistenceError.value = ''; sessionChanged = false
      return true
    } catch { blockedMessage(); return false }
    finally { restoring = false }
  }
  watch(messages, value => {
    if (restoring) return
    sessionChanged = true
    if (!restorationBlocked.value) persist(value)
  }, { deep: true })
  return { messages, isThinking, mascotMood, persistenceError, restorationBlocked, retryPersistence,
    addMessage, updateRecord, markRecordConfirmed, updateGroup, setThinking, setMascotMood, clearConversation }
})
