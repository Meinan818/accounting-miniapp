<script setup>
import { BarChart3, CircleUserRound, PlusCircle, WalletCards } from 'lucide-vue-next'
</script>

<template>
  <main class="min-h-screen bg-gray-50 p-6">
    <section class="mx-auto max-w-2xl">
      <div class="mb-6 flex items-center gap-3">
        <div class="rounded-xl bg-primary-100 p-3 text-primary-600">
          <WalletCards :size="28" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-900">智账 - 首页</h1>
          <p class="text-gray-600">首页开发中...</p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <router-link class="rounded-xl bg-white p-5 shadow-md transition-shadow hover:shadow-lg" to="/add">
          <PlusCircle class="mb-3 text-primary-500" :size="28" />
          <p class="font-semibold text-gray-900">记一笔</p>
        </router-link>
        <router-link class="rounded-xl bg-white p-5 shadow-md transition-shadow hover:shadow-lg" to="/stats">
          <BarChart3 class="mb-3 text-accent-500" :size="28" />
          <p class="font-semibold text-gray-900">查看统计</p>
        </router-link>
        <router-link class="rounded-xl bg-white p-5 shadow-md transition-shadow hover:shadow-lg" to="/profile">
          <CircleUserRound class="mb-3 text-income-dark" :size="28" />
          <p class="font-semibold text-gray-900">个人中心</p>
        </router-link>
      </div>
    </section>
  </main>
</template>
