<script setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { CATEGORY_OPTIONS } from '@/utils/categories'
import { validateRecord } from '@/utils/ledger'
const props = defineProps({ record: { type: Object, default: () => ({}) }, saving: Boolean, error: { type: String, default: '' }, submitLabel: { type: String, default: '保存账单' } })
const emit = defineEmits(['save', 'cancel'])
const form = ref({ type: props.record.type || 'expense', amount: props.record.amount != null ? String(props.record.amount) : '',
  category: props.record.category || '餐饮', date: props.record.date || dayjs().format('YYYY-MM-DD'),
  time: props.record.time || dayjs().format('HH:mm'), remark: props.record.remark || '' })
const localError = ref('')
const categories = computed(() => CATEGORY_OPTIONS[form.value.type])
function changeType(type) { form.value.type = type; if (!categories.value.some(c => c.label === form.value.category)) form.value.category = categories.value[0].label }
function save() {
  if (props.saving) return
  try { const record = validateRecord({ ...form.value, description: form.value.remark || form.value.category }); localError.value = ''; emit('save', record) }
  catch (e) { localError.value = e.message }
}
</script>
<template>
  <form class="record-form" @submit.prevent="save">
    <fieldset :disabled="saving">
      <legend>收支类型</legend>
      <div class="type-options"><button v-for="type in ['expense', 'income']" :key="type" type="button" :aria-pressed="form.type === type" :class="{ selected: form.type === type }" @click="changeType(type)">{{ type === 'income' ? '收入' : '支出' }}</button></div>
      <div class="field-grid">
        <label>金额<input v-model="form.amount" aria-label="金额" inputmode="decimal" type="text" placeholder="如25.50" autocomplete="off" required /></label>
        <label>分类<select v-model="form.category" aria-label="分类"><option v-for="c in categories" :key="c.label" :value="c.label">{{ c.label }}</option></select></label>
        <label>日期<input v-model="form.date" aria-label="日期" type="date" required /></label>
        <label>时间<input v-model="form.time" aria-label="时间" type="time" required /></label>
      </div>
      <label>备注<input v-model="form.remark" aria-label="备注" type="text" maxlength="120" placeholder="这笔用在了哪里？" /></label>
    </fieldset>
    <p v-if="localError || error" class="form-error" role="alert">{{ localError || error }}</p>
    <div class="form-actions"><button type="button" :disabled="saving" @click="emit('cancel')">取消</button><button class="primary" type="submit" :disabled="saving">{{ saving ? '正在保存…' : submitLabel }}</button></div>
  </form>
</template>
<style scoped>
.record-form { color: var(--zz-home-ink, #3c261a); font-size: 15px; }
fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
legend { margin-bottom: 8px; }
.type-options { display: flex; gap: 10px; margin-bottom: 16px; }
button, input, select { min-height: 44px; border: 1px solid #d9c5a9; border-radius: 12px 10px 13px 11px; background: #fffdf8; color: inherit; font: inherit; padding: 9px 12px; }
button { cursor: pointer; }
button:disabled { opacity: .55; cursor: not-allowed; }
button.selected, button.primary { background: #f6ddd8; }
.type-options button, .form-actions button { flex: 1; }
.field-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin: 12px 0; }
label { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
input, select { width: 100%; min-width: 0; box-sizing: border-box; }
.form-actions { display: flex; gap: 10px; margin-top: 18px; }
.form-error { color: #aa594d; margin-top: 12px; overflow-wrap: anywhere; }
input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid #8c6c50; outline-offset: 2px; }
@media (prefers-reduced-motion: no-preference) { button { transition: background-color 140ms ease, border-color 140ms ease; } }
button:not(:disabled):active { border-color: #ba9782; }
@media(max-width:359px) { .field-grid { grid-template-columns: 1fr; } }
</style>
