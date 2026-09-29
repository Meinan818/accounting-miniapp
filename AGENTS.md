# 智账（ZhiZhang）— AI 编程助手交接文档（AGENTS.md）

> 本文件是本项目的**唯一权威交接说明**。与 `README.md`、`PROJECT_PLAN.md`、`docs/` 冲突时，以本文件为准。
> 你（AI 编程助手，如 Claude / Codex）看不到原开发对话，所有上下文都在本文件、`PROJECT_PLAN.md` 和 `docs/` 里。请先完整读完本文件再动手。
> **⚡ 如果你是接手开发的第一步：跳到第 0 节「多 AI 协同开发协议」**，先确认轮值锁，再读其余部分。

> **文档入口约定**：`CLAUDE.md` 只是指向本文件的**指针**，里面不写任何规则。
> 所有规则改在本文件，改完不要往 `CLAUDE.md` 里抄一遍（两份必然分叉）。

---

## 0. 多 AI 协同开发协议（每次开工第一件事）

> 本项目由 **Claude** 与 **Codex** 两个 AI 轮流开发。你可能是其中任何一个。
>
> **通用规则不在这里重复**，完整版写在两份全局配置里：
> - Codex 侧（真源）：`C:\Users\lenovo\.codex\AGENTS.md`
> - Claude 侧：`C:\Users\lenovo\.claude\CLAUDE.md`
>
> 本节**只写本项目差异和硬约束**。全局规则与本文件冲突时，**以本文件为准**。

> ### ⭐ 用户最看重的是什么（任何时候不许破坏）
>
> 用户原话：**"喜欢你们两个之间这种执行任务的方式，令我不会不知道自己要干嘛。"**
> 他看重的是**机制**（永远知道下一步），**不是语气**。三条核心：
>
> 1. **同一时刻只有一个 AI 干活** —— 不是自己的班就直接拒绝开工并告知用户，不靠他盯着。
> 2. **干完活必须主动指路**（§0.6）—— 汇报末尾必须有「—— 下一步 ——」，漏了就算没汇报完。
> 3. **交接靠死文件不靠记忆**（§0.3）—— 隔多久回来读文件就能接上。

### 0.1 开工必做（顺序不能乱）

1. **读本文件**（至少第 0 节和第 1 节）。
2. **读 `.workbuddy/coop/state.json`**，看 `holder`：
   - 不是自己 → **不要改代码**，告诉用户"现在轮到 X"，停止；
   - 是自己 → 开工；
   - 是 `none` → 无人接管，你可以认领（改成自己）。
3. **读 `.workbuddy/coop/BATON.md` 最后一条**，了解上一轮做到哪、留了什么坑。
4. **跑对账三条命令**，与 §1.1 比对；对不上**以现场为准**，并当场把 §1.1 / `state.json` 改对、在汇报里说明：
   ```bash
   git log --oneline -1        # 当前提交
   git status --short          # 有没有未提交的改动（空 = 干净）
   git branch --show-current   # 当前分支
   ```

⚠️ **为什么不许跳过对账**：文档是手工维护的、会过期。信了过期快照就会重复开发、乱切分支或重复发布。

### 0.2 铁律

- **同一时刻只有一个 AI 改代码。** 唯一的通信媒介是**本仓库的文件 + git**，两个 AI 互相看不见对方的对话。
- `holder` 不是你就**不要动代码**（"我就改一行"也不行）。
- **方案设计 / 架构取舍 / 代码审查 → Claude；按方案写代码 / 跑验证 / commit 与 push → Codex**（§0.4）。
- 小改动（改字段、修一个明确 bug）**不必换班**——换班成本高于收益，谁在轮值谁做。

### 0.3 换班流程（由交出方执行）

