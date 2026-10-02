# 喵子智账 - 设计系统

## 品牌与本轮反馈

- 产品全名：喵子智账；主角和聊天助手是二维手绘猫“喵子”，不是小鸡。2026-10-02用户明确；此条优先于旧例子。
- 用户喜欢当前奶油米黄/柔粉配色，但否定首轮设计不够可爱、顶部小鸡及字体突兀。配色反馈不等于整页验收。
- 修订示意复用现有手绘猫，增加贴纸/纸胶带与柔和不规则圆角，去掉立体emoji头像和账单emoji；标题与正文统一轻字重，避免黑体/楷体混搭，金额清晰。当前复用本机系统轻字重字体作示意，不承诺等同正式圆润手写字体或跨设备一致；未下载/嵌入字体、未收费生图。
- 用户随后回复“我觉得可以”：猫猫版设计的视觉方向和当前字形已获确认，按此作为接入基准，不再重复要求同一设计验收。该设计确认不能代替实际页面验收，也不表示多笔/追问逻辑已实现。
- 聊天页现已接入猫猫头像、全名、柔和气泡、胶带纸片卡片与输入区；隐藏未实现的语音按钮及旧小鸡悬浮组件，保留原有单笔识别/表单修改/确认逻辑。历史欢迎消息仅在展示时适配，不重写存储。首页随后按同款风格接入；其余未改版页面旧名称/角色尚未全站迁移。

## 设计理念

**核心概念**：自然聊天记账为主线，手账风格与温暖可爱服务于该体验。AI整理草稿，用户在聊天中补充/纠正，确认后保存；不能让装饰打磨长期阻塞核心闭环。

这是一个**对话式 AI 记账应用**，用户通过和 AI 聊天来记账，就像和朋友分享今天的消费。视觉风格模仿手账本，用手绘线条、温暖色调和可爱吉祥物营造轻松愉悦的记账体验。

---

## 聊天记账前端方案（2026-10-02，设计已确认，视觉已接入，实际页面待验收）

- 主屏延续浅米色手账、二维手绘猫喵子、柔和聊天气泡；不为本轮重新生图。消息为主，账单卡片是对话中整理结果，不打开大表单打断聊天。
- 一句话的多笔消费放在一组草稿卡片：项目、分类、业务日期、金额、合计；待补充/待确认/已记录/已取消用文字明确区分。未补齐金额不能确认。
- 用户继续说“咖啡改成16”时更新对应草稿及合计，助手说明修改结果；没有唯一目标时先追问，已保存账单的改删不沿用草稿操作。
- 缺金额时在对话里问，后续回答继续原草稿；提供“确认记下N笔”和“取消这组”，支持明确文字确认。确认前不入账，成功后不重复提交；失败时保留草稿并允许重试。
- 正式输入区保留发送和中文输入法保护；空闲状态给一句轻提示，暂不展示不能用的语音主按钮。手机键盘与滚动适配在接入实际Vue页后另测。
- 独立设计示意仅演示固定场景和金额补充/纠正，不是真实AI，也不写浏览器账单数据。场景选择器是评审工具，不作为正式产品入口；示意中的日期为相对“今天”。
- 设计示意保存在E盘忽略目录；首轮经13项检查（含320/390/736px无横向溢出、浅/深主题、纠正/确认/追问/取消，脚本错误0）。检查仅覆盖该示意，不算实际Vue页或人工验收通过。
- 已按授权范围仅接入Chat.vue及其气泡/卡片/输入组件外观，复用43KB猫猫衍生头像，不启动Java或真实AI；首页视觉待办保留。上文多笔、连续追问、聊天纠正、草稿取消/保存失败重试是目标，实际页面尚未实现，不冒用示意按钮。正式页面沿用浅米色；示意深色不代表全站深色已实现。猫猫示意12项检查与实际Vue回归22项检查分别记录，人工页面观感尚待确认。

## 首页与聊天页统一方案（2026-10-02，已授权接入，实际首页待验收）

用户指出主页和聊天页严重不符，要求以聊天风格重设计首页。已明确授权并仅调整首页及首页专用日历/导航外观，不改聊天页、Store或记账业务逻辑。

- 顶部采用聊天页同款二维猫猫、喵子智账全名、轻字重；“日常开销”作为账本说明。
- 日历改为同款轻描边纸片与胶带，弱化普通日期块，柔粉标记选中日，今日状态另有清楚标识；日期/金额仍是真实元素。旧外框原图保留，但不要求新版继续挂载。
- 当天账单与空状态沿用聊天页卡片、色彩和猫猫，不再使用小鸡/粗黑边/重阴影。
- 首页底部改为轻量奶油底导航与柔粉中央加号，不再拼贴高大猫熊波浪；保留原路由，统计入口如实标作“统计”。源素材不删除，非首页导航本轮不改。

