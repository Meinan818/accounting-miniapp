# 喵叽智账 · 第二次 compact 后的新会话交接

更新时间：2026-10-03。本会话实际可识别 compact 计数已达 **2**，已停止业务代码编写；本文件与相关工作必须先本地 commit，再创建全新项目聊天。新聊天计数从 0 开始，不能把旧 STATE 的 2 当作新会话事件。提交与新建结果以实际 Git/工具返回为准。

## 授权与接手顺序

用户全权委托本项目常规规划、开发、修复、验证、文档和本地保存，用户负责最终验收。保存后直接继续，不询问“继续吗”。仅重大费用、正式上线、真实数据/隐私/权限重要变化或确实缺少外部条件再询问；规则只维护本项目，不改全局。较大改动前先存档；不使用子代理。

1. 先读 `.workbuddy/handoff/NEXT.md`、本文件、`AGENTS.md`、`PROJECT_PLAN.md`、`STATE.json`、`MISTAKES.md`、`LOG.md` 最新条目。
2. 必须读 LOG 的“用户要求必须保留：浏览器验证失败，未解决”与“新对话接手、完整权限截图与5174实际恢复验证”。原始拒绝及后续恢复都保留；拒绝根因仍未知。再拒绝立即停该动作，不用别名/端口/CDP/其他浏览器/脚本绕过。
3. 核 Git、源码、进程、工具和浏览器库存。不要 reset/clean。全部原账本、对话、照片、素材和内部材料保留，不自动导入/上传或绑定首次账号。
4. 更新新聊天 compact 计数为 0，继续已授权开发。新聊天第二次事件再次停代码、更新本文件/入口、commit 后新建聊天；不建 codex.md，不用 token 或长度推测事件。

## 架构与已完成功能

- 前端 Vue3 Composition API、JavaScript、Vite5、Pinia、Vue Router、Tailwind；已验收猫猫手账外观、个人资料/本地照片、猫耳返回键保留。默认 dev/build 仍为独立演示，显式 `--mode server` 接正式账号。
- 后端 Java21 / Spring Boot3.5.16 / Spring Security / JDBC / Flyway / MySQL8.4.11。仅独立开发库 `miaoji_dev`；不改原数据库/权限。本机复用数据库账号不能当作生产配置。
- 注册、BCrypt 密码登录、Cookie 会话、CSRF、退出、当前用户；账单按真正会话身份隔离，金额 BigDecimal/DECIMAL 与字符串 API，业务日期/可选 HH:mm 时间独立。
- 单笔/1–5笔整组防重：先持久化 UUID Idempotency-Key，再请求；回执/请求键/账单同事务，异内容409，重放不覆盖后续编辑或恢复删除。版本改删、逻辑删除、筛选/分页/分类/月统计、V1–V4迁移已有保存节点。
- 正式资料 GET/PUT `/api/profile`，版本、Unicode昵称/签名校验；私有照片 POST/GET `/api/profile/avatar`，JPEG/PNG签名/解码/大小/像素校验，256px JPEG 重编码，失败只清本次新文件、旧照片保留。
- 最新联通：真实登录/注册与路由守卫、账号账本数据源、等待实际保存、打开编辑时版本、统计联动、资料/照片明确保存才上传。正式聊天仍为规则模拟，账单为 MySQL 真实持久化。
- GET `/api/records/snapshot` 返回本人历史及删除事实；最多5000条，超限413，不静默截断。当前前端月汇总/筛选读取完整账号快照并用既有纯函数计算，未实现大账本分页适配。
- 跨标签 Cookie 切账号：`X-Expected-Account`只断言旧页面身份，不赋予权限；不一致409 `ACCOUNT_CHANGED` 在 CSRF 前阻断读写/退出。私有图片同样有 expectedAccount 断言。客户端撤销旧缓存/页面。
- 演示键不改；正式对话 `miaoji_account_conversation_v1_<owner>`，防重意图 `miaoji_account_write_intents_v1_<owner>`。正式对话目前仅账号区分的本浏览器历史，尚未服务端同步。保存组 recordIds 按稳定回执ID恢复条目对应，不按金额/备注猜测。

## 实际证据与限制

本轮材料根目录：`.workbuddy/memory/frontend-backend-bridge-2026-10-03/`，不入Git。