1. **先干完再交**：手上的活干完、自测通过（对照 §8）、**`git commit` 存档**。严禁把半成品和未提交的改动交出去。
2. **改写轮值锁**：`.workbuddy/coop/state.json` 的 `holder` 改成接手方，更新 `since` / `branch` / `task` / `nextCheckpoint` / `nextAI` / `nextAIReason` / `updatedAt`。
3. **追加交接记录**：`.workbuddy/coop/BATON.md` 末尾追加一条，写清：分支、做了什么、未完成的部分、已知风险、**接手方第一步该做什么**。
4. **告诉用户贴哪段提示词**（见 `.workbuddy/coop/接手提示词.md`）。

### 0.4 本项目分工

| 角色 | 职责 | 不该做 |
|---|---|---|
| **Claude** | 架构设计、数据库结构、API 设计、视觉规范、**代码审查**、拆任务 | 不直接写实现代码（配置文件、文档除外） |
| **Codex** | 严格按文档实现 Vue 组件与页面、跑本地测试、修 bug、**执行 commit 与 push** | 不改 `docs/`、`supabase/`、`README.md`、`PROJECT_PLAN.md`、本文件 |
| **用户** | 确认关键选择、做外部平台操作（Supabase / Vercel / GitHub）、亲手验收 | 不需要读 `state.json`，也不用替他判断轮值 |

### 0.5 提交与发布：谁在什么时候做（本项目口径）

**一句话：commit 跟着"活干完了"走，push 跟着"用户要上线"走。**

| 场景 | 动作 | 谁做 | 影响线上？ |
|---|---|---|---|
| 一个功能干完 + 自测通过 | `git commit` 存档（中文 message） | 干活的 AI **主动做，不用等用户开口** | 不影响 |
| 一段活**没干完**但要换班 | **不 commit**；在 `BATON.md` 写清没干完什么、卡在哪 | 交出方 | 不影响 |
| 改文档 / 规则 / SQL | commit，且**单独一条**（`docs:` 或 `chore(coop):`） | 干活的 AI | 不影响 |
| 用户说「Push」 | 核查（暂存区 / 分支 / 代理 / 远端）→ `git push` → 回访线上 | **Codex**（若 `holder` 不是 codex，先按 §0.3 交班） | **影响**（Vercel 1–2 分钟自动重建） |
| 不确定该不该推 | **不推**，先问用户 | — | 不影响 |

- ⛔ **不许擅自 `git push`**。用户没说「Push / 推送」之前，任何情况下不推。
- ✅ **但 `commit` 不是"擅自"**：干完一段活就该自己提交。工作区一直脏着会让接手方对不上账。
- ⚠️ 本项目**尚未部署到 Vercel**，所以在部署完成前，push 只是把代码传到 GitHub，线上没有网站会变。

### 0.6 汇报末尾必须给「下一步」（强制）

汇报末尾**必须**包含下面这个区块（照抄格式，把 `<>` 换成实际情况）：

```
—— 下一步 ——
现在轮到：<Claude / Codex / 你自己决定>
原因：<一句话，比如"代码写完了，需要一个没参与写的人来挑毛病">
你查收无误后：把《接手提示词》里的 <Claude段 / Codex段 / 收尾段> 贴给 <Claude / Codex>
```

还没到换班（活没干完、或等用户决策）时写：

```
—— 下一步 ——
现在轮到：Codex（还是我，活没干完）
你需要做的：<具体一件事>
```

**写完后回填 `state.json`** 的 `nextAI` / `nextAIReason`，必须与汇报里的一致。对不上说明你自己也没想清楚，回去想清楚再汇报。

### 0.7 判断下一步该找谁

| 刚做完的活 | 下一步找谁 | 为什么 |
|---|---|---|
| 写好了代码 / 修好了 bug / 跑完了测试 | **Claude 复核** | 需要一双没参与写的眼睛 |
| 出了方案 / 做了架构判断 | **Codex 执行** | Codex 按方案写代码最稳 |
| 方案被 Claude 挑出问题 | **Codex 修** | 修改实施归 Codex |
| 方案 + 执行都完成了，等发布 | **交给 Codex 执行** | 发布执行归 Codex；推不推仍由用户说 Push 决定 |
| 小改动（改字段、修一个明确 bug） | **不用换** | 换班成本高于收益 |
| 卡住了、反复试都不成 | **换另一个试** | 换个思路常能破局 |

