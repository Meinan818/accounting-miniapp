## 2026-10-04 · 个人资料异步输入保护

- profile-interactions-2026-10-04/before.log实际3项1通过2失败：重复打开的第二次读取覆盖已填昵称；较早GET在PUT保存新版本后返回，覆盖名片。openProfile串行并在已打开时保留表单；loadProfile按代次/身份/离页核响应，保存撤销旧读取。
- 追加照片部分保存页面验证：POST成功/PUT失败/GET失败仍保留昵称及已上传照片版本，重试仅PUT；成功后旧profileError未清除的retry-before.log4通过1失败已复现并修正。不会再次上传或更改账单/原照片。
- 5项实际Profile setup+真实createProfileApi合成客户端集成、299项全量及demo/server两构建通过。源模块HTTP8项200仅证明本机Vite供给；GUI/真机/真实资料写入未验证，未调用模型/邮件/上传真实照片。
- 6756978普通Push成功，完整6756978b3e86f03ab006fa4afecaf548de05b265远端一致已核。compact仍1，automation沿用既有ID，不重复创建，完整定时成功仍未证实。
- 下一项核个人页月概况/最近7天是否随本机跨日跨月更新；Profile当前month是挂载常量，recentDays的computed未依赖响应日期，须离线取得证据后接已有useLocalDay，不写业务日期或强制重读账本。

## 2026-10-04 · 旧分类原型同名汇总

- category-prototype-2026-10-04/before.log实际15项14通过1失败：演示旧分类__proto__不是返回对象的自有分类，普通对象累加受原型属性影响；constructor也不能正确累加。两Store改Map累加及Object.fromEntries输出，旧名称/金额/记录不迁移不写入。
- 新回归验证__proto__=0.29、constructor=0.31、旧分类=0.07、月合计0.67，Object.prototype保持且存储0写入。294项前端及demo/server两构建通过；GUI/真机未验，无真实账单/AI/邮件调用。
- 首轮修复后的失败来自测试window缺removeEventListener且新增dispose触发，原日志保留，补完整测试替身后294通过；未修改浏览器业务来迁就替身。
- c07f229普通Push及远端完整c07f229e29246ea78c2f17c1513db0a554b70530一致已核；服务仍19940/20820且仅127.0.0.1:8080/5174，无部署。compact仍1，同聊天恢复保留；既有automation不重复创建。
- 下一项核本机Vite修改模块供给与交接记录，再继续资料编辑保存/读取与取消的组件状态时序；不能用源模块200覆盖GUI/真机验收。

## 2026-10-04 · 大额累计保护与整数分显示

- money-totals-2026-10-04/before.log真实复现1通过1失败：90,073笔合法上限金额的合计期望9007299999909927分，旧sumAmounts返回9007299999909928分。按每步安全整数校验，超限不显示错误金额；合法月累计可超过单笔上限。
- 首页/日历、明细月度/每日与聊天月汇总接安全结果；超限显示明确提示但保留日期、账单查询和编辑。合法汇总与结余直接用整数分输出，不把元小数重新转回分。账本分类超限时不继续累计，summaryError与storageError分开，不写原数据。
- 8项金额/正式Store/实际Calendar模板离线渲染、293项全量及demo/server两构建通过。首次渲染harness漏导出shiftCalendarMonth导致2失败，修正后通过；不是GUI/真机/浏览器交互验收。未安装依赖/发真实账单、模型或邮件请求。
- bb208a4普通Push成功，远端完整bb208a416f16d65692db235152d750668d6a74f6与本地一致，历史网络失败保留。compact仍1，automation沿用当前目标和每小时ACTIVE，完整定时成功仍未证实。
- 下一项核演示旧分类名在Store分类getter中的原型同名边界，保持旧账单及分类读取口径；统计Map已有保护，Store旧对象累加尚需离线取证，不因网页最终观感未反馈而停工。

## 2026-10-04 · 账本热更新快照与资源生命周期

