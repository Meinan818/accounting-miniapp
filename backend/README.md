# 喵叽智账后端

Java 21、Spring Boot 3.5.16、Spring Security、Spring JDBC、Flyway、MySQL 8.4。复用已有草稿，以直接SQL表达用户归属和版本条件，暂不引入MyBatis。前端server模式已接此服务；默认演示独立保留，不自动导入账本或照片。

## 本地运行

需要 Java 21 与 Maven 3.6.3 或更新版本。项目内已有 Maven 3.9.11 时，脚本优先复用；否则使用 PATH 中的 Maven。脚本将 Maven 依赖和临时目录限定在项目盘，不安装全局工具、不更改系统 TEMP/TMP。

```powershell
cd E:\XiangMu\未定项目\backend
.\maven.ps1 test
.\maven.ps1 package
```

`test` 使用独立内存 H2，不连接真实 MySQL。H2 通过不能替代 MySQL 或真实 HTTP 检查。

按 `.env.example` 的说明在本机配置 `.env.local.properties`，连接独立的 `miaoji_dev` 开发库；配置被 Git 忽略。正式服务应使用专用的最小权限数据库账号，本轮不修改 MySQL 权限。启动时工作目录必须为 backend：

```powershell
.\run.ps1
```

默认只监听 `127.0.0.1:8080`。启动时 Flyway 在已批准的新空库建立表，拒绝基线化已有表，并禁止 clean。不要将配置指向已有业务库。服务重启使内存登录会话失效，重新登录后账单仍在 MySQL。

## API 最小约定

接口不接受浏览器指定账单所属用户；服务端始终使用已登录身份。金额输入/返回为十进制字符串，业务日期为 `YYYY-MM-DD`，账单 ID 为 UUID，用户 ID 为字符串。

| 方法与路径 | 输入/行为 |
|---|---|
| GET `/api/auth/csrf` | 返回 `headerName` 和 `token`，建立匿名会话 |
| POST `/api/auth/register` | JSON `username` / `password`，成功 201，不自动登录 |
| POST `/api/auth/login` | form-urlencoded `username` / `password`，成功 204 |
| GET `/api/auth/me` | 返回当前账号 ID 和用户名 |
| POST `/api/auth/logout` | 204，失效会话并删除会话 Cookie |
| POST `/api/records` | JSON `type, amount, date, category, note`，必须带UUID格式`Idempotency-Key`；首次201、原请求重放200 |
| POST `/api/records/batch` | JSON `{records: [...]}`，1–5笔整组确认，同样必须带`Idempotency-Key` |
| GET `/api/records?month=2026-10&page=0&size=50` | 当前账号当月账单，page 从 0 开始，size 1–100；返回records/page/size/total |
| GET `/api/categories` | 当前8支出/6收入预设分类标签，需要登录 |
| GET `/api/records/snapshot` | 本人完整历史与逻辑删除事实，返回`{records:[{record,deletedAt}]}`；最多5000条，超限413 `LEDGER_TOO_LARGE`，不静默截断 |
| GET `/api/records/{id}` | 当前账号的有效账单 |
| PUT `/api/records/{id}` | JSON `{version, record: {...}}`，200 返回新版本 |
| DELETE `/api/records/{id}?version=0` | 204，逻辑删除，不彻底擦除历史 |
| GET `/api/statistics/month?month=2026-10` | `income, expense, balance, count`，排除已删除记录 |
| GET `/api/statistics/month/detail?month=2026-10` | 同月收支/笔数及按收入、支出分别聚合的分类金额/笔数/占比 |

所有写请求带 CSRF 响应指定的请求头，并保留会话 Cookie。登录/退出后旧 CSRF token 失效，必须重新 GET `/api/auth/csrf`。用户名为 3–32 位 ASCII 字母/数字/下划线并按小写唯一；密码为 12–64 位可见 ASCII，BCrypt 散列，不静默截断。

