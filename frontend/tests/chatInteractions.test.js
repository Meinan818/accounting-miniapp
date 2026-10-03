// 实际Chat setup离线执行；合成消息/滚动/存储回执，禁真实AI与账单请求。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as Vue from 'vue'
import { createAiDraftApi } from '../src/api/aiDraft.js'

const script = readFileSync(new URL('../src/views/Chat.vue', import.meta.url), 'utf8')
  .split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
function scene() {
  const scope = Vue.effectScope(), cleanup = [], scrolls = []
  let finish, retries = 0, top = 200
  const conversation = Vue.reactive({ messages: Array.from({ length: 90 }, (_, id) => ({ id: String(id), kind: 'text', role: 'assistant', content: '合成历史' })),
    isThinking: false, retryPersistence: () => { retries++; return new Promise(resolve => { finish = resolve }) } })
  const auth = Vue.reactive({ user: { id: 'synthetic' }, api: { request() { assert.fail('不可调用真实网络') } } })
  const bindings = { ...Vue, onMounted() {}, onBeforeUnmount: callback => cleanup.push(callback), SERVER_MODE: true, createAiDraftApi,
    useAuthStore: () => auth, useConversationStore: () => conversation,
    useRecordStore: () => ({ batchRecords: () => [], storageError: '', summaryError: '', monthExpenseCents: 0 }) }
  const view = scope.run(() => new Function(...Object.keys(bindings), script +
    ';return {loadEarlier, retryConversation, messagesContainer, visibleLimit, loadingHistory, retryingPersistence, actionErrors}')(...Object.values(bindings)))
  const container = { scrollHeight: 1000, get scrollTop() { return top }, set scrollTop(value) { top = value; scrolls.push(value) } }
  view.messagesContainer.value = container
  return { view, auth, container, scrolls, get retries() { return retries }, finish: value => finish(value), dispose() {
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
