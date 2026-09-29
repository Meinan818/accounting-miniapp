# 交接板（BATON.md）

> 每换一次班，由**交出方**在下面追加一条。只追加，不删改历史。
> 这个文件是给人和 AI 一起看的"值班记录"；机器可读的状态在 `state.json`。

## 怎么换班

1. 交出方：先把活干完并自测，`git commit`，然后改 `state.json` 的 `holder` 为接手方。
2. 交出方：在下面追加一条记录。
3. 交给用户：告诉用户"把《接手提示词》贴给另一个 AI"。
4. 接手方：读 `AGENTS.md` 第 0 节 + `state.json`，确认 `holder` 是自己，再开工。

## 换班流程图

```
AI 干完活
  ↓
① 自测通过 + git commit
  ↓
② 改 state.json：holder 换成接手方，填 nextAI / nextAIReason
  ↓
③ 在下面追加一条交接记录
  ↓
④ 汇报末尾给「—— 下一步 ——」区块，告诉用户找谁、贴哪段
  ↓
用户查收无误 → 复制《接手提示词》对应段落 → 贴给下一个 AI
```

## 记录格式

```
### [时间] 交出方 → 接手方
- 分支：
- 本次做了什么：
- 当前状态 / 未完成的部分：
- 已知风险或坑：
- 接手方第一步该做什么：
```

---

### [2026-09-29 22:50] WorkBuddy（用户直接委派）→ Codex

- **分支**：`main`

- **本次做了什么**：这个项目从"没有协同机制、文档自相矛盾"整理成"可交接"的状态。共四类：
  1. **确定路线**：用户拍板走 **Web 应用**（Vue 3 + Vite），废弃微信小程序 / uni-app。
     仓库地址和文件夹名都保持不变（用户决定），只把 `frontend/` 重建。
  2. **文档治理**：
     - 新建 `AGENTS.md` —— 唯一权威文档（协同规则 + 项目定位 + 命令 + 进度快照 + 提交规范）。
     - `CLAUDE.md` 改成**指向 `AGENTS.md` 的指针**（原来它自己就是一套规则，和全局规则必然分叉）。
     - 删除 `START_HERE.md` —— 它写的是**作废的小程序路线**（`npm run dev:mp-weixin`、微信开发者工具），
       还写死了 commit 号、写着"等待推送到 GitHub"（实际早已推送）。
     - 一次性任务书 `CODEX_TASKS.md` → `docs/archive/`。
     - 按小程序写的 `docs/UI_DESIGN.md`、`docs/DEVELOPMENT.md` → `docs/archive/`（后者改名 `DEVELOPMENT-miniprogram.md`）。
     - 新建 `docs/CONVENTIONS.md`（代码规范，从原 `CLAUDE.md` 拆出来）。
     - 重写 `docs/DEVELOPMENT.md` 为 Web 版；修正 `docs/API_DESIGN.md` 里的作废内容
       （微信登录 → 邮箱+密码注册/登录；`uni.showToast` → 待实现的 Web toast）。
     - 修正 `README.md`、`PROJECT_PLAN.md` 对 `CLAUDE.md` 的过期引用。
  3. **建立协同机制**：新增 `.workbuddy/coop/`（`state.json` / `BATON.md` / `接手提示词.md`），
     `.gitignore` 加入 `.workbuddy/memory/`。
  4. **顺手清障**：`.git` 里有个 1 小时前留下的陈旧 `index.lock`（0 字节、无 git 进程占用），
     已确认后删除 —— 它会让人误以为"git 命令莫名报错"。

- **当前状态 / 未完成的部分**：
  - 本轮改动已在 `main` 上**本地提交，未 push**（用户没说 Push）。
  - `frontend/` **仍是作废的 uni-app 代码**，没有动 —— 删除并重建属于代码改动，按分工归 Codex 执行。
  - `docs/archive/` 是只读归档，不要再更新里面的内容。

- **已知风险或坑**：
  1. ⚠️ **两份全局规则文件（`C:\Users\lenovo\.codex\AGENTS.md`、`C:\Users\lenovo\.claude\CLAUDE.md`）
     只在 AI 新会话启动时读取。**已经开着的 Claude / Codex 窗口不会自动生效，
     需要用户当面把新口径贴给它们一次（《接手提示词》里已备好）。
  2. 旧 `frontend/` 里是 uni-app 代码，`package.json` 的 scripts 是 `dev:mp-weixin` 之类，
     **不要试图直接在它上面改**，要整个删掉重建。
  3. 项目**尚未部署到 Vercel**，也没有 `.env` 文件。所以现在 push 只是把代码传到 GitHub，
     线上没有任何网站会变 —— 汇报时不要说成"已上线"。
  4. 根目录的 `.env.example` 位置不对（Vite 项目在 `frontend/` 下），Sprint 1.1 时一并挪到 `frontend/.env.example`。

- **接手方第一步该做什么**：
  1. 读 `AGENTS.md` 第 0 节和第 1 节，读 `state.json`，确认 `holder` 是 `codex`。
  2. 读 `docs/archive/CODEX_TASKS.md`（Sprint 1.1 的完整任务说明，含命令与代码片段）。
  3. 执行 Sprint 1.1：删除旧 `frontend/` → `npm create vite@latest frontend -- --template vue` →
     装依赖 → 配 Tailwind / Vue Router / Pinia / Supabase 客户端 → 建目录骨架与 5 个占位页面。
  4. 验收：`npm run dev` 能起、`http://localhost:5173` 能开、Tailwind 生效、路由能切换、控制台无报错。
  5. 完成后 `git commit` 存档，**不要 push**（等用户说），然后按 `AGENTS.md` §0.7 交给 Claude 复核。
