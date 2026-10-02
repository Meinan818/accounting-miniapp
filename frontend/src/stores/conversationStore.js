import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { createId } from '../utils/ledger.js'

const STORAGE_KEY = 'zhizhang_conversation'
function welcome() { return { id: 'welcome-message', role: 'assistant', kind: 'text', content: '本喵来啦～今天买了什么呀？整理好后，由你确认再记下。', createdAt: new Date().toISOString() } }

export const useConversationStore = defineStore('conversation', () => {
  const persistenceError = ref('')
  let canPersist = true
  let initial = [welcome()]
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.some(m => !m || typeof m !== 'object' || typeof m.id !== 'string'
        || (m.kind === 'draft-group' && (!m.group || typeof m.group.id !== 'string' || !Array.isArray(m.group.items) || !m.group.items.length || m.group.items.length > 5
          || !['needs_input', 'ready', 'saved', 'cancelled'].includes(m.group.status)
          || m.group.items.some(i => !i || typeof i.id !== 'string'))))) throw new Error('invalid history')
      initial = parsed
    }
  } catch {
    canPersist = false
    persistenceError.value = '旧对话暂无法读取，已保护原内容。新对话仅留本次页面，刷新前请先备份。账单仍可在明细查看。'
  }
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
  watch(messages, value => {
    if (typeof window === 'undefined' || !canPersist) return
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); persistenceError.value = '' }
    catch { persistenceError.value = '对话暂未保存到浏览器，刷新可能丢失未确认草稿；已入账的数据仍以明细为准。' }
  }, { deep: true })
  return { messages, isThinking, mascotMood, persistenceError, addMessage, updateRecord, markRecordConfirmed,
    updateGroup, setThinking, setMascotMood, clearConversation }
})