**例外**：`state.json` 里 `blocked: true` 时，先写"**卡住了，需要你先处理**"并说明卡在哪。

### 0.8 汇报风格（用户拍板，务必遵守）

用户是非专业开发者，看不懂术语。他明确说喜欢"结论先行 + 分步骤 + 说清下一步"，希望**长期保持**：

1. **第一句就是结论**，不用"让我看看""我来分析"开头。
2. **术语当场解释**——假设对方是文科大学生第一次听，宁可换大白话。
3. **给可直接复制粘贴的完整内容**，不要让他自己填参数。
4. **每步标明会不会影响线上**。
5. **先给推荐，再给 1–2 个备选**；不要平铺一堆选项让他自己掂量。
6. **末尾必须给「下一步」区块**（§0.6）。

### 0.9 禁止事项

1. 不要在 `holder` 不是自己时改代码。
2. 不要绕过轮值锁并行开发。
3. 不要替另一个 AI 猜进度；以 `state.json` 和 `BATON.md` 为准。
4. 不要擅自 `git push`（执行人是 Codex，且必须用户说 Push）。
5. 不要在交接记录里写"应该没问题"这类无证据结论。
6. **不要在汇报末尾漏掉「下一步」区块。**
7. 不要补写没真实发生过的复核、提交或发布记录——发现现场与旧记录不一致时，以 git 和文件现状为准，先停下来汇报。

---

## 1. 项目定位与当前进度

### 1.1 当前进度快照（更新于 2026-09-29 22:45）

> ⚠️ **本节只写"git 查不到的事实"**（线上第几版、做过哪些验证、已知问题、待人工操作）。
>
> **提交号 / 当前分支 / 有没有未提交的改动——一律现场用 git 查（§0.1 第 4 步），严禁抄进本文档。**
> 抄进来的必然过期。2026-09-29 在另一个项目（饭否外卖）就踩过这个坑。

| 项 | 现状 |
|---|---|
| 项目性质 | 个人记账 **Web 应用**，面向简历/作品集展示，不商业化 |
| 预算 | 零预算（Supabase 免费额度 + Vercel 免费托管） |
| 线上部署 | **尚未部署**（无线上地址，push 不影响任何线上网站） |
| 远端仓库 | https://github.com/Meinan818/accounting-miniapp （仓库名含 `miniapp`，是旧的"小程序"路线遗留，暂不改） |
| 当前阶段 | 里程碑 1「本地可运行版本」的准备阶段；**下一步是 Sprint 1.1：重建 Vite 项目** |
| 路线变更 | **2026-09-29 用户拍板：从"微信小程序（uni-app）"改为"Web 应用（Vue 3 + Vite）"**。旧的 uni-app 代码仍在 `frontend/`，待删除 |
| 已完成的验证 | **暂无**。项目刚初始化，还没有可运行的代码（旧的 uni-app 代码已作废，不作验证） |
| 待人工操作 | ① 用户在 Supabase 控制台建项目并执行 `supabase/` 下三个 SQL；② 用户确认 Supabase 的 URL 与 anon key 填入 `.env` |
| 已知问题 | 见 §7 |

### 1.2 里程碑（详细计划见 `PROJECT_PLAN.md`）

- **里程碑 1**（约 1 周）：本地可运行 MVP —— 项目初始化 → 认证 → 记账 → 账单列表 → 统计
- **里程碑 2**（约 2 周）：云端完整版 —— 图表 → 分类管理 → 预算 → 个人中心 → 响应式
- **里程碑 3**（约 1 周）：优化与发布 —— 票据/导出/吉祥物/PWA → **Vercel 部署** → 测试修复

