import { nextTick, onScopeDispose, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { createId, validDate, validateRecord } from '../utils/ledger.js'
import { MAX_CENTS } from '../utils/money.js'
import { SERVER_MODE } from '../api/mode.js'
import { useAuthStore } from './authStore.js'

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
  if (!isObject(group) || !validId(group.id) || !Array.isArray(group.items) || group.items.length > 5
    || !['needs_input', 'ready', 'saved', 'cancelled'].includes(group.status)) throw new Error('invalid group')
  if (!group.items.length && !(group.origin === 'ai' && ['needs_input', 'cancelled'].includes(group.status))) throw new Error('empty group')
  if (group.createdDate !== undefined && (typeof group.createdDate !== 'string' || !validDate(group.createdDate))) throw new Error('invalid date')
  const ids = new Set()
  if (group.recordIds !== undefined && (!Array.isArray(group.recordIds) || group.recordIds.length !== group.items.length
      || new Set(group.recordIds).size !== group.recordIds.length || group.recordIds.some(id => !validId(id)))) throw new Error('invalid saved record ids')
  for (const item of group.items) {
    if (!isObject(item) || !validId(item.id) || ids.has(item.id)) throw new Error('invalid item id')
    ids.add(item.id)
    if (item.type != null && !['expense', 'income'].includes(item.type)) throw new Error('invalid type')
    if (item.amountCents != null && (!Number.isSafeInteger(item.amountCents) || item.amountCents <= 0 || item.amountCents > MAX_CENTS)) throw new Error('invalid amount')
    if (item.date != null && (typeof item.date !== 'string' || !validDate(item.date))) throw new Error('invalid date')
    if (item.time != null && !validTime(item.time)) throw new Error('invalid time')
    for (const field of ['category', 'description', 'remark']) if (item[field] !== undefined && typeof item[field] !== 'string') throw new Error('invalid text')
    if (item.errors !== undefined && (!isObject(item.errors) || Object.values(item.errors).some(e => typeof e !== 'string'))) throw new Error('invalid errors')
    if (['ready', 'saved'].includes(group.status)) validateRecord(group.origin === 'ai' ? { ...item, time: item.time ?? '00:00' } : item)
  }
  const pending = group.pending
  if (group.status === 'needs_input' && !pending) throw new Error('missing pending context')
  if (group.status !== 'needs_input' && pending != null) throw new Error('unexpected pending context')
  if (pending != null) {
    if (!isObject(pending)) throw new Error('invalid pending context')
    if (pending.kind === 'ai') {
      if (group.origin !== 'ai' || typeof pending.text !== 'string' || !pending.text.trim() || pending.text.length > 1000
        || typeof pending.question !== 'string' || !pending.question.trim() || pending.question.length > 300
        || (pending.referenceDate !== undefined && (!validDate(pending.referenceDate) || pending.referenceDate.startsWith('9999-')))) throw new Error('invalid ai clarification')
    } else if (pending.kind === 'target') {
      if (!Array.isArray(pending.itemIds) || !pending.itemIds.length || new Set(pending.itemIds).size !== pending.itemIds.length
        || pending.itemIds.some(id => !ids.has(id))) throw new Error('invalid targets')
      checkPatch(pending.patch)
    } else if (!['type', 'date', 'time', 'amountCents'].includes(pending.kind) || !ids.has(pending.itemId)) throw new Error('invalid pending field')
  }
}
// Validate without rewriting, filtering or migrating older messages.
function readHistory(key = STORAGE_KEY) {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
  if (raw == null) return { messages: [welcome()], raw }
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
  return { messages: parsed, raw }
}

