# 喵叽智账 · 新Codex对话接手提示

先读AGENTS.md、PROJECT_PLAN.md、STATE.json和LOG最新记录；现场核对Git、改动归属和本地服务，不沿用历史测试/发布状态。交接只准备文件，不自动创建聊天、提交或Push。

## 第一优先：UI已获满意确认，本地保存已授权（2026-10-03）

用户回复“听你的”，确认贴纸手动入口、整行点击直接编辑、手机底部/电脑居中方案。已实施，不再把新方案描述为尚未获授权。
- ManualEntry共用奶油/柔粉账本与猫爪贴纸，首页/聊天/明细统一“手动记一笔”；中央+仍到/chat。
- 明细每行无修改按钮，整行点击或Enter/Space打开原共享RecordForm。手机底部面板、电脑居中；取消/Escape不保存，原生dialog焦点恢复及背景滚动恢复已检查。
- 保留A1、RecordStore、ledger/money与原ID/来源/组标识；本轮未改数据层，没有删除/侧滑/长按/后端/生图或新增依赖。
- 本轮npm test 36项、build 1796模块通过；原70项浏览器回归重跑通过，新13项入口/面板回归通过，脚本/控制台错误0。不是用户观感验收。
- 新脚本verify-entry-editor.cjs与截图/result.json存于.workbuddy/memory/home-visual/entry-editor-2026-10-03（脚本在上一级）。旧A1脚本只替换两处旧按钮选择器为整行点击，金额/数据断言保留。
- 本轮已目视390px首页/聊天/明细和编辑面板截图；真机软键盘与跨设备未验证。本地127.0.0.1:5173本轮HTTP200，下一对话仍需现场核实。

用户已回复“满意，commit”，明确认可贴纸入口与编辑面板并授权本地保存；不重复要求这两项观感验收。A1及相关UI/测试/说明一起纳入保存，结果现场查Git；不Push。下一步继续验收A1主线交互，再确认A2范围，不能把UI满意扩大为真实AI/删除/后端授权。

## 已实现，不要重做

- A1规则模拟1–5笔组草稿、追问补原组、金额/日期纠正、明确追加、歧义选编号、整组确认/取消、防重复/刷新恢复。
- /add手动新增与/bills直接修改金额/类型/分类/日期/时间/备注；三入口共用同一账单Store。账单持久化成功才报成功，编辑保留ID/来源/组标识。
- 查询/保存卡片读取修改后的最新账单；旧聊天文本只当历史。本月分类/收支查询可用，不支持的日期明确提示；真实AI/Java/MySQL未接通，未来必须从后台最新账单读取事实，不用旧对话反推。
- 品牌喵叽智账；猫无正式名字、自称本喵，小宝仅标题占位。首页原猫图保留、聊天毛茸茸头像已通过；19张旧图分类归档、5张猫姿态预留，不新生图/删除原图。

## 关键代码与验证

- 视图：frontend/src/views/Home.vue、Chat.vue、Bills.vue、Add.vue。
- 组件：components/common/DraftGroupCard.vue、components/record/RecordForm.vue、RecordEditor.vue；旧单笔ConfirmCard保留兼容。
- 数据：stores/recordStore.js、conversationStore.js；utils/draftEngine.js、ledger.js、money.js、categories.js。
- 正式测试：frontend/tests，npm test（Node内置test/assert，无新增框架/依赖）；此前36项通过。
- 内部E盘脚本：.workbuddy/memory/home-visual/verify-a1-core.cjs（17项）、verify-chat-visual.cjs（22项）、verify-home-alignment.cjs（18项）、verify-bills-mascots.cjs（13项）、verify-asset-archive.cjs（7项）。此前构建1794模块通过，浏览器70项错误0；都不是本次交接新测试。改入口后更新对应点击预期，但保留金额/数据断言并重新运行。
- 核验脚本使用独立profile和固定10月2日测试日期，不操作用户浏览器。截图/缓存/临时目录在E盘内部目录；真机键盘/跨设备未验证。

## 保存和边界

A1业务、上述新组件/工具/测试和当前文档有未提交改动（含未跟踪文件），不要reset/clean或只提交已有跟踪文件而漏掉新组件。上一轮品牌/素材整理已有本地提交，实际Git状态现场查，不以旧记录当同步事实。用户这次“准备交接”不是commit/Push授权。

本地预览此前127.0.0.1:5173，接手先核实是否仍运行；若无服务，按AGENTS已有Vite命令启动，不假设历史HTTP200仍有效。修完两项UI反馈后实际展示整页、跑相关回归，再询问保存。真实AI/后端、猫命名、账单删除/统计整页、额外生图与依赖均不默认实施。