接入后已验证切月、选日期、当天账单、加号到聊天及新增后的数据同步，检查窄屏/电脑滚动、长备注、大金额、底部遮挡和粗指针模拟；首页18项与聊天22项检查通过。没有新增功能、字体下载、生图或后端；技术通过不代替实际首页观感。

## 视觉风格定位

### 首页当前应用规范（与聊天对齐版，待实际页面验收）

首页使用与聊天相同的奶油米黄/柔粉、棕墨色、系统轻字重和二维猫猫。标题为喵子智账，日常开销作小字说明；日历与账单采用胶带/不规则圆角纸片，日期/金额是实时页面元素，不做成图。选中日柔粉，“今”独立标出今天，有账单的小圆点保留。

首页专用导航仍通过homeAppearance开启，使用轻奶油底和柔粉加号，原路由保持；统计入口如实显示“统计”。Bills的非首页导航保留原有图标与外观，不把本轮称为全站统一。

旧外框、夹子、角色、波浪和候选构图仍保留原文件，新版首页不再挂载；不是删除原素材，也不否定此前外框单独验收。下面的旧组件示例仅供未改版页面参考，新首页/聊天以本节与实际代码为准。新方案没有下载字体，跨设备字形和真机键盘仍未验证。

### 关键词
- **手账感**：手绘边框、温暖米黄底色、不规则线条
- **温暖可爱**：粉橙点缀、猫猫贴纸、二维手绘猫陪伴
- **对话式**：聊天气泡、自然语言交互、AI 有个性

### 参考方向
- UI 风格：手账 App（如 Daylio、Notion Calendar）+ 微信聊天界面
- 吉祥物：猫猫喵子（圆润、二维手绘，与现有灰白猫素材保持统一）
- 色调：米黄纸张底色 + 粉橙高亮 + 黑色手绘线

---

## 色彩系统

### 主色调（温暖手账风）

```css
/* 背景色 - 米黄纸张质感 */
--bg-cream: #fffbf0;        /* 奶油米黄 */
--bg-cream-dark: #fff4d6;   /* 深一点的米黄 */
--bg-paper: #fef8e8;        /* 纸张色 */

/* 主色 - 粉橙色（活力、温暖） */
--primary-50: #fff7ed;
--primary-100: #ffedd5;
--primary-200: #fed7aa;
--primary-300: #fdba74;
--primary-400: #fb923c;     /* 主色 */
--primary-500: #f97316;
--primary-600: #ea580c;
--primary-700: #c2410c;
--primary-800: #9a3412;
--primary-900: #7c2d12;

/* 辅助色 - 柔和粉色（可爱） */
--accent-50: #fff1f2;
--accent-100: #ffe4e6;
--accent-200: #fecdd3;
--accent-300: #fda4af;
--accent-400: #fb7185;
--accent-500: #f43f5e;      /* 辅助色 */
--accent-600: #e11d48;
--accent-700: #be123c;
```

### 功能色

```css
/* 收入 - 清新的绿色 */
--income-light: #d1fae5;
--income: #10b981;
--income-dark: #059669;

/* 支出 - 活力的橙红色 */
--expense-light: #fed7aa;
--expense: #fb923c;
--expense-dark: #ea580c;

/* 警告/提醒 */
--warning-light: #fef3c7;
--warning: #fbbf24;
--warning-dark: #f59e0b;
```

### 中性色

```css
/* 文字颜色 */
--text-dark: #1f2937;       /* 深灰黑，主要文字 */
--text-gray: #6b7280;       /* 中灰，次要信息 */
--text-light: #9ca3af;      /* 浅灰，辅助信息 */

/* 手绘边框色 */
--border-hand: #1f2937;     /* 粗黑线手绘边框（3-4px） */
--border-light: #e5e7eb;    /* 细边框 */

/* 背景层次 */
--bg-white: #ffffff;        /* 纯白卡片 */
--bg-card: #fffef9;         /* 卡片底色（微黄） */
```

---

## 字体系统

### 字体选择

```css
/* 主字体 - 清晰易读 */
font-family: 
  -apple-system, 
  BlinkMacSystemFont,
  "PingFang SC",
  "Microsoft YaHei",
  "Segoe UI",
  sans-serif;

/* 数字字体 - 等宽，金额显示 */
font-family: 
  "SF Mono",
  "Consolas",
  "Monaco",
  monospace;

/* 手写风格（可选，用于特殊标题） */
font-family:
  "Ma Shan Zheng",
  "Zhi Mang Xing",
  cursive;
```

### 字体大小

