<script setup>
import ManualEntry from '@/components/record/ManualEntry.vue'
// 1. 导入
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ArrowLeft } from 'lucide-vue-next'
import ChatBubble from '@/components/common/ChatBubble.vue'
import ChatInput from '@/components/common/ChatInput.vue'
import ConfirmCard from '@/components/common/ConfirmCard.vue'
import DraftGroupCard from '@/components/common/DraftGroupCard.vue'
import { createDraft, applyDraftInput, groupReply, isQuery, resolveGroup } from '@/utils/draftEngine'
import { legacyCents } from '@/utils/money'
import { validateRecord } from '@/utils/ledger'
import miaoAvatar from '@/assets/design/mascot/miao-avatar-fluffy-v1.png'
import miaoThinking from '@/assets/design/mascot/poses/miao-thinking.png'
import { useConversationStore } from '@/stores/conversationStore'
import { useRecordStore } from '@/stores/recordStore'
import { formatCurrency } from '@/utils/format'
import { getMonthQueryReply } from '@/utils/chatQuery'

// 2. 组合式函数
const conversationStore = useConversationStore()
const recordStore = useRecordStore()

// Temporary display name; user naming is planned, not implemented.
const catDisplayName = '小宝'

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

const savingGroup = ref(null)
const actionErrors = ref({})
const activeDraftMessage = computed(() => {
  const messages = conversationStore.messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.kind === 'draft-group' && m.group && ['needs_input', 'ready'].includes(m.group.status)
      && recordStore.batchRecords(m.group.id).length === 0) return m
  }
  return null
})
// Display a window, not a storage limit. Older active drafts stay reachable.
const historyBatchSize = 40
const visibleLimit = ref(historyBatchSize)
const recentMessages = computed(() => conversationStore.messages.slice(-visibleLimit.value))
const pinnedDraft = computed(() => activeDraftMessage.value && !recentMessages.value.includes(activeDraftMessage.value) ? activeDraftMessage.value : null)
const visibleMessages = computed(() => pinnedDraft.value ? [pinnedDraft.value, ...recentMessages.value] : recentMessages.value)
const hiddenCount = computed(() => Math.max(0, conversationStore.messages.length - visibleMessages.value.length))
const loadingHistory = ref(false)
const retryingPersistence = ref(false)
async function loadEarlier() {
  if (loadingHistory.value) return
  loadingHistory.value = true
  const container = messagesContainer.value
  const previousHeight = container?.scrollHeight || 0
  const previousTop = container?.scrollTop || 0
  visibleLimit.value += historyBatchSize
  await nextTick()
  if (container) container.scrollTop = previousTop + container.scrollHeight - previousHeight
  loadingHistory.value = false
}
async function retryConversation() {
  if (retryingPersistence.value || conversationStore.isThinking || savingGroup.value) return
  retryingPersistence.value = true
  try {
    if (await conversationStore.retryPersistence()) {
      actionErrors.value = {}
      visibleLimit.value = historyBatchSize
      scrollToBottom()
    }
  } finally { retryingPersistence.value = false }
}
function reply(content) { conversationStore.addMessage({ role: 'assistant', kind: 'text', content }) }
function queryReply(text) {
  if (!recordStore.refresh()) { reply(recordStore.storageError); return }
  try { reply(getMonthQueryReply(text, recordStore.records)) }
  catch (error) { reply('本月查询暂时无法显示：' + error.message + '。账单没有改变。') }
}
function saveDraft(messageId) {
  const message = conversationStore.messages.find(m => m.id === messageId)
  if (!message?.group || message.group.status !== 'ready' || savingGroup.value || retryingPersistence.value) return
  savingGroup.value = messageId
  actionErrors.value[messageId] = ''
  try {
    const saved = recordStore.addRecords(message.group.items, { batchId: message.group.id, source: 'chat' })
    conversationStore.updateGroup(messageId, { ...message.group, status: 'saved', pending: null })
    reply('本喵已记下' + saved.length + '笔，首页和明细已同步。之后直接改明细，查询也会读取最新账单。')
    conversationStore.setMascotMood('success'); resetMoodLater()
  } catch (e) { actionErrors.value[messageId] = e.message; reply(e.message) }
  finally { savingGroup.value = null; scrollToBottom() }
}
function cancelDraft(messageId) {
  const message = conversationStore.messages.find(m => m.id === messageId)
  if (!message?.group || savingGroup.value || retryingPersistence.value || recordStore.batchRecords(message.group.id).length) return
  const result = applyDraftInput(message.group, '取消这组')
  conversationStore.updateGroup(messageId, result.group); actionErrors.value[messageId] = ''; reply(result.reply)
}
function editDraft(messageId, { itemId, record }) {
  const message = conversationStore.messages.find(m => m.id === messageId)
  if (!message?.group || savingGroup.value || retryingPersistence.value || ['saved', 'cancelled'].includes(message.group.status) || recordStore.batchRecords(message.group.id).length) return
  const group = JSON.parse(JSON.stringify(message.group))
  const item = group.items.find(i => i.id === itemId)
  if (!item) return
  try {
    const normalized = validateRecord(record)
    Object.assign(item, normalized, { amountCents: legacyCents(normalized.amount), description: normalized.remark || normalized.category, errors: { amount: '', date: '', time: '' } })
    group.pending = null; resolveGroup(group)
    conversationStore.updateGroup(messageId, group); actionErrors.value[messageId] = ''; reply(groupReply(group))
  } catch (e) { actionErrors.value[messageId] = e.message }
}
async function handleSend(userInput) {
  const text = String(userInput || '').trim()
  if (!text || conversationStore.isThinking || savingGroup.value || retryingPersistence.value) return
  conversationStore.addMessage({ role: 'user', kind: 'text', content: text })
  conversationStore.setThinking(true); conversationStore.setMascotMood('thinking'); scrollToBottom()
  try {
    await wait(600)
    recordStore.refresh()
    const active = activeDraftMessage.value
    if (active) {
      const result = applyDraftInput(active.group, text)
      if (result.action === 'query') queryReply(text)
      else if (result.action === 'confirm') saveDraft(active.id)
      else { conversationStore.updateGroup(active.id, result.group); actionErrors.value[active.id] = ''; reply(result.reply) }
    } else if (isQuery(text)) queryReply(text)
    else {
      const result = createDraft(text)
      reply(result.reply)
      if (result.group) conversationStore.addMessage({ role: 'assistant', kind: 'draft-group', group: result.group })
    }
  } catch { reply('本喵这次没整理好，草稿没有入账。可以再说清楚一些，或者用手动记账。') }
  finally { conversationStore.setThinking(false); conversationStore.setMascotMood('happy'); scrollToBottom() }
}
function legacySaved(message) { return message.confirmed || recordStore.batchRecords('legacy-' + message.id).length > 0 }
function legacyRecord(message) { return recordStore.batchRecords('legacy-' + message.id)[0] || message.record }
function handleUpdateRecord(messageId, updatedRecord) {
  const message = conversationStore.messages.find(m => m.id === messageId)
  if (retryingPersistence.value) return
  if (!message || legacySaved(message)) { reply('这笔已入账，请直接到明细修改。'); return }
  conversationStore.updateRecord(messageId, updatedRecord)
  reply('已经帮你改好啦，再核对一下就可以记账了。')
}
function handleConfirmRecord(messageId, record) {
  const message = conversationStore.messages.find(m => m.id === messageId)
  if (!message || retryingPersistence.value || legacySaved(message)) return
  try {
    recordStore.addRecord(record, { batchId: 'legacy-' + messageId, source: 'chat' })
    conversationStore.markRecordConfirmed(messageId)
    reply('本喵已记下一笔，明细和查询使用同一份最新账单。')
  } catch (e) { reply(e.message) }
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
  <div class="miao-chat">
    <header class="miao-header">
      <div class="miao-header-content">
        <div class="miao-brand">
          <router-link
            to="/"
            class="miao-back active:scale-95"
            aria-label="返回日历主页"
          >
            <ArrowLeft :size="20" />
          </router-link>
          <img :src="miaoAvatar" alt="手绘猫猫" class="miao-header-cat" />
          <div class="min-w-0">
            <h1 class="miao-chat-heading">
              <span class="miao-title">和{{ catDisplayName }}聊聊</span>
              <span class="miao-subtitle">今天的开销</span>
            </h1>
          </div>
        </div>
      </div>
      <div class="miao-summary">
        <p>本月支出 <span>{{ monthExpenseText }}</span></p>
        <span class="miao-demo-label">规则演示 · 每组最多5笔</span>
        <ManualEntry class="miao-manual-link" />
      </div>
    </header>

    <main ref="messagesContainer" class="miao-messages">
      <div class="miao-thread" aria-live="polite">
        <p v-if="recordStore.storageError" class="miao-storage-error" role="alert">{{ recordStore.storageError }}</p>
        <div v-if="conversationStore.persistenceError" class="miao-storage-error" role="alert">
          <p>{{ conversationStore.persistenceError }}</p>
          <button type="button" class="miao-history-button" :disabled="retryingPersistence || conversationStore.isThinking || Boolean(savingGroup)" @click="retryConversation">{{ conversationStore.storageConflict ? '重新读取最新对话' : conversationStore.restorationBlocked ? '重新读取旧对话' : '重试对话保存' }}</button>
        </div>
        <div v-if="hiddenCount" class="miao-history-controls">
          <button type="button" class="miao-history-button" :disabled="loadingHistory || conversationStore.isThinking || Boolean(savingGroup) || retryingPersistence" @click="loadEarlier">查看更早对话（还有{{ hiddenCount }}条）</button>
          <p>这里只分批显示，全部历史仍保留。</p>
        </div>
        <div v-for="message in visibleMessages" :key="message.id" :data-message-id="message.id">
          <p v-if="pinnedDraft?.id === message.id" class="miao-history-note">更早的未完成草稿 · 可以继续补充或确认</p>
          <ChatBubble v-if="message.kind === 'text'" :message="message" cat-appearance />
          <DraftGroupCard
            v-if="message.kind === 'draft-group' && message.group"
            :group="message.group"
            :saved-records="recordStore.batchRecords(message.group.id)"
            :busy="savingGroup === message.id || conversationStore.isThinking || retryingPersistence"
            :error="actionErrors[message.id]"
            @confirm="saveDraft(message.id)"
            @cancel="cancelDraft(message.id)"
            @update="editDraft(message.id, $event)"
          />
          <p v-else-if="message.kind === 'record' && legacyRecord(message)?.deletedAt" class="legacy-deleted-note">这笔账单已删除，已从当前汇总移除，不会通过旧聊天重新入账。</p>
          <ConfirmCard
            v-else-if="message.kind === 'record'"
            :confirmed="legacySaved(message)"
            :record="legacyRecord(message)"
            cat-appearance
            @confirm="handleConfirmRecord(message.id, $event)"
            @update="handleUpdateRecord(message.id, $event)"
          />
        </div>

        <div v-if="conversationStore.isThinking" class="message-enter miao-thinking">
          <img :src="miaoThinking" alt="猫猫托腮思考" />
          <p>本喵正在整理…</p>
        </div>
      </div>
    </main>

    <ChatInput :disabled="conversationStore.isThinking || Boolean(savingGroup) || retryingPersistence" cat-appearance @send="handleSend" @voice="handleVoice" />
  </div>
</template>

<style scoped>
.miao-chat {
  --miao-paper: #fdfaf3;
  --miao-white: #fffdf8;
  --miao-ink: #3c261a;
  --miao-soft: #79634f;
  --miao-line: #d9cbb6;
  --miao-pink: #f8dfda;
  --miao-yellow: #fceed4;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: var(--miao-paper);
  color: var(--miao-ink);
  font-family: "Microsoft YaHei UI Light", "Microsoft YaHei UI", "微软雅黑", sans-serif;
  font-weight: 400;
}
.miao-header { flex-shrink: 0; border-bottom: 1px dashed var(--miao-line); }
.miao-header-content, .miao-summary, .miao-thread { width: 100%; max-width: 480px; margin-inline: auto; }
.miao-header-content { padding: 18px 16px 15px; }
.miao-brand { display: flex; align-items: center; gap: 9px; }
.miao-back { display: grid; place-items: center; flex: 0 0 44px; height: 44px; border: 1px solid var(--miao-line); border-radius: 16px 13px 17px 14px; background: var(--miao-white); }
.miao-header-cat { width: 66px; height: 62px; object-fit: contain; flex-shrink: 0; transform: rotate(-5deg); }
.miao-chat-heading { font-weight: 400; }
.miao-title { display: block; position: relative; isolation: isolate; width: fit-content; font-size: 24px; font-weight: 400; letter-spacing: 1px; white-space: nowrap; }
.miao-title::before { content: ''; position: absolute; inset: 9px -5px 1px; z-index: -1; border-radius: 62% 45% 58% 42%; background: var(--miao-yellow); transform: rotate(-2deg); }
.miao-subtitle { display: block; margin-top: 5px; font-size: 12px; color: var(--miao-soft); }
.miao-summary { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 5px 12px; padding: 9px 16px; font-size: 12px; background: var(--miao-yellow); }
.miao-summary p { display: flex; align-items: center; gap: 8px; }
.miao-summary p span { font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.miao-manual-link { justify-self: start; }
.legacy-deleted-note { padding: 16px; border: 1px dashed #d9c5a9; border-radius: 16px; font-size: 13px; line-height: 1.8; color: #9c806c; background: #fffaf2; }
.miao-history-controls { text-align: center; }
.miao-history-controls p, .miao-history-note { color: var(--miao-soft); font-size: 12px; line-height: 1.8; }
.miao-history-note { margin-bottom: 8px; }
.miao-history-button { min-height: 44px; padding: 8px 12px; border: 1px solid var(--miao-line); border-radius: 12px; background: var(--miao-white); color: var(--miao-soft); font-size: 13px; }
.miao-history-button:disabled { opacity: .55; }
.miao-storage-error { font-size: 12px; color: #aa594d; line-height: 1.8; }
.miao-demo-label { color: var(--miao-soft); }
.miao-messages { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior-y: contain; }
.miao-thread { display: flex; flex-direction: column; gap: 18px; padding: 22px 16px 25px; }
.miao-thinking { display: flex; align-items: flex-end; gap: 8px; font-size: 14px; color: var(--miao-soft); }
.miao-thinking img { width: 64px; height: 68px; object-fit: contain; flex-shrink: 0; }
.miao-thinking p { padding: 11px 13px; border: 1px solid var(--miao-line); border-radius: 21px 19px 22px 8px; background: var(--miao-white); }
.miao-back:focus-visible,
.miao-chat :deep(button:focus-visible),
.miao-chat :deep(input:focus-visible),
.miao-chat :deep(select:focus-visible) { outline: 2px solid var(--miao-ink); outline-offset: 3px; }
.miao-chat :deep(.miao-bubble) { align-items: flex-end; min-width: 0; }
.miao-chat :deep(.miao-bubble .chat-assistant-avatar) { width: 44px; height: 44px; padding: 3px; border: 1px dashed var(--miao-line); background: var(--miao-yellow); border-radius: 48% 52% 46% 54%; }
.miao-chat :deep(.miao-bubble .chat-bubble-body) { position: relative; max-width: calc(100% - 52px); padding: 14px 16px 25px; border: 1.5px solid var(--miao-line); border-radius: 22px 25px 24px 13px; background: var(--miao-white); color: var(--miao-ink); font-size: 15px; line-height: 1.85; box-shadow: 1px 2px 0 var(--miao-yellow); }
.miao-chat :deep(.miao-bubble:not(.miao-bubble-user) .chat-bubble-body::before),
.miao-chat :deep(.miao-bubble:not(.miao-bubble-user) .chat-bubble-body::after) { content: ''; position: absolute; top: -5px; width: 11px; height: 11px; border-top: 1.5px solid var(--miao-line); border-left: 1.5px solid var(--miao-line); border-radius: 4px 1px 2px 1px; background: var(--miao-white); transform: rotate(45deg); pointer-events: none; }
.miao-chat :deep(.miao-bubble:not(.miao-bubble-user) .chat-bubble-body::before) { left: 14px; }
.miao-chat :deep(.miao-bubble:not(.miao-bubble-user) .chat-bubble-body::after) { right: 14px; }
.miao-chat :deep(.chat-bubble-tail) { position: absolute; left: -5px; bottom: 13px; width: 9px; height: 9px; border-left: 1.5px solid var(--miao-line); border-bottom: 1.5px solid var(--miao-line); border-radius: 0 0 0 3px; background: var(--miao-white); transform: rotate(45deg); pointer-events: none; }
.miao-chat :deep(.miao-bubble-user .chat-bubble-body) { max-width: 88%; background: var(--miao-pink); border-radius: 25px 22px 13px 24px; box-shadow: 1px 2px 0 var(--miao-yellow); }
.miao-chat :deep(.miao-bubble-user .chat-bubble-tail) { left: auto; right: -5px; border: 0; border-top: 1.5px solid var(--miao-line); border-right: 1.5px solid var(--miao-line); border-radius: 0 3px 0 0; background: var(--miao-pink); }
.miao-chat :deep(.bubble-paw) { position: absolute; bottom: 7px; right: 11px; width: 18px; height: 13px; opacity: .3; transform: rotate(-13deg); pointer-events: none; }
.miao-chat :deep(.paw-pad), .miao-chat :deep(.paw-toe) { position: absolute; background: var(--miao-soft); }
.miao-chat :deep(.paw-pad) { bottom: 0; left: 5px; width: 9px; height: 6px; border-radius: 55% 55% 45% 45%; }
.miao-chat :deep(.paw-toe) { width: 3px; height: 4px; border-radius: 50%; }
.miao-chat :deep(.toe-one) { left: 1px; top: 5px; transform: rotate(-30deg); }
.miao-chat :deep(.toe-two) { left: 5px; top: 1px; }
.miao-chat :deep(.toe-three) { left: 10px; top: 1px; }
.miao-chat :deep(.toe-four) { left: 15px; top: 5px; transform: rotate(30deg); }
.miao-chat :deep(.miao-record) { position: relative; max-width: none; margin-top: 10px; padding: 24px 14px 14px; border: 1.5px solid var(--miao-line); border-radius: 16px 19px 20px 15px; background: var(--miao-white); color: var(--miao-ink); font-size: 15px; box-shadow: 3px 4px 0 var(--miao-yellow); }
.miao-chat :deep(.miao-record::before) { content: ''; position: absolute; width: 76px; height: 20px; top: -9px; left: calc(50% - 38px); background: var(--miao-pink); border: 1px dashed var(--miao-line); border-radius: 2px 4px 3px 2px; transform: rotate(-4deg); pointer-events: none; }
.miao-chat :deep(.miao-record .record-heading) { font-size: 17px; letter-spacing: .4px; }
.miao-chat :deep(.miao-record .record-pending) { font-size: 12px; padding: 3px 7px; background: var(--miao-yellow); border-radius: 9px 6px 8px 5px; transform: rotate(3deg); white-space: nowrap; }
.miao-chat :deep(.miao-record .space-y-2 > div) { padding-block: 7px; border-bottom: 1px dashed var(--miao-line); }
.miao-chat :deep(.miao-record .space-y-2 > div > span:first-child) { flex-shrink: 0; }
.miao-chat :deep(.miao-record .space-y-2 > div > span:last-child) { overflow-wrap: anywhere; }
.miao-chat :deep(.miao-record .text-gray-900) { color: var(--miao-ink); }
.miao-chat :deep(.miao-record .text-gray-600),
.miao-chat :deep(.miao-record .text-gray-700) { color: var(--miao-soft); }
.miao-chat :deep(.miao-record .font-bold),
.miao-chat :deep(.miao-record .font-semibold),
.miao-chat :deep(.miao-record .font-medium) { font-weight: 400; }
.miao-chat :deep(.miao-record .font-mono) { font-family: inherit; font-size: 17px; font-variant-numeric: tabular-nums; }
.miao-chat :deep(.miao-record button) { min-height: 44px; border: 1px solid var(--miao-line); border-radius: 16px 13px 17px 14px; background: var(--miao-white); color: var(--miao-ink); }
.miao-chat :deep(.miao-record button.bg-primary-400) { background: var(--miao-pink); box-shadow: 0 2px 0 var(--miao-line); }
.miao-chat :deep(.miao-record button.border-primary-400) { background: var(--miao-pink); border-color: var(--miao-ink); }
.miao-chat :deep(.miao-record input),
.miao-chat :deep(.miao-record select) { min-width: 0; min-height: 44px; border: 1px solid var(--miao-line); border-radius: 12px 10px 13px 11px; background: var(--miao-white); color: var(--miao-ink); font-size: 16px; }
.miao-chat :deep(.miao-input) { flex-shrink: 0; border-top: 1px dashed var(--miao-line); padding: 13px 16px calc(14px + env(safe-area-inset-bottom, 0px)); background: var(--miao-paper); }
.miao-chat :deep(.miao-input .chat-compose) { max-width: 448px; padding: 5px 5px 5px 13px; border: 1.5px solid var(--miao-line); border-radius: 22px 18px 21px 17px; background: var(--miao-white); box-shadow: none; }
.miao-chat :deep(.miao-input .chat-compose:focus-within) { outline: 2px solid var(--miao-ink); outline-offset: 2px; }
.miao-chat :deep(.miao-input input) { padding-block: 8px; font-size: 16px; color: var(--miao-ink); }
.miao-chat :deep(.miao-input input:focus-visible) { outline: none; }
.miao-chat :deep(.miao-input input::placeholder) { color: var(--miao-soft); }
.miao-chat :deep(.miao-input .chat-send) { width: auto; min-width: 58px; height: 44px; padding-inline: 12px; border: 1px solid var(--miao-line); border-radius: 16px 13px 17px 14px; background: var(--miao-yellow); color: var(--miao-ink); font-size: 14px; box-shadow: none; }
.miao-chat :deep(.miao-input .chat-send:disabled) { opacity: .6; }
.miao-chat :deep(.miao-input .chat-input-hint) { max-width: 448px; margin: 10px auto 0; text-align: center; color: var(--miao-soft); font-size: 12px; }
@media (max-width: 359px) {
  .miao-header-content { padding-inline: 12px; }
  .miao-brand { gap: 7px; }
  .miao-header-cat { width: 51px; height: 53px; }
  .miao-title { font-size: 23px; }
  .miao-subtitle { font-size: 11px; }
  .miao-thread { padding-inline: 12px; }
}
</style>
