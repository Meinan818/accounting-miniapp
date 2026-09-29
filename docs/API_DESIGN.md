# API 接口设计文档

## 概述

本项目使用 **Supabase** 提供的自动生成 RESTful API，通过 `@supabase/supabase-js` 客户端进行调用。

## 基础配置

### 初始化客户端

```javascript
// api/index.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 认证 API

### 1. 微信登录

```javascript
// api/auth.js

/**
 * 微信小程序登录
 * @returns {Promise<Object>} 用户信息
 */
export async function loginWithWechat() {
  const { code } = await uni.login({ provider: 'weixin' })
  
  // 调用云函数或后端接口交换 session_key
  // 然后使用 Supabase Auth
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'wechat',
    token: code
  })
  
  if (error) throw error
  
  // 创建或更新用户信息
  await createOrUpdateUser(data.user)
  
  return data.user
}

/**
 * 退出登录
 */
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}
```

---

## 用户 API

```javascript
// api/user.js

/**
 * 创建或更新用户信息
 * @param {Object} authUser - Supabase Auth 用户对象
 */
export async function createOrUpdateUser(authUser) {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      auth_id: authUser.id,
      nickname: authUser.user_metadata?.nickname || '用户',
      avatar_url: authUser.user_metadata?.avatar_url || ''
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 获取用户信息
 * @param {string} authId - Auth ID
 */
export async function getUserByAuthId(authId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * 更新用户信息
 * @param {string} userId - 用户ID
 * @param {Object} updates - 更新字段
 */
export async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}
```

---

## 分类 API

```javascript
// api/category.js

/**
 * 获取所有分类（系统 + 用户自定义）
 * @param {string} type - 类型: 'income' | 'expense' | 'all'
 */
export async function getCategories(type = 'all') {
  let query = supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  
  if (type !== 'all') {
    query = query.eq('type', type)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * 创建自定义分类
 * @param {Object} category - 分类信息
 */
export async function createCategory(category) {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: category.user_id,
      name: category.name,
      type: category.type,
      icon: category.icon || 'icon-qita',
      color: category.color || '#1989fa',
      is_system: false
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 更新分类
 * @param {string} categoryId - 分类ID
 * @param {Object} updates - 更新字段
 */
export async function updateCategory(categoryId, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 删除自定义分类
 * @param {string} categoryId - 分类ID
 */
export async function deleteCategory(categoryId) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
  
  if (error) throw error
}
```

---

## 账单记录 API

```javascript
// api/record.js

/**
 * 获取账单列表
 * @param {Object} params - 查询参数
 * @param {string} params.userId - 用户ID
 * @param {string} params.month - 月份 (YYYY-MM)
 * @param {string} params.type - 类型: 'income' | 'expense'
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 */
export async function getRecords({ userId, month, type, page = 1, pageSize = 20 }) {
  let query = supabase
    .from('records')
    .select(`
      *,
      category:categories(id, name, icon, color)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('time', { ascending: false })
  
  // 按月筛选
  if (month) {
    const startDate = `${month}-01`
    const endDate = `${month}-31`
    query = query.gte('date', startDate).lte('date', endDate)
  }
  
  // 按类型筛选
  if (type) {
    query = query.eq('type', type)
  }
  
  // 分页
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  if (error) throw error
  
  return {
    records: data,
    total: count,
    page,
    pageSize
  }
}

/**
 * 获取单条账单
 * @param {string} recordId - 账单ID
 */
export async function getRecordById(recordId) {
  const { data, error } = await supabase
    .from('records')
    .select(`
      *,
      category:categories(id, name, icon, color)
    `)
    .eq('id', recordId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * 创建账单
 * @param {Object} record - 账单信息
 */
export async function createRecord(record) {
  const { data, error } = await supabase
    .from('records')
    .insert({
      user_id: record.user_id,
      category_id: record.category_id,
      type: record.type,
      amount: record.amount,
      date: record.date || new Date().toISOString().split('T')[0],
      time: record.time || new Date().toTimeString().split(' ')[0],
      remark: record.remark || null,
      image_url: record.image_url || null
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 更新账单
 * @param {string} recordId - 账单ID
 * @param {Object} updates - 更新字段
 */
export async function updateRecord(recordId, updates) {
  const { data, error } = await supabase
    .from('records')
    .update(updates)
    .eq('id', recordId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 删除账单
 * @param {string} recordId - 账单ID
 */
export async function deleteRecord(recordId) {
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', recordId)
  
  if (error) throw error
}

/**
 * 批量删除账单
 * @param {string[]} recordIds - 账单ID数组
 */
export async function deleteRecords(recordIds) {
  const { error } = await supabase
    .from('records')
    .delete()
    .in('id', recordIds)
  
  if (error) throw error
}
```

---

## 统计 API

```javascript
// api/stats.js

/**
 * 获取月度收支统计
 * @param {string} userId - 用户ID
 * @param {string} month - 月份 (YYYY-MM)
 */
export async function getMonthlyStats(userId, month) {
  const startDate = `${month}-01`
  const endDate = `${month}-31`
  
  const { data, error } = await supabase
    .from('records')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
  
  if (error) throw error
  
  const income = data
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)
  
  const expense = data
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)
  
  return {
    income,
    expense,
    balance: income - expense
  }
}

/**
 * 按分类统计支出
 * @param {string} userId - 用户ID
 * @param {string} month - 月份 (YYYY-MM)
 */
export async function getCategoryStats(userId, month) {
  const startDate = `${month}-01`
  const endDate = `${month}-31`
  
  const { data, error } = await supabase
    .from('records')
    .select(`
      amount,
      category:categories(id, name, icon, color)
    `)
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lte('date', endDate)
  
  if (error) throw error
  
  // 按分类聚合
  const categoryMap = {}
  data.forEach(record => {
    const categoryId = record.category?.id || 'unknown'
    if (!categoryMap[categoryId]) {
      categoryMap[categoryId] = {
        category: record.category || { name: '未分类', color: '#999' },
        total: 0
      }
    }
    categoryMap[categoryId].total += parseFloat(record.amount)
  })
  
  return Object.values(categoryMap)
    .sort((a, b) => b.total - a.total)
}

/**
 * 获取日均支出
 * @param {string} userId - 用户ID
 * @param {string} month - 月份 (YYYY-MM)
 */
export async function getDailyAverage(userId, month) {
  const { expense } = await getMonthlyStats(userId, month)
  const daysInMonth = new Date(month.split('-')[0], month.split('-')[1], 0).getDate()
  return (expense / daysInMonth).toFixed(2)
}
```

---

## 预算 API

```javascript
// api/budget.js

/**
 * 获取月度预算
 * @param {string} userId - 用户ID
 * @param {string} month - 月份 (YYYY-MM)
 */
export async function getBudgets(userId, month) {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      category:categories(id, name, icon, color)
    `)
    .eq('user_id', userId)
    .eq('month', month)
  
  if (error) throw error
  return data
}

/**
 * 设置预算
 * @param {Object} budget - 预算信息
 */
export async function setBudget(budget) {
  const { data, error } = await supabase
    .from('budgets')
    .upsert({
      user_id: budget.user_id,
      month: budget.month,
      amount: budget.amount,
      category_id: budget.category_id || null
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 删除预算
 * @param {string} budgetId - 预算ID
 */
export async function deleteBudget(budgetId) {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
  
  if (error) throw error
}
```

---

## 文件上传 API

```javascript
// api/upload.js

/**
 * 上传票据图片
 * @param {File} file - 图片文件
 * @param {string} userId - 用户ID
 */
export async function uploadReceipt(file, userId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  // 获取公开URL
  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName)
  
  return publicUrl
}

/**
 * 删除票据图片
 * @param {string} imageUrl - 图片URL
 */
export async function deleteReceipt(imageUrl) {
  // 从URL提取文件路径
  const fileName = imageUrl.split('/receipts/')[1]
  
  const { error } = await supabase.storage
    .from('receipts')
    .remove([fileName])
  
  if (error) throw error
}
```

---

## 错误处理

### 统一错误处理函数

```javascript
// api/errorHandler.js

export function handleApiError(error) {
  console.error('API Error:', error)
  
  let message = '操作失败，请稍后重试'
  
  if (error.message.includes('JWT')) {
    message = '登录已过期，请重新登录'
    // 触发重新登录
  } else if (error.message.includes('violates row-level security')) {
    message = '无权限访问该数据'
  } else if (error.message.includes('duplicate key')) {
    message = '数据已存在'
  }
  
  uni.showToast({
    title: message,
    icon: 'none'
  })
  
  throw error
}
```

### 使用示例

```javascript
try {
  const records = await getRecords({ userId, month })
  // 处理数据
} catch (error) {
  handleApiError(error)
}
```

---

## 性能优化建议

1. **请求去重**: 使用 Vue 的 `computed` 或缓存避免重复请求
2. **分页加载**: 列表数据使用分页，避免一次加载过多
3. **选择性字段**: 使用 `.select()` 只查询需要的字段
4. **本地缓存**: 分类等静态数据缓存到本地
5. **批量操作**: 使用 `.upsert()` 或 `.delete().in()` 进行批量操作

---

**最后更新**: 2026-09-29
