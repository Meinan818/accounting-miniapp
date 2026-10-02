<script setup>
// 1. 导入
import navBillNotebook from '@/assets/design/nav-bill-notebook.png'
import navDetailPig from '@/assets/design/nav-detail-pig.png'
import navProfileDog from '@/assets/design/nav-profile-dog.png'
import navSavingJar from '@/assets/design/nav-saving-jar.png'
import pawPrints from '@/assets/design/paw-prints.png'
import plusGlow from '@/assets/design/plus-glow.png'
import bottomWave from '@/assets/design/navigation/bottom-wave.png'
import plusButton from '@/assets/design/navigation/plus-button.png'

// 2. Props
defineProps({
  active: {
    type: String,
    default: 'home',
  },
  homeAppearance: { type: Boolean, default: false },
})

const navItems = [
  { key: 'detail', label: '明细', image: navDetailPig, to: '/bills' },
  { key: 'bill', label: '账单', image: navBillNotebook, to: '/' },
  { key: 'saving', label: '攒钱', image: navSavingJar, to: '/stats' },
  { key: 'profile', label: '我的', image: navProfileDog, to: '/profile' },
]
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-30"
    :class="homeAppearance ? 'home-bottom-nav' : 'bottom-wave h-28 border-t-[3px] border-hand bg-warning text-hand'"
    aria-label="底部导航"
  >
    <div
      class="relative mx-auto flex h-full items-center justify-between"
      :class="homeAppearance ? 'home-nav-content' : 'max-w-2xl px-8 pt-5 pb-[max(0.4rem,env(safe-area-inset-bottom))]'"
    >
      <img v-if="homeAppearance" :src="bottomWave" alt="" class="home-nav-wave pointer-events-none absolute inset-0 h-full w-full" />
      <template v-for="(item, index) in navItems" :key="item.key">
        <router-link
          :to="item.to"
          class="relative flex w-16 flex-col items-center gap-0.5 text-xs font-semibold transition-all duration-200 active:scale-95"
          :class="[active === item.key ? 'text-primary-700' : 'text-hand', { 'home-nav-left': homeAppearance && item.key === 'bill', 'home-nav-right': homeAppearance && item.key === 'saving' }]"
          :aria-current="active === item.key ? 'page' : undefined"
        >
          <img :src="item.image" alt="" class="h-12 w-12 object-contain drop-shadow-[0_2px_0_rgba(31,41,55,0.12)]" />
          <span>{{ item.label }}</span>
          <span
            v-if="active === item.key"
            class="absolute -bottom-2 h-1.5 w-7 rounded-full bg-accent-400"
          />
        </router-link>

        <!-- 首页使用新素材，其他页面沿用旧按钮外观。 -->
        <router-link
          v-if="index === 1"
          to="/chat"
          class="absolute left-1/2 flex -translate-x-1/2 items-center justify-center transition-all duration-200 active:scale-95"
          :class="homeAppearance ? 'home-plus' : '-top-10 h-24 w-24'"
          aria-label="打开 AI 记账"
        >
          <img :src="homeAppearance ? plusButton : plusGlow" alt="" class="pointer-events-none h-full w-full object-contain" :class="{ 'drop-shadow-md': !homeAppearance }" />
        </router-link>
      </template>

      <img :src="pawPrints" alt="" class="pointer-events-none absolute bottom-1 left-1/2 h-6 w-9 -translate-x-1/2 object-contain opacity-30" />
    </div>
  </nav>
</template>

<style scoped>
.home-bottom-nav { height: calc(var(--zz-home-bottom-nav-height) + env(safe-area-inset-bottom, 0px)); color: var(--zz-home-ink); pointer-events: none; }
.home-nav-content { max-width: var(--zz-home-content-width); padding: 28px 18px 14px; padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px)); }
.home-nav-content > a { pointer-events: auto; }
.home-nav-left { margin-right: 40px; }
.home-nav-right { margin-left: 40px; }
.home-plus { top: -37px; height: 104px; width: 118px; }
.home-nav-content > a:focus-visible { outline: 2px solid var(--zz-home-ink); outline-offset: 4px; border-radius: 8px; }
@media (max-width: 359px) {
  .home-nav-content { padding-left: 8px; padding-right: 8px; }
  .home-nav-left { margin-right: 30px; }
  .home-nav-right { margin-left: 30px; }
  .home-plus { width: 104px; }
}
</style>
