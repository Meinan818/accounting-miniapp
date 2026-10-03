// 实际组件脚本与Editor模板的离线Vue挂载；native dialog/focus仅核调用，不代表GUI验收。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as Vue from 'vue'
import { parse } from '@vue/compiler-sfc'
import { compile } from '@vue/compiler-dom'
import dayjs from 'dayjs'
import { CATEGORY_OPTIONS } from '../src/utils/categories.js'
import { validateRecord } from '../src/utils/ledger.js'
import { useBillQuery, useLedgerReload } from '../src/utils/navigation.js'
import { filterRecords, windowRecordGroups } from '../src/utils/journal.js'
import { getRecordTotals } from '../src/utils/money.js'
import { useLocalDay } from '../src/utils/calendar.js'

function source(file) {
  const { descriptor } = parse(readFileSync(new URL('../src/' + file, import.meta.url), 'utf8'))
  return { script: descriptor.scriptSetup.content.replace(/^import .*$/gm, ''), template: descriptor.template.content }
}
function evaluate(script, bindings, returned) {
  return new Function(...Object.keys(bindings), script + ';return {' + returned + '}')(...Object.values(bindings))
}
function node(tag) {
  return { tag, children: [], props: {}, style: {}, parent: null, text: '', focusCount: 0, scrollCount: 0,
    focus() { this.focusCount++ }, scrollIntoView() { this.scrollCount++ }, showModal() { this.open = true }, close() { this.open = false } }
}
const renderer = Vue.createRenderer({
  createElement: node, createText: text => ({ ...node('#text'), text }), createComment: text => ({ ...node('#comment'), text }),
  insert(child, parent, anchor = null) {
    if (child.parent) { const old = child.parent.children.indexOf(child); if (old >= 0) child.parent.children.splice(old, 1) }
    child.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index < 0) parent.children.push(child); else parent.children.splice(index, 0, child)
  },
  remove(child) { const index = child.parent?.children.indexOf(child) ?? -1; if (index >= 0) child.parent.children.splice(index, 1); child.parent = null },
  setText: (child, text) => { child.text = text }, setElementText: (child, text) => { child.text = text; child.children = [] },
  parentNode: child => child.parent, nextSibling: child => child.parent?.children[child.parent.children.indexOf(child) + 1] || null,
  patchProp: (child, key, previous, value) => { child.props[key] = value },
})
const original = { id: 'synthetic', version: 2, type: 'expense', amount: '0.29', category: '餐饮', date: '2026-10-03', remark: '合成账单' }
const editorSource = source('components/record/RecordEditor.vue'), formSource = source('components/record/RecordForm.vue')
function editorComponent(forms) {
  const RecordForm = { props: ['record', 'saving', 'error'], setup(props, context) {
    const values = evaluate(formSource.script, { ...Vue, dayjs, CATEGORY_OPTIONS, validateRecord, SERVER_MODE: true,
      defineProps: () => props, defineEmits: () => context.emit, defineExpose: context.expose }, 'form, save, localError')
    forms.push(values)
    return () => Vue.h('form', { class: 'record-form' }, values.form.value.amount)
  } }
  const Editor = { props: ['record', 'saving', 'error', 'allowDelete', 'conflict'], components: { RecordForm }, setup(props, context) {
    return evaluate(editorSource.script, { ...Vue, defineProps: () => props, defineEmits: () => context.emit,
      formatCurrency: amount => Number(amount).toFixed(2) },
    'props, emit, dialog, confirmingDelete, deleteTrigger, cancelDeleteButton, startDelete, cancelDelete, close, formatCurrency')
  }, render: new Function('Vue', compile(editorSource.template, { mode: 'function' }).code)(Vue) }
  Editor.render._rc = true
  return Editor
}
function mountEditor() {
  const previousDocument = globalThis.document
  globalThis.document = { body: { style: { overflow: 'scroll' } } }
  const forms = [], events = [], props = Vue.reactive({ record: { ...original }, allowDelete: true, saving: false, conflict: null, error: '' })
  const Editor = editorComponent(forms), root = node('root')
  let view
  const app = renderer.createApp({ render: () => Vue.h(Editor, { ...props, ref: instance => { view = instance },
    onSave: input => events.push(['save', input]), onClose: () => events.push(['close']), onDelete: () => events.push(['delete']) }) })
  app.mount(root)
  return { forms, events, props, get view() { return view }, root, dispose() { app.unmount(); globalThis.document = previousDocument } }
}

