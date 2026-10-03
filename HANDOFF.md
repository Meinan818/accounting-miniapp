# 喵叽智账 · 免费GLM切换、等待中止与整组纠正保护

更新：2026-10-04。本文件保存当前开发进度，未触发第2次压缩或新建聊天。用户恢复持续开发并选择先试GLM-4-Flash-250414；普通开发、修复、验证、文档与本地commit自主执行，不Push、不部署、不增加费用、不用子代理、不改全局。

## 本次聊天与压缩规则

本会话实际可识别compact **1次**，已当场告知并写STATE。同一聊天压缩恢复不能归零；真正新窗口从0开始，旧会话次数只作历史。不能将文档/摘要提及算成事件，不按token或对话长度估算。

第2次实际识别立即停止业务代码，整理本次聊天真实内容、架构、成果、待办、踩坑和关键路径到根HANDOFF，同步NEXT/STATE/LOG/MISTAKES；用set_thread_title将当前对话改为实际任务概括并核返回。检查差异/归属/秘密，本地commit后创建gpt-6.1-sol、high新聊天。未验证代码按待续保存，不为了交接补代码；创建失败保留文档并停止。当前只是第1次，尚未执行该自动交接；不自动Push，不创建codex.md。

本次聊天：接手旧HANDOFF并按用户指导补SMTP，发信200且用户确认收到；启用GLM-4.7-Flash并真实联通。用户正式网页反馈等待、AI_TIMEOUT与AI_PROVIDER_BUSY后询问免费替代，选择GLM-4-Flash-250414。现已切换、补等待与停止、修短句改价缺笔；用户随后明确“没问题了”，本轮模型切换及聊天流程获认可；停止按钮/窄屏/真机未获单独逐项反馈。

## 架构、功能与保护边界

Vue3/JavaScript/Vite/Pinia + Java21/Spring Boot3.5.16/Security/JDBC/Flyway + MySQL8.4.11独立miaoji_dev。正式server与默认demo数据独立，保留已验收猫猫手账外观。保护原账本/对话/资料/照片/素材，不自动导入或给旧账号绑定邮箱。

V1认证与本人账单、V2整组幂等事务、V3分类查询/业务时间、V4资料/256px私有照片、V5同事务操作审计、V6草稿版本确认、V7一致分段账本、V8邮箱验证码注册均已有实现。大账本仍全量内存展示；尚无完整服务端聊天同步、虚拟列表、朋友外网访问或生产部署。旧无验证注册默认关闭，旧账号仍可登录。

163 SMTP真实投递用户已确认收到，完整网页注册成功未获单独明确反馈。真实凭据只留忽略的backend/.env.local.properties；不显示、不提交、不替换用户密钥。测试profile明确禁用真实邮件/AI并清空AI key，单独脚本只发合成文字。

## 当前模型与聊天链路

固定glm-4-flash-250414，沿用原智谱项目密钥，不能自动换付费FlashX或用Kitool。官方模型与定价已核：
- https://docs.bigmodel.cn/cn/guide/models/free/glm-4-flash-250414.md
- https://docs.bigmodel.cn/cn/guide/start/pricing.md

当前官方列输入输出免费、支持JSON；同平台免费仍受账号限额和并发约束，不保证每次成功/时延。初步三次真实解析约1413/366/1646ms，仅该组合成实测。

POST /api/ai/parse登录/CSRF/身份断言、1000字（含追问）、最多5条context、1200输出token/64KiB响应，5秒连接/60秒总期限，前端65秒；每账号6次/分钟、本进程2并发，不自动重试。平台429对应AI_PROVIDER_BUSY、超时504对应AI_TIMEOUT。模型只整理草稿，不读账本或写数据库；确认才走V6事务，统计读真实账单。

新整理、AI追问补充和追加经真实模型；完整草稿中的明确金额/日期纠正及歧义编号选择复用applyDraftInput确定操作，保留其余候选及UUID，AI草稿不强制补消费时间。前后端拒绝完整输出少于已有候选数。此保护没有模拟新模型请求成功；AI错误保留原草稿。演示路径仍独立规则。

等待显示秒数，15秒提示响应较慢；“停止本次整理”中止客户端等待、保留原草稿，迟到成功不能更新组。离页清理计时器/请求，sendGeneration避免旧请求finally干扰新发送。停止不保证平台任务立即结束。GUI与按钮实际观感尚未验证。

## 最新验证与保留的失败