```css
/* 标题 */
--text-3xl: 1.875rem;  /* 30px - 页面主标题 */
--text-2xl: 1.5rem;    /* 24px - 区块标题 */
--text-xl: 1.25rem;    /* 20px - 卡片标题 */
--text-lg: 1.125rem;   /* 18px - 强调正文 */

/* 正文 */
--text-base: 1rem;     /* 16px - 对话气泡、正文 */
--text-sm: 0.875rem;   /* 14px - 辅助文字 */
--text-xs: 0.75rem;    /* 12px - 时间戳、标签 */

/* 金额显示（特大） */
--amount-huge: 3rem;   /* 48px - 月度总额 */
--amount-large: 2rem;  /* 32px - 卡片金额 */
--amount-medium: 1.5rem; /* 24px - 列表金额 */
```

---

## 间距系统

遵循 **8px 栅格系统**

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
```

---

## 圆角与边框

### 圆角（温柔圆润）

```css
--radius-md: 0.5rem;     /* 8px - 输入框 */
--radius-lg: 0.75rem;    /* 12px - 卡片 */
--radius-xl: 1rem;       /* 16px - 大卡片、对话气泡 */
--radius-2xl: 1.5rem;    /* 24px - 日历卡片 */
--radius-full: 9999px;   /* 圆形 - 头像、按钮 */
```

### 手绘边框

```css
/* 粗黑手绘边框 - 核心视觉元素 */
.border-hand {
  border: 3px solid #1f2937;
  /* 可选：添加略微不规则感 */
  border-radius: 12px;
}

/* 细边框 - 次要元素 */
.border-light {
  border: 1px solid #e5e7eb;
}
```

**使用规则**：
- 主要卡片（日历、对话确认卡）：粗黑手绘边框 `border-hand`
- 对话气泡：圆角 + 细边框或无边框
- 按钮：圆角 + 填充色，底部导航按钮用手绘风格

---

## 对话界面设计

### 对话气泡

**AI 消息（左侧）**
```html
<div class="flex items-start gap-2 mb-4">
  <!-- AI 头像 -->
  <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
    <!-- 品牌头像：二维手绘猫喵子；示意不等于当前组件实现 -->
  </div>
  <!-- 气泡 -->
  <div class="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[75%]">
    <p class="text-gray-900 text-base">你好呀，今天花钱了吗？</p>
  </div>
</div>
```

**用户消息（右侧）**
```html
<div class="flex items-start gap-2 mb-4 justify-end">
  <!-- 气泡 -->
  <div class="bg-primary-400 rounded-2xl rounded-tr-sm px-4 py-3 text-white max-w-[75%]">
    <p class="text-base">中午吃饭花了 35 块</p>
  </div>
  <!-- 用户头像 -->
  <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
    👤
  </div>
</div>
```

### AI 确认卡片

```html
<div class="bg-white rounded-xl border-hand p-4 shadow-md mb-4 mx-12">
  <div class="flex items-center gap-2 mb-3">
    <span class="text-xl">📝</span>
    <span class="font-semibold text-gray-900">已识别</span>
  </div>
  
  <div class="space-y-2 mb-4">
    <div class="flex justify-between">
      <span class="text-gray-600">类型</span>
      <span class="font-medium text-gray-900">餐饮 🍔</span>
    </div>
    <div class="flex justify-between">
      <span class="text-gray-600">金额</span>
      <span class="font-mono font-bold text-expense text-lg">¥35.00</span>
    </div>
    <div class="flex justify-between">
      <span class="text-gray-600">时间</span>
      <span class="text-gray-900">今天 12:30</span>
    </div>
  </div>
  
  <div class="flex gap-2">
    <button class="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">
      修改
    </button>
    <button class="flex-1 py-2 bg-primary-400 text-white rounded-lg font-medium">
      确认记账
    </button>
  </div>
</div>
```

---

## 吉祥物设计

### 角色设定

**名字**：喵子；产品全名喵子智账。
**形象**：以现有灰白猫素材为基础的二维手绘猫，保留纸感、棕色轮廓、粉色脸颊；不以系统猫/鸡emoji替代正式头像。

### 应用场景与实施边界

- 聊天顶部和助手消息旁使用猫猫，账单草稿采用纸胶带/手账纸片感，装饰不挡文字和操作。
- 空状态、思考、成功等表情作为后续候选；当前没有完整猫猫动画包，不把“猫会跑步/换表情”写成现成实现。
- 优先复用现有猫图；新增角色素材、字体、收费生成各单独确认。已接入的旧小鸡暂留代码，按批准的前端范围替换，不先批量删除素材。

---

## 组件设计规范

### 按钮

**主要按钮**
```html
<button class="
  px-6 py-3 
  bg-primary-400 text-white font-medium rounded-xl
  shadow-md hover:shadow-lg hover:bg-primary-500
  active:scale-95
  transition-all duration-200
">
  确认记账
