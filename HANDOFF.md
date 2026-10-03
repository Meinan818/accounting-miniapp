# 喵叽智账 · 用户临时暂停交接

2026-10-03：用户外出，明确要求暂停开发，本次由用户手动新开对话；Codex不得自动create_thread。当前对话已改名「喵叽智账：邮箱验证注册与GLM草稿适配交接」。完成本地commit后停止；不Push、不部署。

## 压缩计数与授权

本会话实际可识别compact **1次**，已写STATE；旧会话2次不继承。本次暂停不是第二次compact。新聊天计数从0开始；以后第二次实际事件须立刻停代码/交接/commit/改名，再按授权新建gpt-6.1-sol、high聊天。此次由用户手动选择同样模型和强度。

用户新增明确要求：每次识别实际compact，立即当场向用户汇报“本会话第N次上下文压缩”并同步STATE。本轮第一次更新文件后未明确汇报，已承认并记录防错。新窗口接手先将STATE计数设0、注明全新会话基准；旧1只作历史，不能因摘要提及而计入新窗口。

普通规划/实现/修复/验证/文档/本地commit持续授权仍保留，用户最终验收；本次暂停期间不继续开发。只维护本项目，不修改全局，不用子代理。保护全部原账本、照片、对话、资料、素材和内部材料，不reset/clean、不自动导入演示或绑定首次账号。

## 新对话读取与第一步

1. 读取本文件、AGENTS、PROJECT_PLAN、.workbuddy/handoff/NEXT/STATE/MISTAKES及LOG最新条目，核Git/代码/服务现场，不重复开发已完成项。
2. 先核SMTP配置识别：用户已回复「SMTP已配置」，但实际读取backend/.env.local.properties后检查configured=false。只核变量名/是否非空/是否启用，不输出邮箱授权码、密码或整个文件；未定位原因。验证请求在检查处提前返回，**没有发送真实邮件**。不要假称SMTP配置有效或投递成功。
3. 然后补GLM新增代码编译、针对合成测试、全量测试与必要HTTP边界。仅完成验证后继续前端真实草稿适配；不能以新增源码当作已经接通真实AI。
4. 真实SMTP启用后，可向配置发信邮箱自身申请验证邮件，并明确区分SMTP接受与收件箱送达。真实用户注册GUI由用户自行输入验证码/密码；不要在聊天收集秘密。GLM真实外发需核凭据及数据边界，不从Kitool取聊天密钥。

## 架构与已完成功能

Vue3/JavaScript/Vite/Pinia + Java21/Spring Boot3.5.16/Security/JDBC/Flyway + MySQL8.4.11独立miaoji_dev。默认演示独立保留；显式server模式连接真实账号。认证Cookie/CSRF/账号归属、单笔与1–5笔整组幂等事务、版本改删/逻辑删除、分类查询/月统计、资料及256px私有照片已有实现。已验收猫猫手账外观保留。

本会话保存节点：
- 9e0576d V5账单操作审计，与业务同事务，不复制金额备注照片，52H2/9MySQL检查。
- 29ad5e8 登录注册限流及后续新对话模型规则，57后端/6真实HTTP检查。
- 164cc36 V6服务端版本草稿与前端确认，62后端/176Node/两构建/11源模块HTTP/8草稿HTTP。
- a3ba820 V7分段一致账本读取，64后端/178Node/8MySQL/5001笔GUI；仍全量内存列表，未虚拟化。
- 3bea467 V8邮箱验证注册、邮箱密码登录与旧账号兼容。官方starter-mail已授权，163。新注册验证码SecureRandom六位/BCrypt，5分钟、60秒重发、5次错误、邮箱+UUID绑定、一次消费；错误次数提交，SMTP失败挑战回退。旧无验证注册默认403；旧账号不自动绑定邮箱。72后端/package、180Node、两构建、9MySQL HTTP通过。HTTP明确植入合成挑战，非真实投递。

