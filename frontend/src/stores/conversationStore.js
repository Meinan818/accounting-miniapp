import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'zhizhang_conversation'

function createMessageId() {
  return `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createWelcomeMessage() {
  return {
    id: 'welcome-message',
    role: 'assistant',
    kind: 'text',
    content: '你好呀，我是小账 🐣 告诉我今天花了什么，我来帮你记账。',
    createdAt: new Date().toISOString(),
  }
}

function loadMessages() {
  if (typeof window === 'undefined') {
    return [createWelcomeMessage()]
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : [createWelcomeMessage()]
  } catch (error) {
    console.warn('读取本地对话记录失败：', error)
    return [createWelcomeMessage()]
  }
}

export const useConversationStore = defineStore('conversation', () => {
  const messages = ref(loadMessages())
  const isThinking = ref(false)
  const mascotMood = ref('happy')

  function addMessage(message) {
    const normalizedMessage = {
      id: message.id || createMessageId(),
      role: message.role || 'assistant',
      kind: message.kind || 'text',
      content: message.content || '',
      record: message.record || null,
      confirmed: Boolean(message.confirmed),
      createdAt: message.createdAt || new Date().toISOString(),
    }

    messages.value.push(normalizedMessage)
    return normalizedMessage
  }

  function updateRecord(messageId, updatedRecord) {
    const message = messages.value.find((item) => item.id === messageId)

    if (message) {
      message.record = { ...updatedRecord }
    }
  }

  function markRecordConfirmed(messageId) {
    const message = messages.value.find((item) => item.id === messageId)

    if (message) {
      message.confirmed = true
    }
  }

  function setThinking(value) {
    isThinking.value = Boolean(value)
  }

  function setMascotMood(mood) {
    mascotMood.value = mood
  }

  function clearConversation() {
    messages.value = [createWelcomeMessage()]
    mascotMood.value = 'happy'
  }

  watch(messages, (newMessages) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages))
    }
  }, { deep: true })

  return {
    messages,
    isThinking,
    mascotMood,
    addMessage,
    updateRecord,
    markRecordConfirmed,
    setThinking,
    setMascotMood,
    clearConversation,
  }
})
