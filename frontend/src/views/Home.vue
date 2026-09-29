<script setup>
// 1. 导入
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ChatBubble from '@/components/common/ChatBubble.vue'
import ChatInput from '@/components/common/ChatInput.vue'
import ConfirmCard from '@/components/common/ConfirmCard.vue'
import MascotChicken from '@/components/mascot/MascotChicken.vue'
import { useConversationStore } from '@/stores/conversationStore'
import { useRecordStore } from '@/stores/recordStore'
import { formatCurrency } from '@/utils/format'
import { getFakeAIResponse } from '@/utils/mockAI'

// 2. 组合式函数
const conversationStore = useConversationStore()
const recordStore = useRecordStore()

// 3. 响应式数据
const messagesContainer = ref(null)
let moodTimer = null

// 4. 计算属性
const monthExpenseText = computed(() => formatCurrency(recordStore.monthExpense))

// 5. 方法
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

function resetMoodLater() {
  if (moodTimer) {
    window.clearTimeout(moodTimer)
  }

  moodTimer = window.setTimeout(() => {
    conversationStore.setMascotMood('happy')
  }, 1800)
}

async function handleSend(userInput) {
  const text = String(userInput || '').trim()

  if (!text || conversationStore.isThinking) {
    return
  }

  conversationStore.addMessage({
    role: 'user',
    kind: 'text',
    content: text,
  })
  conversationStore.setThinking(true)
  conversationStore.setMascotMood('thinking')
  scrollToBottom()

  await wait(900)

  const response = getFakeAIResponse(text, {
    monthExpense: recordStore.monthExpense,
    monthIncome: recordStore.monthIncome,
    categoryExpenses: recordStore.categoryExpenses,
  })

  if (response.type === 'record') {
    conversationStore.addMessage({
      role: 'assistant',
      kind: 'text',
      content: response.reply,
    })
    conversationStore.addMessage({
      role: 'assistant',
      kind: 'record',
      content: response.reply,
      record: response.record,
    })
    conversationStore.setMascotMood('happy')
  } else if (response.type === 'query') {
    conversationStore.addMessage({
      role: 'assistant',
      kind: 'text',
      content: response.reply,
    })
    conversationStore.setMascotMood('success')
    resetMoodLater()
  } else {
    conversationStore.addMessage({
      role: 'assistant',
      kind: 'text',
      content: response.reply,
    })
    conversationStore.setMascotMood('confused')
    resetMoodLater()
  }

  conversationStore.setThinking(false)
  scrollToBottom()
}

function handleUpdateRecord(messageId, updatedRecord) {
  conversationStore.updateRecord(messageId, updatedRecord)
  conversationStore.addMessage({
    role: 'assistant',
    kind: 'text',
    content: '已经帮你改好啦，再核对一下就可以记账了 ✨',
  })
  conversationStore.setMascotMood('happy')
  scrollToBottom()
}

function handleConfirmRecord(messageId, record) {
  const message = conversationStore.messages.find((item) => item.id === messageId)

  if (!message || message.confirmed) {
    return
  }

  recordStore.addRecord(record)
  conversationStore.markRecordConfirmed(messageId)

  const updatedTotal = recordStore.categoryExpenses[record.category] || record.amount
  const totalLabel = record.type === 'income' ? '收入' : '支出'

  conversationStore.addMessage({
    role: 'assistant',
    kind: 'text',
    content: `✅ 记账成功！本月${record.category}${totalLabel}已累计 ${formatCurrency(updatedTotal)}。`,
  })
  conversationStore.setMascotMood('success')
  resetMoodLater()
  scrollToBottom()
}

function handleVoice() {
  conversationStore.setMascotMood('confused')
  resetMoodLater()
}

// 6. 监听
watch(
  () => [conversationStore.messages.length, conversationStore.isThinking],
  scrollToBottom,
  { flush: 'post' },
)

// 7. 生命周期
onMounted(scrollToBottom)

onBeforeUnmount(() => {
  if (moodTimer) {
    window.clearTimeout(moodTimer)
  }
})
</script>

<template>
  <div class="paper-surface flex h-[100dvh] flex-col overflow-hidden bg-cream">
    <header class="border-b-[3px] border-hand bg-cream-dark/90 px-4 py-3 backdrop-blur">
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-gray-900">智账 🐣</h1>
          <p class="text-xs text-gray-500">和小账聊聊今天的花销</p>
        </div>
        <div class="rounded-xl border-2 border-hand bg-white px-3 py-2 text-right shadow-sm">
          <p class="text-xs text-gray-500">本月支出</p>
          <p class="font-mono text-lg font-bold text-expense-dark">{{ monthExpenseText }}</p>
        </div>
      </div>
    </header>

    <main ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-5">
      <div class="mx-auto flex max-w-2xl flex-col gap-4" aria-live="polite">
        <template v-for="message in conversationStore.messages" :key="message.id">
          <ChatBubble v-if="message.kind === 'text'" :message="message" />
          <ConfirmCard
            v-else-if="message.kind === 'record'"
            :confirmed="message.confirmed"
            :record="message.record"
            @confirm="handleConfirmRecord(message.id, $event)"
            @update="handleUpdateRecord(message.id, $event)"
          />
        </template>

        <div v-if="conversationStore.isThinking" class="message-enter flex items-start gap-2">
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl">
            🐣
          </div>
          <div class="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 text-gray-500 shadow-sm">
            小账正在思考...🤔
          </div>
        </div>
      </div>
    </main>

    <MascotChicken :mood="conversationStore.mascotMood" />
    <ChatInput :disabled="conversationStore.isThinking" @send="handleSend" @voice="handleVoice" />
  </div>
</template>