最新产品决定：GLM-4.7-Flash（不换付费FlashX），不付费部署，先本机自己使用，朋友访问以后决定；邮箱验证码注册、平时邮箱+密码登录，163与官方mail依赖。未部署、没有真实GLM调用。

## 本次待续代码（未编译/未测试）

新增backend/src/main/java/cn/miaoji/ledger/GlmDraftParser.java与GlmDraftController.java；application.yml/.env.example增加默认禁用的MIAOJI_AI_ENABLED与后端MIAOJI_GLM_API_KEY。源码仅是草稿实现，**未编译、未测试、未打包、未接前端、未真实调用**。

拟定POST /api/ai/parse，已登录/CSRF/原身份断言保护，输入message/date/context（0–5条已完整候选记录），只返回ready或needs_input。固定免费模型/智谱官方endpoint，最多1000字输入、1200输出token、20秒请求/5秒连接超时、64KiB响应上限、拒绝重定向；每账号6次/分钟和全局2并发。模型输出严格JSON/字段/金额/分类/日期校验，无数据库写入，不读取整本账单。实际行为仍须测试，尤其JSON异常映射、响应体大小与超时、并发槽释放、限流、匿名/CSRF及错误提示。当前前端聊天仍规则模拟，服务端草稿于确认时建立，不是完整服务端会话同步。

## 实际证据与运行现场

材料根.workbuddy/memory/fullstack-reliability-2026-10-03，不入Git；current-run指向run-edc7df2757444e4e81c5afc245c3e57d。源码修改前source-before-glm.zip已在该run保存。新旧合成数据全保留，V8已实际迁移；没有新增GLM数据库迁移。

email-package-final.log：72项后端测试通过、package成功；email-frontend-test-final.log：180Node通过；email-build-server/demo.log两构建成功。email-http-1791038379011-8252fc78/result.json在材料根（非run下面），9项通过，首条标签仍V5，V8以真实Flyway日志为准。

本轮browser-result.json实际12项，含320px邮箱注册与未配置SMTP明确失败；email-registration-320.png/email-unconfigured-320.png保存。此前8/9累计数少算1，最新按文件12核实。完整邮箱成功注册GUI、真实163投递、生产交互/真机/用户正式功能验收未完成。前轮约23项最终JSON缺失不补造。

本次尝试SMTP前启动Java PID34764（仍为邮箱节点已验证jar，不含新GLM源码），启动V8校验正常；配置检查configured=false提前终止，没有HTTP发信、没有SMTP投递。暂停时经路径/命令核实后已停止自身PID34764，8080无监听。Vite5174 PID31548保留；下次重核。不操作其他进程。

Java D:/JavaDev/jdk-21；Maven复用.workbuddy/memory/backend-foundation/apache-maven-3.9.11/bin/mvn.cmd，repo位于同目录maven-repository；缓存/TEMP/TMP只任务级E盘配置。Windows脚本曾被执行策略拒绝，不改系统策略，直接现有Java或mvn.cmd。MySQL CLI workdir须.workbuddy/memory/backend-foundation，相对--defaults-extra-file=mysql-client.cnf，不回显。backend/.env.local.properties和storage均忽略，不提交。

## 规范与本会话踩坑

Java沿用显式归属/版本SQL、同事务及现有RecordInput/ledger验证，前端保留JS与同一RecordStore、整数分。只写相关可回退改动，不加不必要依赖。秘密/账本/照片/内部ZIP/SQL/日志不入Git。普通已验证节点本地commit后继续，未验证节点按wip如实保存。

MISTAKES已保留：执行策略拒绝；scrollWidth误判；MockMvc ServletPath测试错误；草稿契约漏mock；大SQL失败具体根因未知；Set.add重复断言错误已纠正；Login局部patch上下文失败且原子未写。SMTP检查false根因未定位，不推断用户填错。原始浏览器拒绝与后续原5174恢复见LOG指定记录，再拒绝立刻停，不换地址/端口/CDP/工具绕过。
