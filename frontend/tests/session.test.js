import test from 'node:test'
import assert from 'node:assert/strict'
import { createSession } from '../src/api/session.js'
import { ApiError } from '../src/api/client.js'

const alice = { id: '1', username: 'synthetic_alice' }
const bob = { id: '2', username: 'synthetic_bob' }
test('恢复只读真实会话，401保持未登录，不假造演示用户', async () => {
  const session = createSession({ request: async () => { throw new ApiError('expired', { status: 401 }) } })
  assert.equal(await session.restore(), false); assert.equal(session.user.value, null); assert.equal(session.status.value, 'guest')
})
test('服务不可用不当成未登录或演示数据', async () => {
  const session = createSession({ request: async () => { throw new ApiError('offline') } })
  await assert.rejects(session.restore(), /offline/)
  assert.equal(session.status.value, 'unavailable'); assert.equal(session.user.value, null)
})
test('切换账号及退出发送身份变化，让所有业务缓存立即隔离', async () => {
  const changes = []; let account = alice
  const session = createSession({ login: async () => account, logout: async () => {} }, { onIdentityChange: (...args) => changes.push(args) })
  await session.login('a', 'synthetic'); account = bob; await session.login('b', 'synthetic'); await session.logout()
  assert.deepEqual(changes, [['1', null], [null, '1'], ['2', null], [null, '2']]); assert.equal(session.user.value, null)
})
test('过期后迟到的会话响应不能恢复之前身份', async () => {
  let resolve
  const session = createSession({ request: () => new Promise(done => { resolve = done }) })
  const pending = session.restore(); session.expire(); resolve(alice)
  assert.equal(await pending, false); assert.equal(session.user.value, null)
})
test('并发恢复只发送一次，旧恢复不能覆盖新账号登录', async () => {
  let resolve; let count = 0
  const session = createSession({ request: () => { count++; return new Promise(done => { resolve = done }) }, login: async () => bob })
  const first = session.restore(); const second = session.restore()
  await session.login('b', 'synthetic'); resolve(alice); await Promise.all([first, second])
  assert.equal(count, 1); assert.equal(session.user.value.id, '2')
})
test('注册成功后实际登录；注册失败不创建身份', async () => {
  const calls = []
  const session = createSession({ request: async (...args) => calls.push(args), login: async () => alice })
  await session.register('a', 'synthetic')
  assert.equal(calls[0][1], '/api/auth/email/register'); assert.equal(session.user.value.id, '1')
  const failed = createSession({ request: async () => { throw new ApiError('taken', { status: 409 }) } })
  await assert.rejects(failed.register('a', 'synthetic'), /taken/); assert.equal(failed.user.value, null)
})
test('退出网络失败保留当前会话并提示，401可正常清理', async () => {
  let fail = 0
  const session = createSession({ login: async () => alice, logout: async () => { throw new ApiError('failed', { status: fail }) } })
  await session.login('a', 'synthetic'); await assert.rejects(session.logout()); assert.equal(session.user.value.id, '1')
  fail = 401; await session.logout(); assert.equal(session.user.value, null)
})
test('畸形服务身份拒绝登录，密码不放入会话状态', async () => {
  const session = createSession({ login: async () => ({ id: '../other', username: 'bad' }) })
  await assert.rejects(session.login('a', 'SyntheticPass123!'), /身份格式/)
  assert.equal(session.user.value, null); assert.equal(Object.hasOwn(session, 'password'), false)
})
test('邮箱验证码申请只接收挑战回执，注册传邮箱验证码并等待真实登录', async () => {
  const calls = []; const challengeId = '7ebf606b-a0d5-4053-98fb-194505f3d10c'
  const session = createSession({ request: async (...args) => {
    calls.push(args)
    return args[1].endsWith('/code') ? { challengeId, expiresIn: 300, resendAfter: 60 } : null
  }, login: async (email, password) => {
    assert.equal(email, 'synthetic@example.test'); assert.equal(password, 'SyntheticPass123!')
    return { id: '1', username: email }
  } })
  assert.equal((await session.requestRegistrationCode('synthetic@example.test')).challengeId, challengeId)
  await session.register('synthetic@example.test', 'SyntheticPass123!', challengeId, '123456')
  assert.deepEqual(calls[1][2].body, { email: 'synthetic@example.test', password: 'SyntheticPass123!', challengeId, code: '123456' })
  assert.equal(session.user.value.username, 'synthetic@example.test')
  assert.equal(Object.hasOwn(session, 'code'), false); assert.equal(Object.hasOwn(session, 'password'), false)
})
test('验证码申请回执缺字段拒绝冒称已发送，注册失败不伪造登录', async () => {
  const session = createSession({ request: async () => ({ challengeId: '../bad', expiresIn: 300, resendAfter: 60 }) })
  await assert.rejects(session.requestRegistrationCode('synthetic@example.test'), /回执不完整/)
  assert.equal(session.user.value, null)
})
