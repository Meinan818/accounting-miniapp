<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import NotebookBack from '@/components/common/NotebookBack.vue'
import miaoWriting from '@/assets/design/mascot/poses/miao-writing.png'
import RecordForm from '@/components/record/RecordForm.vue'
import { useRecordStore } from '@/stores/recordStore'
import { createId } from '@/utils/ledger'
import { SERVER_MODE } from '@/api/mode'
import { useManualRecordSave } from '@/utils/navigation'
const router = useRouter()
const store = useRecordStore()
const batchId = createId('manual')
const { saving, error, savedRecord, save, cancelPending, restoredRecord, notice, cancelling } = useManualRecordSave(store, router, batchId)
const recovery = computed(() => store.manualRecovery || { operations: [], error: '' })
</script>
<template>
  <main class="manual-page notebook-evolution">
    <section class="manual-content">
      <header><NotebookBack to="/bills" label="返回账单明细" /><img :src="miaoWriting" alt="" /><div><h1>手动记一笔</h1><p>喵叽智账 · 不用AI也能记</p></div></header>
      <router-link to="/chat" class="chat-link">更想说一说？和小宝聊着记 →</router-link>
      <p class="edition-ribbon">备用小便签 · 和聊天共用一本账</p>
      <article class="manual-card">
        <p class="intro">直接填好就能保存，和聊天记账共用同一本账。</p>
        <p v-if="store.storageError" role="alert" class="warning">{{ store.storageError }}</p>
        <p v-if="recovery.error" role="alert" class="warning">{{ recovery.error }}</p>
        <p v-if="notice" role="status" class="intro">{{ notice }}</p>
        <section v-if="recovery.operations.length && !savedRecord" class="saved-recovery" aria-label="恢复上次手动保存">
          <p>还有上次未收尾的保存操作。先恢复并核对这笔，避免重复记账。</p>
          <div v-for="operation in recovery.operations" :key="operation.batchId">
            <p>{{ operation.record.date }} · {{ operation.record.type === 'income' ? '收入' : '支出' }} · {{ operation.record.category }} · ¥{{ operation.record.amount }}</p>
            <p v-if="operation.record.remark">{{ operation.record.remark }}</p>
            <button type="button" :disabled="saving" @click="save(operation.record, operation.batchId)">{{ saving ? '正在恢复…' : '恢复原保存操作' }}</button>
            <button type="button" :disabled="saving" @click="cancelPending(operation)">核实并结束未入账草稿</button>
          </div>
          <p v-if="error" role="alert" class="warning">{{ error }}</p>
        </section>
        <RecordForm v-else-if="!recovery.error && !savedRecord && !cancelling" :record="restoredRecord" :saving="saving" :error="error" @save="record => save(record)" @cancel="router.push('/bills')" />
        <div v-if="savedRecord" class="saved-recovery" role="status"><p>这笔账单已经保存，可以打开明细查看。</p><p v-if="error" role="alert" class="warning">{{ error }}</p><button type="button" :disabled="saving" @click="save()">{{ saving ? '正在打开明细…' : '打开已保存账单' }}</button></div>
      </article>
      <p class="local-note">{{ SERVER_MODE ? '正式账单保存到当前账号，不调用AI。' : '本地演示：账单保存在当前浏览器，不调用AI。' }}</p>
    </section>
  </main>
</template>
<style scoped>
.manual-page { min-height: 100dvh; background: var(--zz-home-bg, #fdfaf3); padding: 24px 16px 40px; color: var(--zz-home-ink, #3c261a); font-family: var(--zz-home-font); }
.manual-content { max-width: 480px; margin: auto; }
header { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; }
header img { width: 62px; height: 62px; object-fit: contain; }
h1 { font-size: 23px; font-weight: 400; } header p { font-size: 12px; margin-top: 5px; }
.back { display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; border: 1px solid #d9c5a9; border-radius: 14px; background: #fffdf8; }
.chat-link { display: inline-block; padding: 10px 0; font-size: 13px; }
.manual-card { position: relative; margin-top: 16px; padding: 23px 18px 20px; border: 1px solid #d9c5a9; border-radius: 18px 22px 19px 16px; background: #fffdf8; box-shadow: 3px 4px 0 #fbedcf; }
.manual-card::before { content: ''; position: absolute; width: 70px; height: 16px; top: -8px; left: calc(50% - 35px); background: #f6ddd8; transform: rotate(-4deg); }
.intro, .local-note { font-size: 12px; line-height: 1.8; margin-bottom: 17px; }
.local-note { margin-top: 18px; text-align: center; }.warning { color: #aa594d; }
.saved-recovery { margin-top: 16px; font-size: 13px; line-height: 1.8; }.saved-recovery button { min-height: 44px; padding: 8px 14px; margin-top: 8px; border: 1px solid #d9c5a9; border-radius: 12px; background: #f6ddd8; }.saved-recovery button:focus-visible { outline: 2px solid #785746; outline-offset: 3px; }.saved-recovery button:disabled { opacity: .5; }
</style>
