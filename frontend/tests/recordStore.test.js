import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref } from 'vue'
import { useRecordStore, createRecordStoreHMRHandler, RECORD_STORAGE_KEY } from '../src/stores/recordStore.js'
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

test('删除从明细/汇总排除，组事实仍保留；重载后不恢复', () => {
  const store = useRecordStore(); const saved = store.addRecords([record({}), record({ id: 'b', amount: '16' })], { batchId: 'g' })
  store.deleteRecord(saved[0].id)
  assert.equal(store.records.length, 1); assert.equal(store.records[0].amount, 16)
  assert.equal(store.batchRecords('g').length, 2); assert(store.batchRecords('g')[0].deletedAt)
  assert.equal(JSON.parse(data.get(RECORD_STORAGE_KEY)).length, 2)
  setActivePinia(createPinia()); const next = useRecordStore()
  assert.equal(next.records.length, 1); next.addRecords([record({}), record({ id: 'b', amount: '16' })], { batchId: 'g' })
  assert.equal(next.records.length, 1); assert(next.batchRecords('g')[0].deletedAt)
})
test('删除写入失败时内存和存储不变，恢复后可重试', () => {
  const store = useRecordStore(); const saved = store.addRecord(record({}), { batchId: 'g' })
  const old = data.get(RECORD_STORAGE_KEY); fail = true
  assert.throws(() => store.deleteRecord(saved.id), /删除未完成/)
  assert.equal(store.records.length, 1); assert.equal(data.get(RECORD_STORAGE_KEY), old)
  assert.equal(store.batchRecords('g')[0].deletedAt, undefined)
  fail = false; store.deleteRecord(saved.id); assert.equal(store.records.length, 0)
})
test('重复删除无额外写入，旧编辑和缺失目标均不覆盖存储', () => {
  const store = useRecordStore(); const saved = store.addRecord(record({}), { batchId: 'g' })
  store.deleteRecord(saved.id); const count = writes; const old = data.get(RECORD_STORAGE_KEY)
  store.deleteRecord(saved.id); assert.equal(writes, count)
  assert.throws(() => store.updateRecord(saved.id, record({ amount: '99' })), /已删除/)
  assert.throws(() => store.deleteRecord('missing'), /不存在/)
  assert.equal(data.get(RECORD_STORAGE_KEY), old)
})
test('删除前读取其他入口最新数据，不覆盖已新增账单', () => {
  const store = useRecordStore(); const saved = store.addRecord(record({}), { batchId: 'g' })
  const other = { ...saved, id: 'external', draftGroupId: 'external', amount: 50 }
  data.set(RECORD_STORAGE_KEY, JSON.stringify([saved, other]))
  store.deleteRecord(saved.id); assert.deepEqual(store.records, [other])
})
test('损坏删除标记保护原数据，禁止隐蔽排除或覆盖', () => {
  data.set(RECORD_STORAGE_KEY, JSON.stringify([record({ deletedAt: 'not-a-date' })]))
  const store = useRecordStore(); const old = data.get(RECORD_STORAGE_KEY)
  assert.match(store.storageError, /保护/)
  assert.throws(() => store.deleteRecord('a'), /保护/); assert.equal(data.get(RECORD_STORAGE_KEY), old)
})

test('删除收支分别更新月汇总/分类，删除最后一笔不恢复示例', () => {
  const now = new Date(); const date = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01'
  const store = useRecordStore(); const expense = store.addRecord(record({ date }), { batchId: 'expense' })
  const income = store.addRecord(record({ date, type: 'income', category: '工资', amount: '100' }), { batchId: 'income' })
  store.deleteRecord(expense.id); assert.equal(store.monthExpense, 0); assert.deepEqual(store.categoryExpenses, {})
  assert.equal(store.monthIncome, 100); store.deleteRecord(income.id)
  assert.equal(store.monthIncome, 0); assert.deepEqual(store.categoryIncome, {})
  setActivePinia(createPinia()); assert.equal(useRecordStore().records.length, 0)
})

test('热更新注册升级旧Store动作/过滤器，同时保留已保存账单', () => {
  const old = [record({ id: 'legacy-kept', amount: 5 })]
  data.set(RECORD_STORAGE_KEY, JSON.stringify(old))
  const legacyUse = defineStore('record', () => ({ records: ref(old), addRecord: () => {} }))
  const legacy = legacyUse(); assert.equal(useRecordStore(), legacy)
  assert.equal(typeof legacy.deleteRecord, 'undefined')
  const hot = { data: { pinia: legacyUse._pinia }, invalidate() { assert.fail('store id must not change') } }
  // Vite carries the original Pinia through hot.data; first enabling HMR on an old page still needs one reload.
  const callback = createRecordStoreHMRHandler(hot); assert.equal(typeof callback, 'function')
  callback({ useRecordStore })
  assert.equal(useRecordStore(), legacy); assert.equal(typeof legacy.deleteRecord, 'function')
  assert.deepEqual(legacy.records, old); assert.equal(writes, 0)
  legacy.deleteRecord('legacy-kept'); assert.equal(legacy.records.length, 0)
  assert.equal(JSON.parse(data.get(RECORD_STORAGE_KEY))[0].id, 'legacy-kept')
  assert(JSON.parse(data.get(RECORD_STORAGE_KEY))[0].deletedAt)
})
test('非开发环境没有hot对象时不注册回调或修改账单', () => {
  assert.equal(createRecordStoreHMRHandler(undefined), undefined); assert.equal(writes, 0); assert.equal(data.get(RECORD_STORAGE_KEY), '[]')
})
