<script setup>
// 视觉交叠期间，旧页不能接收点击、Tab 焦点或屏幕阅读器操作。
function lockLeavingPage(element) {
  element.inert = true
}
function unlockLeavingPage(element) {
  element.inert = false
}
</script>

<template>
  <div class="app-shell min-h-screen">
    <router-view v-slot="{ Component, route }">
      <!-- 新页立即接上旧页；不再先淡出成空背景。 -->
      <transition name="page" @before-leave="lockLeavingPage" @leave-cancelled="unlockLeavingPage">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>
