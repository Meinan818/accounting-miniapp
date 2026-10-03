import test from 'node:test'
import assert from 'node:assert/strict'
import { getScrollPosition } from '../src/utils/navigation.js'

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
