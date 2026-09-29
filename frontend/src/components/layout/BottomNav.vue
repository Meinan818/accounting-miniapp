<script setup>
// 1. 导入
import { PiggyBank, Plus, ReceiptText, ScrollText, UserRound } from 'lucide-vue-next'

// 2. Props
defineProps({
  active: {
    type: String,
    default: 'home',
  },
})
</script>

<template>
  <nav class="bottom-wave fixed bottom-0 left-0 right-0 z-30 h-24 bg-warning text-hand">
    <div class="relative mx-auto flex h-full max-w-2xl items-end justify-around px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <router-link
        to="/bills"
        class="flex w-16 flex-col items-center gap-0.5 text-xs font-semibold"
        :class="active === 'detail' ? 'text-primary-700' : 'text-hand'"
      >
        <ScrollText :size="28" :stroke-width="2" />
        <span>明细</span>
      </router-link>

      <router-link
        to="/"
        class="flex w-16 flex-col items-center gap-0.5 text-xs font-semibold"
        :class="active === 'bill' ? 'text-primary-700' : 'text-hand'"
      >
        <ReceiptText :size="28" :stroke-width="2" />
        <span>账单</span>
      </router-link>

      <router-link
        to="/chat"
        class="absolute -top-7 left-1/2 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full border-[4px] border-hand bg-white text-hand shadow-[0_5px_0_rgba(31,41,55,0.2)] active:scale-95"
        aria-label="打开 AI 记账"
      >
        <Plus :size="46" :stroke-width="3" />
      </router-link>

      <router-link
        to="/stats"
        class="flex w-16 flex-col items-center gap-0.5 text-xs font-semibold"
        :class="active === 'saving' ? 'text-primary-700' : 'text-hand'"
      >
        <PiggyBank :size="28" :stroke-width="2" />
        <span>攒钱</span>
      </router-link>

      <router-link
        to="/profile"
        class="flex w-16 flex-col items-center gap-0.5 text-xs font-semibold"
        :class="active === 'profile' ? 'text-primary-700' : 'text-hand'"
      >
        <UserRound :size="28" :stroke-width="2" />
        <span>我的</span>
      </router-link>
    </div>
  </nav>
</template>
