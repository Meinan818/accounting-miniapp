import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useConversationStore } from '../src/stores/conversationStore.js'
import { createDraft, applyDraftInput } from '../src/utils/draftEngine.js'
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

test('重复消息/组/条目编号及未知消息结构保护原文', async () => {
  const text = { id: 'm', role: 'assistant', kind: 'text', content: 'old' }
  const draft = { id: 'g-message', role: 'assistant', kind: 'draft-group', group: { id: 'g', status: 'needs_input', items: [{ id: 'i', amountCents: null }], pending: { kind: 'amountCents', itemId: 'i' } } }
  for (const input of [[text, text], [{ ...text, kind: 'unknown' }], [draft, { ...draft, id: 'other' }], [{ ...draft, group: { ...draft.group, items: [{ id: 'i' }, { id: 'i' }] } }]]) {
    setActivePinia(createPinia()); const raw = JSON.stringify(input); data.set(key, raw)
    const store = useConversationStore(); store.addMessage({ content: 'new' }); await nextTick()
    assert.equal(data.get(key), raw); assert.equal(store.restorationBlocked, true)
  }
})
test('损坏金额/日期/追问引用与目标补丁不能静默恢复', async () => {
  const base = { id: 'g', status: 'needs_input', items: [{ id: 'i', amountCents: null }], pending: { kind: 'amountCents', itemId: 'i' } }
  const groups = [
    { ...base, items: [{ id: 'i', amountCents: -1 }] },
    { ...base, items: [{ id: 'i', date: '2026-02-30' }] },
    { ...base, items: [{ id: 'i', time: '25:00' }] },
    { ...base, pending: { kind: 'amountCents', itemId: 'missing' } },
    { ...base, pending: null },
    { ...base, pending: { kind: 'target', itemIds: ['missing'], patch: { amountCents: 100 } } },
    { ...base, pending: { kind: 'target', itemIds: ['i'], patch: { amountCents: 0 } } },
    { ...base, pending: { kind: 'target', itemIds: ['i'], patch: { category: 'bad' } } },
    { ...base, status: 'ready', pending: null },
  ]
  for (const group of groups) {
    setActivePinia(createPinia()); const raw = JSON.stringify([{ id: 'm', role: 'assistant', kind: 'draft-group', group }]); data.set(key, raw)
    const store = useConversationStore(); await nextTick(); assert.equal(data.get(key), raw)
    assert.equal(store.restorationBlocked, true); assert.match(store.persistenceError, /保护/)
  }
})
test('有效歧义目标上下文原样恢复', () => {
  const group = { id: 'g', status: 'needs_input', items: [{ id: 'a', amountCents: 100 }, { id: 'b', amountCents: 200 }], pending: { kind: 'target', itemIds: ['a','b'], patch: { amountCents: 300 } } }
  const raw = JSON.stringify([{ id: 'm', role: 'assistant', kind: 'draft-group', group }]); data.set(key, raw)
  const store = useConversationStore(); assert.equal(store.restorationBlocked, false)
  assert.equal(JSON.stringify(store.messages), raw); assert.equal(writes, 0)
})
test('完整待确认/已保存草稿正常恢复，历史不截断', () => {
  const item = { id: 'i', type: 'expense', amountCents: 100, category: '餐饮', date: '2026-10-03', time: '12:00', remark: '咖啡' }
  const messages = Array.from({ length: 250 }, (_, i) => ({ id: 'text-' + i, kind: 'text', role: 'user', content: '历史' + i }))
  messages.push({ id: 'ready', role: 'assistant', kind: 'draft-group', group: { id: 'ready', status: 'ready', items: [item], pending: null } },
    { id: 'saved', role: 'assistant', kind: 'draft-group', group: { id: 'saved', status: 'saved', items: [item], pending: null } })
  data.set(key, JSON.stringify(messages)); const store = useConversationStore()
  assert.equal(store.restorationBlocked, false); assert.equal(store.messages.length, 252); assert.equal(writes, 0)
})
test('写入失败后显式重试保存完整本页消息，不影响账本键', async () => {
  const store = useConversationStore(); data.set('zhizhang_mock_records', 'original-ledger')
  fail = true; store.addMessage({ content: '尚未保存' }); await nextTick(); assert.match(store.persistenceError, /未保存/)
  assert.equal(await store.retryPersistence(), false)
  fail = false; assert.equal(await store.retryPersistence(), true)
  assert.equal(store.persistenceError, ''); assert.equal(JSON.parse(data.get(key)).at(-1).content, '尚未保存')
  assert.equal(data.get('zhizhang_mock_records'), 'original-ledger')
})
test('读取失败重试失败仍保护原文，外部恢复有效数据后只读重载', async () => {
  data.set(key, '{bad'); const store = useConversationStore()
  assert.equal(await store.retryPersistence(), false); assert.equal(data.get(key), '{bad'); assert.equal(writes, 0)
  const raw = JSON.stringify([{ id: 'old', role: 'assistant', kind: 'text', content: '恢复的历史' }]); data.set(key, raw)
  assert.equal(await store.retryPersistence(), true); assert.equal(store.messages[0].content, '恢复的历史')
  assert.equal(store.persistenceError, ''); assert.equal(writes, 0); assert.equal(data.get(key), raw)
  store.addMessage({ content: '继续' }); await nextTick(); assert.equal(JSON.parse(data.get(key)).length, 2)
})
test('坏历史保护期间本页新增内容不能被重新读取覆盖，包含同tick重试', async () => {
  for (const settled of [false, true]) {
    setActivePinia(createPinia()); data.set(key, '{bad'); const store = useConversationStore()
    store.addMessage({ content: '本页新消息' }); if (settled) await nextTick()
    const raw = JSON.stringify([{ id: 'old', role: 'user', kind: 'text', content: '旧历史' }]); data.set(key, raw)
    assert.equal(await store.retryPersistence(), false); assert.equal(data.get(key), raw)
    assert.equal(store.messages.at(-1).content, '本页新消息'); assert.match(store.persistenceError, /避免覆盖/)
  }
})
test('空字符串坏存储不当作空历史覆盖，合法空历史原样保留', () => {
  data.set(key, ''); const blocked = useConversationStore(); assert.equal(blocked.restorationBlocked, true)
  setActivePinia(createPinia()); data.set(key, '[]'); const empty = useConversationStore()
  assert.equal(empty.restorationBlocked, false); assert.deepEqual(empty.messages, []); assert.equal(writes, 0)
})
test('存储读取异常保护原文，读取权限恢复后显式重试可用', async () => {
  const raw = JSON.stringify([{ id: 'old', kind: 'text', role: 'assistant', content: '原内容' }]); data.set(key, raw)
  const original = window.localStorage.getItem; window.localStorage.getItem = () => { throw Error('denied') }
  const store = useConversationStore(); assert.equal(store.restorationBlocked, true); assert.equal(writes, 0)
  assert.equal(await store.retryPersistence(), false); window.localStorage.getItem = original
  assert.equal(await store.retryPersistence(), true); assert.equal(JSON.stringify(store.messages), raw); assert.equal(writes, 0)
})
test('规则引擎真实产生的各类追问/歧义/取消/保存上下文可原样恢复', () => {
  const options = { date: '2026-10-03', time: '12:00' }
  const ready = createDraft('咖啡16，地铁3', options).group
  const sameNames = createDraft('咖啡16，咖啡20', options).group
  const groups = [ready, createDraft('咖啡', options).group, createDraft('红包20', options).group,
    createDraft('明天咖啡20', options).group, createDraft('咖啡20元 25:00', options).group,
    applyDraftInput(sameNames, '咖啡改成18', options).group,
    applyDraftInput(ready, '取消这组', options).group, { ...ready, status: 'saved' }]
  for (const group of groups) {
    setActivePinia(createPinia()); const raw = JSON.stringify([{ id: 'm', role: 'assistant', kind: 'draft-group', group }]); data.set(key, raw)
    const store = useConversationStore(); assert.equal(store.restorationBlocked, false, JSON.stringify(group))
    assert.equal(JSON.stringify(store.messages), raw); assert.equal(writes, 0)
  }
})
