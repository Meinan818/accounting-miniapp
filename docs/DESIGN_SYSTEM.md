# 智账 - 设计系统

## 设计理念

**核心概念**：手账风格 + AI 对话 + 温暖可爱

这是一个**对话式 AI 记账应用**，用户通过和 AI 聊天来记账，就像和朋友分享今天的消费。视觉风格模仿手账本，用手绘线条、温暖色调和可爱吉祥物营造轻松愉悦的记账体验。

---

## 视觉风格定位

### 关键词
- **手账感**：手绘边框、温暖米黄底色、不规则线条
- **温暖可爱**：粉橙点缀、emoji 丰富、小黄鸡陪伴
- **对话式**：聊天气泡、自然语言交互、AI 有个性

### 参考方向
- UI 风格：手账 App（如 Daylio、Notion Calendar）+ 微信聊天界面
- 吉祥物：小黄鸡（圆润、表情丰富、会根据记账内容做出反应）
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
    🐣
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

**名字**：小账（Xiaozhang）  
**形象**：圆润的小黄鸡 🐣

### 表情状态

```
😊 开心（默认）：等待用户说话
🎉 庆祝：记账成功、今天没花钱
🤔 思考：AI 正在理解用户输入
😰 紧张：本月支出超过预算
💪 鼓励：用户说"又超支了"时安慰
😴 睡觉：长时间无操作
```

### 应用场景

1. **对话界面底部**：小黄鸡常驻左下角，根据对话内容切换表情
2. **空状态**："当前选择日期没有账单记录"时，小黄鸡摊手
3. **加载状态**：小黄鸡跑步动画
4. **成功反馈**：小黄鸡竖大拇指

### 实现方式

- **阶段 1**：用 emoji 🐣 快速实现
- **阶段 2**：简笔画 SVG（5-6 个状态，手绘风格）
- **阶段 3**：Lottie 动画（可选）

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
- **底部导航**：移动端固定底部，桌面端左侧边栏

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
