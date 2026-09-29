<template>
  <view class="container">
    <view class="header">
      <view class="month-selector">
        <text>{{ currentMonth }}</text>
      </view>
      <view class="stats-card">
        <view class="stats-item">
          <text class="stats-label">收入</text>
          <text class="stats-value income">{{ income }}</text>
        </view>
        <view class="stats-item">
          <text class="stats-label">支出</text>
          <text class="stats-value expense">{{ expense }}</text>
        </view>
        <view class="stats-item">
          <text class="stats-label">结余</text>
          <text class="stats-value">{{ balance }}</text>
        </view>
      </view>
    </view>

    <view class="record-list">
      <view v-if="records.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无记账记录</text>
        <text class="empty-tip">点击下方按钮开始记账</text>
      </view>

      <view v-for="(group, date) in groupedRecords" :key="date" class="date-group">
        <view class="date-header">
          <text>{{ date }}</text>
        </view>
        <view
          v-for="record in group"
          :key="record.id"
          class="record-item"
          @click="handleRecordClick(record)"
        >
          <view class="record-icon" :style="{ background: record.category?.color }">
            {{ record.category?.icon || '📝' }}
          </view>
          <view class="record-info">
            <text class="category-name">{{ record.category?.name || '未分类' }}</text>
            <text class="record-remark">{{ record.remark || '无备注' }}</text>
          </view>
          <text class="record-amount" :class="record.type">
            {{ record.type === 'expense' ? '-' : '+' }}{{ record.amount }}
          </text>
        </view>
      </view>
    </view>

    <!-- 记账按钮 -->
    <view class="add-btn" @click="navigateToAdd">
      <text class="add-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getRecords } from '@/api/record'
import { getCurrentMonth } from '@/utils/date'

const currentMonth = ref(getCurrentMonth())
const records = ref([])
const loading = ref(false)

const income = computed(() => {
  return records.value
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + Number(r.amount), 0)
    .toFixed(2)
})

const expense = computed(() => {
  return records.value
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount), 0)
    .toFixed(2)
})

const balance = computed(() => {
  return (Number(income.value) - Number(expense.value)).toFixed(2)
})

// 按日期分组
const groupedRecords = computed(() => {
  const groups = {}
  records.value.forEach(record => {
    const date = record.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(record)
  })
  return groups
})

async function fetchRecords() {
  loading.value = true
  try {
    // TODO: 替换为真实的 userId
    const userId = 'test-user-id'
    const result = await getRecords({
      userId,
      month: currentMonth.value
    })
    records.value = result.records
  } catch (error) {
    console.error('获取账单失败:', error)
  } finally {
    loading.value = false
  }
}

function navigateToAdd() {
  uni.navigateTo({
    url: '/pages/add/add'
  })
}

function handleRecordClick(record) {
  console.log('点击账单:', record)
  // TODO: 跳转到详情页或编辑页
}

onMounted(() => {
  // fetchRecords() // 暂时注释，等配置好 Supabase 后启用
  console.log('首页加载完成')
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 150rpx;
}

.header {
  background: #ffffff;
  padding: 30rpx;
}

.month-selector {
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 30rpx;
}

.stats-card {
  display: flex;
  justify-content: space-around;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-label {
  font-size: 24rpx;
  color: #969799;
  margin-bottom: 10rpx;
}

.stats-value {
  font-size: 36rpx;
  font-weight: 600;

  &.income {
    color: #07c160;
  }

  &.expense {
    color: #ee0a24;
  }
}

.record-list {
  padding: 20rpx 30rpx;
}

.date-group {
  margin-bottom: 30rpx;
}

.date-header {
  font-size: 24rpx;
  color: #969799;
  margin-bottom: 20rpx;
}

.record-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.record-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
}

.record-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.category-name {
  font-size: 28rpx;
  color: #323233;
  margin-bottom: 8rpx;
}

.record-remark {
  font-size: 24rpx;
  color: #969799;
}

.record-amount {
  font-size: 32rpx;
  font-weight: 600;

  &.income {
    color: #07c160;
  }

  &.expense {
    color: #ee0a24;
  }
}

.empty-state {
  padding: 150rpx 0;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  display: block;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #969799;
  display: block;
  margin-bottom: 10rpx;
}

.empty-tip {
  font-size: 24rpx;
  color: #c8c9cc;
  display: block;
}

.add-btn {
  position: fixed;
  bottom: 100rpx;
  right: 50rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #1989fa, #0e7ce2);
  box-shadow: 0 8rpx 16rpx rgba(25, 137, 250, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.add-icon {
  color: #ffffff;
  font-size: 64rpx;
  font-weight: 300;
}
</style>
