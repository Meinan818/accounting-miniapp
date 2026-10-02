<script setup>
import { WalletCards } from 'lucide-vue-next'
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-500 to-accent-500 p-6">
    <section class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
      <div class="mb-6 flex justify-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
          <WalletCards :size="32" />
        </div>
      </div>
      <h1 class="mb-2 text-center text-3xl font-bold text-gray-900">喵叽智账</h1>
      <p class="mb-8 text-center text-gray-600">让记账变得优雅又有趣</p>

      <div class="rounded-xl bg-primary-50 p-6 text-center text-primary-700">
        登录页面开发中...
      </div>

      <router-link
        to="/"
        class="mt-6 block rounded-lg bg-primary-500 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-primary-600"
      >
        进入首页
      </router-link>
    </section>
  </main>
</template>