- 本聊天实际compact=1，STATE已同步；同聊天恢复保留，第二次按规则立即停止代码交接。8项真实Pinia4.0.3热更新/实际Store源码离线集成、285项全量与demo/server两构建通过；GUI/真机/真实Vite页面未验证。
- before.log实际3失败：正式热更新快照变空，演示/正式监听由3变6。返回allRecords状态保留快照；Vite hot.data沿用按Pinia隔离的资源scope，热更新释放旧时钟/账号/storage监听，原Store dispose释放当前版本；用公开API，不改依赖或刷新页面。
- 补测发现返回状态后，dispose再换账号创建会回填原快照，recreate-before.log5通过1失败；skipHydrate限制新Store回填，热更新仍保留状态。旧请求scope退出即撤销代次，迟到读取/编辑不覆盖当前事实、不自动后续请求；跨月时钟和删除/组事实保持。
- 材料record-hmr-2026-10-04。新增离线测试纳npm入口，不安装依赖，不发真实账单/模型/邮件请求。先前1a1e163完整SHA=1a1e1632d5a5cda5e53d014ef8aed66efbf22735已核远端一致；服务19940/20820仍仅127.0.0.1:8080/5174，无部署。
- 下一项直接继续累计金额边界取证。已核统计有安全整数保护，sumAmounts/分类累加尚无同等保护；不冒称全站金额全面安全。自动续办沿用既有automation，不重复创建。

## 2026-10-04 · 正式与演示账本跨月缓存

- ledger-month-clock-2026-10-04/before.log实际复现：两个月账单均已加载，时间跨月后同revision重读省去替换，monthExpense仍0.29而不是新月0.31。computed只有records依赖，直接dayjs取月不触发更新。
- 正式/演示月getter接入已提取useLocalDay响应本机日；不改月筛选口径/账单日期，不强制替换同版本账本，不发写请求。正式跨月仍只2次首页读取，演示跨月0写入且dispose释放focus/storage监听。
- 31项正式账本针对、277项全量及demo/server两构建通过；3d361fa为此前独立保持行为时钟提取节点。没有新增真实账单/模型/邮件，GUI/真机未验，compact=0。
- 本次私有仓库/无Pages/0 workflows/0 deployments再由官方GitHub只读API核实，remote=915b933；普通Push后继续核完整SHA，不强推。下一项开发期Pinia热更新生命周期与缓存保留：已核本地4.0.3导出dist/pinia.js，hot临时Store不自动dispose，须离线取证再确定最小处理，不能冒称正式生产故障。

## 2026-10-04 · 手动取消时保留真实表单实例

- 使用已有Vue3.5.43/compiler-dom3.5.43、实际Add模板及RecordForm初始化脚本在Node自定义renderer验证组件时序，不安装依赖/浏览器，不称GUI。首轮harness漏SERVER_MODE导致3项不能渲染，修正后before-fixed-harness.log2通过1真实失败：用户12.34输入取消另一页草稿后变成0.29。
- 取消期间仅隐藏RecordForm，不卸载；恢复内容只在当前表单与初值一致时回填，有未提交修改则保留并显示实际提示。不根据后来的props偷偷覆盖输入，未知原时间不补造。取消未入账/重填仍须应用内明确保存，无自动入账/换键。
- 3项实际模板/初始化挂载、275项全量及demo/server两构建通过，manual-render-2026-10-04。harness按本地runtime的_rc协议设置运行时编译代理，原警告/失败保留，最终无Vue警告。新测试纳npm入口及Git，依赖/锁文件不变；GUI/真机未验，compact=0。
- 本地日历10eb7a3/e202d3d暂未核上传成功，重试443失败保留；当前继续核远端增量。下一项金额和整月汇总边界，先核既有金额函数、首页/明细/统计消费口径，不凭假设改逻辑。

## 2026-10-04 · 日历相邻月选日、边界与今日标签

- 源CalendarCard脚本离线执行真实复现：相邻月点击11月2日先发selected-date再发month，Home切月把选择改为11月1日，component-before.log保留；新helper缺失为另一个独立失败，不能混作真实旧业务复现。
- 改为先切月再发选日，Home原子核有效日期并同步其月份；1000/9999月份边界按钮及越界外月日期禁用，非法输入保留选择。六周网格/闰日保持，今日标签由Home响应today驱动，查看历史日时也随跨日更新。记录点使用有效日期Set，排除已删除，不做42次全账本扫描。
- 7项日历helper/源组件逻辑、272项全量及demo/server两构建通过，calendar-day-2026-10-04最终selection日志。GUI/真机/键盘及真实隔夜未验，原账本/账号/照片未改，无模型/邮件请求，compact=0。
- 10eb7a3已本地保存；其Push exit1(443/sideband断开)末尾虽打印Everything up-to-date，不能当成功，远端需重新核完整SHA。下一项核首页日历选择事件及日期范围回归收尾、当前本机模块供给，随后继续手动保存取消/重新填写的跨组件状态时序。

