# 智账 (ZhiZhang)

一个**手账风格 + AI 对话**的个人记账 Web 应用。用户直接用自然语言告诉 AI 花了什么钱，AI 整理成确认卡片，确认后完成记账。

## 当前状态

- ✅ Vite 5 + Vue 3 + Tailwind CSS 基础项目
- ✅ 首页手账日历、月度收支和日期账单列表
- ✅ 中央 + 打开 AI 对话和确认卡片，可修改金额、类型、分类、日期、时间和备注
- ✅ 支出、收入、分类和月度统计的假 AI 识别
- ✅ 对话和假账单使用 Pinia + localStorage 持久化
- ✅ 小黄鸡吉祥物 🐣 和手账风格视觉
- ✅ Sprint 1.3 复核问题 P1 五项已修复
- ⏳ 尚未接入 Supabase 和真实 Claude API
- ⏳ 尚未部署到 Vercel

当前仍处于**阶段 1：前端 + 假数据**。真实后端和真实 AI 将在后续阶段接入。

## 已实现功能

- 输入“今天吃饭花了35块”，AI 识别并生成餐饮支出确认卡片。
- 输入“工资收入8000”，AI 识别工资收入。
- 输入“本月花了多少”“餐饮花了多少”，返回假账单统计。
- 支持下午、傍晚、晚上的时间识别。
- 支持修改账单后再确认。
- 确认后保存到本地假数据，并更新顶部月度统计。
- 对话记录和新消息自动滚动。
- 无法识别时给出示例引导。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + Composition API |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 路由 | Vue Router 4 |
| 状态 | Pinia |
| 日期 | dayjs |
| 图标 | lucide-vue-next + emoji |
| 后端（后续） | Supabase |
| AI（后续） | Claude API |
| 部署（后续） | Vercel |

## 本地运行

```powershell
cd E:\项目\未定项目\frontend
npm ci
npm run dev
```

浏览器打开：

`http://localhost:5173`

生产构建：

```powershell
npm run build
```

## 环境变量

模板位于 `frontend/.env.example`。

阶段 1 不要求配置 `.env`。阶段 2 接入 Supabase 时，再创建 `frontend/.env`：

```env
VITE_SUPABASE_URL=你的项目地址
VITE_SUPABASE_ANON_KEY=你的匿名密钥
```

真实 `.env` 不得提交到 Git。

## 目录结构

```text
未定项目/
├── frontend/                 # Vue 3 + Vite 前端
│   └── src/
│       ├── components/       # 对话、确认卡片、吉祥物等组件
│       ├── stores/           # 对话和假账单状态
│       ├── utils/            # 假 AI、格式化和日期处理
│       ├── views/            # 页面
│       ├── router/           # 路由
│       └── api/              # Supabase 客户端骨架
├── supabase/                 # 数据库结构、种子数据和 RLS
├── docs/                     # 设计、开发和接口文档
├── PROJECT_PLAN.md           # 开发计划
└── AGENTS.md                 # AI 开发与交接规则
```

## 主要文档

- [PROJECT_PLAN.md](./PROJECT_PLAN.md)：阶段和 Sprint 计划
- [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md)：手账风格设计规范
- [docs/CONVENTIONS.md](./docs/CONVENTIONS.md)：代码规范
- [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)：开发与调试说明
- [docs/API_DESIGN.md](./docs/API_DESIGN.md)：接口设计
- [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md)：数据库设计

## 下一阶段

按 `PROJECT_PLAN.md` 继续：

1. Sprint 1.4：日历页面
2. Sprint 1.5：账单明细页
3. Sprint 1.6：统计页面
4. Sprint 1.7：个人中心
5. Sprint 1.8：底部导航
6. 阶段 2：接入 Supabase 和真实 Claude API
