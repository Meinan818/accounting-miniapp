# 智账 — 开发指南（docs/DEVELOPMENT.md）

> 适用路线：**Web 应用**（Vue 3 + Vite + Tailwind CSS + Supabase），部署到 Vercel。
> 旧版（微信小程序 / uni-app / HBuilderX）指南已作废，见 `docs/archive/DEVELOPMENT-miniprogram.md`。
> AI 协作规则见根目录 `AGENTS.md`；代码规范见 `docs/CONVENTIONS.md`。

## 一、环境搭建

### 1. 安装 Node.js

需要 **Node.js 18 或更高**（Vite 5 的要求）：

```bash
node -v    # 应 ≥ v18
npm -v
```

### 2. 编辑器

推荐 VS Code，装两个插件：**Vue - Official**（Vue 语言支持）、**Tailwind CSS IntelliSense**。

## 二、项目初始化

> ⚠️ 目前 `frontend/` 还是作废的 uni-app 代码，需要先按 `docs/archive/CODEX_TASKS.md` 重建为 Vite 项目（Sprint 1.1 的任务）。下面的命令在重建之后才成立。

```bash
cd frontend
npm install
```

网络慢时先切国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
```

## 三、配置 Supabase

### 1. 建项目并拿凭证

1. 访问 https://app.supabase.com ，用 GitHub 账号登录。
2. New Project：名称 `accounting-app`；数据库密码设强密码并**记下来**；Region 选 `Northeast Asia (Tokyo)` 或最近的。
3. 等项目创建完成（约 2 分钟）。
4. Settings → API，复制 **Project URL** 和 **anon public key**。

### 2. 配置环境变量

在 **`frontend/`** 目录下创建 `.env`（不是项目根目录）：

```
VITE_SUPABASE_URL=你的 Project URL
VITE_SUPABASE_ANON_KEY=你的 anon key
```

- 变量名必须以 `VITE_` 开头，否则前端读不到；**改完必须重启 dev server**。
- `.env` 已在 `.gitignore` 中，**永不入库**。
- 只放 anon key；`service_role` key **严禁**出现在前端代码或任何文档里。

### 3. 初始化数据库

在 Supabase Dashboard → 左侧 SQL Editor → New Query，**按顺序**执行项目 `supabase/` 下的三个文件：

| 顺序 | 文件 | 作用 |
|---|---|---|
| 1 | `supabase/schema.sql` | 建 5 张表（users / categories / records / budgets / accounts） |
| 2 | `supabase/seed.sql` | 插入初始数据（35 条预设分类） |
| 3 | `supabase/rls_policies.sql` | 配置行级安全策略（用户只能访问自己的数据） |

**验证**：左侧 Table Editor 应能看到 5 张表，`categories` 有 35 条数据。

> 这一步是**人工操作**，AI 做不了，也不要假装完成。

### 4. 配置 Storage（可选，里程碑 3 做票据上传时再配）

建一个 Bucket（建议名 `receipts`）存票据照片，并配 RLS 策略允许用户上传/删除自己的文件、所有人可读。策略写法参考 `supabase/rls_policies.sql` 的风格。

## 四、启动项目

```bash
cd frontend

npm run dev        # 开发服务器，默认 http://localhost:5173
npm run build      # 生产构建，产物在 frontend/dist
npm run preview    # 本地预览构建产物
```

## 五、开发流程

1. 读 `docs/DESIGN_SYSTEM.md` 了解视觉规范，读 `docs/CONVENTIONS.md` 了解写法。
2. 按 `docs/CONVENTIONS.md` 的目录结构新建页面 / 组件。
3. 调数据用 `src/api/` 下封装好的方法，**不要在组件里直接写 Supabase 查询**。
4. 本地在浏览器里**亲手点一遍**（验收要求见 `AGENTS.md` 第 8 节）。
5. 提交（一个功能一个 commit，格式见 `docs/CONVENTIONS.md`）。

## 六、调试技巧

| 要查什么 | 去哪看 |
|---|---|
| 组件状态 / 响应式数据 | Vue DevTools（浏览器插件） |
| 网络请求与状态码 | DevTools → Network，筛 `supabase.co` |
| 运行时错误 | DevTools → Console |
| 数据到底写没写进去 | Supabase Table Editor 直接看表 |
| RLS 是否拦住了查询 | SQL Editor 里用 `select auth.uid()` 对照策略条件 |
| 环境变量读没读到 | Console 打印 `import.meta.env.VITE_SUPABASE_URL` |

热更新不工作时：确认文件在 `frontend/src/` 下，然后重启 dev server。

## 七、常见问题

**Q1：`npm install` 失败**
切镜像后重试：`npm config set registry https://registry.npmmirror.com`；必要时删掉 `node_modules` 和 `package-lock.json` 再装。

**Q2：报 `Cannot find module`**
依赖没装全，或路径别名没配。检查 `vite.config.js` 里的 `@` → `./src` 别名和 `node_modules` 是否存在。

**Q3：Supabase 请求失败 / 网络错误**
检查 `frontend/.env` 是否存在、变量名是否以 `VITE_` 开头、是否重启过 dev server。

**Q4：查询成功但返回空数组**
多半是 RLS 策略问题。检查 `supabase/rls_policies.sql` 是否执行成功、策略里的 `auth.uid()` 条件是否匹配当前登录用户。

**Q5：Tailwind 样式不生效**
检查 `tailwind.config.js` 的 `content` 是否覆盖所有 `.vue` 文件，以及 `src/style.css` 里是否有 `@tailwind` 三行指令。

**Q6：环境变量改了但没变化**
Vite 只在启动时读取 `.env`，**必须重启** dev server。

**Q7：注册后登录提示邮箱未验证**
Supabase 默认开启邮箱验证。演示阶段可在 Dashboard → Authentication → Providers → Email 里关掉 "Confirm email"。

## 八、打包与部署（里程碑 3）

1. 把仓库推到 GitHub（`main` 分支）。
2. Vercel 里 New Project → 导入该仓库。
3. Root Directory 设为 `frontend`；Build Command `npm run build`；Output Directory `dist`。
4. 在 Vercel 的环境变量里配置 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。
5. 之后每次 push 到 `main`，Vercel 会自动重新构建并上线（约 1–2 分钟）。

> push 到 `main` 等于线上发布，**必须先由用户明确说「Push」才推**。规则见 `AGENTS.md` 第 0.5 节。