## 2026-10-04 · 首页跨日日期与历史选择

- Home今日/星期改为响应日期，60秒检查本机日、窗口focus/前台恢复即时核日期；跨日/跨月时默认今日选择跟随，用户正在看历史日期/月则保持，回到今天先刷新本机日期。不修改业务日期/账单，也不发网络请求。
- 新calendar模块3项跨月/历史选择/前台恢复/非法时钟/定时器与监听释放通过，268项全量及demo/server两构建通过，材料calendar-day-2026-10-04。新模块和测试均纳入Git，npm test入口加入，依赖/锁文件不变；GUI/真机/实际等待隔夜未验，compact=0。
- 470266d普通Push成功，上一0471afd完整SHA已核。本节点继续核查保存上传，下一项日历月切换上下界和非法日期选择；与明细统一有效月份，避免日历越界造成空月或异常，保留原选择/数据。

## 2026-10-04 · 账本读取失败原地重试

- Bills增加原地重新读取入口；首页/统计共用重复点击、读取异常和离页迟到保护。显式重试保持force=true，统计首次挂载保持普通版本读取；不改变筛选/月份/已确认快照，不自动写入。按钮含44px触达、忙碌和禁用状态。
- before.log为新helper导出缺失导致测试模块加载失败，不误称两个业务回归已运行；实现后28项导航/265项全量与demo/server两构建通过，ledger-retry-2026-10-04。无GUI/真机或真实数据/模型/邮件请求，compact=0。
- 0471afd已Push，ls-remote完整0471afd9e90ec2f9608389ee4ca818add04f2d81与本地一致；历史连接失败保留。下一项首页跨日显示：现today/星期为挂载时常量，隔夜不切页会显示旧日，应按本机日期更新并保护用户浏览的历史月份。

## 2026-10-04 · 原生跨标签页确认意图锁

- MDN https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request 已实际读取200，核exclusive/ifAvailable/null回调/Promise释放语义。正式浏览器初始化/草稿确认/取消/本地收尾共用当前账号命名的Web Lock；占用时直接提示原操作稍后重试，不排队或自动重发，也不生成新UUID。不支持锁的浏览器拒绝这些写入并保留草稿，不静默放弃互斥。
- before.log29项27通过2失败，复现第二实例不受锁保护及不支持时仍留意图。85项接口/账本/导航、263项全量及demo/server两构建通过；锁测试注入LockManager语义，不冒称真实浏览器多标签页GUI已验。仅前端及测试变更，无新依赖/真实外发/账本变更，compact=0。
- 30dc626已本地保存多页旧响应保护，本节点核差异后保存并普通Push，再核完整远端SHA。下一项完善明细账本读取失败的原地重试与重复点击保护，现Bills仅显示错误而缺同页重新读取入口，首次账本仍全量内存。

## 2026-10-04 · 多标签页旧意图与恢复提示保护

- before.log57项55通过2失败，复现等待回执期间意图改变仍继续确认/收尾及storage事件不刷新提示。发送前/响应后核捕获的原UUID/内容，收尾绑定对应回执数组的原意图，避免同实例后续请求改写守卫基准；取消也按原意图保护。
- storage事件仅使当前账号恢复列表重读，不请求网络/自动入账，切账号与作用域释放解绑；隐藏的未提交表单保留实例，另一页出现恢复操作不丢当前输入。261项全量及demo/server两构建通过，材料manual-tabs-2026-10-04；GUI/真机未验。
- 普通Push恢复成功，3c1b586..e34e4de已上传；ls-remote完整e34e4dec9bf8b71f098760404cb13c6611a05f8a与本地一致，旧低速/443失败保留，没有强推/改权限/部署。
- 尚未解决两个标签页首次同时读空存储后各自创建确认UUID的竞争；下一项使用浏览器原生Web Locks按账号串行初始化，已实际读取MDN LockManager/request文档(200)，确认exclusive/ifAvailable/null回调及锁释放语义。不能把当前旧响应保护冒称所有多页竞争已解决。compact=0。

## 2026-10-04 · 未入账手动草稿明确结束

