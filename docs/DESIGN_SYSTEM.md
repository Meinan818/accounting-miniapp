# 智账 - 设计系统

## 设计理念

**核心概念**：高级感 + 可爱萌宠 + 二次元风格

将专业的记账功能与轻松可爱的视觉风格结合，打造一个既高效又有趣的财务管理应用。

---

## 视觉风格定位

### 关键词
- **高级感**：简约、克制、精致
- **可爱**：圆润、柔和、亲和
- **二次元**：活泼、生动、有个性

### 参考方向
- UI 风格：Notion（简洁高级）+ Duolingo（可爱有趣）
- 吉祥物：圆润的小猫/小狗形象，作为记账助手
- 交互：微动画，赋予元素生命力

---

## 色彩系统

### 主色调（高级 + 温暖）

```css
/* 主色 - 温柔的紫色（高级感） */
--primary-50: #faf5ff;
--primary-100: #f3e8ff;
--primary-200: #e9d5ff;
--primary-300: #d8b4fe;
--primary-400: #c084fc;
--primary-500: #a855f7;  /* 主色 */
--primary-600: #9333ea;
--primary-700: #7e22ce;
--primary-800: #6b21a8;
--primary-900: #581c87;

/* 辅助色 - 温暖的粉色（可爱） */
--accent-50: #fff1f2;
--accent-100: #ffe4e6;
--accent-200: #fecdd3;
--accent-300: #fda4af;
--accent-400: #fb7185;
--accent-500: #f43f5e;
--accent-600: #e11d48;
--accent-700: #be123c;
--accent-800: #9f1239;
--accent-900: #881337;
```

### 功能色

```css
/* 收入 - 清新的绿色 */
--success-light: #d1fae5;
--success: #10b981;
--success-dark: #059669;

/* 支出 - 活力的橙色（避免过于刺眼的红色） */
--expense-light: #fed7aa;
--expense: #fb923c;
--expense-dark: #ea580c;

/* 警告 - 温暖的黄色 */
--warning-light: #fef3c7;
--warning: #fbbf24;
--warning-dark: #f59e0b;

/* 信息 - 柔和的蓝色 */
--info-light: #dbeafe;
--info: #3b82f6;
--info-dark: #2563eb;
```

### 中性色（高级灰）

```css
/* 文字颜色 */
--text-primary: #1f2937;    /* 深灰，不是纯黑 */
--text-secondary: #6b7280;  /* 中灰 */
--text-tertiary: #9ca3af;   /* 浅灰 */
--text-disabled: #d1d5db;   /* 禁用 */

/* 背景色 */
--bg-primary: #ffffff;      /* 纯白 */
--bg-secondary: #f9fafb;    /* 浅灰背景 */
--bg-tertiary: #f3f4f6;     /* 更浅的灰 */

/* 边框色 */
--border-light: #f3f4f6;
--border-default: #e5e7eb;
--border-strong: #d1d5db;
```

### 暗色模式（可选）

```css
/* 暗色背景使用深紫灰色，而非纯黑 */
--dark-bg-primary: #1a1625;
--dark-bg-secondary: #251e35;
--dark-bg-tertiary: #2f2742;

/* 暗色文字 */
--dark-text-primary: #f9fafb;
--dark-text-secondary: #d1d5db;
--dark-text-tertiary: #9ca3af;
```

---

## 字体系统

### 字体选择

```css
/* 主字体 - 优雅易读 */
font-family: 
  "Inter", 
  -apple-system, 
  BlinkMacSystemFont,
  "PingFang SC",
  "Microsoft YaHei",
  sans-serif;

/* 数字字体 - 等宽，适合金额显示 */
font-family: 
  "JetBrains Mono",
  "SF Mono",
  "Consolas",
  monospace;
```

### 字体大小（Tailwind 标准）

