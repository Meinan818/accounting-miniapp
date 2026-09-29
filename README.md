# 个人记账小程序

一个基于 uni-app + Supabase 的微信小程序，提供简洁易用的记账功能和数据可视化分析。

## 📱 功能特性

### 核心功能
- ✅ 微信授权登录
- ✅ 快速记账（收入/支出）
- ✅ 分类管理（预设 + 自定义）
- ✅ 票据拍照上传
- ✅ 月度统计报表
- ✅ 数据可视化（饼图、折线图）
- ✅ 预算管理与提醒

### 技术亮点
- 🎯 前后端分离架构
- 🎯 Supabase 实时数据库
- 🎯 行级安全策略（RLS）
- 🎯 响应式 UI 设计
- 🎯 云存储集成

## 🛠 技术栈

### 前端
- **框架**: uni-app (Vue 3)
- **UI 组件**: uView UI
- **图表库**: uCharts / ECharts
- **状态管理**: Pinia
- **工具**: Vite

### 后端
- **BaaS**: Supabase
- **数据库**: PostgreSQL
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **API**: 自动生成的 RESTful API

## 🚀 快速开始

### 前置要求
- Node.js >= 16
- 微信开发者工具
- Supabase 账号（免费）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd 未定项目
```

2. **安装依赖**
```bash
cd frontend
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的 Supabase 配置
# VITE_SUPABASE_URL=你的项目URL
# VITE_SUPABASE_ANON_KEY=你的匿名密钥
```

4. **初始化数据库**
- 登录 Supabase Dashboard
- 在 SQL Editor 中执行 `supabase/schema.sql`
- 执行 `supabase/seed.sql` 插入初始数据
- 执行 `supabase/rls_policies.sql` 配置安全策略

5. **启动开发服务器**
```bash
npm run dev:mp-weixin
```

6. **在微信开发者工具中打开**
- 打开微信开发者工具
- 导入项目：`frontend/dist/dev/mp-weixin`

## 📂 项目结构

```
未定项目/
├── README.md                 # 项目说明
├── CLAUDE.md                 # AI 协同开发规则
├── PROJECT_PLAN.md           # 项目规划
├── .env.example              # 环境变量模板
├── .gitignore                # Git 忽略配置
│
├── frontend/                 # 前端项目
│   ├── pages/               # 页面
│   ├── components/          # 组件
│   ├── api/                 # API 封装
│   ├── utils/               # 工具函数
│   └── static/              # 静态资源
│
├── supabase/                # 数据库配置
│   ├── schema.sql           # 表结构
│   ├── seed.sql             # 初始数据
│   └── rls_policies.sql     # 安全策略
│
└── docs/                    # 项目文档
    ├── DATABASE_DESIGN.md   # 数据库设计
    ├── API_DESIGN.md        # API 设计
    ├── UI_DESIGN.md         # UI 设计
    └── DEVELOPMENT.md       # 开发指南
```

## 📖 文档

- [数据库设计](./docs/DATABASE_DESIGN.md)
- [API 接口文档](./docs/API_DESIGN.md)
- [UI 设计说明](./docs/UI_DESIGN.md)
- [开发指南](./docs/DEVELOPMENT.md)
- [AI 协同开发规则](./CLAUDE.md)

## 🤝 协同开发

本项目支持与 Claude / Codex 等 AI 工具协同开发。

**开始前请阅读**: [CLAUDE.md](./CLAUDE.md)

主要约定：
- 使用语义化提交信息
- 遵循项目代码规范
- 更新相关文档
- 测试后再提交

## 📝 开发进度

查看 [PROJECT_PLAN.md](./PROJECT_PLAN.md) 了解当前进度和待办事项。

## 📄 License

MIT License

---

**Created with** ❤️ **for learning and portfolio**
