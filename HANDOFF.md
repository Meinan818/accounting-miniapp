# 喵叽智账 · SMTP投递与GLM正式草稿接入

更新：2026-10-04。用户手动新聊天读旧HANDOFF后恢复持续开发；2026-10-03外出暂停已结束。普通规划、实现、修复、验证、文档和本地commit已授权，独立节点保存后继续；不Push、不部署、不新增费用，不用子代理，不改全局。

## 压缩、总结、改名和新建规则

本会话实际可识别compact计数 **0**；新窗口基准0，旧会话1次只作历史。不能将文档/摘要提及算成事件。每次实际识别立即当场告诉用户“本会话第N次上下文压缩”并写STATE。

第2次一识别就停止代码，整理本次聊天实际内容、架构、成果、验证、待办、踩坑及关键路径到根HANDOFF，同步NEXT/STATE/LOG/MISTAKES。交接前用set_thread_title改当前聊天为实际任务概括并核返回；检查差异/归属/秘密，本地commit（待续源码如实标未验证）后新建gpt-6.1-sol、high聊天。新建失败保留交接并停开发；不自动Push。此次文档更新是当前进度保存，不代表触发第二次压缩或已新建聊天。

## 已完成功能与架构

Vue3/JS/Vite/Pinia + Java21/Spring Boot3.5.16/Security/JDBC/Flyway + MySQL8.4.11独立miaoji_dev。演示与正式账号数据独立，已验收猫猫手账外观保留。保护原账本、对话、资料、照片、素材和内部材料，不自动导入或绑定旧账号邮箱。

V1认证/账单隔离、V2创建与整组幂等事务、V3分类查询及业务时间、V4资料/256px私有头像、V5同事务操作审计、V6草稿版本确认、V7一致分段账本、V8邮箱挑战与验证注册已有实现。大账本仍全量内存展示；无服务端完整聊天同步、虚拟列表、生产部署或朋友外网访问配置。

## 本轮SMTP与真实GLM证据

- 初次SMTP白名单核查：backend/.env.local.properties及进程环境都无所需SMTP键。用户按说明新增必要配置；随后开关true、用户名和授权码非空。没有回显值。
- 使用已验证邮箱jar，向配置发信邮箱自身申请验证码：HTTP200、JavaMail发送完成；用户明确回复“已收到”。已核实真实投递，不读取验证码。完整网页注册/登录仍待验收。
- 用户按官方API Keys入口配置GLM并启用，授权主动文字及候选交给智谱处理。固定免费glm-4.7-flash，不换FlashX，不从Kitool取密钥，不上传完整账本/照片。
- 首个完整解析20秒请求503，最短独立Java合成请求200证明密钥有效；较长独立探测45秒HttpTimeoutException，后续429/1302并发限制。失败保留，不将全部异常归因用户配置。现总期限60秒覆盖响应体，前端65秒；无自动重试，超时504 AI_TIMEOUT、上游429 AI_PROVIDER_BUSY明确区分。不能保证每次响应时延。
- 更新后真实模型/Java/MySQL检查8项通过：匿名拒绝、合成身份、多笔两笔43.00、缺金额追问且不猜、纠正两笔41.00、解析不写入、草稿未入账、确认与重放同回执。该脚本最后汇总因读取分页包装层r.amount而非r.record.amount失败，原failure/progress保留，不能冒称原9项全通过。
- 另外实际前端源模块经5174 Vite代理连接Java/MySQL/GLM的6项通过：登录、读取两笔41.00、原UUID草稿重试同回执、重试不重复、真实AI整理昨天面包3.50、候选整理仍不写账单。新独立result.json提供最终两笔41.00证据。新旧合成账号/数据保留。
- 最终86项后端全测试/package、189项前端Node、demo/server构建通过。测试profile明确禁用真实AI/邮件并清空AI密钥，不受本机启用配置影响。

## 当前AI路径与限制

POST /api/ai/parse需登录、CSRF、原身份断言，输入message/date/context（最多5条完整候选）；不读取账本、不写数据库。最多1000字（含追问上下文）、1200输出token、64KiB响应上限、5秒连接/60秒总期限、拒绝重定向；每账号6次/分钟、本进程2并发，账号平台限制可能更低，超时取消客户端不保证立即撤销平台任务。

