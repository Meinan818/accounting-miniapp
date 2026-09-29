# AI 协同开发规则文档

本文档为 Claude、Codex 及其他 AI 工具提供项目上下文和开发规范，确保协同开发的一致性。

## 项目概述

**项目名称**: 个人记账小程序  
**技术栈**: uni-app (Vue 3) + Supabase (PostgreSQL)  
**目标**: 开发一个功能完整、UI 美观、适合简历展示的微信小程序  
**预算约束**: 零预算（使用 Supabase 免费额度）

## 技术架构

### 前端（uni-app）
- **框架**: uni-app 基于 Vue 3 + Vite
- **UI 库**: uView UI（选用理由：组件丰富、文档完善、适合小程序）
- **图表**: uCharts（轻量、跨平台兼容性好）
- **状态管理**: Pinia（Vue 3 官方推荐）
- **HTTP 客户端**: @supabase/supabase-js

### 后端（Supabase）
- **数据库**: PostgreSQL（关系型，适合记账场景）
- **认证**: Supabase Auth（支持微信登录）
- **存储**: Supabase Storage（存储票据照片）
- **API**: 自动生成的 RESTful API + PostgREST
- **实时**: Supabase Realtime（可选功能）

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 前端框架 | uni-app | 跨平台能力，可扩展到支付宝小程序/H5 |
| 数据库 | PostgreSQL | 关系型适合财务数据，支持复杂查询 |
| 后端方案 | Supabase BaaS | 免费，无需服务器，快速开发 |
| UI 组件库 | uView UI | 文档完善，适合新手，组件美观 |
| 图表库 | uCharts | 小程序兼容性好，包体积小 |

## 数据库设计原则

### 表结构设计
1. **用户表** (`users`): 存储用户基本信息
2. **账单记录表** (`records`): 核心表，存储收支记录
3. **分类表** (`categories`): 收支分类（预设 + 自定义）
4. **预算表** (`budgets`): 月度预算设置
5. **账本表** (`accounts`): 支持多账本（可选功能）

### 命名规范
- 表名：小写复数形式（`records`, `categories`）
- 字段名：蛇形命名（`user_id`, `created_at`）
- 外键：`表名_id`（如 `user_id`, `category_id`）
- 时间戳：使用 `created_at`, `updated_at`

### 安全策略
- **启用 RLS**（Row Level Security）：每个表都必须配置
- **用户隔离**：用户只能访问自己的数据
- **API Key**: 仅使用 anon key，不暴露 service_role key

## 前端开发规范

### 目录结构约定
```
frontend/
├── pages/              # 页面（每个页面一个文件夹）
│   ├── index/         # 首页（账单列表）
│   ├── add/           # 记账页面
│   ├── stats/         # 统计页面
│   └── mine/          # 我的页面
├── components/         # 公共组件
│   ├── CategoryPicker/ # 分类选择器
│   ├── DatePicker/     # 日期选择器
│   └── Chart/          # 图表组件
├── api/               # API 封装
│   ├── index.js       # Supabase 客户端初始化
│   ├── record.js      # 账单 CRUD
│   └── category.js    # 分类 CRUD
├── utils/             # 工具函数
│   ├── date.js        # 日期处理
│   └── format.js      # 格式化（金额、数字）
└── static/            # 静态资源
    ├── images/        # 图片
    └── icons/         # 图标
```

### 代码规范

#### 命名约定
- **组件名**: PascalCase（`CategoryPicker.vue`）
- **文件名**: kebab-case（`date-picker.vue`）
- **变量/函数**: camelCase（`getTotalAmount`, `userInfo`）
- **常量**: UPPER_SNAKE_CASE（`API_BASE_URL`, `MAX_AMOUNT`）

#### Vue 组件规范
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
// 1. 导入语句
import { ref, computed } from 'vue'
import { useStore } from '@/store'

// 2. Props 定义
const props = defineProps({
  // ...
})

// 3. Emits 定义
const emit = defineEmits(['update', 'close'])

// 4. 响应式数据
const count = ref(0)

// 5. 计算属性
const doubleCount = computed(() => count.value * 2)

// 6. 方法
const handleClick = () => {
  // ...
}