- 接续0083f17后完成安全结束入口：GET核原草稿身份/字段/版本，仅OPEN或CANCELLED可处理；OPEN走既有cancel事务的行锁/版本保护，收到完整CANCELLED回执后才关闭本地恢复意图。已确认、未知、内容变化、身份变化及取消响应丢失仍保留原操作；没有自动入账或改键。
- 明确取消后原表单内容回填，待用户在应用内重新核对保存；取消等待时阻断其他操作，离页迟到不更新界面，取消结束前不提前挂载空表单。旧操作键/内容保留，没有删除浏览器记录。
- cancel-before.log先复现2项失败，最终259项前端及demo/server构建通过；H2单项cancelledExpiredAndInvalidDraftsCannotConfirm通过，核过期草稿可取消、取消后不可确认、账单数0。Java业务代码未改，测试AI/邮件明确禁用，无MySQL原数据写入/GUI/真机检查，原服务保持，compact=0。
- 普通Push与ls-remote随后443连接失败，原文保留，暂无本轮上传成功证据；新源码本地保存后继续。下一项核多标签页手动恢复状态同步及旧请求键并发保护，不等外部连接或用户回复。

## 2026-10-04 · 手动未知写入刷新重进恢复

- 分页节点d5c03e4本地保存，普通Push实际低速超时，远端已核3c1b586；历史成功不撤销。继续开发，无强推/权限/部署操作。
- 复用当前账号miaoji_account_write_intents_v1键，单笔manual操作恢复原body/UUID/版本；不新建恢复键，不自动重发。Add显示原金额/日期/收支/分类/备注及显式恢复按钮，未收尾时不另建一笔。旧成功manual意图无收尾标记也会安全重放原操作，然后读取当前事实。
- 只有完整回执及强制快照成功后标记manualComplete；网络/快照/存储失败仍保留恢复入口。重放不恢复删除或覆盖编辑；导航失败只重试打开。损坏内容保护原文且阻止新写，账号变化清显示；演示保持原保存方式。
- before.log真实复现新恢复方法缺失；77项接口/账本/导航针对、255项全量及demo/server构建通过，材料manual-resume-2026-10-04。没有真实业务写入、AI/邮件/GUI/真机检查，原19940/20820和127.0.0.1的8080/5174保持。compact仍0。
- 下一项继续手动过期草稿明确收尾：服务器确认未入账的过期草稿才能解除恢复阻挡，未知状态仍保持原操作；不自动换键重写。GUI依工具可用时补验，不等用户继续。

## 新窗口接续（2026-10-04）

01a10369-4fe9-7c82-9502-a6593e36b203已核transfer-result.json status=success、目标及finalCommit=dbca03b702058456dc49056bf15867526bd48c58，源聊天停止共享写入；实际compact基准0，源2次仅历史。原生automation view及toml核每小时/ACTIVE/failed_runs_only/本聊天目标一致，未重复建立，定时完整成功仍未验证。

分页重复编号优先于顺序错误分类，严格递增与旧快照保护保持。28项针对、250项全量及demo/server两构建全部通过，证据heartbeat-recovery-2026-10-04的new-window日志，旧失败保留。无GUI/真机或真实业务写入、AI/邮件调用。下一项直接继续手动未知写入刷新重进恢复，保留原键/内容，不自动重新建账。

# 喵叽智账 · 全权续办、免费GLM与个人页调整交接

## 最新交接（2026-10-04，覆盖下方旧现场）

实际交接结果：待续本地commit b5db5a7已成功；原生改名成功。新聊天01a10369-4fe9-7c82-9502-a6593e36b203已按gpt-6.1-sol/high创建；automation原生update成功转到该目标，toml逐字段核仅目标改变，其余名称/提示/周期/ACTIVE/failed_runs_only全部保持。源聊天最后只保存这些结果并写memory/heartbeat-recovery-2026-10-04/transfer-result.json交接回执后不再改共享文件，新聊天读success回执接手。源compact=2，新窗口自己设0；本次未Push，分页失败保持待续。

源聊天01a10312-42ac-7953-909e-b7f982a78353实际compact=2，已告知并停止业务代码，STATE=2；同聊天恢复不归零。按用户规则先待续本地commit/改名，再原生创建gpt-6.1-sol/high新聊天，转移现有heartbeat。实际结果见LOG末条，不能凭计划声称成功。用户全权授权，新聊天直接持续开发、不主动提问、不等回复、不用子代理。

