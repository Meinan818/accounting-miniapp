// 实际Chat setup离线执行；合成消息/滚动/存储回执，禁真实AI与账单请求。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as Vue from 'vue'
import { createAiDraftApi } from '../src/api/aiDraft.js'
import { getMonthQueryReply } from '../src/utils/chatQuery.js'

const script = readFileSync(new URL('../src/views/Chat.vue', import.meta.url), 'utf8')
  .split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
function scene() {
  const scope = Vue.effectScope(), cleanup = [], scrolls = [], timers = [], writes = [], queries = [], facts = []
  let finish, retries = 0, top = 200
  const conversation = Vue.reactive({ messages: Array.from({ length: 90 }, (_, id) => ({ id: String(id), kind: 'text', role: 'assistant', content: '合成历史' })),
    isThinking: false, retryPersistence: () => { retries++; return new Promise(resolve => { finish = resolve }) },
    addMessage: message => conversation.messages.push(message),
    updateGroup: (id, group) => { conversation.messages.find(message => message.id === id).group = group },
    updateRecord: (id, record) => { conversation.messages.find(message => message.id === id).record = record },
    markRecordConfirmed: id => { conversation.messages.find(message => message.id === id).confirmed = true },
    setMascotMood: value => { conversation.mascotMood = value } })
  const store = { batchRecords: () => facts, records: [], storageError: '合成读取失败', summaryError: '', monthExpenseCents: 0,
    refresh: () => new Promise((resolve, reject) => queries.push({ resolve, reject })),
    addRecords: (items, options) => new Promise((resolve, reject) => writes.push({ items, options, reject, resolve: saved => { facts.push(...saved); resolve(saved) } })),
    addRecord: (record, options) => new Promise((resolve, reject) => writes.push({ items: [record], options, reject, resolve: saved => { facts.push(saved); resolve(saved) } })) }
  const auth = Vue.reactive({ user: { id: 'synthetic' }, api: { request() { assert.fail('不可调用真实网络') } } })
  const bindings = { ...Vue, onMounted() {}, onBeforeUnmount: callback => cleanup.push(callback), SERVER_MODE: true, createAiDraftApi, getMonthQueryReply,
    window: { setTimeout: callback => { timers.push(callback); return timers.length }, clearTimeout() {}, clearInterval() {} },
    useAuthStore: () => auth, useConversationStore: () => conversation,
    useRecordStore: () => store }
  const view = scope.run(() => new Function(...Object.keys(bindings), script +
    ';return {loadEarlier, retryConversation, messagesContainer, visibleLimit, loadingHistory, retryingPersistence, actionErrors, queryReply, saveDraft, handleConfirmRecord, savingGroup}')(...Object.values(bindings)))
  const container = { scrollHeight: 1000, get scrollTop() { return top }, set scrollTop(value) { top = value; scrolls.push(value) } }
  view.messagesContainer.value = container
  return { view, auth, conversation, writes, queries, facts, timers, container, scrolls, get retries() { return retries }, finish: value => finish(value), dispose() {
    cleanup.splice(0).forEach(callback => callback()); scope.stop(); view.messagesContainer.value = null
  } }
}

test('展开历史保留阅读位置并阻止重复展开；存活页面重读清理旧错误和历史窗口', async () => {
  const env = scene()
  try {
    const pending = env.view.loadEarlier()
    env.container.scrollHeight = 1600
    await env.view.loadEarlier()
    assert.equal(env.view.visibleLimit.value, 80)
    await pending
    assert.deepEqual(env.scrolls, [800])
    assert.equal(env.view.loadingHistory.value, false)
    env.view.actionErrors.value = { old: '合成错误' }
    const retry = env.view.retryConversation()
    await env.view.retryConversation()
    assert.equal(env.retries, 1)
    env.finish(true); await retry; await Vue.nextTick()
    assert.deepEqual(env.view.actionErrors.value, {})
    assert.equal(env.view.visibleLimit.value, 40)
    assert.equal(env.view.retryingPersistence.value, false)
    assert.equal(env.scrolls.at(-1), 1600)
  } finally { env.dispose() }
})

test('历史展开离页后旧nextTick不能滚动已卸载容器', async () => {
  const env = scene(), pending = env.view.loadEarlier()
  env.dispose(); env.container.scrollHeight = 1600; await pending
  assert.deepEqual(env.scrolls, [])
})

test('对话重读迟到成功不清离页旧状态，离页入口不追加存储操作', async () => {
  const env = scene()
  env.view.visibleLimit.value = 80; env.view.actionErrors.value = { old: '保留原错误快照' }
  const pending = env.view.retryConversation()
  env.dispose(); env.finish(true); await pending
  assert.equal(env.view.visibleLimit.value, 80)
  assert.deepEqual(env.view.actionErrors.value, { old: '保留原错误快照' })
  await env.view.retryConversation(); await env.view.loadEarlier()
  assert.equal(env.retries, 1)
})

