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

> 认证方式：**邮箱 + 密码**（Supabase Auth）。
> 旧的"微信登录"方案属于作废的微信小程序路线，已移除；不要再按它实现。

### 1. 邮箱注册

```javascript
// api/auth.js

/**
 * 邮箱注册
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} 用户信息
 */
export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname: '用户' } }
  })

  if (error) throw error

  // 同步到业务用户表 users
  if (data.user) await createOrUpdateUser(data.user)

  return data.user
}
```

### 2. 邮箱登录

```javascript
/**
 * 邮箱登录
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} 用户信息
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) throw error

  return data.user
}
```

> 注意：Supabase 默认要求邮箱验证。若演示阶段想跳过，去 Dashboard → Authentication → Providers → Email 里关掉 "Confirm email"。

### 3. 退出登录与获取当前用户

```javascript
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
  
  // 提示用户
  // ⚠️ 旧的 uni.showToast 是小程序 API，Web 版不可用。
  // Web 版用项目自己的 toast 工具（待实现，建议放 @/utils/toast.js，导出 showToast）
  showToast(message)

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

## Claude AI 对话 API

> **核心功能**：智账是对话式 AI 记账应用，用户通过自然语言和 AI 对话来记账和查询。

### 1. Claude API 配置

```javascript
// api/claude.js

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

/**
 * 调用 Claude API
 * @param {Array} messages - 对话历史 [{ role: 'user'|'assistant', content: string }]
 * @param {Object} systemContext - 系统上下文（用户数据、分类列表等）
 */
export async function callClaude(messages, systemContext) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: buildSystemPrompt(systemContext),
      messages: messages,
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API 错误: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content[0].text
}
```

### 2. 系统提示词设计

```javascript
/**
 * 构建系统提示词
 * @param {Object} context - 用户上下文
 */
function buildSystemPrompt(context) {
  const { monthlyStats, categories, recentRecords } = context

  return `你是「智账」记账应用的 AI 助手，名字叫「小账」🐣。你的任务是：

## 核心能力
1. **理解用户的记账意图**：从自然语言中提取金额、分类、时间、备注
2. **回答查询问题**：根据用户账单数据计算并回答
3. **友好聊天**：语气可爱、简洁、像朋友

## 可用的分类（${categories.length} 个）
支出分类：${categories.filter(c => c.type === 'expense').map(c => `${c.name} ${c.icon || ''}`).join('、')}
收入分类：${categories.filter(c => c.type === 'income').map(c => `${c.name} ${c.icon || ''}`).join('、')}

## 当前用户数据
- 本月总支出：¥${monthlyStats.expense.toFixed(2)}
- 本月总收入：¥${monthlyStats.income.toFixed(2)}
- 本月结余：¥${monthlyStats.balance.toFixed(2)}

## 最近 5 条账单
${recentRecords.map(r => `- ${r.date} ${r.category?.name} ${r.type === 'expense' ? '-' : '+'}¥${r.amount} ${r.remark || ''}`).join('\n')}

## 响应格式
你必须返回 **严格的 JSON 格式**，不要有任何其他文字。格式如下：

### 记账类型
{
  "type": "record",
  "intent": "add_expense" | "add_income",
  "data": {
    "amount": 数字,
    "category": "分类名称（必须从上面列表选）",
    "date": "YYYY-MM-DD（今天/昨天/具体日期）",
    "time": "HH:MM:SS（默认当前时间）",
    "remark": "用户提到的备注"
  },
  "reply": "你的回复文字，比如：好的，已帮你记录：餐饮支出 ¥35，需要修改吗？"
}

### 查询类型
{
  "type": "query",
  "intent": "query_monthly" | "query_category" | "query_recent",
  "reply": "根据上面的用户数据回答，比如：本月支出 ¥1234，餐饮占 40%"
}

### 闲聊类型
{
  "type": "chat",
  "reply": "友好的回复，比如：你好呀！需要记账吗？"
}

## 示例

用户："今天中午在麦当劳吃了个套餐，花了 35 块"
你的响应：
{
  "type": "record",
  "intent": "add_expense",
  "data": {
    "amount": 35,
    "category": "餐饮",
    "date": "2026-09-29",
    "time": "12:30:00",
    "remark": "麦当劳套餐"
  },
  "reply": "好的，已帮你记录：餐饮支出 ¥35.00，备注'麦当劳套餐'，需要修改吗？"
}

用户："我这个月餐饮花了多少？"
你的响应：
{
  "type": "query",
  "intent": "query_category",
  "reply": "让我算算...本月餐饮支出 ¥520，占总支出的 42%，比上月多了 ¥80 哦~"
}

用户："你好"
你的响应：
{
  "type": "chat",
  "reply": "你好呀！今天花钱了吗？需要记一笔吗？"
}

## 注意事项
- 时间理解："今天"用当前日期，"昨天"减 1 天，"上周"需要追问具体日期
- 分类匹配：尽量从可用分类中选，找不到用"其他"
- 金额单位：统一用元（¥），不要有"块""元"字
- 回复语气：可爱、简洁、不超过 50 字
- **必须返回纯 JSON**，不要有 \`\`\`json 或其他包装
`
}
```

### 3. 前端调用示例

```javascript
// 在对话界面使用