// 7. 生命周期
onMounted(() => {
  // ...
})
</script>

<style lang="scss" scoped>
/* 样式 */
</style>
```

#### API 调用规范
```javascript
// api/record.js
import { supabase } from './index'

/**
 * 获取账单列表
 * @param {string} userId - 用户ID
 * @param {string} month - 月份 (YYYY-MM)
 * @returns {Promise<Array>}
 */
export async function getRecords(userId, month) {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('user_id', userId)
    .gte('date', `${month}-01`)
    .lte('date', `${month}-31`)
    .order('date', { ascending: false })
  
  if (error) throw error
  return data
}
```

### UI/UX 设计原则

1. **色彩方案**
   - 主色：`#1989fa`（蓝色，代表信任）
   - 收入色：`#07c160`（绿色）
   - 支出色：`#ee0a24`（红色）
   - 背景色：`#f7f8fa`（浅灰）

2. **交互原则**
   - 快速记账：首页点击「+」直接进入记账页
   - 手势操作：左滑删除、下拉刷新
   - 即时反馈：操作后立即更新 UI，显示 Toast
   - 二次确认：删除操作需弹窗确认

3. **性能优化**
   - 列表懒加载：按月分页加载
   - 图片懒加载：票据图片延迟加载
   - 缓存策略：分类数据本地缓存

## 开发流程

### 功能开发流程
1. **需求澄清**: 阅读 `PROJECT_PLAN.md` 确认当前任务
2. **设计检查**: 查看 `docs/` 中的设计文档
3. **编码实现**: 按照本文档规范编写代码
4. **自测**: 在微信开发者工具中测试
5. **文档更新**: 更新相关文档（如 API_DESIGN.md）
6. **提交代码**: 使用语义化提交信息

### Git 提交规范
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具配置

**示例**:
```
feat(record): 添加账单删除功能

- 实现左滑删除交互
- 添加删除确认弹窗
- 同步删除 Supabase 数据

Closes #12
```

## AI 协作指引

### 给 Claude 的指引

1. **读取上下文**: 开始工作前先读取以下文件
   - `CLAUDE.md`（本文档）
   - `PROJECT_PLAN.md`（当前进度）
   - `docs/DATABASE_DESIGN.md`（数据库结构）
   - 相关页面的现有代码

2. **代码生成原则**
   - 优先使用 uni-app API（而非浏览器 API）
   - 使用 Vue 3 Composition API（`<script setup>`）
   - 所有 API 调用必须有错误处理
   - 添加必要的中文注释

3. **文件操作规范**
   - 创建新文件：先说明文件作用，再生成代码
   - 修改文件：说明修改原因和影响范围
   - 删除代码：保留必要的注释说明

4. **响应格式**
   - 先总结要做什么
   - 再展示代码/配置
   - 最后说明如何测试

### 给 Codex 的指引

1. **上下文窗口**: 工作前确保加载了 `CLAUDE.md` 和相关设计文档
2. **代码风格**: 遵循本文档的命名和组织规范
3. **依赖管理**: 使用 `package.json` 中已有的依赖，避免引入新依赖
4. **测试建议**: 生成代码后提供测试步骤

## 常见问题处理

### Supabase 相关

**Q: RLS 策略导致查询失败？**  
A: 检查 `supabase/rls_policies.sql` 是否正确配置，确保策略中使用 `auth.uid()` 匹配当前用户。

**Q: 图片上传失败？**  
A: 检查 Storage Bucket 是否公开，RLS 策略是否允许当前用户上传。

### uni-app 相关

**Q: API 在小程序中不生效？**  
A: 检查 `manifest.json` 中是否配置了合法域名（Supabase URL）。

**Q: 组件样式在小程序中异常？**  
A: 避免使用 CSS 变量，小程序不完全支持；使用 `rpx` 而非 `rem`。

## 项目里程碑

见 `PROJECT_PLAN.md`

## 资源链接

- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [Supabase 文档](https://supabase.com/docs)
- [uView UI 文档](https://www.uviewui.com/)
- [uCharts 文档](https://www.ucharts.cn/)

---

**最后更新**: 2026-09-29  
**维护者**: 项目团队 + AI 助手