创建账单时客户端为一次确认生成UUID请求键，网络超时、重复点击与重新登录后的同次重试必须复用它。相同账号/键/内容返回原入账回执，响应头`Idempotency-Replayed`标明`true/false`；金额`1`和`1.00`视为同一内容。不同内容、条目顺序或单笔/整组接口混用同键返回409 `REQUEST_KEY_REUSED`，不会覆盖旧内容；不同账号的同键彼此独立。

账单列表可叠加`type=income|expense`、精确`category`、`date=YYYY-MM-DD`及`q`（最多120字符）；日期必须属于所选月，错误类型/分类组合拒绝。未指定收支的“其他”匹配两个类型，指定类型则区分。文字按空白分词，各词可跨备注、分类、金额、日期、业务时间、收支中文标签匹配且必须全部满足；大小写不敏感，`%/_/!`按普通文字处理，不接受SQL片段扩大查询。total是筛选后有效笔数，超过末页仍返回正确total；筛选不会改变月统计。

可选`time`为严格`HH:mm`业务时间，提供时会存储/校验，并参与防重内容判断。未提供的旧账单保留未知且不补当前时间，响应不显示该字段；省略时间的旧V2请求指纹和回执保持兼容。前端remark对应API note、金额转十进制字符串，图标/说明由前端分类与备注推导；server模式已切真实账号数据源。

前端发送`X-Expected-Account`断言当前页面身份，与真正Cookie会话比较；不一致409 `ACCOUNT_CHANGED`，在CSRF前阻断旧页读写或退出另一账号。这不是指定权限的用户号，所有归属仍取真实会话。私有头像GET可带`expectedAccount`同样断言，避免跨标签换Cookie后显示错误账号图片。

请求键、所有账单和回执在同一数据库事务中保存；整组先完整校验，任何写入/回执保存失败全部回退，失败后同键可重试。数据库主键约束负责并发防重，不依赖单进程锁。回执是当时入账的固定快照，重放不修改或恢复之后已编辑/删除的账单；当前金额/删除事实必须重新读取账单或统计。防重请求目前永久保留，不自动清理或让旧键再次入账；正式前端通过服务端版本草稿确认；旧单笔/整组防重接口保留兼容。

金额大于 0、最大 999999999.99、至多两位小数；日期年份 1000–9998；备注最多 200 字。分类当前仅固定预设并校验收支匹配。请求体未知字段拒绝，其他账号账单统一 404；401 为未登录、403 为 CSRF/权限拒绝、409 为用户名重复或账单版本冲突、503 为存储暂不可用。错误响应不返回密码、SQL 或请求原文。

## 尚未完成

当前不是完整B/C验收：自定义分类、服务端对话同步、真实AI均未实现。正式前端已开发版联通，生产实际交互、真机及用户正式功能验收未完成；聊天历史暂按账号隔离存在浏览器。旧整组接口接收已确认内容；正式前端已使用下方服务端草稿确认，聊天整理仍规则模拟。旧演示数据与照片不会自动绑定账号、导入或上传。没有部署或收费调用。