test('删除确认返回编辑保留金额/备注/未知时间的同一表单，并调用正确焦点目标', async () => {
  const state = mountEditor()
  try {
    const form = state.forms[0], dialog = state.view.dialog
    assert.equal(dialog.open, true)
    assert.equal(document.body.style.overflow, 'hidden')
    form.form.value.amount = '12.34'; form.form.value.remark = '尚未保存输入'
    for (let cycle = 0; cycle < 2; cycle++) {
      await state.view.startDelete()
      assert.equal(state.view.cancelDeleteButton.focusCount, 1)
      assert.equal(dialog.children.some(child => child.tag === 'form' && child.style.display === 'none'), true)
      await state.view.close(); await Vue.nextTick()
      assert.equal(state.view.confirmingDelete, false)
      assert.equal(state.view.deleteTrigger.focusCount, 1)
    }
    assert.equal(state.forms.length, 1)
    assert.equal(form.form.value.amount, '12.34')
    assert.equal(form.form.value.remark, '尚未保存输入')
    form.save()
    assert.equal(state.events[0][0], 'save')
    assert.equal(state.events[0][1].amount, 12.34)
    assert(!('time' in state.events[0][1]))
    assert.equal(state.events.length, 1)
    state.dispose()
    assert.equal(dialog.open, false)
  } finally { if (state.view) state.dispose() }
})

test('删除请求期间关闭/Escape不退出窗口，离页后nextTick不聚焦旧按钮并恢复overflow', async () => {
  const state = mountEditor(), priorDocument = document
  try {
    await state.view.startDelete()
    const button = state.view.cancelDeleteButton, dialog = state.view.dialog
    state.props.saving = true; await Vue.nextTick()
    state.view.close()
    assert.equal(state.view.confirmingDelete, true)
    assert.deepEqual(state.events, [])
    state.props.saving = false; await Vue.nextTick()
    const pending = state.view.cancelDelete()
    state.dispose(); await pending
    assert.equal(button.focusCount, 1)
    assert.equal(dialog.open, false)
    assert.equal(priorDocument.body.style.overflow, 'scroll')
  } finally { if (state.view) state.dispose() }
})

function mountBills({ records = [{ ...original }], dateClock = {} } = {}) {
  const bills = source('views/Bills.vue'), calls = []
  const route = Vue.reactive({ query: { month: '2026-10' } })
  let finish, fail, values
  const store = Vue.reactive({ records, storageError: '', refresh: async () => true,
    updateRecord: (...args) => { calls.push(['update', ...args]); return new Promise((resolve, reject) => { finish = resolve; fail = reject }) },
    deleteRecord: (...args) => { calls.push(['delete', ...args]); return new Promise((resolve, reject) => { finish = resolve; fail = reject }) } })
  const focusTarget = node('notice')
  const app = renderer.createApp({ setup() {
    values = evaluate(bills.script, { ...Vue, dayjs, useRecordStore: () => store, useRoute: () => route,
      useLocalDay: () => useLocalDay({ eventTarget: null, ...dateClock }),
      useBillQuery, useLedgerReload, filterRecords, windowRecordGroups, getRecordTotals, CATEGORY_OPTIONS },
    'edit, saveEdit, deleteEdit, adoptLatestVersion, notice, noticeElement, saving, saveError, editConflict, editingRecord, selectedMonth, searchText, groupedRecords, setRecordElement, loadMoreRecords, visibleLimit')
    values.noticeElement.value = focusTarget
    return () => Vue.h('main')
  } })
  app.mount(node('root')); values.edit(original)
  return { values, calls, route, focusTarget, finish: result => finish(result), fail: error => fail(error), dispose: () => app.unmount() }
}

