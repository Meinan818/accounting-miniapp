<script setup>
// 1. 导入
import { ReceiptText, CalendarDays, BarChart3, UserRound, Plus } from 'lucide-vue-next'
import navBillNotebook from '@/assets/design/navigation/nav-bill-notebook.png'
import navDetailPig from '@/assets/design/navigation/nav-detail-pig.png'
import navProfileDog from '@/assets/design/navigation/nav-profile-dog.png'
import navSavingJar from '@/assets/design/navigation/nav-saving-jar.png'
import pawPrints from '@/assets/design/navigation/paw-prints.png'
import plusGlow from '@/assets/design/navigation/plus-glow.png'

// 2. Props
defineProps({
  active: {
    type: String,
    default: 'home',
  },
  homeAppearance: { type: Boolean, default: false },
})

const navItems = [
  { key: 'detail', label: '明细', image: navDetailPig, icon: ReceiptText, to: '/bills' },
  { key: 'bill', label: '账单', image: navBillNotebook, icon: CalendarDays, to: '/' },
  { key: 'saving', label: '攒钱', homeLabel: '统计', image: navSavingJar, icon: BarChart3, to: '/stats' },
  { key: 'profile', label: '我的', image: navProfileDog, icon: UserRound, to: '/profile' },
]
</script>

<template>
  <nav
    v-if="homeAppearance"
    class="home-bottom-nav fixed bottom-0 left-0 right-0 z-30"
    aria-label="底部导航"
  >
    <div class="home-nav-content">
      <template v-for="(item, index) in navItems" :key="item.key">
        <router-link
          :to="item.to"
          class="home-nav-item active:scale-95"
          :class="{ 'home-nav-active': active === item.key }"
          :aria-current="active === item.key ? 'page' : undefined"
        >
          <component :is="item.icon" :size="20" :stroke-width="1.5" aria-hidden="true" />
          <span>{{ item.homeLabel || item.label }}</span>
        </router-link>
        <router-link
          v-if="index === 1"
          to="/chat"
          class="home-compose active:scale-95"
          aria-label="打开 AI 记账"
        >
          <span class="home-plus" aria-hidden="true"><Plus :size="24" :stroke-width="1.5" /></span>
          <span>聊着记</span>
        </router-link>
      </template>
    </div>
  </nav>
  <nav
    v-else
    class="fixed bottom-0 left-0 right-0 z-30 bottom-wave h-28 border-t-[3px] border-hand bg-warning text-hand"
    aria-label="底部导航"
  >
    <div
      class="relative mx-auto flex h-full items-center justify-between max-w-2xl px-8 pt-5 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
    >
      <template v-for="(item, index) in navItems" :key="item.key">
        <router-link
          :to="item.to"
          class="relative flex w-16 flex-col items-center gap-0.5 text-xs font-semibold transition-all duration-200 active:scale-95"
          :class="active === item.key ? 'text-primary-700' : 'text-hand'"
          :aria-current="active === item.key ? 'page' : undefined"
        >
          <img :src="item.image" alt="" class="h-12 w-12 object-contain drop-shadow-[0_2px_0_rgba(31,41,55,0.12)]" />
          <span>{{ item.label }}</span>
          <span
            v-if="active === item.key"
            class="absolute -bottom-2 h-1.5 w-7 rounded-full bg-accent-400"
          />
        </router-link>

        <!-- 非首页导航本轮保留原外观。 -->
        <router-link
          v-if="index === 1"
          to="/chat"
          class="absolute left-1/2 flex -translate-x-1/2 items-center justify-center transition-all duration-200 active:scale-95 -top-10 h-24 w-24"
          aria-label="打开 AI 记账"
        >
          <img :src="plusGlow" alt="" class="pointer-events-none h-full w-full object-contain drop-shadow-md" />
        </router-link>
      </template>

      <img :src="pawPrints" alt="" class="pointer-events-none absolute bottom-1 left-1/2 h-6 w-9 -translate-x-1/2 object-contain opacity-30" />
    </div>
  </nav>
</template>

<style scoped>
.home-bottom-nav { height: calc(var(--zz-home-bottom-nav-height) + env(safe-area-inset-bottom, 0px)); border-top: 1px dashed var(--zz-home-line); background: var(--zz-home-bg); color: var(--zz-home-ink); font-family: var(--zz-home-font); font-weight: 400; pointer-events: none; }
.home-nav-content { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); align-items: center; max-width: var(--zz-home-content-width); height: 100%; margin-inline: auto; padding: 8px 16px calc(10px + env(safe-area-inset-bottom, 0px)); }
.home-nav-content > a { pointer-events: auto; }
.home-nav-item, .home-compose { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-width: 0; min-height: 44px; padding: 6px 3px; color: var(--zz-home-ink-soft); font-size: 12px; border-radius: 13px 10px 14px 11px; }
.home-nav-active { background: var(--zz-home-title-brush); color: var(--zz-home-ink); }
.home-compose { padding-block: 0; gap: 3px; color: var(--zz-home-ink); }
.home-plus { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid var(--zz-home-line); border-radius: 16px 13px 17px 14px; background: var(--zz-home-pink-soft); box-shadow: 0 2px 0 var(--zz-home-line); }
.home-nav-content > a:focus-visible { outline: 2px solid var(--zz-home-ink); outline-offset: 4px; border-radius: 8px; }
@media (max-width: 359px) {
  .home-nav-content { padding-inline: 12px; }
}
</style>