服务端严格JSON重复/尾部/字段/金额字符串/日期/分类/最多120字备注校验，只返回ready或needs_input；金额与用户归属仍由现有账单服务验证。错误原文、密钥和模型请求内容不写日志或Git。

server聊天使用frontend/src/api/aiDraft.js，完整候选/待补充原文保留，改价/追加经GLM返回完整组；查询读取真实已保存账单，明确确认/取消在本机识别，保存走原V6事务。AI失败保护原草稿、不模拟成功。不提供时间时保留未指定，不伪造消费时刻。追问可刷新恢复，空候选不显示已记账。demo旧规则路径独立保留。

## 待办与下一步

1. 核Git/服务及STATE新会话基准，不重复已验证接口或重做已验收外观。
2. 优先正式网页注册→邮箱密码登录→聊天多笔/补充/纠正→确认→刷新与明细改删，核窄屏、空追问、未配置/超时提示和账号隔离。当前工具列表没有可调用的浏览器交互工具，本轮只有源码HTTP与构建证据，不冒称GUI通过；给用户本地链接自行验收，不主动切换浏览器，不绕过历史权限拒绝。
3. 修实际验收问题后完成这个本机闭环；朋友访问方式、费用/部署/权限改动仍另行决定。普通独立工作保存后继续，不重复问是否继续。

## 关键代码、环境与材料

后端GlmDraftParser/GlmDraftController；RecordInput/LedgerService共用校验；application-test.yml隔离真实外发。前端api/aiDraft.js、api/client.js、views/Chat.vue、stores/conversationStore.js、components/common/DraftGroupCard.vue。已追加模型、历史恢复及请求期限测试，未加依赖。

Java D:/JavaDev/jdk-21，Maven .workbuddy/memory/backend-foundation/apache-maven-3.9.11/bin/mvn.cmd，同目录maven-repository；任务TEMP/TMP和材料在E盘。MySQL客户端C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe只复用已有程序；workdir必须backend-foundation，--defaults-extra-file=mysql-client.cnf，不回显。运行jar时先核停止本轮进程再package，不改执行策略。

本轮材料 .workbuddy/memory/glm-integration-2026-10-04：smtp-result.json、glm-before*.log、glm-targeted.log、glm-package*.log、frontend-final.log、build-*-final.log、real-*/glm-real-progress/failure.json、source-*/result.json及服务日志/脚本。全部忽略，不入Git。旧材料及source-before-glm.zip保留；此前浏览器拒绝及原5174恢复见LOG旧条目，根因未知，再拒绝即停。

本轮测试临时开启旧合成注册仅供脚本，已停止并重启正常服务（无legacy开关）。当前本机服务入口8080，正式Vite5174；PID记录在材料目录local-server-pid.txt/vite-pid.txt，下次核现场而非信任旧PID。backend/.env.local.properties与storage忽略，不提交。未Push、未部署。

## 本轮踩坑

证据目录工作目录错配导致Maven未执行；测试辅助Runnable类型错误；合成用户名超32限制；测试profile继承真实AI开关意外外发合成文字；HTTP分页汇总读错包装层。失败原文与修正证据见MISTAKES/LOG，不能用后续成功抹掉首次失败。秘密均保留本机忽略配置，普通保存前用git-workflow检查差异/遗漏/敏感值。

## 收尾后的用户验收反馈（2026-10-04，覆盖上方待验收摘要）

用户实际5174聊天反馈等待、随后AI_TIMEOUT及AI_PROVIDER_BUSY，正式GUI未通过。当前4.7-Flash真实HTTP成功仅证明若干请求成功，不能证明稳定性；未取得完整网页注册成功的明确单独反馈。用户改问免费模型推荐，尚未改代码/切模型/新增模型调用。官方已核glm-4-flash-250414输入输出免费、支持JSON/128K，可沿用现密钥但同平台限额未必改善；OpenRouter公开模型当前qwen/qwen3.8-27b:free输入输出0/结构化输出，但需新密钥、免费每日限制和网络实测。下一步选定模型后实测接入，并补等待计时/中止反馈。本会话实际compact仍0，交接/改名规则继续保留。
