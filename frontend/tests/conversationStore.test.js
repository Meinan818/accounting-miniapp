import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useConversationStore } from '../src/stores/conversationStore.js'
let data, fail, writes
const key = 'zhizhang_conversation'
beforeEach(() => { data = new Map(); fail = false; writes = 0; globalThis.window = { localStorage: { getItem: k => data.get(k) ?? null, setItem: (k,v) => { if(fail) throw Error('full'); writes++; data.set(k,v) } } }; setActivePinia(createPinia()) })
test('读取旧单笔对话不擅自迁移或覆盖', () => {
  const old = [{id:'old',role:'assistant',kind:'record',confirmed:false,record:{amount:25}}]
  data.set(key,JSON.stringify(old));const store=useConversationStore()
  assert.deepEqual(JSON.parse(JSON.stringify(store.messages)),old);assert.equal(writes,0)
})
test('不完整组草稿可保存和恢复当前追问上下文', async () => {
  const store=useConversationStore();const group={id:'g',status:'needs_input',items:[{id:'i',amountCents:null}],pending:{kind:'amountCents',itemId:'i'}}
  store.addMessage({kind:'draft-group',group});await nextTick();setActivePinia(createPinia())
  const restored=useConversationStore();assert.equal(restored.messages.at(-1).group.pending.itemId,'i');assert.equal(restored.messages.at(-1).group.items[0].amountCents,null)
})
test('对话存储失败提示可见但不抛出未捕获错误', async () => {
  const store=useConversationStore();fail=true;store.addMessage({content:'test'});await nextTick()
  assert.match(store.persistenceError,/未保存/);assert.equal(store.messages.at(-1).content,'test')
})
test('损坏组结构保护原对话，不写入替换内容', async () => {
  const raw=JSON.stringify([{id:'bad',kind:'draft-group',group:{id:'bad',items:null}}]);data.set(key,raw)
  const store=useConversationStore();store.addMessage({content:'new'});await nextTick()
  assert.equal(data.get(key),raw);assert.match(store.persistenceError,/保护/)
})