test('账号切换期间旧历史/重读回执不更新页面，旧入口不发新存储请求', async () => {
  const env = scene()
  try {
    env.view.actionErrors.value = { old: '原账号状态' }
    const history = env.view.loadEarlier(), retry = env.view.retryConversation()
    env.auth.user = { id: 'another-synthetic' }
    env.finish(true); await Promise.all([history, retry]); await Vue.nextTick()
    assert.deepEqual(env.scrolls, [])
    assert.equal(env.view.visibleLimit.value, 80)
    assert.deepEqual(env.view.actionErrors.value, { old: '原账号状态' })
    await env.view.retryConversation(); await env.view.loadEarlier()
    assert.equal(env.retries, 1)
  } finally { env.dispose() }
})

const record = { id: 'synthetic-record', type: 'expense', amount: 0.29, date: '2026-10-03', time: '09:15', category: '餐饮' }
function addDraft(env) {
  env.conversation.messages.push({ id: 'draft', kind: 'draft-group', group: { id: 'synthetic-group', status: 'ready', pending: null, items: [record] } })
}

test('查询读取迟到的成功与失败都不追加离页对话', async () => {
  for (const loaded of [true, false]) {
    const env = scene(), pending = env.view.queryReply('本月支出')
    env.dispose(); env.queries[0].resolve(loaded); await pending
    assert.equal(env.conversation.messages.length, 90)
  }
})

test('离页草稿确认保留Store成功账单事实，不追加旧消息或创建情绪定时器', async () => {
  const env = scene(); addDraft(env)
  const pending = env.view.saveDraft('draft')
  env.dispose(); env.writes[0].resolve([record]); await pending
  assert.equal(env.facts.length, 1)
  assert.equal(env.conversation.messages.length, 91)
  assert.equal(env.timers.length, 0)
  assert.equal(env.conversation.messages.at(-1).group.status, 'ready')
})

test('账号切换后旧单笔确认不改对话，成功账单事实保留', async () => {
  const env = scene()
  try {
    env.conversation.messages.push({ id: 'legacy', kind: 'record', record })
    const pending = env.view.handleConfirmRecord('legacy', record)
    env.auth.user = { id: 'another-synthetic' }
    env.writes[0].resolve(record); await pending
    assert.equal(env.facts.length, 1)
    assert.equal(env.conversation.messages.length, 91)
    assert(!env.conversation.messages.at(-1).confirmed)
  } finally { env.dispose() }
})

test('当前页面正常查询/整组确认仍反馈成功，失败保留原草稿并可重试', async () => {
  const env = scene()
  try {
    const query = env.view.queryReply('本月支出'); env.queries[0].resolve(true); await query
    assert.match(env.conversation.messages.at(-1).content, /本月支出合计/)
    addDraft(env)
    let pending = env.view.saveDraft('draft')
    await env.view.saveDraft('draft')
    assert.equal(env.writes.length, 1)
    env.writes[0].reject(Error('合成写入失败')); await pending
    assert.equal(env.view.actionErrors.value.draft, '合成写入失败')
    assert.equal(env.view.savingGroup.value, null)
    pending = env.view.saveDraft('draft'); env.writes[1].resolve([record]); await pending
    assert.equal(env.conversation.messages.find(message => message.id === 'draft').group.status, 'saved')
    assert.equal(env.timers.length, 1)
    assert.equal(env.view.savingGroup.value, null)
    assert.match(env.conversation.messages.at(-1).content, /已记下1笔/)
    env.auth.user = { id: 'another-synthetic' }; env.timers[0]()
    assert.equal(env.conversation.mascotMood, 'success')
    await env.view.saveDraft('draft'); await env.view.queryReply('本月支出')
    assert.equal(env.writes.length, 2)
    assert.equal(env.queries.length, 1)
  } finally { env.dispose() }
})

test('确认离页后的写入失败不追加旧错误回复或回填页面错误', async () => {
  const env = scene(); addDraft(env)
  const pending = env.view.saveDraft('draft')
  env.dispose(); env.writes[0].reject(Error('迟到合成失败')); await pending
  assert.equal(env.conversation.messages.length, 91)
  assert.equal(env.view.actionErrors.value.draft, '')
  assert.equal(env.facts.length, 0)
})

test('当前页面旧单笔确认仍更新回执，重复确认不再发写请求', async () => {
  const env = scene()
  try {
    env.conversation.messages.push({ id: 'legacy', kind: 'record', record })
    const pending = env.view.handleConfirmRecord('legacy', record)
    env.writes[0].resolve(record); await pending
    assert.equal(env.conversation.messages.find(message => message.id === 'legacy').confirmed, true)
    assert.match(env.conversation.messages.at(-1).content, /已记下一笔/)
    await env.view.handleConfirmRecord('legacy', record)
    assert.equal(env.writes.length, 1)
  } finally { env.dispose() }
})
