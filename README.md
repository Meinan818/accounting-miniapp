# 智账 (ZhiZhang)

一个**高级感 + 可爱萌宠**风格的个人记账 Web 应用，让记账变得优雅又有趣。

## ✨ 特性

- 🎨 **高级视觉设计**：紫粉渐变色系 + 玻璃态效果
- 🐱 **可爱吉祥物**：小账猫咪陪你记账
- 📊 **数据可视化**：直观的图表展示收支趋势
- 📱 **响应式设计**：完美适配手机和桌面
- 🌙 **暗色模式**：保护眼睛的深色主题
- 💾 **云端同步**：基于 Supabase 的实时数据同步
- 🚀 **PWA 支持**：可添加到桌面，离线使用

## 🛠 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **路由**: Vue Router
- **状态管理**: Pinia
- **图表**: ECharts
- **图标**: Lucide Icons

### 后端
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth (邮箱登录)
- **存储**: Supabase Storage
- **API**: 自动生成的 RESTful API

### 部署
- **托管**: Vercel / Netlify
- **PWA**: vite-plugin-pwa
- **打包**: Tauri (可选)

## 🎯 核心功能

### P0（必须有）
- ✅ 邮箱登录/注册
- ✅ 快速记账（收入/支出）
- ✅ 账单列表（按日期分组）
- ✅ 分类管理（预设 + 自定义）
- ✅ 月度统计（收支汇总）

### P1（重要）
- ✅ 数据可视化（饼图、折线图）
- ✅ 预算管理
- ✅ 数据筛选（按月份、分类）
- ✅ 响应式设计

### P2（加分项）
- 🔄 票据上传
- 🔄 数据导出 (CSV/Excel)
- 🔄 AI 对话记账
- 🔄 暗色模式
- 🔄 PWA 离线支持

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- npm >= 9

### 安装

```bash
# 克隆项目
git clone https://github.com/Meinan818/accounting-miniapp.git
cd accounting-miniapp

# 安装依赖
npm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env，填入 Supabase 配置
# VITE_SUPABASE_URL=你的项目URL
# VITE_SUPABASE_ANON_KEY=你的anon key
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📂 项目结构

```
智账/
├── src/
│   ├── views/              # 页面
│   │   ├── Login.vue       # 登录页
│   │   ├── Home.vue        # 首页（账单列表）
│   │   ├── Add.vue         # 记账页
│   │   ├── Stats.vue       # 统计页
│   │   └── Profile.vue     # 个人中心
│   ├── components/         # 组件
│   │   ├── common/         # 通用组件
│   │   ├── record/         # 账单相关
│   │   ├── chart/          # 图表组件
│   │   └── mascot/         # 吉祥物组件
│   ├── api/                # API 封装
│   │   ├── supabase.js     # Supabase 客户端
│   │   ├── auth.js         # 认证
│   │   ├── record.js       # 账单
│   │   └── category.js     # 分类
│   ├── stores/             # Pinia 状态管理
│   │   ├── user.js         # 用户状态
│   │   ├── record.js       # 账单状态
│   │   └── category.js     # 分类状态
│   ├── router/             # 路由配置
│   │   └── index.js
│   ├── utils/              # 工具函数
│   │   ├── date.js         # 日期处理
│   │   └── format.js       # 格式化
│   ├── assets/             # 静态资源
│   │   ├── images/         # 图片
│   │   └── mascot/         # 吉祥物素材
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── public/                 # 公共资源
│   └── favicon.ico
├── docs/                   # 项目文档
│   ├── DATABASE_DESIGN.md  # 数据库设计
│   ├── API_DESIGN.md       # API 设计
│   ├── DESIGN_SYSTEM.md    # 设计系统
│   └── DEVELOPMENT.md      # 开发指南
├── supabase/               # 数据库脚本
│   ├── schema.sql          # 表结构
│   ├── seed.sql            # 初始数据
│   └── rls_policies.sql    # 安全策略
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

## 🎨 设计系统

查看完整的设计规范：[DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md)

### 色彩
- **主色**：紫色渐变（高级感）
- **辅助色**：粉色（可爱）
- **功能色**：绿色（收入）、橙色（支出）

### 吉祥物
**小账**：圆润的小猫咪，戴着带"¥"符号的小帽子，表情丰富，陪伴用户记账。

## 📖 文档

- [数据库设计](./docs/DATABASE_DESIGN.md) - 表结构和 ER 图
- [API 设计](./docs/API_DESIGN.md) - 接口规范和示例
- [设计系统](./docs/DESIGN_SYSTEM.md) - 视觉规范和组件设计
- [开发指南](./docs/DEVELOPMENT.md) - 环境搭建和开发流程
- [AGENTS.md](./AGENTS.md) - **唯一权威**：AI 协作规则、提交与发布节奏、当前进度
- [代码规范](./docs/CONVENTIONS.md) - 命名、目录、Vue 写法、Tailwind 用法

## 🤝 开发团队

- **架构设计**: Claude
- **代码实现**: Codex
- **产品规划**: 项目发起人

## 📄 License

MIT License

---

**Created with** ❤️ **by Team ZhiZhang**