- `run-f09803b801674fe1a7d64704f7b26320/tests-final-all.log`：174项前端 Node 测试通过。
- 同目录 `context-avatar-package-final.log`：49项后端 H2 集成测试、package 成功。
- 同目录 `build-final-all-server.log`、`build-final-all-demo.log`：server/默认两种构建成功。
- `run-http-1791031035888-3e050012/result.json`：前端源模块实际连接 Java/MySQL 的11项HTTP检查通过，含丢回执后同键重试、改删与账号隔离。首次失败目录 `run-http-1791030992942-ed0f0ff5` 保留。
- 第2次compact前，原5174内置浏览器已实际观察：注册登录、空账号账本、手动0.29→版本改0.30、两笔整组43.00确认保存/月总43.30、刷新查询、逻辑删咖啡后25.30与卡片删除事实、资料/预置头像/合成照片取消及明确上传、退出/错密码/B账号隔离、320px聊天无横向溢出、停机明确错误、重启登录后账本/照片保留、真实双标签旧A表单在B会话下42元保存被阻断且B无错写。
- 上述约23个开发版浏览器观察来自前轮工具现场及压缩摘要，最终检查JSON尚未落盘。现有 `deleted-card-before.png/txt`、`profile-server.png` 是局部证据。不能宣称完整结果文件存在或补造原始证据。
- 最后一条浏览器收尾调用中断，关闭第二标签/退出/320px登录/最终截图/markHandoff是否部分执行未知；320px登录不算通过。REPL已重置，旧 tab 变量无效，新聊天按库存重新绑定，不能猜标签状态。
- 生产构建实际交互、真机、跨设备、用户对正式登录功能人工验收未完成。真实AI、审计、服务端草稿与完整B/C均未完成；无收费、Push或部署。

## 当前环境与运行

交接现场只读核实：旧后端PID31156、Vite PID29800均不存在；8080、5174均无监听。摘要里“仍在运行”已过期。新聊天自行核实后合法启动，不冒称服务仍活，也不操作其他进程。

- Java：`D:/JavaDev/jdk-21`；Maven复用 `.workbuddy/memory/backend-foundation/apache-maven-3.9.11/bin/mvn.cmd`。
- backend工作目录：`./maven.ps1 test` / `./maven.ps1 package`，运行 `./run.ps1`；Windows先停经核实属于本轮的Java，再package，避免jar被占用。
- 前端正式开发：frontend工作目录 `node ./node_modules/vite/bin/vite.js --mode server --host 127.0.0.1 --port 5174 --strictPort`；同源 `/api` 代理8080。
- 默认演示 `npm run dev` / `npm run build`；正式 `npm run dev:server` / `npm run build:server`。先核端口，不覆盖原演示站点。
- 凭据在忽略的 `backend/.env.local.properties`，禁止回显。MySQL CLI调用显式 workdir 为 `.workbuddy/memory/backend-foundation`，用相对 `--defaults-extra-file=mysql-client.cnf`。
- 缓存/材料/临时文件使用E盘，任务级设置，不改系统TEMP/TMP，不擅自全局安装。
- `backend/storage/`与开发库全部保留；当前总数量没有最终核查，不填推测。

## 待办与推荐顺序

1. 新聊天计数归零后，补尚缺的收尾证据与必要正式联通复验，区分重新验证与旧记录，保持已验收外观和原数据。
2. 后端审计、服务端草稿版本/确认/事务与客户端确认衔接、登录限流；按独立范围实施、验证、保存后继续，不等用户“继续”。
3. 大账本分页与查询/汇总服务接入、正式对话服务端归属/同步等按架构逐步完善。
4. 真实AI先核当前官方接口、已有凭据和费用边界。没有已核实聊天配置，不把Kitool生图配置冒充聊天API，不发未批准收费请求。
5. 自定义分类、生产最小权限账号、文件备份/容量与部署另按阶段处理。真实演示数据导入需明确预览归属与批准。

## 规范、踩坑与关键路径

代码规范沿用 `docs/CONVENTIONS.md`；Java按已有 Controller/Service/Repository 分层、参数化SQL、归属和版本条件、整组事务。前端JS/Composition API、金额整数分，不引入第二账本；秘密不进源码、日志、前端VITE变量或提交。提交 `<type>(<scope>): <中文说明>`，只保存相关文件，本次不Push。

已确认错误完整见 MISTAKES：batch回执/201空正文契约猜错且模拟测试也错；刷新后卡片条目关联遗漏；旧模式说明/匿名提示；运行jar期间重打包失败；路径猜测/同patch重复路径；跨标签Cookie需要服务端身份断言；AGENTS标题被平台换行假设拆开。原失败材料保留，不用成功抹掉。早期本机数据库密码曾意外进入工具输出，未入Git；轮换尚未完成，不擅自改权限/其他程序配置。

关键入口：`frontend/src/api/{client,session,ledger,mode,remoteLedger,profile}.js`、`stores/{authStore,recordStore,conversationStore}.js`、`router/index.js`、`views/{Login,Chat,Bills,Profile}.vue`、`utils/groupRecords.js`、`frontend/tests/remoteLedger.test.js`；后端 `auth/AccountContextFilter.java`、`auth/SecurityConfig.java`、`ledger/{LedgerController,LedgerService,LedgerRepository}.java`、迁移 `backend/src/main/resources/db/migration/`、集成测试 `backend/src/test/java/cn/miaoji/`。

较大联通改动前源码存档 `source-before.zip`、`source-before-integration.zip` 均在本轮run材料目录。不要删除原照片、失败记录、存档或忽略文件；Git提交并不保存忽略的数据文件。
