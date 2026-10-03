# 喵叽智账 · 新Codex对话接手提示

## 开工入口

工作目录：E:/XiangMu/未定项目。先读本文件，再读AGENTS.md、PROJECT_PLAN.md、.workbuddy/handoff/STATE.json和LOG.md最新记录。随后现场核对git status、git log、git branch、相关源码与本地服务；旧日志/规划不是当前实施授权，Git状态以现场为准。

交接只更新现有说明，不自动创建新聊天、commit、Push或归档本对话。保护全部现存材料和新对话接手时的未提交改动，不reset/clean。

## 当前下一步：本地保存后核对A阶段门槛，提出下一项最小范围

A1聊天闭环、A2手动/修改/单笔删除、A3最小统计页均已接入并按用户授权做本地保存；不要沿用旧“Stats仍占位/功能尚未commit”的描述，不重做这些业务。

已完成只读核查并获用户确认，现已接入三个最小范围：聊天查询复用statistics；历史每批40条显示、可加载更早消息并单独显示更早未完成组；ConversationStore补恢复校验与显式保存/读取重试。用户已回复“commit”授权本地保存本轮相关源码/测试/说明；提交结果以Git现场为准。后续先只读核对A阶段门槛与剩余限制，提出下一项有界方案，确认后实施，不自动Push或建后端。全量序列化保存和多标签页对话冲突仍是限制，不误称整个A3完成。

## 已实现，继续复用

- A1：规则模拟1–5笔组草稿、连续追问、金额/日期纠正、明确追加/歧义选择、整组确认/取消、防重复与刷新恢复。仍是有限规则，不是真实AI；查询先支持本月，其他日期不能用本月结果冒充。
- 手动/明细：共享RecordForm、RecordStore和ledger/money校验。首页/聊天/明细为同款“手动记一笔”贴纸，中央+仍到/chat；明细整行点击编辑，手机底部/电脑居中。用户已认可这些入口，不反复要求旧成果验收。
- 单笔删除：仅明细编辑内提供，二次确认默认聚焦返回编辑；取消保留未保存输入，失败留原账单可重试。原存储保留deletedAt/ID/来源/组标记，列表/汇总排除删除项，聊天组卡片与旧单笔卡片显示删除事实，旧草稿/旧编辑/重复确认不能恢复。不是彻底擦除历史，暂不提供恢复、批量或侧滑。
- 新增/反馈修复：保存后带added标识跳到正确月份并定位“刚刚记下”新行；删除成功提示可见。RecordStore以显式Vite HMR边界更新动作/计算属性，旧开发页首次启用仍可能需刷新。已复现旧Store缺删除方法，但用户当次错误未取到，不能把所有历史失败一概归因于缓存。
- 统计：/stats已接入切月/URL保留、月收支/结余/有效笔数、收支分类金额/笔数/占比横向条、所选月份明细链接/返回、空状态及读取保护。只读有效账本，整数分计算，草稿/删除项不计入；未来日期仍按所属月份统计，与首页/明细一致。分类占比显示一位小数并提示舍入差异，大金额不拆行。不是预算/年度分析、AI质量指标或后端接口。
- 最新事实：修改后的账单/查询/保存卡片读同一本账；旧聊天文字只当历史。不要用旧草稿覆盖人工修改。

## 用户明确暂缓/未来规划

- **日期排序、未来日期分区、示例单独标记**：用户说“先不改了”，尚未实施。当前按业务日期倒序，未来日期示例可能在今天前面；不要擅自移动/删除示例或改日期来整理页面。
- **后端8项**：草稿持久化、服务端重新校验、重复确认/网络重试幂等、审计、模型故障手动降级、多笔事务、确认/修改率及有标准答案的AI准确率评测，已写PROJECT_PLAN未来B/C/D阶段。用户明确只记规划、按当前前端进度来，不提前建设backend/、MySQL/认证/真实AI，不加固定期限。
- 预算/攒钱/年度统计、票据/语音/PWA、额外动画、猫命名、依赖、付费生图、Push/部署都没有自动追加授权。

## 品牌与素材边界

全名“喵叽智账”（账），奶油米黄/柔粉2D猫猫手账。猫自称“本喵”，无正式名字，小宝只是聊天标题占位。首页用原miao-avatar.png，聊天用已通过的miao-avatar-fluffy-v1.png；统计复用在用的miao-writing/cream-receipt，不重审已认可头像，不新生图或下载字体。