```css
/* 标题 */
--text-4xl: 2.25rem;  /* 36px - 页面主标题 */
--text-3xl: 1.875rem; /* 30px - 区块标题 */
--text-2xl: 1.5rem;   /* 24px - 卡片标题 */
--text-xl: 1.25rem;   /* 20px - 小标题 */

/* 正文 */
--text-lg: 1.125rem;  /* 18px - 强调正文 */
--text-base: 1rem;    /* 16px - 标准正文 */
--text-sm: 0.875rem;  /* 14px - 辅助文字 */
--text-xs: 0.75rem;   /* 12px - 次要信息 */

/* 金额显示 */
--amount-large: 3rem;   /* 48px - 主要金额 */
--amount-medium: 2rem;  /* 32px - 次要金额 */
--amount-small: 1.25rem; /* 20px - 列表金额 */
```

### 字重

```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 间距系统

遵循 **8px 栅格系统**（Tailwind 默认）

```css
/* 基础单位 */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */

/* 容器间距 */
--container-padding: 1rem;  /* 移动端 */
--container-padding-lg: 2rem; /* 桌面端 */
```

---

## 圆角系统

**圆润可爱的设计语言**

```css
--radius-sm: 0.375rem;   /* 6px - 按钮、输入框 */
--radius-md: 0.5rem;     /* 8px - 卡片 */
--radius-lg: 0.75rem;    /* 12px - 大卡片 */
--radius-xl: 1rem;       /* 16px - 模态框 */
--radius-2xl: 1.5rem;    /* 24px - 特殊元素 */
--radius-full: 9999px;   /* 圆形 - 头像、标签 */
```

**使用规则**：
- 按钮：`rounded-lg`（12px）
- 卡片：`rounded-xl`（16px）
- 输入框：`rounded-lg`（12px）
- 标签/徽章：`rounded-full`
- 头像：`rounded-full`

---

## 阴影系统

**柔和的投影，增加层次感**

```css
/* 微阴影 - 悬浮状态 */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* 默认阴影 - 卡片 */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* 强阴影 - 模态框、弹出层 */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* 超强阴影 - 浮动元素 */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* 彩色阴影 - 主要按钮（可选） */
--shadow-primary: 0 8px 16px -4px rgba(168, 85, 247, 0.4);
```

---

## 吉祥物设计

### 角色设定

**名字**：小账（Xiaozhang）

**形象**：
- 圆润的小猫咪（简化的二次元风格）
- 大眼睛，短手短脚
- 戴着可爱的小帽子（帽子上有"¥"符号）
- 表情丰富，有多个状态

### 表情状态

```
😊 开心：记账成功、收入增加
😢 难过：支出超标、预算不足
🤔 思考：分析账单、提供建议
😴 睡觉：无操作状态
🎉 庆祝：达成目标、省钱成功
😰 紧张：临近超支、月底没钱
```

### 应用场景

1. **空状态**：小账坐着等待，提示"快来记一笔吧~"
2. **记账成功**：小账竖起大拇指
3. **超支警告**：小账露出紧张表情
4. **月度报告**：小账戴着小眼镜，拿着报表
5. **加载状态**：小账跑步动画

### 实现方式

- **静态图**：关键场景使用插画（SVG）
- **简化版**：用 CSS + emoji 实现快速版本
- **动画版**：Lottie 动画（可选）

---

## 组件设计规范

### 按钮

**主要按钮**（Primary）
```html
<button class="
  px-6 py-3 
  bg-gradient-to-r from-primary-500 to-primary-600
  text-white font-medium rounded-lg
  shadow-lg shadow-primary-500/30
  hover:shadow-xl hover:shadow-primary-500/40
  active:scale-95
  transition-all duration-200
">
  记一笔
</button>
```

**次要按钮**（Secondary）
```html
<button class="
  px-6 py-3
  bg-white text-primary-600 font-medium rounded-lg
  border-2 border-primary-200
  hover:bg-primary-50 hover:border-primary-300
  active:scale-95
  transition-all duration-200
">
  取消
</button>
```

### 卡片

**基础卡片**
```html
<div class="
  bg-white rounded-xl p-6
  shadow-md hover:shadow-lg
  transition-shadow duration-200
">
  <!-- 内容 -->