test('编辑保存拒绝重复请求，离页后成功回执不改本页月份/提示', async () => {
  const state = mountBills()
  const pending = state.values.saveEdit({ amount: 12.34 })
  await state.values.saveEdit({ amount: 56.78 })
  state.dispose()
  state.finish({ ...original, date: '2026-11-02', amount: 12.34 }); await pending
  assert.equal(state.calls.length, 1)
  assert.equal(state.values.selectedMonth.value, '2026-10')
  assert.equal(state.values.notice.value, '')
})

test('离页后删除成功不更新提示或聚焦旧节点', async () => {
  const state = mountBills(), pending = state.values.deleteEdit()
  state.dispose(); state.finish(); await pending
  assert.equal(state.values.notice.value, '')
  assert.equal(state.focusTarget.focusCount, 0)
})

test('离页后版本冲突不回填旧页面错误和冲突内容', async () => {
  const state = mountBills(), pending = state.values.saveEdit({ amount: 12.34 })
  state.dispose()
  state.fail(Object.assign(Error('合成冲突'), { recoveryLoaded: true, currentRecord: { ...original, version: 3 } })); await pending
  assert.equal(state.values.saveError.value, '')
  assert.equal(state.values.editConflict.value, null)
})

test('仍在明细页保存成功切到新日期月份，失败冲突可采用新版本重试', async () => {
  const state = mountBills()
  try {
    let pending = state.values.saveEdit({ amount: 12.34 })
    state.fail(Object.assign(Error('合成冲突'), { recoveryLoaded: true, currentRecord: { ...original, version: 3 } })); await pending
    assert.equal(state.values.saveError.value, '合成冲突')
    await state.values.saveEdit({ amount: 12.34 })
    assert.equal(state.calls.length, 1)
    state.values.adoptLatestVersion()
    pending = state.values.saveEdit({ amount: 12.34 })
    assert.deepEqual(state.calls[1].at(-1), { version: 3 })
    state.finish({ ...original, date: '2026-11-02', amount: 12.34 }); await pending
    assert.equal(state.values.selectedMonth.value, '2026-11')
    assert.equal(state.values.editingRecord.value, null)
    assert.equal(state.values.saving.value, false)
    assert.match(state.values.notice.value, /已保存修改/)
  } finally { state.dispose() }
})

test('仍在明细页删除错误保留编辑且可重试，成功聚焦提示；离页旧入口不能再次发送', async () => {
  const state = mountBills()
  try {
    let pending = state.values.deleteEdit()
    state.fail(Error('合成删除失败')); await pending
    assert.equal(state.values.editingRecord.value.id, original.id)
    assert.equal(state.values.saveError.value, '合成删除失败')
    pending = state.values.deleteEdit(); state.finish(); await pending
    assert.equal(state.focusTarget.focusCount, 1)
    assert.equal(state.values.saving.value, false)
    assert.match(state.values.notice.value, /已删除/)
    state.dispose(); state.values.edit(original)
    await state.values.deleteEdit(); await state.values.saveEdit({ amount: 12.34 })
    assert.equal(state.calls.length, 2)
  } finally { state.dispose() }
})