架构：Vue3/JavaScript/Vite/Pinia + Java21/Spring Boot3.5.16/Security/JDBC/Flyway + MySQL独立miaoji_dev。正式server和demo隔离；免费glm-4-flash-250414只整理草稿，确认才入账。认证/邮箱、账单/统计、资料/私有照片、幂等事务、审计和分段账本已联通。零费用、本机；保护原账号/账本/照片/合成数据，不追加收费或真实外发，不改权限/可见性/生产数据。

已完成：聊天指代/追问/追加、账本版本缓存与迟到保护、60笔明细窗口、资料部分保存/冲突、统计切月、会话/验证码/CSRF及同账号新会话隔离、手动成功导航恢复、明细版本对照与查询路由边界。改动前248项前端及demo/server两构建通过，GUI/真机未补验，87项后端/真实模型/邮件为历史证据。上节点HEAD=3c1b5867f2eddff8629422768582072097f3ba75，上一轮已核远端完整SHA一致。本次交接仅本地保存，先修待续失败再核查Push。

待续源码只有frontend/src/api/remoteLedger.js与frontend/tests/remoteLedger.test.js：新增第二页中断保护/从首页按新版本重试及页内逆序拒绝测试，新增previousId严格递增检查。后端LedgerRepository现有ORDER BY id、id>?已核，无后端改动。材料.workbuddy/memory/heartbeat-recovery-2026-10-04/pages-before.log及pages-after.log均28项27通过1失败。交接只读after日志确认：旧“分页中途版本变化或重复游标”用例220行期望/重复/，实际“账本分页顺序或位置不合法”，新增顺序校验抢先重复检测。未补全量/构建，不称节点完成；此聊天不再修代码或凑测试通过。

新聊天先核检查顺序/错误分类、修复并针对/全量/两构建验证，保留原失败，再commit/核查后普通Push，直接继续手动未知写入刷新重进恢复。Add每次挂载新manual batchId，同页重试已保护，刷新恢复尚未实施。可评估复用账号隔离键miaoji_account_write_intents_v1_${owner}，原请求键和内容必须一致；未知结果不可自动换键重写、不可串账号或存秘密。首次账本仍全量内存，GUI缺工具记PENDING，不等待用户代测。

关键路径：remoteLedger/client/Add/ledgerStore与后端LedgerRepository；start-local.cmd/scripts/local-dev.mjs统一本机入口。heartbeat开工核Java19940/Vite20820仅127.0.0.1的8080/5174监听，未重启/停止，新聊天核实际归属再操作。沿用JavaScript/现依赖、小步回退，金额/业务日期/账号隔离/确认事务优先；测试禁真实AI/邮件。缓存与单命令TEMP/TMP在E盘，不改系统环境。真实配置、storage、memory、target/dist/node_modules忽略，严禁入Git。

origin已确认私有https://github.com/Meinan818/accounting-miniapp.git；新聊天核所有待上传历史、秘密/目标/部署影响再正常Push，不强推、不改权限；历史间歇连接失败保留。原生heartbeat ID automation，每小时/ACTIVE/failed_runs_only，交接前目标源聊天，创建成功后原生update转移并保持其余字段，不重复建立、不手改toml。heartbeat确已收到并开工，但完整定时成功未验证，scheduledRunVerified仍false。真正新窗口设compact基准0，源2次仅历史；实际第2次再停代码/交接commit/改名/指定模型新建并转移，自动唤醒/摘要/普通中断不计。

本会话新踩坑为分页校验优先级导致旧断言失败，见MISTAKES。交接多文件patch错误上下文被原子拒绝，核无部分写入后按实际内容重试；不影响业务数据。下方旧计数/目标/待办和源聊天功能描述只作历史，以本段与LOG最新条执行。

更新：2026-10-04。本聊天01a10312-42ac-7953-909e-b7f982a78353已识别第1次实际compact并告知，STATE=1，同聊天恢复不得归零；源聊天第2次仅历史。新聊天由原生工具显式gpt-6.1-sol/high承接，heartbeat automation已转到当前聊天。以下旧“本次聊天”功能记录均为源聊天历史，不冒称本轮重验。

最新现场：聊天、账本缓存、60笔窗口、资料、统计、会话/验证码/CSRF及同账号代次、手动导航、编辑冲突和明细查询已验证，248项前端及demo/server构建通过，相关源模块和5项本机HTTP200。GUI/真机未补验，无新外发/业务写入。直接继续大账本分页中断、未确认写入原操作恢复及可验证交互范围。历史33项和随后5节点已Push到私有main，远端25320a9完整SHA核一致；中途重置/超时失败保留，未强推/改权限/部署。heartbeat仍每小时ACTIVE，实际compact=1；用户不用操作，不等待继续。