</div>
```

**强调卡片**（带渐变）
```html
<div class="
  bg-gradient-to-br from-primary-500 to-accent-500
  rounded-xl p-6
  text-white
  shadow-xl
">
  <!-- 内容 -->
</div>
```

### 输入框

```html
<input class="
  w-full px-4 py-3
  bg-gray-50 border-2 border-gray-200 rounded-lg
  text-gray-900 placeholder-gray-400
  focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100
  transition-all duration-200
" />
```

### 标签/徽章

```html
<span class="
  inline-flex items-center
  px-3 py-1
  bg-primary-100 text-primary-700
  text-sm font-medium rounded-full
">
  餐饮
</span>
```

---

## 动画规范

### 微动画

**原则**：自然、流畅、不过度

```css
/* 标准过渡 */
transition: all 0.2s ease;

/* 弹性过渡 - 适合按钮、卡片 */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* 弹跳过渡 - 适合提示、通知 */
transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 常用动画

**淡入淡出**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**滑入（从下到上）**
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**弹跳**
```css
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

**按钮点击反馈**
```css
.btn:active {
  transform: scale(0.95);
}
```

---

## 图标系统

### 推荐图标库

- **Lucide Icons**（推荐）：简洁、现代、Vue 3 友好
- **Heroicons**：Tailwind 官方，风格统一
- **Phosphor Icons**：有趣、圆润

### 图标大小

```css
--icon-xs: 1rem;    /* 16px */
--icon-sm: 1.25rem; /* 20px */
--icon-md: 1.5rem;  /* 24px */
--icon-lg: 2rem;    /* 32px */
--icon-xl: 2.5rem;  /* 40px */
```

---

## 响应式断点

```css
/* Tailwind 默认断点 */
sm: 640px   /* 手机横屏 */
md: 768px   /* 平板 */
lg: 1024px  /* 小笔记本 */
xl: 1280px  /* 桌面 */
2xl: 1536px /* 大屏 */
```

### 设计原则

- **移动优先**：默认样式为移动端
- **渐进增强**：大屏幕添加额外功能
- **单列布局**：移动端单列，桌面端可多列

---

## 特殊设计元素

### 玻璃态（Glassmorphism）

用于模态框、浮动卡片

```css
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### 新拟态（Neumorphism）- 谨慎使用

仅用于特殊场景（如数字键盘）

```css
.neumorphic {
  background: #f0f0f3;
  box-shadow: 
    8px 8px 16px #d1d1d4,
    -8px -8px 16px #ffffff;
}
```

### 渐变色

**主要渐变**
```css
background: linear-gradient(135deg, #a855f7 0%, #f43f5e 100%);
```

**收入渐变**
```css
background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
```

**支出渐变**
```css
background: linear-gradient(135deg, #fb923c 0%, #f43f5e 100%);
```

---

## 页面布局

### 移动端布局

```
┌─────────────────────┐
│      顶部导航        │
├─────────────────────┤
│                     │
│     主要内容区       │
│   （可滚动）         │
│                     │
├─────────────────────┤
│    底部导航栏        │
│   [首页][统计][我]   │
└─────────────────────┘
```

### 桌面端布局

```
┌──────────────────────────────────┐
│           顶部导航栏              │
├───────┬──────────────────────────┤
│       │                          │
│ 侧边  │      主要内容区           │
│ 导航  │    （更宽，居中）         │
│       │                          │
└───────┴──────────────────────────┘
```

---

## 使用示例

### 记账卡片

```html
<div class="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
  <!-- 分类图标 -->
  <div class="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-2xl mb-3">
    🍔
  </div>
  
  <!-- 分类名称 -->
  <p class="text-gray-900 font-medium mb-1">午餐</p>
  
  <!-- 金额 -->
  <p class="text-2xl font-bold text-expense-500 font-mono">
    -¥ 35.00
  </p>
  
  <!-- 时间 -->
  <p class="text-sm text-gray-500 mt-2">
    今天 12:30
  </p>
</div>
```

---

**最后更新**: 2026-09-29  
**设计师**: Claude + 项目团队
