<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import RecordForm from './RecordForm.vue'
const props = defineProps({ record: { type: Object, required: true }, saving: Boolean, error: String })
const emit = defineEmits(['save', 'close'])
const dialog = ref(null)
let previousOverflow
onMounted(() => { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; dialog.value.showModal() })
onBeforeUnmount(() => { dialog.value?.close(); document.body.style.overflow = previousOverflow })
function close() { if (!props.saving) emit('close') }
</script>
<template>
  <dialog ref="dialog" class="bill-editor" aria-labelledby="bill-editor-title" @cancel.prevent="close">
    <div class="editor-handle" aria-hidden="true"></div>
    <div class="editor-heading"><h2 id="bill-editor-title">编辑这笔账单</h2><button type="button" aria-label="关闭修改窗口" :disabled="saving" @click="close">×</button></div>
    <p class="editor-note">保存后，明细、首页和聊天查询都会使用最新数据。</p>
    <RecordForm :record="record" :saving="saving" :error="error" submit-label="保存修改" @save="emit('save', $event)" @cancel="close" />
  </dialog>
</template>
<style scoped>
.bill-editor { width: min(480px,calc(100% - 28px)); max-height: calc(100dvh - 40px); overflow-y: auto; padding: 20px; border: 1px solid #d9c5a9; border-radius: 18px 22px 19px 16px; background: var(--zz-home-bg, #fdfaf3); color: var(--zz-home-ink, #3c261a); font-family: inherit; }
.bill-editor::backdrop { background: rgb(80 60 40 / .28); }
.editor-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h2 { font-size: 19px; font-weight: 400; }
.editor-heading button { min-width: 44px; min-height: 44px; border: 1px solid #d9c5a9; border-radius: 12px; background: #fffdf8; font-size: 24px; color: inherit; }
.editor-note { font-size: 12px; margin: 10px 0 18px; line-height: 1.7; }
.editor-handle { display: none; }
@media (max-width: 639px) {
  .bill-editor { position: fixed; inset: auto 0 0; margin: 0 auto; width: 100%; max-width: 480px; max-height: calc(100dvh - 16px); padding: 12px 18px calc(20px + env(safe-area-inset-bottom, 0px)); border-radius: 24px 24px 0 0; box-shadow: 0 -6px 24px rgb(80 60 40 / .1); }
  .editor-handle { display: block; width: 36px; height: 4px; margin: 0 auto 14px; border-radius: 8px; background: #dbc5b8; }
}
</style>