test('明细跨日月只更新今日/昨日标签，保留历史月份/搜索/编辑，不写账单并释放时钟', async () => {
  const OriginalDate = globalThis.Date
  let time = new OriginalDate('2026-10-31T12:00:00'), day = '2026-10-31', cleared = false, state, tick
  globalThis.Date = class extends OriginalDate {
    constructor(...args) { super(...(args.length ? args : [time.getTime()])) }
    static now() { return time.getTime() }
  }
  const events = new Map(), records = [{ ...original, date: '2026-10-31' }, { ...original, id: 'other', date: '2026-10-30' }]
  try {
    state = mountBills({ records, dateClock: { now: () => day, documentTarget: null,
      eventTarget: { addEventListener: (name, listener) => events.set(name, listener), removeEventListener: name => events.delete(name) },
      timers: { setInterval: callback => { tick = callback; return 7 }, clearInterval: id => { assert.equal(id, 7); cleared = true } } } })
    assert.deepEqual(state.values.groupedRecords.value.map(group => group.label), ['今天', '昨天'])
    state.values.searchText.value = '合成账单'
    state.values.editingRecord.value.remark = '未保存编辑快照'
    assert.deepEqual(state.values.groupedRecords.value.map(group => group.label), ['今天', '昨天'])
    time = new OriginalDate('2026-11-01T12:00:00'); day = '2026-11-01'; events.get('focus')?.()
    await Vue.nextTick()
    assert.equal(state.values.groupedRecords.value[0].label, '昨天')
    assert.match(state.values.groupedRecords.value[1].label, /^10月30日/)
    time = new OriginalDate('2026-11-02T12:00:00'); day = '2026-11-02'; tick?.()
    await Vue.nextTick()
    assert.match(state.values.groupedRecords.value[0].label, /^10月31日/)
    assert.equal(state.values.selectedMonth.value, '2026-10')
    assert.equal(state.values.searchText.value, '合成账单')
    assert.equal(state.values.editingRecord.value.remark, '未保存编辑快照')
    assert.equal(state.calls.length, 0)
    state.dispose()
    assert.equal(events.size, 0)
    assert.equal(cleared, true)
  } finally { state?.dispose(); globalThis.Date = OriginalDate }
})

test('快速切换新账单定位时旧nextTick不滚动或聚焦，当前定位仍生效', async () => {
  const state = mountBills({ records: [{ ...original }, { ...original, id: 'other' }] })
  const first = node('first'), second = node('second')
  try {
    state.values.editingRecord.value = null
    state.values.setRecordElement(original.id, first); state.values.setRecordElement('other', second)
    state.route.query = { month: '2026-10', added: original.id }
    await Vue.nextTick(() => { state.route.query = { month: '2026-10', added: 'other' } })
    await Vue.nextTick(); await Vue.nextTick()
    assert.equal(first.focusCount, 0)
    assert.equal(first.scrollCount, 0)
    assert.equal(second.focusCount, 1)
    assert.equal(second.scrollCount, 1)
  } finally { state.dispose() }
})

test('新账单定位等待DOM时用户开始搜索，不被旧回调抢走焦点或清筛选', async () => {
  const state = mountBills(), target = node('receipt')
  try {
    state.values.editingRecord.value = null
    state.values.setRecordElement(original.id, target)
    state.route.query = { month: '2026-10', added: original.id }
    await Vue.nextTick(() => { state.values.searchText.value = '合成' })
    await Vue.nextTick()
    assert.equal(target.focusCount, 0)
    assert.equal(target.scrollCount, 0)
    assert.equal(state.values.searchText.value, '合成')
  } finally { state.dispose() }
})

test('连续翻页只由最新展开目标聚焦，正常单次展开仍定位到第一笔新增账单', async () => {
  const records = Array.from({ length: 121 }, (_, id) => ({ ...original, id: String(id) }))
  const state = mountBills({ records }), first = node('row60'), second = node('row120')
  try {
    state.values.editingRecord.value = null
    state.values.setRecordElement('60', first); state.values.setRecordElement('120', second)
    let pending = state.values.loadMoreRecords(); await pending
    assert.equal(first.focusCount, 1)
    first.focusCount = 0; first.scrollCount = 0
    state.values.visibleLimit.value = 60
    pending = state.values.loadMoreRecords()
    const next = state.values.loadMoreRecords()
    await Promise.all([pending, next])
    assert.equal(first.focusCount, 0)
    assert.equal(first.scrollCount, 0)
    assert.equal(second.focusCount, 1)
    assert.equal(second.scrollCount, 1)
  } finally { state.dispose() }
})
