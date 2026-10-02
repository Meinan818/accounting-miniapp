import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useRecordStore, RECORD_STORAGE_KEY } from '../src/stores/recordStore.js'
let data, fail, writes
const record = extra => ({ id: 'a', type: 'expense', amount: '25', category: '餐饮', date: '2026-10-02', time: '12:00', remark: '午饭', ...extra })
beforeEach(() => {
  data = new Map([[RECORD_STORAGE_KEY, '[]']]); fail = false; writes = 0
  globalThis.window = { localStorage: { getItem: k => data.get(k) ?? null, setItem: (k, v) => { if (fail) throw Error('QuotaExceeded'); writes++; data.set(k, v) } } }
  setActivePinia(createPinia())
})
test('整组只写一次，同源手动添加与直接修改保持原账单', () => {
  const store = useRecordStore()
  const saved = store.addRecords([record({}), record({ id: 'b', amount: '16' })], { batchId: 'g' })
  assert.equal(writes, 1); assert.equal(store.records.length, 2)
  store.addRecord(record({ id: 'c', amount: '3' }), { batchId: 'manual', source: 'manual' })
  store.updateRecord(saved[0].id, record({ amount: '12' }))
  assert.equal(store.records.length, 3); assert.equal(store.records.find(r => r.id === saved[0].id).amount, 12)
  assert.equal(JSON.parse(data.get(RECORD_STORAGE_KEY)).length, 3)
})
test('账单写入失败不会修改内存、也不留下部分账单，恢复后可重试', () => {
  const store = useRecordStore(); fail = true
  assert.throws(() => store.addRecords([record({}), record({ id: 'b' })], { batchId: 'g' }), /未保存/)
  assert.equal(store.records.length, 0); assert.equal(data.get(RECORD_STORAGE_KEY), '[]')
  fail = false; store.addRecords([record({}), record({ id: 'b' })], { batchId: 'g' }); assert.equal(store.records.length, 2)
})
test('读到新账单后再修改，不能覆盖其他入口的新记录', () => {
  const store = useRecordStore(); const saved = store.addRecord(record({}), { batchId: 'a' })
  const other = { ...saved, id: 'external', draftGroupId: 'external', amount: 50 }
  data.set(RECORD_STORAGE_KEY, JSON.stringify([saved, other]))
  store.updateRecord(saved.id, record({ amount: '16' }))
  assert.equal(store.records.length, 2); assert.equal(store.records.find(r => r.id === 'external').amount, 50)
})
test('损坏存储不自动清空，禁止覆盖；修复后可恢复', () => {
  data.set(RECORD_STORAGE_KEY, '{broken'); const store = useRecordStore()
  assert.match(store.storageError, /保护/)
  assert.throws(() => store.addRecord(record({})), /保护/)
  assert.equal(data.get(RECORD_STORAGE_KEY), '{broken'); assert.equal(writes, 0)
  data.set(RECORD_STORAGE_KEY, '[]'); assert.equal(store.refresh(), true)
})
test('刷新后同组确认不重复，账单改动不会被旧草稿还原', () => {
  const first = useRecordStore(); const saved = first.addRecords([record({})], { batchId: 'g' })
  first.updateRecord(saved[0].id, record({ amount: '14' }))
  setActivePinia(createPinia()); const next = useRecordStore()
  next.addRecords([record({})], { batchId: 'g' })
  assert.equal(next.records.length, 1); assert.equal(next.records[0].amount, 14)
})