- 最新backend-package-correction.log：87项全测试及package通过（含整组少返回候选拒绝）。
- 最新frontend-test-final.log：192项全部通过；build-demo-final.log与build-server-final.log两构建通过。含取消迟到响应、两笔改价保留、歧义编号、缺笔拒绝、含修改字样的追加仍调用模型。
- real-1791047055366/glm-real-result.json：新模型/Java/MySQL9项通过，多笔43、缺金额追问、完整纠正41、确认前无入账、确认重放不重复。正常运行服务没有临时legacy注册开关。
- source-1791047721760/result.json：前端源模块经5174代理真实Java/MySQL/GLM6项通过（含昨天面包日期与无写入）。
- 最新source-1791048339634/result.json：用户原句5项通过，午饭25、咖啡18两笔43；咖啡改16后两笔41且仍未入账。改价走确定操作不发模型。
- 失败原文全部保留：首次脚本未等HTTP ready、相对日期错、非法输出、短句改价仅返回1笔；补日期参考/消费分类/完整JSON示例后复验，缺笔最终通过上述保护及原句验证。前端追加含“改成”被误路由的失败测试保留frontend-append-before.log，显式追加排除本机纠正后192项通过。

旧4.7模型正式网页的AI_TIMEOUT/AI_PROVIDER_BUSY反馈不能被HTTP成功覆盖，用户已确认本轮新模型聊天流程无问题；等待停止交互、窄屏、真机及其他页面未获单独逐项反馈。当前没有可调用的浏览器交互工具，不冒称GUI验证，不绕过历史权限拒绝，不主动切换用户浏览器。

## 已认可流程与下一步

本轮此前提供的验收为：刷新5174重新登录，输入“午饭25，咖啡18”再“咖啡改成16”，核两笔41元、确认前无新增、确认后新增两笔并刷新保留。用户现已反馈无问题，不重复要求操作。已有真实账单不删，不能要求总账绝对为41元。停止按钮仍只有技术证据，不要求故意重复请求触发平台限额。

用户已反馈“没问题了”，不重复要求本轮聊天验收。Codex继续本机启动入口及运行说明，普通保存后继续既有路线；不将该反馈扩大为全部异常场景/真机通过。朋友访问方式、上线/费用/真实数据或权限重要变化需单独确认。

## 关键路径与运行

后端GlmDraftParser/Controller、LedgerService与RecordInput校验、src/test/resources/application-test.yml；前端api/aiDraft.js/client.js、utils/draftEngine.js、views/Chat.vue、conversationStore与DraftGroupCard。沿用JavaScript与既有测试，不加无关依赖/大重构。

Java D:/JavaDev/jdk-21；Maven .workbuddy/memory/backend-foundation/apache-maven-3.9.11/bin/mvn.cmd，同目录maven-repository。TEMP/TMP仅当前任务指向E盘材料tmp，npm缓存E:/CODEX/.cache/npm，不改系统环境/执行策略。

最新自身正常Java PID19940、Vite PID20820（8080/5174），下次核命令/HTTP而非相信旧PID。正常Java启动jar已包含最新后端保护，Vite读取最新前端；自身PID记在材料local-server-pid.txt。停止前核归属，package时先停自己的Java。

MySQL客户端C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe，工作目录必须.workbuddy/memory/backend-foundation，用相对--defaults-extra-file=mysql-client.cnf且不回显凭据。backend/storage、properties和内部材料忽略，不纳入Git；所有新旧合成数据保留。

最新材料.workbuddy/memory/glm4-switch-2026-10-04；早期SMTP/4.7在glm-integration-2026-10-04。旧备份/失败/浏览器拒绝及恢复原文保留，详见LOG/MISTAKES。一次组合停止/启动/验证命令被自动审核拒绝，只返回blocked by policy；拒绝未执行，后续按独立最小工具操作核归属并成功，不更改权限或规避策略，不推断拒绝原因。

## 最新本机启动入口（2026-10-04）

用户已认可聊天并要求无事不打扰、自己继续开发。根start-local.cmd可双击启动已有Java jar和正式Vite；scripts/local-dev.mjs --check只读核环境和端口。无新依赖/收费/编译/MySQL启动/策略变更/浏览器切换，仅127.0.0.1的8080/5174；任一端口占用退出并保护原服务。HTTP CSRF与server模式模块就绪才报启动成功，Ctrl+C/失败/退出只停自己创建的子进程。缓存/临时/分次日志在项目.cache内，参数错误退出码保留。

新增scripts/local-dev.test.mjs 8项通过，node --check及cmd检查通过；真实现有Java/MySQL/Vite独立临时端口启停7项通过，原5174前后CSRF200。未调AI/邮件或写账单，原Java19940/Vite20820保持。Windows GUI双击/直接关闭窗口未单独实测，源码变更后仍需手动package再启动。详见docs/DEVELOPMENT现行入口；下方旧演示说明明确历史。材料local-start-2026-10-04忽略保留。

下一步继续聊天追加、日期与追问边界的离线检查/回归，无需用户操作；不重复要求已认可功能验收。本会话compact仍1，第二次停止/总结/改名/commit/指定模型新建规则保留。本轮验收文档替换误改及修正记录见MISTAKES，错误提交仅本地并已后续修正，无Push/部署。
