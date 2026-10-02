# 新Codex对话接手提示

复制下面整段到新Codex对话。详细规则与真实状态只从AGENTS.md/STATE.json/LOG.md读取，不依赖前一对话记忆。

```text
接手 E:\XiangMu\未定项目 的智账项目，继续由Codex全权负责。

先读AGENTS.md、PROJECT_PLAN.md、.workbuddy/handoff/STATE.json和LOG.md最新记录，现场核对Git及相关代码；不要先写代码或重复Push。

当前路线为Vue前端 + Java后端 + MySQL，长期打磨无硬期限，先继续前端，backend尚未建立。旧Supabase代码已移除，历史资料只在docs/archive/；前端仍是本地演示，账单数据要保护。

最近要修首页视觉：用户指出猫熊未贴合波浪、导航背景难看、日期区违和。外框此前单独通过，但整页未通过；新完整底部参考图在docs/assets/reference/bottom-scene-candidate.png，原型在同目录home-prototype.png。新视觉方案尚未获实施确认，先给精确方案再修改，完成后给实际页面验收链接，不展示未接入素材。

只在E盘项目保存新素材、截图、测试和临时文件；正式页面素材在frontend/src/assets/design按用途分类，源图在docs/assets/source/，内部材料在.workbuddy/memory/。既有C盘文件未经授权不删除。本机Kitool工具仍是默认生图工具，但没有生图请求不调用。

不要把历史测试当成本轮验证，也不要把已授权的本次Push当永久发布授权。下一轮Push或部署等我明确说。最后说明真实状态与推荐下一步。
```
