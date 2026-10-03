# 喵叽智账后端

Java 21、Spring Boot 3.5.16、Spring Security、Spring JDBC、Flyway、MySQL 8.4。复用已有草稿，先以直接 SQL 明确表达用户归属和版本条件，暂不引入 MyBatis。前端仍使用原本的本地演示账本，没有接入此服务。

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
java -jar .\target\miaoji-backend-0.1.0.jar
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
| GET `/api/records?month=2026-10&page=0&size=50` | 当前账号当月账单，page 从 0 开始，size 1–100 |
| GET `/api/records/{id}` | 当前账号的有效账单 |
| PUT `/api/records/{id}` | JSON `{version, record: {...}}`，200 返回新版本 |
| DELETE `/api/records/{id}?version=0` | 204，逻辑删除，不彻底擦除历史 |
| GET `/api/statistics/month?month=2026-10` | `income, expense, balance, count`，排除已删除记录 |

所有写请求带 CSRF 响应指定的请求头，并保留会话 Cookie。登录/退出后旧 CSRF token 失效，必须重新 GET `/api/auth/csrf`。用户名为 3–32 位 ASCII 字母/数字/下划线并按小写唯一；密码为 12–64 位可见 ASCII，BCrypt 散列，不静默截断。

创建账单时客户端为一次确认生成UUID请求键，网络超时、重复点击与重新登录后的同次重试必须复用它。相同账号/键/内容返回原入账回执，响应头`Idempotency-Replayed`标明`true/false`；金额`1`和`1.00`视为同一内容。不同内容、条目顺序或单笔/整组接口混用同键返回409 `REQUEST_KEY_REUSED`，不会覆盖旧内容；不同账号的同键彼此独立。

请求键、所有账单和回执在同一数据库事务中保存；整组先完整校验，任何写入/回执保存失败全部回退，失败后同键可重试。数据库主键约束负责并发防重，不依赖单进程锁。回执是当时入账的固定快照，重放不修改或恢复之后已编辑/删除的账单；当前金额/删除事实必须重新读取账单或统计。防重请求目前永久保留，不自动清理或让旧键再次入账；服务端草稿的过期版本校验尚未实现。

金额大于 0、最大 999999999.99、至多两位小数；日期年份 1000–9998；备注最多 200 字。分类当前仅固定预设并校验收支匹配。请求体未知字段拒绝，其他账号账单统一 404；401 为未登录、403 为 CSRF/权限拒绝、409 为用户名重复或账单版本冲突、503 为存储暂不可用。错误响应不返回密码、SQL 或请求原文。

## 尚未完成

当前不是完整 B/C 验收：分类筛选/自定义分类/分类汇总、资料与照片接口、登录限流、服务端草稿/审计、前端联通和真实 AI 均未实现。整组接口直接接收用户已确认的内容，不冒充已有服务端草稿状态机。旧演示数据与照片不会自动绑定账号、导入或上传。没有部署，也没有收费服务调用。

兼容性依据：[Spring Boot 3.5 环境要求](https://docs.spring.io/spring-boot/3.5/system-requirements.html)、[Spring Security 会话](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html)、[CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)。实际验证见项目交接 LOG。