## 最新授权与自动续办

本聊天用户再次重申“不主动提问、不要停、全权负责”，已补全局规则与PROJECT_PLAN/NEXT，并原生更新既有automation提示，保留每小时/ACTIVE/failed_runs_only/当前目标。全局修改前备份在E盘autonomy-reconfirmed-2026-10-04；常规节点继续写记录，需用户事项统一PENDING。新对话必须连续接续，保存/汇报不是等待点。

用户要求写入全局规划：Codex自主负责规划、开发、新功能、美化、创新、修复、优化、测试、文档、commit和Push；用户只给建议和审核，未来几天可能不回复。不要主动提问或等待回复，缺资料/凭据/明确预算等集中登记到.workbuddy/handoff/PENDING.md，暂缓依赖部分并继续独立工作。项目AGENTS顶部与全局C:/Users/Lqx24/.codex/AGENTS.md已同步；旧“不Push/不改全局/等用户继续”等已被覆盖。全局备份在E盘.workbuddy/memory/autonomy-2026-10-04/global-agents-before.md。保留零费用、本机、保护真实数据与凭据，不增加收费模型/生图，不擅自改变权限、可见性或生产资源。不要用子代理。

原生heartbeat「喵叽智账自主开发续办」ID automation已ACTIVE，每小时一次，notificationPolicy=failed_runs_only。当前目标01a10312-42ac-7953-909e-b7f982a78353，源聊天原生update保留其余字段后转移，本聊天已view并只读核落盘。不重复创建、不手改toml。尚无实际定时运行成功证据；依赖电脑、Codex、连接和额度可用。正常阶段安静记录，压缩事件仍按规则明确汇报。

## 本次聊天实际内容

1. 接手旧HANDOFF，按用户反馈指导SMTP本机配置，真实发信200且用户确认收到。随后指导启用智谱项目密钥，真实GLM联通，秘密未回显。
2. 用户网页报告等待卡住、AI_TIMEOUT和平台额度/并发限制；选择先试免费GLM-4-Flash-250414。已切换，补等待秒数/15秒慢提示/停止与迟到响应保护，明确短句纠正保留整组、拒绝模型少返回候选。用户后续“没问题了”，本轮模型及聊天流程已认可，不重复要求验收。
3. 自主补根start-local.cmd与scripts/local-dev.mjs统一本机启动；不安装、不自动编译、不启动MySQL、不改系统策略、不自动打开浏览器。端口占用保护原服务，HTTP就绪才报成功，仅清理自己创建的进程。
4. 离线复现复合纠正后一句金额误套第一笔，改为多段交原真实模型接口，单段/日期/合法千分位继续确定处理。新复合句仅离线测试，没有新增真实GLM请求。
5. 用户截图要求删除个人页黄色“给认真生活的你 · 一张手账名片”纸条；Profile.vue已移除，标题下间距24→16px，下方自然上移。新观感未单独反馈，不冒称最终审核通过。
6. 用户全权低打扰授权已写全局，原生自动续办已创建，待事项表已建立。GitHub连接失败尚未Push；这次第2次compact开始正式交接。

## 架构、数据与当前功能

Vue3/JavaScript/Vite/Pinia + Java21/Spring Boot3.5.16/Security/JDBC/Flyway + MySQL8.4.11独立miaoji_dev。正式server与默认demo数据独立；保留猫猫手账、首页原头像/聊天毛茸茸头像。原账本、照片、对话、账号、素材与所有合成测试数据保留，不自动导入演示数据或绑定旧账号邮箱。

V1身份认证和本人账单、V2整组幂等事务、V3分类查询/业务时间、V4资料/256px私有照片、V5同事务操作审计、V6草稿版本确认、V7一致分段账本、V8邮箱验证码注册已实现并连前端。旧无验证注册默认关闭，旧账号仍可登录；163真实收件已核，完整成功注册GUI未获单独反馈。大账本仍全量内存展示，完整服务端聊天同步/虚拟列表/朋友外网访问/生产部署尚未实现。

真实配置只留忽略backend/.env.local.properties；不显示、不提交。测试profile明确禁用真实邮件/AI并清空AI key，外发独立脚本只用合成文字。不要上传已有账本/照片做验证。

## 免费模型及聊天保护

