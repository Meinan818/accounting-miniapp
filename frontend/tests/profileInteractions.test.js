// Execute the actual Profile setup script offline, without browser or requests.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { computed, effectScope, reactive, ref, unref } from 'vue'
import dayjs from 'dayjs'
import { createProfileApi } from '../src/api/profile.js'
import { DEFAULT_PROFILE, readLocalProfile, saveLocalProfile } from '../src/utils/localProfile.js'
import { getMonthStatistics } from '../src/utils/statistics.js'
import { getRecentDays } from '../src/utils/journal.js'
import { centsText } from '../src/utils/money.js'
import { useLocalDay } from '../src/utils/calendar.js'

const original = { nickname: '合成名片', signature: '合成签名', avatar: 'cat', version: 0 }
function scene({ records = [], dateClock = {}, createPhoto = () => { assert.fail('不可处理真实照片') } } = {}) {
  const requests = [], cleanup = [], scope = effectScope()
  const auth = reactive({ user: { id: '1' }, api: { request(method, path, options) {
    return new Promise((resolve, reject) => requests.push({ method, path, options, resolve, reject }))
  } } })
  const script = readFileSync(new URL('../src/views/Profile.vue', import.meta.url), 'utf8').split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
  const bindings = { computed, ref, dayjs, onMounted() {}, onBeforeUnmount: fn => cleanup.push(fn), SERVER_MODE: true,
    useRecordStore: () => ({ records, storageError: '', refresh() { assert.fail('不可自动读账单') } }),
    useAuthStore: () => auth, getMonthStatistics, getRecentDays, centsText, packageInfo: { version: 'synthetic' },
    useLocalDay: () => useLocalDay({ eventTarget: null, ...dateClock }),
    DEFAULT_PROFILE, readLocalProfile, saveLocalProfile, createProfileApi, createProfilePhoto: createPhoto }
  const view = scope.run(() => new Function(...Object.keys(bindings), script + '; return { month, monthTitle, statistics, recentDays, profile, profileForm, profileError, profileDialog, loadProfile, openProfile, closeProfile, choosePhoto, processingPhoto, saveProfile, savingProfile, editError, loadingProfile }')(...Object.values(bindings)))
  let opens = 0
  view.profileDialog.value = { open: false, showModal() { opens++; this.open = true }, close() { this.open = false } }
  return { view, requests, get opens() { return opens }, dispose() { cleanup.forEach(fn => fn()); scope.stop() } }
}

test('重复打开资料编辑不能用迟到读取覆盖用户刚填的昵称', async () => {
  const env = scene()
  try {
    const first = env.view.openProfile(), second = env.view.openProfile()
    env.requests[0].resolve(original); await first
    env.view.profileForm.value.nickname = '正在填写的昵称'
    env.requests[1]?.resolve({ ...original, nickname: '迟到旧名片' }); await second
    assert.equal(env.view.profileForm.value.nickname, '正在填写的昵称')
    assert.equal(env.opens, 1)
    assert.equal(env.requests.length, 1)
  } finally { env.dispose() }
})

test('头像本地处理完成保留期间输入的昵称签名，确认前不上传', async () => {
  let complete
  const env = scene({ createPhoto: () => new Promise(resolve => { complete = resolve }) })
  try {
    const opened = env.view.openProfile(); env.requests[0].resolve(original); await opened
    const input = { files: [{ type: 'image/jpeg', size: 24 }], value: 'synthetic-file' }
    const pending = env.view.choosePhoto({ target: input })
    assert.equal(input.value, '')
    assert.equal(env.view.processingPhoto.value, true)
    env.view.profileForm.value.nickname = '处理期间的昵称'
    env.view.profileForm.value.signature = '处理期间的签名'
    complete('data:image/jpeg;base64,/9j/AA=='); await pending
    assert.equal(env.view.profileForm.value.avatar, 'photo')
    assert.equal(env.view.profileForm.value.nickname, '处理期间的昵称')
    assert.equal(env.view.profileForm.value.signature, '处理期间的签名')
    assert.equal(env.view.processingPhoto.value, false)
    assert.equal(env.requests.length, 1)
    assert.equal(env.requests[0].method, 'GET')
  } finally { env.dispose() }
})

test('取消头像处理再打开编辑，旧照片迟到不会替换新名片', async () => {
  let complete
  const env = scene({ createPhoto: () => new Promise(resolve => { complete = resolve }) })
  try {
    const opened = env.view.openProfile(); env.requests[0].resolve(original); await opened
    const pending = env.view.choosePhoto({ target: { files: [{}], value: '' } })
    env.view.closeProfile()
    assert.equal(env.view.processingPhoto.value, false)
    const reopened = env.view.openProfile(); env.requests[1].resolve({ ...original, nickname: '再次编辑' }); await reopened
    env.view.profileForm.value.nickname = '新的输入'
    complete('data:image/jpeg;base64,/9j/AA=='); await pending
    assert.equal(env.view.profileForm.value.avatar, 'cat')
    assert.equal(env.view.profileForm.value.nickname, '新的输入')
    assert.equal(env.view.editError.value, '')
    assert.equal(env.view.processingPhoto.value, false)
    assert.equal(env.requests.length, 2)
  } finally { env.dispose() }
})

