<script setup>
// 1. 导入
import { computed } from 'vue'
import miaoAvatar from '@/assets/design/mascot/miao-avatar.png'

// 2. Props
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  catAppearance: { type: Boolean, default: false },
})

// 3. 计算属性
const isUser = computed(() => props.message.role === 'user')
const displayContent = computed(() => {
  if (props.catAppearance && props.message.id === 'welcome-message' && !isUser.value) {
    return '喵～我是喵子。说说今天买了什么，我帮你整理成账单，核对后再记下。'
  }

  if (props.catAppearance && !isUser.value && typeof props.message.content === 'string') {
    // Only adapt the displayed old mascot; do not rewrite saved messages or user input.
    return props.message.content.replaceAll('🐣', '')
  }

  return props.message.content
})
</script>

<template>
  <div class="message-enter flex items-start gap-2" :class="[isUser ? 'justify-end' : 'justify-start', { 'miao-bubble': catAppearance, 'miao-bubble-user': catAppearance && isUser }]">
    <div
      v-if="!isUser"
      class="chat-assistant-avatar flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-hand/10 bg-primary-100 text-xl"
      :aria-label="catAppearance ? '喵子头像' : '小账头像'"
    >
      <img v-if="catAppearance" :src="miaoAvatar" alt="" class="h-full w-full object-contain" />
      <template v-else>🐣</template>
    </div>

    <div
      class="chat-bubble-body max-w-[78%] px-4 py-3 text-base leading-relaxed"
      :class="isUser
        ? 'rounded-2xl rounded-tr-sm bg-primary-400 text-white shadow-sm'
        : 'rounded-2xl rounded-tl-sm border border-gray-200 bg-white text-gray-900 shadow-sm'"
    >
      <p class="whitespace-pre-wrap break-words">{{ displayContent }}</p>
    </div>

    <div
      v-if="isUser && !catAppearance"
      class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-hand/10 bg-gray-200 text-xl"
      aria-label="用户头像"
    >
      👤
    </div>
  </div>
</template>