export const useConversationStore = defineStore('conversation', () => {
  const owner = SERVER_MODE ? useAuthStore().user?.id : null
  if (SERVER_MODE && !owner) throw new Error('请先登录再打开对话')
  const key = SERVER_MODE ? `miaoji_account_conversation_v1_${owner}` : STORAGE_KEY
  const persistenceError = ref('')
  const restorationBlocked = ref(false)
  const storageConflict = ref(false)
  const hasUnsavedChanges = ref(false)
  let expectedRaw
  let restoring = false
  let initial = [welcome()]
  function blockedMessage() {
    persistenceError.value = '旧对话暂无法读取，已保护原内容。新对话仅留本次页面，刷新前请先备份。账单仍可在明细查看。'
  }
  try { const history = readHistory(key); initial = history.messages; expectedRaw = history.raw }
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
  function conflictMessage() {
    storageConflict.value = true
    persistenceError.value = '另一页面已更新对话，本页已暂停写入，不会用旧历史覆盖。'
      + (hasUnsavedChanges.value ? '本页未保存的消息或草稿仍在此页，请先备份两份内容，不要刷新或清除存储。' : '可点击重新读取最新对话，账单仍以明细为准。')
  }
  function persist(value) {
    if (storageConflict.value) { conflictMessage(); return false }
    try {
      // Check immediately before writing. This protects known stale snapshots, not an atomic cross-tab lock.
      const nextRaw = JSON.stringify(value)
      if (typeof window !== 'undefined') {
        if (window.localStorage.getItem(key) !== expectedRaw) { conflictMessage(); return false }
        window.localStorage.setItem(key, nextRaw)
      }
      expectedRaw = nextRaw
      hasUnsavedChanges.value = false
      persistenceError.value = ''; return true
    } catch {
      persistenceError.value = '对话暂未保存到浏览器，刷新可能丢失未确认草稿；已入账的数据仍以明细为准。'
      return false
    }
  }
  async function retryPersistence() {
    // Drain queued edits before deciding whether re-reading can discard anything.
    await nextTick()
    if (!restorationBlocked.value && !storageConflict.value) return persist(messages.value)
    if (hasUnsavedChanges.value) {
      persistenceError.value = '原对话仍受保护，本页已有未保存消息或草稿；为避免覆盖任一份内容，暂不能重新读取。请先备份两份内容，不要刷新或清除存储。'
      return false
    }
    try {
      const recovered = readHistory(key)
      restoring = true
      messages.value = recovered.messages
      expectedRaw = recovered.raw
      restorationBlocked.value = false; storageConflict.value = false
      await nextTick()
      // A storage event can arrive while the view updates: never acknowledge an already-stale reload.
      if (typeof window !== 'undefined' && window.localStorage.getItem(key) !== expectedRaw) {
        conflictMessage(); return false
      }
      persistenceError.value = ''; hasUnsavedChanges.value = false
      return true
    } catch { restorationBlocked.value = true; blockedMessage(); return false }
    finally { restoring = false }
  }
  watch(messages, value => {
    if (restoring) return
    hasUnsavedChanges.value = true
    if (!restorationBlocked.value) persist(value)
  }, { deep: true })
  if (typeof window !== 'undefined' && window.addEventListener) {
    const target = window
    const listener = event => {
      if (event.key !== key && event.key != null) return
      if (restorationBlocked.value) return
      try {
        if (event.storageArea && event.storageArea !== target.localStorage) return
        // Read the actual current snapshot, not a potentially delayed event.newValue.
        if (target.localStorage.getItem(key) !== expectedRaw) conflictMessage()
      } catch { persistenceError.value = '对话存储暂无法读取，请先保留本页内容，稍后重试；不会自动覆盖旧历史。' }
    }
    target.addEventListener('storage', listener)
    onScopeDispose(() => target.removeEventListener?.('storage', listener))
  }
  if (SERVER_MODE) {
    const auth = useAuthStore()
    watch(() => auth.user?.id, value => {
      if (value === owner) return
      restorationBlocked.value = true
      messages.value = []; isThinking.value = false
      persistenceError.value = '账号已变化，旧对话已保留，当前页面暂停写入。'
    }, { flush: 'sync' })
  }
  return { messages, isThinking, mascotMood, persistenceError, restorationBlocked, storageConflict, hasUnsavedChanges, retryPersistence,
    addMessage, updateRecord, markRecordConfirmed, updateGroup, setThinking, setMascotMood, clearConversation }
})