兼容性依据：[Spring Boot 3.5 环境要求](https://docs.spring.io/spring-boot/3.5/system-requirements.html)、[Spring Security 会话](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html)、[CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)。实际验证见项目交接 LOG。

## 正式账号资料与头像

GET `/api/profile`读取当前账号名片；PUT同路径传`{version,nickname,signature,avatar}`，昵称1–20个Unicode码点、签名最多60，avatar为cat/paw/flower/photo。photo需先上传，未知字段拒绝，旧版本409。注册与默认名片同事务创建；V4为既有账号建立默认名片，不读取浏览器本地资料。

POST `/api/profile/avatar?version=N`使用multipart字段`image`，只接受2MB以内的有效JPEG/PNG，边长最多4096、总像素最多400万。服务端检查签名、实际解码及截断警告，居中裁剪256px、奶油底JPEG重新编码并舍弃元信息；前端可将WebP在本机处理成JPEG后上传。正常上传返回新资料版本。实际容器超限返回413，非法图片400，版本冲突409。

GET同路径只向当前登录身份返回其照片，响应JPEG及`Cache-Control: no-store`；未上传404、匿名401。用户不能指定文件路径或照片所属账号。所有写入保留CSRF；照片文件采用随机UUID，数据库保存失败清理本次新文件，旧头像文件保留，不执行历史清理。

默认文件存于`backend/storage/`，可用`MIAOJI_STORAGE_DIR`指定独立路径；multipart和Java临时目录位于项目盘，`run.ps1`只设置当前进程环境并恢复。storage、凭据、缓存不入Git。正式备份需要同时保存数据库与storage，当前仅本机开发，尚无生产容量/备份策略或照片删除功能。

## 账单操作审计（V5）

账单创建、修改、逻辑删除的操作与前后版本在ledger_audit中与业务同事务保存，失败一起回退；入账防重重放不追加事件。只记录账号、账单ID、操作、版本、创建请求键和时间，不复制金额、备注、照片或认证信息。旧账单不补造历史事件；当前没有审计查询界面或管理端，记录仅供后续可靠性核查，未实现完整合规审计。

## 登录和注册频率保护

同一连接地址在60秒窗口内合计最多20次登录/注册尝试，超过返回429 AUTH_RATE_LIMITED和Retry-After秒数。CSRF先验证，之后在密码计算前限流；CSRF读取、退出、普通业务不计入。窗口到期恢复，不永久锁账号，不因换Cookie/用户名或伪造X-Forwarded-For重置。成功尝试也计数。

可配置miaoji.auth.attempt-limit、window-seconds和address-capacity（默认10000个地址）。单调时钟和原子内存计数，不记录密码或用户名；容量满时拒绝新地址而不驱逐活跃限制，过期桶按需清理。目前仅单进程，重启会重置；经Vite代理的请求共享本机地址，不宣称已有分布式限流或生产可信代理配置。

## 服务端版本草稿（V6）

GET /api/drafts/{UUID}读取本人草稿；PUT同路径{records:[...]}首次建立，重复同ID/同规范内容返回现状，不同内容409。PUT带version修改OPEN草稿，版本加1，不延长首次24小时有效期。全部1–5笔字段先验证，保存草稿不入账。POST /{id}/cancel带version取消，重复取消可回放；已确认不可取消。未自动同步浏览器未确认聊天历史。

POST /{id}/confirm带{version}及Idempotency-Key（须等于草稿UUID）：行锁校验归属、版本、OPEN与有效期；草稿CONFIRMED/固定回执、原防重请求、账单、操作审计在同一事务提交，任一失败全回退。旧版本409，已取消409，过期未确认410；已确认同版本重试200原回执，首次201，重放不恢复后续改删。其他账号404。V6不导入旧草稿、不补造历史，24小时后不自动清理记录。

正式客户端在用户点击保存/确认后先持久化UUID意图，保存服务端草稿，验证内容和版本并在本机持久化版本，再发送确认；网络/存储失败保留原操作，版本变化阻断。旧已成功batch意图可同键回放兼容，演示模式不调用这些接口。尚无服务端对话同步或草稿恢复列表。

## 大账本分段读取（V7）

GET /api/records/snapshot/page?size=500每段最多500条，按稳定账单UUID递增，包含逻辑删除事实。返回{records,revision,nextAfter}；续页必须携带after与第一段revision，末段nextAfter=null。同账号成功创建整组/修改/删除事务中增加ledger_revision；重放和失败不增加。每段repeatable-read读取版本和记录，中途写入版本变化409 LEDGER_CHANGED，客户端保护旧完整账本，不混合新旧页。旧snapshot仍保留5000上限兼容，正式前端改用分页并只在完整读取后替换。

当前是分段传输，客户端仍保留完整账号账本作既有计算和列表展示；未宣称无限容量/虚拟列表或生产性能指标。单页SQL使用(user_id,id)键范围，不依赖OFFSET。