test('替换头像后旧处理失败不干扰最新照片或忙碌状态', async () => {
  const photos = []
  const env = scene({ createPhoto: () => new Promise((resolve, reject) => photos.push({ resolve, reject })) })
  try {
    const opened = env.view.openProfile(); env.requests[0].resolve(original); await opened
    const first = env.view.choosePhoto({ target: { files: [{}], value: '' } })
    const second = env.view.choosePhoto({ target: { files: [{}], value: '' } })
    photos[0].reject(Error('旧图片失败')); await first
    assert.equal(env.view.processingPhoto.value, true)
    assert.equal(env.view.editError.value, '')
    photos[1].resolve('data:image/jpeg;base64,/9j/AQ=='); await second
    assert.equal(env.view.profileForm.value.photo, 'data:image/jpeg;base64,/9j/AQ==')
    assert.equal(env.view.processingPhoto.value, false)
    assert.equal(env.requests.length, 1)
  } finally { env.dispose() }
})

test('晚到的旧读取失败不掩盖较新资料，重试状态正常释放', async () => {
  const env = scene()
  try {
    const first = env.view.loadProfile(), second = env.view.loadProfile()
    env.requests[1].resolve({ ...original, nickname: '较新名片', version: 2 }); await second
    env.requests[0].reject(Error('迟到读取失败')); await first
    assert.equal(env.view.profile.value.nickname, '较新名片')
    assert.equal(env.view.profile.value.version, 2)
    assert.equal(env.view.profileError.value, '')
    assert.equal(env.view.loadingProfile.value, false)
  } finally { env.dispose() }
})

test('照片部分保存与重读失败仍保留昵称输入，重试只PUT不再次上传', async () => {
  const env = scene()
  const waitFor = async count => { while (env.requests.length < count) await new Promise(resolve => setImmediate(resolve)) }
  try {
    const opened = env.view.openProfile(); env.requests[0].resolve(original); await opened
    env.view.profileForm.value = { ...original, nickname: '填写中的新名', avatar: 'photo', photo: 'data:image/jpeg;base64,/9j/AA==' }
    const saving = env.view.saveProfile()
    assert.equal(env.requests[1].method, 'POST')
    env.requests[1].resolve({ ...original, avatar: 'photo', avatarUrl: '/api/profile/avatar', version: 1 })
    await waitFor(3); env.requests[2].reject(Error('合成PUT中断'))
    await waitFor(4); env.requests[3].reject(Error('合成GET中断')); await saving
    assert.equal(env.view.profileForm.value.nickname, '填写中的新名')
    assert.equal(env.view.profileForm.value.photo, '/api/profile/avatar?v=1&expectedAccount=1')
    assert.equal(env.view.profile.value.version, 1)
    assert.match(env.view.editError.value, /照片已保存/)
    assert.match(env.view.profileError.value, /合成GET中断/)
    assert.equal(env.view.savingProfile.value, false)
    const retry = env.view.saveProfile()
    assert.equal(env.requests[4].method, 'PUT')
    assert.equal(env.requests[4].options.body.version, 1)
    env.requests[4].resolve({ ...original, nickname: '填写中的新名', avatar: 'photo', avatarUrl: '/api/profile/avatar', version: 2 })
    await retry
    assert.equal(env.requests.length, 5)
    assert.equal(env.view.profile.value.version, 2)
    assert.equal(env.view.profileError.value, '')
  } finally { env.dispose() }
})

test('离页后的资料读取不再打开已经移除的编辑窗口', async () => {
  const env = scene()
  const pending = env.view.openProfile()
  env.dispose(); env.view.profileDialog.value = null
  env.requests[0].resolve(original)
  await pending
  assert.equal(env.opens, 0)
})

test('迟到的资料重读不能覆盖已经保存的新版本', async () => {
  const env = scene()
  try {
    const opened = env.view.openProfile(); env.requests[0].resolve(original); await opened
    const reading = env.view.loadProfile()
    env.view.profileForm.value.nickname = '新昵称'
    const saving = env.view.saveProfile()
    env.requests[2].resolve({ ...original, nickname: '新昵称', version: 1 }); await saving
    env.requests[1].resolve(original); await reading
    assert.equal(env.view.profile.value.nickname, '新昵称')
    assert.equal(env.view.profile.value.version, 1)
  } finally { env.dispose() }
})

test('个人页跨月同步月份与7天足迹，保留编辑输入且不读取网络', () => {
  const OriginalDate = globalThis.Date
  let time = new OriginalDate('2026-10-31T12:00:00'), day = '2026-10-31', cleared = false
  globalThis.Date = class extends OriginalDate {
    constructor(...args) { super(...(args.length ? args : [time.getTime()])) }
    static now() { return time.getTime() }
  }
  const events = new Map()
  let env
  try {
    env = scene({ records: [
      { id: 'oct', type: 'expense', amount: 0.29, date: '2026-10-31', category: '餐饮' },
      { id: 'nov', type: 'expense', amount: 0.31, date: '2026-11-01', category: '餐饮' },
    ], dateClock: { now: () => day, documentTarget: null,
      eventTarget: { addEventListener: (key, fn) => events.set(key, fn), removeEventListener: key => events.delete(key) },
      timers: { setInterval: () => 1, clearInterval: () => { cleared = true } },
    } })
    assert.equal(env.view.statistics.value.expenseCents, 29)
    assert.equal(env.view.recentDays.value.at(-1).date, '2026-10-31')
    env.view.profileForm.value.nickname = '跨月仍在填写'
    time = new OriginalDate('2026-11-01T12:00:00'); day = '2026-11-01'; events.get('focus')?.()
    assert.equal(unref(env.view.monthTitle), '2026年11月')
    assert.equal(env.view.statistics.value.expenseCents, 31)
    assert.equal(env.view.recentDays.value.at(-1).date, '2026-11-01')
    assert.equal(env.view.profileForm.value.nickname, '跨月仍在填写')
    assert.equal(env.requests.length, 0)
  } finally { env?.dispose(); globalThis.Date = OriginalDate }
  assert.equal(events.size, 0)
  assert.equal(cleared, true)
})
