<script setup>
// 1. 导入
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

// 2. 组合式函数
const userStore = useUserStore()

// 3. 生命周期
onMounted(() => {
  userStore.loadSession()
})
</script>

<template>
  <div id="app" class="min-h-screen">
    <router-view />
  </div>
</template>
