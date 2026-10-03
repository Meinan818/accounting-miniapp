import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient, ApiError } from '../src/api/client.js'
import { createLedgerApi, fromRecordView, toRecordInput } from '../src/api/ledger.js'

const response = (status, data) => new Response(status === 204 ? null : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
const token = { headerName: 'X-CSRF-TOKEN', token: 'synthetic-csrf' }
const id = '7ebf606b-a0d5-4053-98fb-194505f3d10c'
const input = { id: 'item1', type: 'expense', amount: '0.29', date: '2026-10-03', time: '09:15', category: '餐饮', remark: '合成午饭' }
const view = { id, type: 'expense', amount: '0.29', date: input.date, time: input.time, category: input.category, note: input.remark, version: 0 }
function memory() {
  const values = new Map()
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}

test('写请求获取CSRF、同源Cookie与十进制JSON，不持有密码令牌', async () => {
  const calls = []
  const api = createApiClient({ fetcher: async (path, options) => { calls.push({ path, ...options }); return response(200, path.endsWith('csrf') ? token : view) } })
  await api.request('POST', '/api/records', { body: { amount: '0.29' }, headers: { 'Idempotency-Key': id } })
  assert.equal(calls.length, 2)
  assert.equal(calls[1].headers['X-CSRF-TOKEN'], token.token)
  assert.equal(calls[1].credentials, 'same-origin')
  assert.equal(calls[1].body, '{"amount":"0.29"}')
  assert.equal(calls[1].headers['Idempotency-Key'], id)
})
test('并发读取CSRF只产生一次请求', async () => {
  let calls = 0
  const api = createApiClient({ fetcher: async () => { calls++; await new Promise(resolve => setTimeout(resolve, 10)); return response(200, token) } })
  await Promise.all([api.getCsrf(), api.getCsrf()]); assert.equal(calls, 1)
})
test('请求断言当前账号，跨标签Cookie变化的409撤销旧页面身份', async () => {
  let changed = 0, header
  const api = createApiClient({ getOwner: () => '1', onUnauthorized: () => changed++, fetcher: async (path, options) => {
    header = options.headers['X-Expected-Account']
    return response(409, { code: 'ACCOUNT_CHANGED', message: '账号已变化' })
  } })
  await assert.rejects(api.request('GET', '/api/records/snapshot'), error => error.code === 'ACCOUNT_CHANGED')
  assert.equal(header, '1'); assert.equal(changed, 1)
})
test('登录以表单提交并重新获取token；退出不保存密码', async () => {
  const calls = []
  const api = createApiClient({ fetcher: async (path, options) => {
    calls.push({ path, ...options })
    return path.endsWith('/csrf') ? response(200, { ...token, token: 'csrf-' + calls.length })
      : path.endsWith('/me') ? response(200, { id: '1', username: 'synthetic' }) : response(204)
  } })
  await api.login('synthetic', 'SyntheticPass123!')
  assert.equal(calls[1].body, 'username=synthetic&password=SyntheticPass123%21')
  assert.equal(calls[2].path, '/api/auth/csrf')
  await api.logout(); assert.equal(calls[4].headers['X-CSRF-TOKEN'], 'csrf-3')
})
test('401通知清正式缓存，网络错误不自动重发写操作', async () => {
  let expired = 0; let writes = 0
  const api = createApiClient({ onUnauthorized: () => expired++, fetcher: async (path) => {
    if (path.endsWith('/csrf')) return response(200, token)
    if (path.endsWith('/me')) return response(401, {})
    writes++; throw new Error('synthetic network error')
  } })
  await assert.rejects(api.request('GET', '/api/auth/me'), error => error instanceof ApiError && error.status === 401)
  assert.equal(expired, 1)
  await assert.rejects(api.request('POST', '/api/records', { body: {} }), /连接不到/)
  assert.equal(writes, 1)
})
test('超时停止请求，HTML错误和未知CSRF头不能显示或转发', async () => {
  const timed = createApiClient({ timeoutMs: 10, fetcher: (path, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('abort')))) })
  await assert.rejects(timed.request('GET', '/api/auth/me'), /超时/)
  const html = createApiClient({ fetcher: async () => new Response('<p>synthetic private diagnostic</p>', { status: 503 }) })
  await assert.rejects(html.request('GET', '/api/auth/me'), error => !error.message.includes('private'))
  const malformed = createApiClient({ fetcher: async () => response(200, { headerName: 'Authorization', token: 'bad' }) })
  await assert.rejects(malformed.getCsrf(), /安全校验/)
  await assert.rejects(html.request('GET', 'https://example.com'), /同源/)
})
test('multipart不手写Content-Type，让浏览器生成boundary', async () => {
  const calls = []
  const api = createApiClient({ fetcher: async (path, options) => { calls.push(options); return response(200, path.endsWith('csrf') ? token : {}) } })
  const body = new FormData(); body.append('image', new Blob(['synthetic']))
  await api.request('POST', '/api/profile/avatar?version=0', { body, multipart: true })
  assert.equal(calls[1].body, body); assert.equal(Object.hasOwn(calls[1].headers, 'Content-Type'), false)
})
test('注册201允许空回执，查询成功仍拒绝非JSON正文', async () => {
  const api = createApiClient({ fetcher: async path => path.endsWith('/csrf') ? response(200, token) : new Response(null, { status: 201 }) })
  assert.equal(await api.request('POST', '/api/auth/register', { body: { username: 'synthetic', password: 'SyntheticPass123!' } }), null)
  const malformed = createApiClient({ fetcher: async () => new Response('<html>synthetic</html>', { status: 200 }) })
  await assert.rejects(malformed.request('GET', '/api/auth/me'), /格式不正确/)
})
test('金额双向适配保留分精度和未知时间，不信任畸形回执', () => {
  assert.equal(toRecordInput(input).amount, '0.29')
  assert.equal(toRecordInput({ ...input, amount: '999999999.99' }).amount, '999999999.99')
  assert.equal(fromRecordView(view).amount, 0.29)
  const { time, ...unknown } = view
  assert.equal(Object.hasOwn(fromRecordView(unknown), 'time'), false)
  for (const patch of [{ amount: 0.29 }, { version: -1 }, { id: '../other' }, { date: '2026-02-30' }, { time: '24:00' }, { type: 'invalid' }]) {
    assert.throws(() => fromRecordView({ ...view, ...patch }))
  }
})
test('超时及新实例重试复用持久化UUID，账户相同操作独立', async () => {
  const storage = memory(); const keys = []; let fail = true
  const client = { request: async (method, path, options) => {
    if (method === 'PUT') return { id: path.split('/').at(-1), version: 0, status: 'OPEN', records: options.body.records }
    keys.push(options.headers['Idempotency-Key']); if (fail) throw new Error('timeout'); return { records: [view] }
  } }
  const first = createLedgerApi(client, { storage, owner: '1', newUuid: () => id })
  await assert.rejects(first.createBatch([input], 'group1'), /timeout/)
  fail = false
  const next = createLedgerApi(client, { storage, owner: '1', newUuid: () => { throw new Error('must reuse') } })
  const receipt = await next.createBatch([input], 'group1')
  assert.deepEqual(keys, [id, id]); assert.equal(receipt[0].draftGroupId, 'group1')
  const otherId = '7ebf606b-a0d5-4053-98fb-194505f3d10d'
  await createLedgerApi(client, { storage, owner: '2', newUuid: () => otherId }).createBatch([input], 'group1')
  assert.equal(keys.at(-1), otherId)
  assert.equal(storage.values.has('zhizhang_mock_records'), false)
})
test('同次确认内容变化拒绝发请求，防止超时后改稿重复入账', async () => {
  let requests = 0
  const api = createLedgerApi({ request: async (method, path, options) => {
    if (method === 'PUT') return { id, version: 0, status: 'OPEN', records: options.body.records }
    requests++; return { records: [view] }
  } }, { storage: memory(), owner: '1', newUuid: () => id })
  await api.createBatch([input], 'g')
  await assert.rejects(api.createBatch([{ ...input, amount: '0.30' }], 'g'), /内容已改变/)
  assert.equal(requests, 1)
})
test('防重标识保存失败或旧意图损坏时不发送请求也不覆盖原文', async () => {
  let calls = 0
  const client = { request: async () => { calls++ } }
  const failing = { getItem: () => null, setItem: () => { throw new Error('quota') } }
  await assert.rejects(createLedgerApi(client, { storage: failing, owner: '1', newUuid: () => id }).createBatch([input], 'g'), /尚未发送/)
  const storage = memory(); storage.setItem('miaoji_account_write_intents_v1_1', '{broken')
  await assert.rejects(createLedgerApi(client, { storage, owner: '1' }).createBatch([input], 'g'))
  assert.equal(storage.getItem('miaoji_account_write_intents_v1_1'), '{broken'); assert.equal(calls, 0)
})
test('草稿版本先持久化再确认，新实例拒绝已变化的服务端版本', async () => {
  const storage = memory(); let version = 0; const calls = []
  const client = { request: async (method, path, options) => {
    calls.push({ method, path, options })
    if (method === 'PUT') return { id, version, status: 'OPEN', records: options.body.records }
    assert.equal(JSON.parse(storage.getItem('miaoji_account_write_intents_v1_1')).g.draftVersion, 0)
    assert.deepEqual(options.body, { version: 0 }); throw Error('lost confirmation response')
  } }
  await assert.rejects(createLedgerApi(client, { storage, owner: '1', newUuid: () => id }).createBatch([input], 'g'), /lost confirmation/)
  version = 1
  await assert.rejects(createLedgerApi(client, { storage, owner: '1' }).createBatch([input], 'g'), /版本已变化/)
  assert.equal(calls.filter(call => call.method === 'POST').length, 1)
})
test('草稿版本持久化失败或服务端内容不符时不发送确认', async () => {
  let writes = 0; let content = null; let saved = null
  const properStorage = { getItem: () => saved, setItem: (key, value) => {
    if (JSON.parse(value).g?.draftVersion != null) throw Error('quota')
    saved = value
  } }
  const client = { request: async (method, path, options) => {
    if (method === 'POST') { writes++; return { records: [view] } }
    return { id, version: 0, status: 'OPEN', records: content ?? options.body.records }
  } }
  await assert.rejects(createLedgerApi(client, { storage: properStorage, owner: '1', newUuid: () => id }).createBatch([input], 'g'), /尚未发送确认/)
  content = [{ ...toRecordInput(input), amount: '9.99' }]
  await assert.rejects(createLedgerApi(client, { storage: properStorage, owner: '1' }).createBatch([input], 'g'), /内容不一致/)
  assert.equal(writes, 0)
})
test('修改删除带服务器版本，回执保留组标识', async () => {
  const calls = []
  const api = createLedgerApi({ request: async (...args) => { calls.push(args); return { ...view, version: 1 } } }, { storage: memory(), owner: '1' })
  const current = { ...fromRecordView(view), draftGroupId: 'g' }
  const updated = await api.update(current, input); assert.equal(updated.draftGroupId, 'g')
  assert.equal(calls[0][2].body.version, 0); assert.equal(updated.version, 1)
  await api.remove(updated); assert.equal(calls[1][1], `/api/records/${id}?version=1`)
})
