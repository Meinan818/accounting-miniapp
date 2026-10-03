import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, ref } from 'vue'
import { createRemoteLedger } from '../src/api/remoteLedger.js'
import { createApiClient } from '../src/api/client.js'
import { createProfileApi, fromProfileView } from '../src/api/profile.js'
import { linkGroupRecords } from '../src/utils/groupRecords.js'
const id = '9abf606b-a0d5-4053-98fb-194505f3d10c'
const value = { id, type: 'expense', amount: '0.29', date: '2026-10-03', time: '09:15', category: '餐饮', note: '合成午饭', version: 0 }
const input = { id: 'item1', type: value.type, amount: value.amount, date: value.date, time: value.time, category: value.category, remark: value.note }
function setup(client) {
  const owner = ref('1'), scope = effectScope(), values = new Map()
  const store = scope.run(() => createRemoteLedger(client, owner, { storage: { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) } }))
  return { store, owner, values, dispose: () => scope.stop() }
}
test('正式账本不读取演示数据，删除事实排除汇总但保留卡片定位', async () => {
  const test = setup({ request: async () => ({ records: [{ record: value, deletedAt: '2026-10-03T01:00:00Z' }] }) })
  try { assert.equal(await test.store.refresh(), true); assert.equal(test.store.records.value.length, 0); assert.equal(test.store.recordsByIds([id])[0].deletedAt, '2026-10-03T01:00:00Z'); assert.throws(() => test.store.clearRecords(), /不提供/) }
  finally { test.dispose() }
})
test('重开页面后按回执ID恢复组条目关联，顺序变化及删除不丢最新事实', () => {
  const group = { id: 'g', recordIds: ['a', 'b'], items: [{ id: 'item1' }, { id: 'item2' }] }
  const linked = linkGroupRecords(group, [{ id: 'b', deletedAt: 'synthetic' }, { id: 'a', amount: 12 }])
  assert.equal(linked[0].draftItemId, 'item1'); assert.equal(linked[0].amount, 12)
  assert.equal(linked[1].draftItemId, 'item2'); assert.equal(linked[1].deletedAt, 'synthetic')
})
test('重放回执及读取失败不恢复已删除账单或覆盖当前编辑', async () => {
  let offline = false
  const test = setup({ request: async (method, path) => path.endsWith('batch') ? { records: [value] } : offline ? Promise.reject(Error('offline')) : { records: [{ record: { ...value, amount: '0.30', version: 2 }, deletedAt: '2026-10-03T01:00:00Z' }] } })
  try {
    await test.store.refresh(); offline = true
    await assert.rejects(test.store.addRecords([input], { batchId: 'g' }), /服务器已确认/)
    assert.equal(test.store.records.value.length, 0); assert.equal(test.store.recordsByIds([id])[0].amount, 0.30)
  } finally { test.dispose() }
})
test('账号改变立即清内存，旧账号迟到响应不进入新账本', async () => {
  let resolve
  const test = setup({ request: () => new Promise(done => { resolve = done }) })
  try { const pending = test.store.refresh(); test.owner.value = '2'; resolve({ records: [{ record: value }] }); assert.equal(await pending, false); assert.equal(test.store.records.value.length, 0) }
  finally { test.dispose() }
})
test('写入必须等待新快照，不能用先前正在读取的旧账本报告同步', async () => {
  let resolve; let reads = 0
  const test = setup({ request: async (method, path) => {
    if (path.endsWith('batch')) return { records: [value] }
    reads++; if (reads === 1) return new Promise(done => { resolve = done })
    return { records: [{ record: value, deletedAt: null }] }
  } })
  try {
    const previous = test.store.refresh(); const save = test.store.addRecords([input], { batchId: 'g' })
    await Promise.resolve(); resolve({ records: [] }); await previous; await save
    assert.equal(reads, 2); assert.equal(test.store.records.value.length, 1); assert.equal(test.store.batchRecords('g').length, 1)
  } finally { test.dispose() }
})
test('旧编辑版本用于改删，不借用刷新后的新版本覆盖其他修改', async () => {
  const writes = []
  const test = setup({ request: async (...args) => {
    if (args[0] === 'GET') return { records: [{ record: { ...value, version: 3 } }] }
    writes.push(args); throw Error('stale')
  } })
  try {
    await test.store.refresh(); await assert.rejects(test.store.updateRecord(id, input, { version: 0 })); await assert.rejects(test.store.deleteRecord(id, { version: 0 }))
    assert.equal(writes[0][2].body.version, 0); assert.match(writes[1][1], /version=0$/)
    assert.equal(test.store.records.value[0].version, 3)
  } finally { test.dispose() }
})
test('畸形快照及网络失败保护最后已确认账本，不写浏览器演示键', async () => {
  let snapshot = { records: [{ record: value }] }
  const test = setup({ request: async () => snapshot })
  try {
    await test.store.refresh(); snapshot = { records: [{ record: value }, { record: value }] }
    assert.equal(await test.store.refresh(), false); assert.equal(test.store.records.value.length, 1); assert.equal(test.values.size, 0)
  } finally { test.dispose() }
})
test('CSRF等待期间账号变化，真正发送写请求之前阻断', async () => {
  let resolve, current = true, writes = 0
  const api = createApiClient({ fetcher: async path => {
    if (path.endsWith('csrf')) return new Promise(done => { resolve = done })
    writes++; return new Response('{}')
  } })
  const pending = api.request('POST', '/api/records/batch', { body: {}, beforeSend: () => { if (!current) throw Error('identity changed') } })
  current = false; resolve(new Response(JSON.stringify({ headerName: 'X-CSRF-TOKEN', token: 'synthetic' })))
  await assert.rejects(pending, /identity changed/); assert.equal(writes, 0)
})
test('资料仅使用固定私有头像地址，拒绝外部URL', () => {
  const value = { nickname: '猫', signature: '', avatar: 'photo', version: 1, avatarUrl: '/api/profile/avatar' }
  assert.equal(fromProfileView(value).photo, '/api/profile/avatar?v=1')
  assert.equal(fromProfileView(value, '1').photo, '/api/profile/avatar?v=1&expectedAccount=1')
  assert.throws(() => fromProfileView({ ...value, avatarUrl: 'https://example.com/private' }))
})
test('新照片保存时才上传并使用返回版本更新资料，部分失败如实提示', async () => {
  const calls = [], profile = { nickname: '猫', signature: '', avatar: 'cat', version: 0 }
  const api = createProfileApi({ request: async (...args) => {
    calls.push(args); if (args[0] === 'POST') return { ...profile, avatar: 'photo', avatarUrl: '/api/profile/avatar', version: 1 }
    throw Error('synthetic profile conflict')
  } })
  await assert.rejects(api.save(profile, { ...profile, avatar: 'photo', photo: 'data:image/jpeg;base64,/9j/' }), /照片已保存.*昵称或签名尚未保存/)
  assert.equal(calls[0][2].multipart, true); assert.equal(calls[1][2].body.version, 1)
})
test('预置资料保存不上传照片，Unicode超长不发请求', async () => {
  let calls = 0; const profile = { nickname: '猫', signature: '', avatar: 'cat', version: 0 }
  const api = createProfileApi({ request: async () => { calls++; return { ...profile, version: 1 } } })
  await api.save(profile, profile); assert.equal(calls, 1)
  await assert.rejects(api.save(profile, { ...profile, nickname: '😀'.repeat(21) })); assert.equal(calls, 1)
})
