<script setup>
import { computed, ref } from 'vue'
import { centsText, legacyCents } from '@/utils/money'
import RecordEditor from '@/components/record/RecordEditor.vue'
const props = defineProps({ group: { type: Object, required: true }, savedRecords: { type: Array, default: () => [] }, busy: Boolean, error: String })
const emit = defineEmits(['confirm', 'cancel', 'update'])
const editing = ref(null)
const saved = computed(() => props.savedRecords.length === props.group.items.length && props.group.items.every(i => props.savedRecords.some(r => r.draftItemId === i.id)))
const status = computed(() => saved.value ? 'saved' : props.group.status)
const items = computed(() => props.group.items.map(i => {
  const r = props.savedRecords.find(r => r.draftItemId === i.id)
  return r ? { ...i, ...r, id: i.id, amountCents: legacyCents(r.amount), description: r.remark || r.description || r.category } : i
}))
const totals = computed(() => ({ expense: items.value.filter(i => i.type === 'expense').reduce((n, i) => n + (i.amountCents || 0), 0), income: items.value.filter(i => i.type === 'income').reduce((n, i) => n + (i.amountCents || 0), 0) }))
const editRecord = computed(() => { const i = props.group.items.find(i => i.id === editing.value); return i ? { ...i, amount: i.amountCents == null ? '' : centsText(i.amountCents) } : null })
function update(record) { emit('update', { itemId: editing.value, record }); editing.value = null }
</script>
<template>
  <article class="miao-record draft-group-card" :data-group-id="group.id" :data-state="status">
    <div class="draft-heading"><h2 class="record-heading">这组小账单 · {{ items.length }}笔</h2><span class="record-pending">{{ ({ needs_input: '待补充', ready: '待确认', saved: '已记账', cancelled: '已取消' })[status] || '保存中' }}</span></div>
    <ol class="draft-items">
      <li v-for="(item, index) in items" :key="item.id" :data-item-id="item.id">
        <div class="draft-item-top"><span>{{ index + 1 }}. {{ item.description }}</span><strong :class="item.type">{{ item.amountCents == null ? '待补金额' : '¥' + centsText(item.amountCents) }}</strong></div>
        <p>{{ item.type === 'income' ? '收入' : item.type === 'expense' ? '支出' : '待定收支' }} · {{ item.category }} · {{ item.date || '待补日期' }} {{ item.time || '待补时间' }}</p>
        <button v-if="!['saved', 'cancelled'].includes(status)" type="button" :disabled="busy" :aria-label="'编辑第' + (index + 1) + '笔草稿'" @click="editing = item.id">编辑这笔</button>
      </li>
    </ol>
    <div class="draft-totals"><p v-if="totals.expense">支出{{ status === 'needs_input' ? '已知金额' : '合计' }} ¥{{ centsText(totals.expense) }}</p><p v-if="totals.income">收入{{ status === 'needs_input' ? '已知金额' : '合计' }} ¥{{ centsText(totals.income) }}</p><p v-if="status === 'needs_input'">仍有待补充或待选择的信息，补齐后才能保存。</p></div>
    <p v-if="error" role="alert" class="draft-error">{{ error }}</p>
    <div v-if="!['saved', 'cancelled'].includes(status)" class="draft-actions"><button type="button" :disabled="busy" @click="emit('cancel')">取消这组</button><button type="button" class="draft-confirm bg-primary-400" :disabled="busy || status !== 'ready'" @click="emit('confirm')">{{ busy ? '正在保存…' : '确认记下' + items.length + '笔' }}</button></div>
    <p v-else-if="status === 'saved'" class="saved-note">此卡片读取最新账单；<router-link :to="{ path: '/bills', query: { month: items[0]?.date?.slice(0, 7) } }">到明细修改</router-link>。历史聊天回复只是当时的记录。</p>
    <RecordEditor v-if="editRecord" :key="editing" :record="editRecord" @save="update" @close="editing = null" />
  </article>
</template>
<style scoped>
.draft-heading, .draft-item-top { display: flex; align-items: start; justify-content: space-between; gap: 10px; }
.draft-heading h2 { font-weight: 400; }
.draft-items { margin-top: 12px; }
.draft-items li { padding: 12px 0; border-bottom: 1px dashed #d9c5a9; }
.draft-item-top > span { min-width: 0; overflow-wrap: anywhere; }
strong { font-weight: 400; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.draft-items p { font-size: 12px; color: #aa8a70; margin-top: 5px; }
.draft-items button { margin-top: 6px; padding: 6px 10px; font-size: 12px; min-height: 36px; }
.expense { color: #ba7662; }.income { color: #7f9367; }
.draft-totals { font-size: 13px; line-height: 1.9; margin-top: 10px; }
.draft-actions { display: flex; gap: 10px; margin-top: 14px; }.draft-actions button { flex: 1; padding: 10px 6px; }
button:disabled { opacity: .5; cursor: not-allowed; }
.draft-error { margin-top: 10px; color: #aa594d; }
.saved-note { font-size: 12px; line-height: 1.8; margin-top: 12px; }.saved-note a { text-decoration: underline; }
</style>