---

## 2. 技术栈

| 层 | 选型 |
|---|---|
| 前端框架 | Vue 3（Composition API + `<script setup>`） |
| 构建 | Vite 5 |
| 语言 | **JavaScript（不是 TypeScript）** |
| 样式 | Tailwind CSS 3 |
| 路由 | Vue Router 4 |
| 状态 | Pinia |
| 图表 | ECharts |
| 图标 | lucide-vue-next |
| 日期 | dayjs |
| 后端 | Supabase（PostgreSQL + Auth + Storage，Realtime 可选） |
| 部署 | Vercel（免费，接 GitHub 自动部署）—— **尚未配置** |

设计规范见 `docs/DESIGN_SYSTEM.md`；代码规范见 `docs/CONVENTIONS.md`。

---

## 3. 本地运行与构建

> ⚠️ **目前 `frontend/` 里还是旧的 uni-app 代码（作废）**。下列命令在 Codex 完成 Sprint 1.1（重建 Vite 项目）之后才成立。

```bash
cd frontend
npm install                 # 装依赖（网络慢可先 npm config set registry https://registry.npmmirror.com）
npm run dev                 # 开发服务器，默认 http://localhost:5173
npm run build               # 生产构建，产物在 frontend/dist
npm run preview             # 本地预览构建产物
```

- 环境变量放在 `frontend/.env`（**不是根目录**），变量名必须以 `VITE_` 开头；改完要重启 dev server。
- `.env` 已在 `.gitignore` 中，**永不入库**；只提供只含变量名的 `.env.example`。
- 本项目**没有** TypeScript 类型检查，也没有单元测试。改动后的验证方式见 §8。

---

## 4. 目录结构

```
未定项目/                      ← 文件夹名暂不改（用户 2026-09-29 决定）
├── AGENTS.md                  ← ✅ 唯一权威 AI 规则与交接文档（本文件）
├── CLAUDE.md                  ← 只是指向 AGENTS.md 的指针，不写规则
├── README.md                  ← 给人看：项目是什么 + 怎么跑起来
├── PROJECT_PLAN.md            ← 计划与里程碑（只写"计划"，不写"已发生的事实"）
├── .env.example               ← ⚠️ 待挪到 frontend/.env.example（见 §7）
├── .workbuddy/
│   ├── coop/                  ← 轮值锁与交接：state.json / BATON.md / 接手提示词.md
│   └── memory/                ← AI 私有工作日志（.gitignore 忽略，不入库）
├── docs/                      ← 技术文档（Claude 维护，Codex 不改）
│   ├── DATABASE_DESIGN.md
│   ├── API_DESIGN.md
│   ├── DESIGN_SYSTEM.md       ← 唯一视觉规范
│   ├── CONVENTIONS.md         ← 代码规范（命名 / 目录 / Vue 写法 / Tailwind）
│   ├── DEVELOPMENT.md         ← Web 版开发指南
│   └── archive/               ← 一次性材料与作废文档，只读
└── supabase/                  ← SQL（Claude 维护，Codex 不改）
    ├── schema.sql             ← 表结构
    ├── seed.sql               ← 初始数据（35 条预设分类）
    └── rls_policies.sql       ← 行级安全策略
```

**根目录只放三个 `.md`**：`AGENTS.md`（AI 看）、`README.md`（人看）、`PROJECT_PLAN.md`（计划）。
其他一律进 `docs/` 或 `.workbuddy/`。

---

## 5. 数据库（Supabase）

- 5 张表：`users` / `categories` / `records` / `budgets` / `accounts`。
- 详细字段与关系见 `docs/DATABASE_DESIGN.md`，建表语句见 `supabase/schema.sql`。
- 命名：表名小写复数；字段蛇形（`user_id`、`created_at`）；外键 `表名_id`。
- **每个表都必须启用 RLS**，用户只能访问自己的数据；策略见 `supabase/rls_policies.sql`。
- 前端**只允许**放 anon / publishable key；**service_role / secret key 严禁**出现在前端代码、文档、提交信息或聊天里。
- ⚠️ `supabase/` 下三个 SQL **需要用户在 Supabase 控制台手动执行**（AI 做不了，不要假装完成）。

