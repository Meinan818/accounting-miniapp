// 使用实际Add模板和RecordForm初始化脚本验证Vue挂载时序；不代表浏览器GUI验收。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as Vue from 'vue'
import { compile } from '@vue/compiler-dom'
import dayjs from 'dayjs'
import { CATEGORY_OPTIONS } from '../src/utils/categories.js'
import { validateRecord } from '../src/utils/ledger.js'
import { useManualRecordSave } from '../src/utils/navigation.js'

function source(file) {
  const content = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8')
  return { script: content.split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, ''),
    template: content.split('<template>')[1].split('</template>')[0] }
}
function evaluate(script, bindings, returned) {
  return new Function(...Object.keys(bindings), script + ';return {' + returned + '}')(...Object.values(bindings))
}
function node(tag) { return { tag, children: [], props: {}, style: {}, parent: null, text: '' } }
const renderer = Vue.createRenderer({
  createElement: node, createText: text => ({ ...node('#text'), text }), createComment: text => ({ ...node('#comment'), text }),
  insert(child, parent, anchor = null) {
    if (child.parent) { const old = child.parent.children.indexOf(child); if (old >= 0) child.parent.children.splice(old, 1) }
    child.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index < 0) parent.children.push(child); else parent.children.splice(index, 0, child)
  },
  remove(child) { const index = child.parent?.children.indexOf(child) ?? -1; if (index >= 0) child.parent.children.splice(index, 1); child.parent = null },
  setText: (child, text) => { child.text = text },
  setElementText: (child, text) => { child.text = text; child.children = [] },
  parentNode: child => child.parent,
  nextSibling: child => child.parent?.children[child.parent.children.indexOf(child) + 1] || null,
  patchProp: (child, key, previous, value) => { child.props[key] = value },
})
const operation = { batchId: 'manual-original', record: { id: 'single', type: 'expense', amount: '0.29',
  date: '2026-10-03', time: '09:15', category: '餐饮', remark: '合成午饭' } }

function mount(pending = false) {
  const instances = [], add = source('views/Add.vue'), formSource = source('components/record/RecordForm.vue')
  let finish
  const store = Vue.reactive({ storageError: '', manualRecovery: { operations: pending ? [operation] : [], error: '' },
    cancelManualOperation: () => new Promise(done => { finish = () => { store.manualRecovery = { operations: [], error: '' }; done() } }),
    addRecord: async () => { throw Error('测试禁止自动入账') } })
  const RecordForm = { props: ['record', 'saving', 'error'], setup(props, context) {
    const values = evaluate(formSource.script, { computed: Vue.computed, ref: Vue.ref, dayjs, CATEGORY_OPTIONS, validateRecord,
      SERVER_MODE: true, defineProps: () => props, defineEmits: () => context.emit, defineExpose: context.expose }, 'form, save')
    instances.push(values)
    return () => Vue.h('form', { class: 'record-form' }, values.form.value.amount)
  } }
  const stub = { render: () => Vue.h('span') }
  const Add = { components: { RecordForm, NotebookBack: stub, RouterLink: stub }, setup() {
    return evaluate(add.script, { computed: Vue.computed, ref: Vue.ref, watch: Vue.watch, useRouter: () => ({ push: async () => undefined }),
      useRecordStore: () => store, createId: () => 'manual-new', SERVER_MODE: true, useManualRecordSave, miaoWriting: 'synthetic' },
    'store, router, recovery, saving, error, savedRecord, save, cancelPending, restoredRecord, notice, cancelling, miaoWriting, SERVER_MODE, manualForm: typeof manualForm === "undefined" ? null : manualForm')
  }, render: new Function('Vue', compile(add.template, { mode: 'function' }).code)(Vue) }
  Add.render._rc = true
  const root = node('root'), app = renderer.createApp(Add), view = app.mount(root)
  return { store, view, root, instances, finish: () => finish(), dispose: () => app.unmount() }
}

test('实际Vue挂载：取消未入账操作后原日期/金额/备注进入表单初值', async () => {
  const state = mount(true)
  try {
    const pending = state.view.cancelPending(operation)
    await Vue.nextTick(); state.finish(); await pending; await Vue.nextTick()
    const form = state.instances.at(-1).form.value
    assert.equal(form.amount, '0.29')
    assert.equal(form.date, '2026-10-03')
    assert.equal(form.time, '09:15')
    assert.equal(form.remark, '合成午饭')
  } finally { state.dispose() }
})

test('另一页恢复操作出现和消失保持已填写表单的同一实例', async () => {
  const state = mount()
  try {
    const first = state.instances.at(-1)
    first.form.value.amount = '12.34'; first.form.value.remark = '当前未提交输入'
    state.store.manualRecovery = { operations: [operation], error: '' }; await Vue.nextTick()
    state.store.manualRecovery = { operations: [], error: '' }; await Vue.nextTick()
    assert.equal(state.instances.length, 1)
    assert.equal(state.instances.at(-1), first)
    assert.equal(first.form.value.amount, '12.34')
  } finally { state.dispose() }
})

test('另一页待恢复草稿明确取消后仍保留当前用户未提交输入', async () => {
  const state = mount()
  try {
    const first = state.instances.at(-1)
    first.form.value.amount = '12.34'; first.form.value.remark = '当前未提交输入'
    state.store.manualRecovery = { operations: [operation], error: '' }; await Vue.nextTick()
    const pending = state.view.cancelPending(operation)
    await Vue.nextTick(); state.finish(); await pending; await Vue.nextTick()
    assert.equal(state.instances.at(-1).form.value.amount, '12.34')
    assert.equal(state.instances.at(-1).form.value.remark, '当前未提交输入')
    assert.match(state.view.notice, /当前填写的内容已保留/)
  } finally { state.dispose() }
})
