<script setup>
// 1. 导入
import navBillNotebook from '@/assets/design/nav-bill-notebook.png'
import navDetailPig from '@/assets/design/nav-detail-pig.png'
import navProfileDog from '@/assets/design/nav-profile-dog.png'
import navSavingJar from '@/assets/design/nav-saving-jar.png'
import pawPrints from '@/assets/design/paw-prints.png'
import plusGlow from '@/assets/design/plus-glow.png'

// 2. Props
defineProps({
  active: {
    type: String,
    default: 'home',
  },
})

const navItems = [
  { key: 'detail', label: '明细', image: navDetailPig, to: '/bills' },
  { key: 'bill', label: '账单', image: navBillNotebook, to: '/' },
  { key: 'saving', label: '攒钱', image: navSavingJar, to: '/stats' },
  { key: 'profile', label: '我的', image: navProfileDog, to: '/profile' },
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
          <img :src="item.image" alt="" class="h-12 w-12 object-contain drop-shadow-[0_2px_0_rgba(31,41,55,0.12)]" />
          <span>{{ item.label }}</span>
          <span
            v-if="active === item.key"
            class="absolute -bottom-2 h-1.5 w-7 rounded-full bg-accent-400"
          />
        </router-link>

        <!-- 缩小中央加号光晕：从 32 改为 24，位置也上移一点 -->
        <router-link
          v-if="index === 1"
          to="/chat"
          class="absolute -top-10 left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="打开 AI 记账"
        >
          <img :src="plusGlow" alt="" class="h-full w-full object-contain drop-shadow-md" />
        </router-link>
      </template>

      <img :src="pawPrints" alt="" class="pointer-events-none absolute bottom-1 left-1/2 h-6 w-9 -translate-x-1/2 object-contain opacity-30" />
    </div>
  </nav>
</template>
