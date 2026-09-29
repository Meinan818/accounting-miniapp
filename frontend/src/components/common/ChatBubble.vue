<script setup>
// 1. 导入
import { computed } from 'vue'

// 2. Props
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})

// 3. 计算属性
const isUser = computed(() => props.message.role === 'user')
</script>

<template>
  <div class="message-enter flex items-start gap-2" :class="isUser ? 'justify-end' : 'justify-start'">
    <div
      v-if="!isUser"
      class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-hand/10 bg-primary-100 text-xl"
      aria-label="小账头像"
    >
      🐣
    </div>

    <div
      class="max-w-[78%] px-4 py-3 text-base leading-relaxed"
      :class="isUser
        ? 'rounded-2xl rounded-tr-sm bg-primary-400 text-white shadow-sm'
        : 'rounded-2xl rounded-tl-sm border border-gray-200 bg-white text-gray-900 shadow-sm'"
    >
      <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
    </div>

    <div
      v-if="isUser"
      class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-hand/10 bg-gray-200 text-xl"
      aria-label="用户头像"
    >
      👤
    </div>
  </div>
</template>