固定glm-4-flash-250414，沿用用户智谱项目密钥，不换付费FlashX或Kitool。此前已核官方免费模型/定价文档：https://docs.bigmodel.cn/cn/guide/models/free/glm-4-flash-250414.md 与 https://docs.bigmodel.cn/cn/guide/start/pricing.md 。仍受平台限额/并发约束，不保证每次成功或时延。

POST /api/ai/parse：登录/CSRF/身份断言，1000字含追问、最多5条context、1200输出token/64KiB响应，5秒连接/60秒总期限，前端65秒；每账号6次/分钟、本进程2并发，不自动重试。平台429为AI_PROVIDER_BUSY，504为AI_TIMEOUT。模型只整理草稿、不读账本或写库；确认走V6事务，统计来自真实账单。

新整理/追问/追加真实模型；完整草稿单段明确金额/日期纠正及歧义编号选择确定处理，保留其他候选与UUID；多段纠正交原模型接口。前后端拒绝完整结果少于已有候选数，错误/停止保留原草稿，不能把确定改价说成模型请求。停止中止客户端等待、迟到不能改组，离页清请求计时，generation保护旧finally不干扰新发送；不保证远端任务立即撤销。演示规则仍独立保留。

## 实际验证及未验证

- 最新frontend194项、demo/server两构建通过：材料.workbuddy/memory/profile-trim-2026-10-04/frontend-test.log及两build日志。Profile模块200且黄色纸条已无。本次纯交接不重跑业务测试。
- 后端87项/package是此前节点证据：glm4-switch-2026-10-04/backend-package-correction.log。
- 免费模型/Java/MySQL真实9项：real-1791047055366/glm-real-result.json；源模块6项：source-1791047721760/result.json；用户原句5项：source-1791048339634/result.json，午饭25/咖啡18两笔43，咖啡改16后两笔41且未入账。上述在glm4-switch材料中，不能当本轮又执行。
- 启动8项Node、真实Java/MySQL/Vite独立临时端口启停7项，原5174前后CSRF200：local-start-2026-10-04。GUI双击/关闭窗口未单独实测。
- 复合纠正11项针对及194全量通过，未追加新句真实模型调用。等待停止、窄屏/真机、新个人页观感未单独审核。当前无可调用浏览器交互工具，不安装绕过、不冒称GUI验证。

## 本会话踩坑及防复发

原始失败不覆盖，细节见MISTAKES/LOG：测试profile曾继承真实key导致离线测试外发，已显式关闭；HTTP脚本曾未等ready/错账单包装层，后独立证据纠正；免费模型昨天日期错误、非法输出及短句只返回1笔，补提示/确定处理/缺笔拒绝；追加含“改成”误路由、复合纠正误套金额，均离线复现再修。旧4.7正式网页超时/并发反馈不能被其他HTTP成功抹掉。

验收文档批量替换因PowerShell二元数组展开误改文字，0dd6f96错误本地提交保留，9a9baf3已纠正，没有重写历史；以后准确对象/小patch并逐行看语义diff。交接一次多文件patch带猜测PROJECT_PLAN标题被原子拒绝，无部分修改；读实际标题后成功。曾组合进程操作自动审核返回blocked by policy，原文保留；后核归属分开最小操作，没有改权限或推断拒绝原因。

## 运行、关键路径与保存边界

根start-local.cmd启动已有jar和server Vite；scripts/local-dev.mjs --check只读核查，端口占用退出不动原服务，仅127.0.0.1的8080/5174。源码变更先按既有backend/maven.ps1或既有Maven打包，不把旧jar启动当新源码已生效；package前核自己的Java归属。最后历史Java PID19940、Vite20820，必须核现场，不按旧PID停止。当前预览http://127.0.0.1:5174/profile。

Java D:/JavaDev/jdk-21；Maven .workbuddy/memory/backend-foundation/apache-maven-3.9.11/bin/mvn.cmd及同目录maven-repository。TEMP/TMP仅单次任务E盘，npm缓存E:/CODEX/.cache/npm，不改系统环境/策略。MySQL客户端C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe；工作目录.workbuddy/memory/backend-foundation，使用相对--defaults-extra-file=mysql-client.cnf，不回显凭据。

关键源码：后端GlmDraftParser/Controller、LedgerService/RecordInput与application-test.yml；前端src/api/aiDraft.js/client.js、utils/draftEngine.js、views/Chat.vue/Profile.vue、conversationStore/DraftGroupCard；scripts/local-dev.mjs。沿用JavaScript、既有依赖、小步回退，金额/日期/用户归属与确认事务为优先保护。

