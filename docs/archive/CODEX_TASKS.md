# Codex 开发任务说明

## 📋 项目状态

**项目位置**: `E:\项目\未定项目`  
**GitHub**: https://github.com/Meinan818/accounting-miniapp  
**当前 commit**: `279606a` (chore: 项目初始化)  
**技术栈**: Vue 3 + Vite + Tailwind CSS + Supabase

## 🎯 项目重构说明

**重要变更**：
- ❌ 不再做微信小程序（uni-app）
- ✅ 改为做 Web 应用（Vue 3 + Vite）
- ✅ 项目名称：**智账**（高级感 + 可爱萌宠风格）
- ✅ 数据库设计保持不变（Supabase）
- ✅ 旧的 `frontend/` 目录不再使用（需要删除或忽略）

---

## 📖 必读文档

开始前请仔细阅读（按顺序）：

1. **README.md** - 项目概述和技术栈
2. **CLAUDE.md** - 协同开发规则、代码规范 ⭐️最重要
3. **PROJECT_PLAN.md** - 开发计划和里程碑
4. **docs/DESIGN_SYSTEM.md** - 视觉设计规范（色彩、字体、组件）⭐️
5. **docs/DATABASE_DESIGN.md** - 数据库表结构
6. **docs/API_DESIGN.md** - API 接口示例

---

## 🚀 第一步：项目初始化（优先级 P0）

### 任务 1.1：创建 Vite 项目

```bash
# 1. 删除旧的 frontend 目录（或重命名为 frontend.old）
cd E:\项目\未定项目
# 如果删除有权限问题，就重命名
mv frontend frontend.old

# 2. 创建新的 Vite + Vue 3 项目
npm create vite@latest frontend -- --template vue

# 3. 进入项目目录
cd frontend

# 4. 安装依赖
npm install

# 5. 测试运行
npm run dev
# 应该能在 http://localhost:5173 看到 Vite + Vue 欢迎页
```

### 任务 1.2：安装项目依赖

```bash
cd frontend

# 核心依赖
npm install vue-router@4 pinia @supabase/supabase-js

# UI 和样式
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

# 图表
npm install echarts

# 图标
npm install lucide-vue-next

# 工具库
npm install dayjs

# 开发工具（可选）
npm install -D eslint prettier
```

### 任务 1.3：配置 Tailwind CSS

创建/修改 `tailwind.config.js`：

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 参考 docs/DESIGN_SYSTEM.md 的色彩系统
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        accent: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        expense: {
          light: '#fed7aa',
          DEFAULT: '#fb923c',
          dark: '#ea580c',
        },
        income: {
          light: '#d1fae5',
          DEFAULT: '#10b981',
          dark: '#059669',
        }
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

