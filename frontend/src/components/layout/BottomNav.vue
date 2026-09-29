<script setup>
// 1. 导入
import { Plus } from 'lucide-vue-next'

// 2. Props
defineProps({
  active: {
    type: String,
    default: 'home',
  },
})

const navItems = [
  { key: 'detail', label: '明细', icon: '🐷', to: '/bills' },
  { key: 'bill', label: '账单', icon: '📒', to: '/' },
  { key: 'saving', label: '攒钱', icon: '🫙', to: '/stats' },
  { key: 'profile', label: '我的', icon: '🐶', to: '/profile' },
]
</script>

<template>
  <nav class="bottom-wave fixed bottom-0 left-0 right-0 z-30 h-28 border-t-[3px] border-hand bg-warning text-hand">
    <div class="relative mx-auto flex h-full max-w-2xl items-center justify-between px-8 pt-5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
      <template v-for="(item, index) in navItems" :key="item.key">
        <router-link
          :to="item.to"
          class="relative flex w-16 flex-col items-center gap-0.5 text-xs font-semibold transition-all duration-200 active:scale-95"
          :class="active === item.key ? 'text-primary-700' : 'text-hand'"
        >
          <span class="text-3xl leading-none drop-shadow-[0_2px_0_rgba(31,41,55,0.14)]">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          <span
            v-if="active === item.key"
            class="absolute -bottom-2 h-1.5 w-7 rounded-full bg-accent-400"
          />
        </router-link>

        <router-link
          v-if="index === 1"
          to="/chat"
          class="absolute -top-8 left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full border-[4px] border-hand bg-[#ffe79a] text-hand shadow-[0_6px_0_rgba(31,41,55,0.22)] transition-all duration-200 active:scale-95"
          aria-label="打开 AI 记账"
        >
          <span class="absolute inset-2 rounded-full border-2 border-warning/80" />
          <Plus :size="50" :stroke-width="3" />
        </router-link>
      </template>

      <span class="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-xl opacity-30">🐾</span>
    </div>
  </nav>
</template>