import { callClaude } from '@/api/claude'
import { getMonthlyStats, getRecords } from '@/api/stats'
import { getCategories } from '@/api/category'

// 用户发送消息
async function sendMessage(userInput) {
  // 1. 准备上下文数据
  const monthlyStats = await getMonthlyStats(userId, currentMonth)
  const recentRecords = await getRecords({ userId, page: 1, pageSize: 5 })
  const categories = await getCategories()

  const systemContext = {
    monthlyStats,
    categories,
    recentRecords: recentRecords.records,
  }

  // 2. 构建对话历史（保留最近 10 条）
  const messages = [
    ...conversationHistory.slice(-10),
    { role: 'user', content: userInput },
  ]

  // 3. 调用 Claude API
  const aiResponse = await callClaude(messages, systemContext)

  // 4. 解析 JSON 响应
  let parsedResponse
  try {
    parsedResponse = JSON.parse(aiResponse)
  } catch (error) {
    console.error('AI 响应解析失败:', aiResponse)
    parsedResponse = {
      type: 'chat',
      reply: '抱歉，我没理解，能再说一遍吗？',
    }
  }

  // 5. 根据类型处理
  if (parsedResponse.type === 'record') {
    // 展示确认卡片，等用户点"确认记账"后调用 createRecord
    showConfirmCard(parsedResponse.data, parsedResponse.reply)
  } else if (parsedResponse.type === 'query' || parsedResponse.type === 'chat') {
    // 直接显示回复
    addAIMessage(parsedResponse.reply)
  }

  // 6. 更新对话历史
  conversationHistory.push(
    { role: 'user', content: userInput },
    { role: 'assistant', content: parsedResponse.reply }
  )
}
```

### 4. 错误处理

```javascript
// api/claude.js

export async function callClaudeWithRetry(messages, systemContext, retries = 2) {
  try {
    return await callClaude(messages, systemContext)
  } catch (error) {
    if (retries > 0 && error.message.includes('rate_limit')) {
      // 遇到速率限制，等待后重试
      await new Promise(resolve => setTimeout(resolve, 2000))
      return callClaudeWithRetry(messages, systemContext, retries - 1)
    }
    
    // 其他错误，返回友好的兜底响应
    console.error('Claude API 调用失败:', error)
    return JSON.stringify({
      type: 'chat',
      reply: '抱歉，我现在有点累了，稍后再试试吧~',
    })
  }
}
```

### 5. 成本控制建议

- **缓存分类和统计数据**：避免每次对话都重新获取
- **限制对话历史**：只保留最近 10 条，减少 token 消耗
- **客户端节流**：用户输入间隔 < 1 秒不触发 API 调用
- **本地意图识别**：简单的"你好""谢谢"等直接本地回复，不调 API

---

**最后更新**: 2026-09-29