backend/storage、properties、.workbuddy/memory、.cache、target/dist/node_modules忽略，不入Git。origin是https://github.com/Meinan818/accounting-miniapp.git，最后fetch失败Recv failure: Connection was reset，REST元数据失败，gh不存在。旧跟踪引用显示23个待上传只属旧数据，必须fetch成功后重算并核全部历史提交、可见性/敏感文件/外部部署。没有.github不能证明无外部部署。不要强推，不改仓库可见性，不把本地commit说成Push。

## 新聊天第一步

先读本文件、AGENTS当前有效规则、PROJECT_PLAN、STATE/NEXT/PENDING/MISTAKES及LOG最新条，核Git/服务/自动化目标；真正新窗口将实际compact基准设0并注明旧2仅历史。不重复创建自动化。GitHub连接恢复后自主完成上传核查再Push，不让它阻塞本地开发。

## 新聊天已执行（2026-10-04）

- 用户重申全权授权后继续资料恢复：部分上传回执携带partialProfile与原错误code/status，Profile保留文本并将已上传照片换为服务端地址，读最新失败仍保留已知版本；STALE_PROFILE展示当前名片且保留输入，编辑窗可重读。真实客户端beforeSend/返回及离页身份保护阻断跨账号旧资料请求。3项新增回归先复现2失败后通过，最终215项与两构建通过；Profile模块200，真实账号照片写入/GUI/真机未补验。材料profile-recovery-2026-10-04。下一项统计跨月/读取失败保护。
- GitHub连接本轮恢复，fetch成功；已用现有Git认证只读核私有仓库/main/可Push，hooks/workflows/deployments/environments/checks/statuses均0，凭据只在进程内存不回显。待上传28项历史均同一作者/相关项目节点，快进祖先成立，历史敏感模式与禁止文件扫描0。资料提交后准备自主Push，不能把此准备写成实际已上传。
- 源聊天原生创建/改名/自动化转移已核，当前compact基准0。原Java19940/Vite20820仍仅127.0.0.1监听，8080 CSRF和5174/profile均200，未重启或操作原数据。
- 聊天边界已离线修复：待选编号的新纠正不套旧金额，只有纯编号应用旧意图；名称/时间/多段纠正交真实接口，携带待选修改；追问保存referenceDate，跨天恢复用提问日，旧追问退回创建日。明确追加至少增加一候选，已有5笔不发送追加请求。演示待选复合句保留原草稿。
- ai-before.log先复现7项失败；新增共享规则测试又复现1项演示复合指令误改日期，原frontend-test.log保留。修复后203项前端及demo/server两构建通过，材料chat-boundaries-2026-10-04。新增日期存储合法/损坏保护检查；未调用真实模型/邮件、未入账、未做GUI或真机验收。
- fetch本轮重试低速超时，仍未核远端可见性/部署，未Push；继续独立账本工作，成果如下，已保存数据和账户隔离保持。
- 大账本刷新已继续完成：每次仍请求首页核版本，相同已完整加载版本省去后续分页/整本替换；改删/整组写入清缓存并使旧读取失效，账号切换不复用缓存。强制读取等待现有请求后仍强制完整分页。后端既有revision同事务递增及REPEATABLE_READ源码已核，无后端/数据库改动。
- ledger-refresh-2026-10-04/before.log实际复现3项（重复分页、编辑/删除后旧快照覆盖）；forced-before.log补复现强制刷新等待后丢force参数。最终frontend-test-final.log209项及两构建通过；1201条合成离线用例未变刷新从3页到1页，不能冒称真实MySQL性能测试。首次读取仍全量内存、GUI/真机未验证；原5174已提供新模块200。下一项明细长列表显示窗口，保持组合筛选和全月统计。
- 明细窗口也已继续完成：先展示60笔，逐批“继续翻小票”，完整列表先筛选再限制展示；月总额/每日完整匹配合计不截断，部分日期显示总笔数/已展示数。窗口外新增目标单独保留可见且不重复；异步账本到达后可再触发定位。筛选或切月重置窗口，展开后焦点到新展示条目。journal19项/全量212项与两构建通过，Bills模块200，材料bills-window-2026-10-04；实际按钮/焦点/窄屏/真机未GUI验证，不能当人工验收。下一项资料版本冲突与未保存输入恢复。
