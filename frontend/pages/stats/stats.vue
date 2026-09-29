<template>
  <view class="container">
    <view class="page-title">统计</view>
    <view class="tip-text">功能开发中，敬请期待...</view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
  console.log('统计页面加载')
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
}

.page-title {
  font-size: 48rpx;
  font-weight: 600;
  color: #323233;
  margin-bottom: 20rpx;
}

.tip-text {
  font-size: 28rpx;
  color: #969799;
}
</style>
