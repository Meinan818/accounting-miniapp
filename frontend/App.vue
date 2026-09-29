<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    // 检查登录状态
    this.checkLoginStatus()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    checkLoginStatus() {
      // 检查本地是否有登录信息
      const token = uni.getStorageSync('token')
      if (!token) {
        console.log('未登录，需要引导用户登录')
      }
    }
  }
}
</script>

<style lang="scss">
/* 引入全局样式 */
@import "@/uni.scss";

/* 全局样式 */
page {
  background-color: #f7f8fa;
  font-size: 28rpx;
  color: #323233;
}

/* 通用类 */
.container {
  padding: 30rpx;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.flex {
  display: flex;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-primary {
  color: #323233;
}

.text-secondary {
  color: #646566;
}

.text-disabled {
  color: #c8c9cc;
}

.text-income {
  color: #07c160;
}

.text-expense {
  color: #ee0a24;
}

/* 按钮样式 */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 40rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  transition: all 0.15s;
}

.btn-primary {
  background: #1989fa;
  color: #ffffff;
}

.btn-primary:active {
  opacity: 0.8;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  color: #969799;
  font-size: 28rpx;
}
</style>