---

## 6. 当前任务与下一步

**Sprint 1.1：重建 Vite 项目**（负责人：Codex，先由 Claude 出方案——见 §6.1）

任务详情已归档在 `docs/archive/CODEX_TASKS.md`，包含逐步命令与代码片段。要点：

1. 删除（或先改名备份）旧的 uni-app 目录 `frontend/`。
2. 用 `npm create vite@latest frontend -- --template vue` 重建。
3. 装依赖：`vue-router@4`、`pinia`、`@supabase/supabase-js`、`tailwindcss@3 postcss autoprefixer`、`echarts`、`lucide-vue-next`、`dayjs`。
4. 配置 Tailwind（色板见 `docs/DESIGN_SYSTEM.md`）、Vue Router、Pinia、Supabase 客户端。
5. 建目录骨架与 5 个占位页面（Login / Home / Add / Stats / Profile）。

**验收标准**：`npm run dev` 能起、能访问 `http://localhost:5173`、Tailwind 生效、路由能切换、控制台无报错。

---

## 7. 已知问题 / 待处理

| 项 | 说明 | 归属 |
|---|---|---|
| 旧 uni-app 代码 | `frontend/` 仍是作废的小程序代码，Sprint 1.1 时删除 | Codex |
| `.env.example` 位置 | 现在在根目录，但 Vite 项目在 `frontend/`，应挪到 `frontend/.env.example` | Codex |
| 仓库名 `accounting-miniapp` | 与 Web 路线不符，容易误导；改名要在 GitHub 设置里做，且会改远端地址 | 用户决定，暂不改 |
| 未部署 | Vercel 还没配，上线属于里程碑 3 | 用户 + Codex |
| 旧文档归档 | `docs/archive/UI_DESIGN.md` 是按小程序写的页面设计，Web 版页面布局待重写 | Claude |

---

## 8. 验证要求与提交规范

**每个改动完成后必须**：

1. `npm run dev` 能正常启动，控制台无报错；
2. 在浏览器里**亲手点一遍**受影响的页面（Chrome DevTools）；
3. 涉及数据的改动，去 Supabase Table Editor 确认真写进去了；
4. 如实说明"哪些验证了、哪些没验证"。**跑不了就说明原因，不要假装跑过。**

> 本项目没有自动化测试，所以"在浏览器里点一遍"是唯一的真实验证方式，不能省。

**提交信息格式**（语义化，简体中文）：

```
<type>(<scope>): <subject>
```

`type` 取值：`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`。
例：`feat(record): 实现账单列表页面`。

- **一个功能一个 commit**；协同协议文件单独用 `chore(coop):`，不与功能混在一起。
- 提交前用 `git status --short` 确认待提交列表里**没有任何 `.env` 文件**。

---

## 9. 相关文档

| 文档 | 看它做什么 |
|---|---|
| `README.md` | 项目是什么、怎么跑起来 |
| `PROJECT_PLAN.md` | 里程碑、Sprint 拆分、优先级、风险 |
| `docs/DATABASE_DESIGN.md` | 表结构、字段、关系 |
| `docs/API_DESIGN.md` | Supabase 调用示例、接口约定 |
| `docs/DESIGN_SYSTEM.md` | 色彩、字体、间距、组件、动画（**实现前必读**） |
| `docs/CONVENTIONS.md` | 命名、目录、Vue 写法、Tailwind 用法 |
| `docs/DEVELOPMENT.md` | 环境搭建、调试技巧、常见问题 |
| `docs/archive/` | 作废/一次性材料，只读 |
