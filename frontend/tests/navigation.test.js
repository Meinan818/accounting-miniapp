import test from 'node:test'
import assert from 'node:assert/strict'
import { getScrollPosition } from '../src/utils/navigation.js'
import { useStatsMonthNavigation } from '../src/utils/navigation.js'
import { effectScope } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

async function setupMonth(month = '2026-10') {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/stats', component: {} }] })
  await router.push({ path: '/stats', query: { month, q: '保留筛选' } })
  const scope = effectScope()
  const route = { get query() { return router.currentRoute.value.query } }
  const navigation = scope.run(() => useStatsMonthNavigation(route, router, () => '2026-10'))
  return { router, navigation, dispose: () => scope.stop() }
}

test('统计月份导航被拒绝时，月份仍与真实路由和账本一致', async () => {
  const scene = await setupMonth()
  try {
    scene.router.beforeEach(() => false)
    assert.equal(await scene.navigation.changeMonth(1), false)
    assert.equal(scene.navigation.selectedMonth.value, '2026-10')
    assert.equal(scene.router.currentRoute.value.query.month, '2026-10')
  } finally { scene.dispose() }
})

test('慢导航完成前不展示尚未成功切换月份，连续点击累积到最终月份', async () => {
  const scene = await setupMonth()
  let release
  const blocked = new Promise(done => { release = done })
  scene.router.beforeEach(() => blocked)
  try {
    const first = scene.navigation.changeMonth(1)
    const second = scene.navigation.changeMonth(1)
    assert.equal(scene.navigation.selectedMonth.value, '2026-10')
    release(true)
    await Promise.all([first, second])
    assert.equal(scene.navigation.selectedMonth.value, '2026-12')
    assert.equal(scene.router.currentRoute.value.query.month, '2026-12')
    assert.equal(scene.router.currentRoute.value.query.q, '保留筛选')
  } finally { release(true); scene.dispose() }
})

test('统计月份守卫抛错时不产生未处理拒绝，后续可以重新切月', async () => {
  const scene = await setupMonth()
  scene.router.onError(() => {})
  let fail = true
  scene.router.beforeEach(() => { if (fail) throw Error('合成读取失败') })
  try {
    assert.equal(await scene.navigation.changeMonth(-1), false)
    assert.equal(scene.navigation.selectedMonth.value, '2026-10')
    assert.match(scene.navigation.navigationError.value, /暂时无法切换/)
    assert.equal(scene.navigation.pendingMonth.value, '')
    fail = false
    assert.equal(await scene.navigation.changeMonth(-1), true)
    assert.equal(scene.navigation.selectedMonth.value, '2026-09')
    assert.equal(scene.navigation.navigationError.value, '')
  } finally { scene.dispose() }
})

test('更早的取消结果不会清空新导航的等待月份', async () => {
  const scene = await setupMonth()
  let release
  const blocked = new Promise(done => { release = done })
  scene.router.beforeEach(() => blocked)
  try {
    const first = scene.navigation.changeMonth(1)
    const second = scene.navigation.changeMonth(1)
    await first
    assert.equal(scene.navigation.pendingMonth.value, '2026-12')
    assert.equal(scene.navigation.navigationError.value, '')
    release(true)
    await second
    assert.equal(scene.navigation.pendingMonth.value, '')
  } finally { release(true); scene.dispose() }
})

test('离页释放后，旧导航异常不再修改页面状态', async () => {
  const scene = await setupMonth()
  scene.router.onError(() => {})
  let reject
  scene.router.beforeEach(() => new Promise((_, fail) => { reject = fail }))
  const pending = scene.navigation.changeMonth(1)
  while (!reject) await new Promise(done => setImmediate(done))
  scene.dispose()
  reject(Error('合成离页后失败'))
  assert.equal(await pending, false)
  assert.equal(scene.navigation.navigationError.value, '')
  assert.equal(await scene.navigation.changeMonth(1), false)
})

test('统计月份上下界不发导航，异常查询使用当前月份', async () => {
  for (const [month, offset] of [['1000-01', -1], ['9999-12', 1]]) {
    const scene = await setupMonth(month)
    try { assert.equal(await scene.navigation.changeMonth(offset), false); assert.equal(scene.navigation.selectedMonth.value, month) }
    finally { scene.dispose() }
  }
  const scene = await setupMonth(['2026-01', '2026-02'])
  try {
    assert.equal(scene.navigation.selectedMonth.value, '2026-10')
    assert.equal(await scene.navigation.changeMonth(-1), true)
    assert.equal(scene.navigation.selectedMonth.value, '2026-09')
  } finally { scene.dispose() }
})

const route = (path, query = {}) => ({ path, query })
test('普通跨页导航从顶部开始', () => {
  assert.deepEqual(getScrollPosition(route('/stats'), route('/')), { left: 0, top: 0 })
})
test('浏览器返回恢复原位置，不创建第二份位置', () => {
  const position = { left: 0, top: 308 }
  assert.equal(getScrollPosition(route('/'), route('/stats'), position), position)
})
test('返回顶部的已保存位置仍有优先权', () => {
  const position = { left: 0, top: 0 }
  assert.equal(getScrollPosition(route('/bills', { added: 'new' }), route('/add'), position), position)
})
test('同页查询变化不抢走阅读或编辑位置', () => {
  assert.equal(getScrollPosition(route('/bills', { q: '咖啡' }), route('/bills')), false)
})
test('保存后跳转由明细定位新账单，不再回顶', () => {
  assert.equal(getScrollPosition(route('/bills', { added: 'new-record' }), route('/add')), false)
})
test('空新增标记不阻止普通导航回顶', () => {
  assert.deepEqual(getScrollPosition(route('/bills', { added: '' }), route('/')), { left: 0, top: 0 })
})
test('数组查询参数不能冒充单笔新增目标', () => {
  assert.deepEqual(getScrollPosition(route('/bills', { added: ['a', 'b'] }), route('/')), { left: 0, top: 0 })
})
test('其他页带同名参数仍从顶部开始', () => {
  assert.deepEqual(getScrollPosition(route('/stats', { added: 'new' }), route('/')), { left: 0, top: 0 })
})
test('首次进入没有查询对象也可回顶', () => {
  assert.deepEqual(getScrollPosition({ path: '/' }, { path: '' }), { left: 0, top: 0 })
})