在 `src/style.css` 中添加 Tailwind 指令：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 全局样式 */
@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}
```

### 任务 1.4：配置 Vue Router

创建 `src/router/index.js`：

```js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/add',
    name: 'Add',
    component: () => import('@/views/Add.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/Stats.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
```

### 任务 1.5：配置 Pinia

创建 `src/stores/user.js`：

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/api/supabase'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const session = ref(null)

  const isLoggedIn = computed(() => !!session.value)

  async function loadSession() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    if (data.session) {
      user.value = data.session.user
    }
  }

  function setSession(newSession) {
    session.value = newSession
    user.value = newSession?.user || null
  }

  function logout() {
    session.value = null
    user.value = null
  }

  return {
    user,
    session,
    isLoggedIn,
    loadSession,
    setSession,
    logout
  }
})
```

### 任务 1.6：配置 Supabase

创建 `src/api/supabase.js`：

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 配置缺失，请检查 .env 文件')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})
```

### 任务 1.7：更新 `src/main.js`

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
```

### 任务 1.8：创建基础 `App.vue`

```vue
<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.loadSession()
})
</script>

<template>
  <div id="app" class="min-h-screen">
    <router-view />
  </div>
</template>
```

### 任务 1.9：创建目录结构

```bash
cd src

# 创建页面目录
mkdir -p views

# 创建组件目录
mkdir -p components/common
mkdir -p components/layout
mkdir -p components/record
mkdir -p components/chart
mkdir -p components/mascot

# 创建 API 目录
mkdir -p api

# 创建 stores 目录
mkdir -p stores

# 创建 utils 目录
mkdir -p utils

# 创建资源目录
mkdir -p assets/images
mkdir -p assets/mascot
```

### 任务 1.10：配置 vite.config.js

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
```

### 任务 1.11：创建占位页面

创建 `src/views/Login.vue`：

```vue
<script setup>
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-accent-500">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <h1 class="text-3xl font-bold text-center mb-2 text-gray-900">智账</h1>
      <p class="text-center text-gray-600 mb-8">让记账变得优雅又有趣</p>
      
      <div class="text-center text-gray-500">
        登录页面开发中...
      </div>
    </div>
  </div>
</template>
```

创建 `src/views/Home.vue`：

```vue
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-4 text-gray-900">智账 - 首页</h1>
      <p class="text-gray-600 mb-4">首页开发中...</p>
      <button 
        @click="goToLogin"
        class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
      >
        去登录
      </button>
    </div>
  </div>
</template>
```

创建 `src/views/Add.vue`：

```vue
<script setup>
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-4 text-gray-900">记一笔</h1>
      <p class="text-gray-600">记账页面开发中...</p>
    </div>
  </div>
</template>
```

创建 `src/views/Stats.vue`：

```vue
<script setup>
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-4 text-gray-900">统计</h1>
      <p class="text-gray-600">统计页面开发中...</p>
    </div>
  </div>
</template>
```

创建 `src/views/Profile.vue`：

```vue
<script setup>
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-4 text-gray-900">我的</h1>
      <p class="text-gray-600">个人中心开发中...</p>
    </div>
  </div>
</template>
```

### ✅ 验收标准

完成后应该能够：
- ✅ `npm run dev` 正常启动
- ✅ 访问 `http://localhost:5173` 看到登录页面
- ✅ Tailwind CSS 样式生效（紫色渐变背景）
- ✅ 控制台无报错
- ✅ 目录结构正确创建
- ✅ 路由能正常切换（/login, /, /add, /stats, /profile）

---

## 📝 提交要求

完成后提交到 Git：

```bash
# 在项目根目录（E:\项目\未定项目）
git add .
git commit -m "feat: 初始化 Vite + Vue 3 项目

- 创建 Vite + Vue 3 + Tailwind CSS 项目
- 配置 Vue Router 和 Pinia
- 集成 Supabase 客户端
- 创建项目目录结构
- 配置路由守卫和用户状态管理
- 创建基础页面占位组件
- 配置 Tailwind 紫粉渐变色系

Sprint 1.1 完成
"

git push origin main
```

---

## 🔍 注意事项

1. **不要改动以下文件**（Claude 维护）：
   - `docs/` 目录下的所有文档
   - `supabase/` 目录下的 SQL 文件
   - `CLAUDE.md`
   - `PROJECT_PLAN.md`
   - `README.md`

2. **环境变量**：
   - 创建 `frontend/.env.example` 模板
   - 用户需要自己创建 `.env` 文件

3. **代码规范**：
   - 严格遵循 `CLAUDE.md` 的代码规范
   - 使用 Vue 3 Composition API (`<script setup>`)
   - 优先使用 Tailwind utility classes

4. **遇到问题**：
   - 先查阅 `CLAUDE.md` 的"常见问题"章节
   - 检查文档是否有说明
   - 记录问题，稍后与 Claude 讨论

---

## 📋 下一步任务

完成项目初始化并 push 后，下一步任务是：

**Sprint 1.2：认证系统**
- 实现登录页面完整 UI
- 实现注册功能
- 集成 Supabase Auth（邮箱 + 密码）
- 实现登录状态持久化

等你完成项目初始化并 push 后，告诉我，我会给你详细的认证系统任务说明。

---

## 🎓 参考资料

- [Vite 官方文档](https://cn.vitejs.dev/)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Tailwind CSS 官方文档](https://tailwindcss.com/)
- [Supabase JS 客户端](https://supabase.com/docs/reference/javascript/introduction)
- [Vue Router 官方文档](https://router.vuejs.org/zh/)
- [Pinia 官方文档](https://pinia.vuejs.org/zh/)

---

**创建时间**: 2026-09-29  
**负责人**: Codex  
**审查人**: Claude
