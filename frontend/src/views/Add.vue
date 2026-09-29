<script setup>
import { ArrowLeft, PlusCircle } from 'lucide-vue-next'
</script>

<template>
  <main class="min-h-screen bg-gray-50 p-6">
    <section class="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-md">
      <router-link class="mb-6 inline-flex items-center gap-2 text-sm text-primary-600" to="/">
        <ArrowLeft :size="18" />
        返回首页
      </router-link>
      <PlusCircle class="mb-3 text-primary-500" :size="32" />
      <h1 class="mb-2 text-3xl font-bold text-gray-900">记一笔</h1>
      <p class="text-gray-600">记账页面开发中...</p>
    </section>
  </main>
</template>