</button>
```

**次要按钮**
```html
<button class="
  px-6 py-3
  bg-white text-gray-700 font-medium rounded-xl
  border-2 border-gray-200
  hover:bg-gray-50
  active:scale-95
  transition-all duration-200
">
  取消
</button>
```

**底部导航按钮（手绘风格）**
```html
<button class="flex flex-col items-center gap-1 py-2">
  <span class="text-2xl">💬</span>
  <span class="text-xs text-gray-700">对话</span>
</button>
```

### 卡片

**日历卡片（手绘边框）**
```html
<div class="
  bg-white rounded-2xl border-hand p-6
  shadow-lg
">
  <!-- 日历内容 -->
</div>
```

**账单卡片**
```html
<div class="
  bg-white rounded-xl p-4
  border border-gray-200
  hover:shadow-md transition-shadow
">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-2xl">🍔</span>
      <div>
        <p class="font-medium text-gray-900">麦当劳套餐</p>
        <p class="text-sm text-gray-500">今天 12:30</p>
      </div>
    </div>
    <p class="font-mono font-bold text-expense text-lg">-¥35.00</p>
  </div>
</div>
```

### 输入框

**对话输入框**
```html
<div class="flex items-center gap-2 p-3 bg-white rounded-full border-2 border-gray-200">
  <input 
    type="text" 
    placeholder="说说今天花了什么钱..." 
    class="flex-1 bg-transparent outline-none text-gray-900"
  />
  <button class="w-10 h-10 rounded-full bg-primary-400 text-white flex items-center justify-center">
    🎤
  </button>
</div>
```

---

## 日历视图设计

参考用户提供的截图风格：

```html
<div class="bg-white rounded-2xl border-hand p-4 shadow-lg">
  <!-- 头部：月份切换 -->
  <div class="flex items-center justify-between mb-4">
    <button class="text-2xl text-gray-400">◀</button>
    <h2 class="text-xl font-bold text-gray-900">2026年9月</h2>
    <button class="text-2xl text-gray-400">▶</button>
  </div>
  
  <!-- 星期标题 -->
  <div class="grid grid-cols-7 gap-1 mb-2 text-center text-sm text-gray-500">
    <div>日</div><div>一</div><div>二</div><div>三</div>
    <div>四</div><div>五</div><div>六</div>
  </div>
  
  <!-- 日期格子 -->
  <div class="grid grid-cols-7 gap-1">
    <button class="aspect-square rounded-lg bg-gray-50 flex items-center justify-center text-gray-900 font-medium hover:bg-gray-100">
      01
    </button>
    <!-- 今天 -->
    <button class="aspect-square rounded-lg bg-accent-400 text-white flex items-center justify-center font-bold">
      29
    </button>
    <!-- 其他日期... -->
  </div>
  
  <!-- 底部：本月统计 -->
  <div class="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
    <span class="text-income">本月收入：¥ 0.00</span>
    <span class="text-expense">本月支出：¥ 0.00</span>
  </div>
</div>
```

---

## 动画规范

### 微动画

```css
/* 标准过渡 */
transition: all 0.2s ease;

/* 按钮点击反馈 */
.btn:active {
  transform: scale(0.95);
}

/* 对话气泡进入动画 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble {
  animation: slideUp 0.3s ease;
}
```

---

## 图标系统

**优先使用 emoji**（符合手账风格）：
- 餐饮 🍔、交通 🚗、购物 🛍️、娱乐 🎮
- 医疗 💊、教育 📚、住房 🏠、运动 ⚽
- 收入 💰、工资 💵、红包 🧧

**辅助图标库**：lucide-vue-next（简洁线性图标，用于功能按钮）

---

## 响应式设计

### 断点

```css
sm: 640px   /* 大屏手机 */
md: 768px   /* 平板 */
lg: 1024px  /* 桌面 */
```

### 布局原则

- **移动端优先**：主要场景是手机竖屏
- **对话界面**：移动端全屏，桌面端居中 max-w-2xl
- **底部导航**：当前移动端与桌面端均固定底部，桌面内容居中；左侧边栏不是已实现要求，后续变更单独确认。

---

## 色彩使用示例

| 场景 | 颜色 |
|---|---|
| 页面背景 | `bg-cream`（米黄） |
| 对话背景 | `bg-white` |
| AI 气泡 | `bg-white` + `border-gray-200` |
| 用户气泡 | `bg-primary-400`（粉橙） |
| 收入金额 | `text-income`（绿色） |
| 支出金额 | `text-expense`（橙色） |
| 主要按钮 | `bg-primary-400` |
| 日历今天 | `bg-accent-400`（粉色） |

---

**最后更新**: 2026-09-29  
**设计方向**: 对话式 AI 记账 + 手账风格