19张旧图已按类别归档保留，9张猫姿态4在用/5预留，来源清单/哈希已检查；不把旧路径删除误说成丢图，不清理或搬移原图/素材。收费调用需另授权，新图必须先展示审核后接入。

## 关键代码与正式测试

- 视图：frontend/src/views/Home.vue、Chat.vue、Bills.vue、Add.vue、Stats.vue；Login/Profile仍为占位，不能声称认证或全站完整。
- 组件：components/record/ManualEntry.vue、RecordForm.vue、RecordEditor.vue；components/common/DraftGroupCard.vue，旧ConfirmCard保留兼容。
- 数据：stores/recordStore.js、conversationStore.js；utils/ledger.js、money.js、draftEngine.js、categories.js、statistics.js、chatQuery.js；mockAI保留旧兼容材料，当前聊天查询不再调用它。
- npm test：Node内置test/assert，共75项（此前60+本轮查询5/对话恢复10），测试入口包含frontend/tests/statistics.test.js；没有lint/typecheck脚本，不虚报执行。
- statistics.js为只读纯计算，不另建账本；按业务日期月份/整数分聚合，Map分类不受原型同名键影响，累计超安全范围明确失败。RecordStore.records只公开有效账单，batchRecords含删除事实用于防重和卡片。

## 验证证据：本轮边界实施与历史分开

- 最近统计实施：60项Node、1798模块构建、128项浏览器（新统计20+原108）及7项素材检查通过，错误0。覆盖改金额/方向/分类/跨月/删除、草稿不入账、同测试浏览器storage事件、坏存储保护/恢复、年份边界、320/390/1280px和大金额/长分类。
- 最近统计commit前：重新跑60项Node与1798模块构建（3.73秒）、差异检查通过；浏览器/素材结果沿用上述同业务源码的实施轮证据，不是提交轮重跑。
- 前一轮纯交接没有重跑业务检查。本轮边界实施已新跑75项Node、1799模块构建（2.98秒）、69项浏览器业务检查（新17+聊天16+删除17+统计19），控制台错误0；目视320/390px历史入口及恢复错误截图。用户验收/真机/跨设备仍未确认。
- 独立profile/固定日期都是测试环境，未改用户浏览器账单；真机软键盘/跨设备/多用户事务未验证。保存授权不等于整个A3/全栈或所有人工路径验收完成；有实际反馈再有界修，不反复催促同一保存点。

## 内部E盘材料与运行

内部脚本在.workbuddy/memory/home-visual/：verify-a1-core.cjs、verify-entry-editor.cjs、verify-bills-mascots.cjs、verify-home-alignment.cjs、verify-chat-visual.cjs、verify-a2-delete.cjs、verify-manual-feedback.cjs、verify-a3-statistics.cjs、verify-asset-archive.cjs。截图/结果/profile在对应子目录，其中a3-statistics-2026-10-03有统计预览、空/大金额/错误截图和result.json/build.txt；不入Git、不清理。

当前预览为http://127.0.0.1:5173/，本轮验收路径/chat。本轮验证时原服务已停止，重新启动已有Vite后可用。下一对话先核实服务；若停止，按AGENTS现有Vite命令启动。TEMP/TMP/profile/缓存任务级优先E盘，不改系统TEMP、不安装全局依赖或重新下载浏览器，不承诺Windows/Codex自动记录均迁到E盘。

## 本地保存与下一轮权限

此前A1/A2与最小统计已本地保存；本轮新增chatQuery helper/测试、Chat和ConversationStore变更及配套说明已获用户本地commit授权，原交接内容一并保留纳入。保存须包含两份新源码/测试，提交结果以Git现场为准；内部脚本/profile/截图不入Git，不清理材料。保存不等于整个A3/真机/跨设备验收，Push仍单独授权。

## 本轮恢复与测试材料

读取失败不覆盖原历史；没有本页变更时可显式重读外部恢复的合法数据，不额外写入。已有新消息/草稿时拒绝重读覆盖，并提示先备份；没有自动合并/备份导出/修复功能。写入失败用“重试对话保存”保存整份本页状态，不写账本键。

本轮材料位于.workbuddy/memory/home-visual/a3-boundaries-2026-10-03，包含verify-boundaries.cjs、result.json、test-final.txt、build-final.txt及截图；regression下为旧验证脚本副本/独立profile/结果，原材料未覆盖。旧聊天脚本用气泡数量判断回复完成，在40条显示窗口下超时；副本改用完整存储消息增长及助手回复判断，原业务断言保留，重新通过。
