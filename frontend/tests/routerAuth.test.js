// Real Vue Router in memory + project guard + session; no browser or network.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { reactive } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createSession } from '../src/api/session.js'
import { getScrollPosition } from '../src/utils/navigation.js'
import { getLoginReturnPath } from '../src/utils/loginRedirect.js'

const source = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  .replace(/^import .*$/gm, '')
  .replace(/component: \(\) => import\('[^']+'\)/g, 'component: {}')
  .replace('createWebHistory(import.meta.env.BASE_URL)', 'createMemoryHistory()')
  .replace('export default router', 'return router')
function scene({ delayedLedger = false } = {}) {
  const reads = [], logins = [], ledger = []
  let ledgerReads = 0
  const session = createSession({ request: () => new Promise((resolve, reject) => reads.push({ resolve, reject })),
    login: () => new Promise(resolve => logins.push(resolve)) })
  const auth = reactive(session)
  const router = new Function('createRouter', 'createMemoryHistory', 'getScrollPosition', 'getLoginReturnPath', 'SERVER_MODE', 'useAuthStore', 'useRecordStore', source)(
    createRouter, createMemoryHistory, getScrollPosition, getLoginReturnPath, true, () => auth, () => ({ refresh: async () => {
      ledgerReads++
      if (delayedLedger) await new Promise(resolve => ledger.push(resolve))
    } }))
  return { router, auth, session, reads, logins, ledger, get ledgerReads() { return ledgerReads },
    flush: () => new Promise(resolve => setImmediate(resolve)) }
}
const account = { id: '1', username: 'synthetic' }
test('并发导航共享正在恢复的身份，恢复前不误判访客，最新目的地保留', async () => {
  const env = scene(), first = env.router.push('/bills'); await env.flush()
  assert.equal(env.auth.status, 'loading'); assert.equal(env.reads.length, 1)
  const second = env.router.push('/stats'); await env.flush()
  const interimRoute = env.router.currentRoute.value.name
  env.reads[0].resolve(account); await Promise.all([first, second])
  assert.notEqual(interimRoute, 'Login')
  assert.equal(env.router.currentRoute.value.name, 'Stats'); assert.equal(env.reads.length, 1)
  assert.equal(env.ledgerReads, 1)
})
test('登录中的loading不会额外恢复身份，受保护目标仍需有效登录', async () => {
  const env = scene(), login = env.session.login('synthetic', 'synthetic-password')
  await env.router.push('/bills')
  assert.equal(env.router.currentRoute.value.name, 'Login'); assert.equal(env.reads.length, 0)
  assert.equal(env.ledgerReads, 0); env.logins[0](account); await login
})
test('共享恢复失败时最新受保护目标回登录，恢复后可再次导航', async () => {
  const env = scene(), first = env.router.push('/bills'); await env.flush()
  const second = env.router.push('/stats'); await env.flush()
  env.reads[0].reject(Error('synthetic-offline')); await env.flush()
  // Redirecting to Login may itself retry an unavailable session; finish that synthetic read.
  if (env.reads[1]) env.reads[1].reject(Error('synthetic-still-offline'))
  await Promise.all([first, second])
  assert.equal(env.router.currentRoute.value.name, 'Login'); assert.equal(env.auth.user, null)
  assert.equal(env.ledgerReads, 0)
  const retry = env.router.push('/stats'); await env.flush(); env.reads.at(-1).resolve(account); await retry
  assert.equal(env.router.currentRoute.value.name, 'Stats'); assert.equal(env.ledgerReads, 1)
})
test('账本等待期间身份失效，迟到读取不再放行受保护页面', async () => {
  const env = scene({ delayedLedger: true }), pending = env.router.push('/bills'); await env.flush()
  env.reads[0].resolve(account); await env.flush(); assert.equal(env.ledgerReads, 1)
  env.session.expire(); env.ledger[0](); await pending
  assert.equal(env.router.currentRoute.value.name, 'Login'); assert.equal(env.auth.user, null)
})
test('访客跳登录保留明细完整目的地，已认证访问登录返回安全站内目标', async () => {
  const env = scene(), target = '/bills?month=2026-09&q=coffee#receipt'
  env.session.expire(); await env.router.push(target)
  assert.equal(env.router.currentRoute.value.name, 'Login')
  assert.equal(env.router.currentRoute.value.query.redirect, target)
  const login = env.session.login('synthetic', 'synthetic-password'); env.logins[0](account); await login
  // Visit a new login URL; pushing the current identical URL skips guards in Vue Router.
  await env.router.push({ name: 'Login', query: { redirect: target, visit: 'synthetic' } })
  assert.equal(env.router.currentRoute.value.fullPath, target)
  await env.router.push({ name: 'Login', query: { redirect: '//example.test' } })
  assert.equal(env.router.currentRoute.value.name, 'Home')
})
