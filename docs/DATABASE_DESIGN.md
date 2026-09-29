# 数据库设计文档

## 概述

本项目使用 **Supabase (PostgreSQL)** 作为数据库，采用关系型数据库设计，适合财务数据的管理和复杂查询。

## ER 图

```
┌─────────────┐
│   auth.users│ (Supabase Auth)
└──────┬──────┘
       │
       │ 1:1
       ▼
┌─────────────┐
│    users    │ 用户信息表
└──────┬──────┘
       │
       │ 1:N
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌────────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│ categories │  │ records  │  │ budgets │  │ accounts │
│  分类表    │  │ 账单表   │  │ 预算表  │  │ 账本表   │
└────────────┘  └────┬─────┘  └─────────┘  └──────────┘
       ▲             │
       └─────────────┘
         N:1 (category_id)
```

## 表结构详解

### 1. users - 用户信息表

存储用户基本信息，与 Supabase Auth 关联。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 用户ID |
| auth_id | UUID | FOREIGN KEY, UNIQUE | Supabase Auth 用户ID |
| nickname | VARCHAR(50) | | 昵称 |
| avatar_url | TEXT | | 头像URL |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**:
- `idx_users_auth_id` ON `auth_id`

**关系**:
- `auth_id` → `auth.users(id)` (ON DELETE CASCADE)

---

### 2. categories - 分类表

存储收支分类，支持系统预设和用户自定义。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 分类ID |
| user_id | UUID | FOREIGN KEY, NULLABLE | 用户ID（系统分类为NULL） |
| name | VARCHAR(20) | NOT NULL | 分类名称 |
| type | VARCHAR(10) | NOT NULL, CHECK | 类型: income/expense |
| icon | VARCHAR(50) | DEFAULT 'icon-qita' | 图标名称 |
| color | VARCHAR(20) | DEFAULT '#1989fa' | 颜色（十六进制） |
| is_system | BOOLEAN | DEFAULT FALSE | 是否系统预设 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**:
- `idx_categories_user_id` ON `user_id`
- `idx_categories_type` ON `type`

**关系**:
- `user_id` → `users(id)` (ON DELETE CASCADE)

**业务逻辑**:
- `is_system = TRUE`: 系统预设分类，所有用户可见，不可修改/删除
- `is_system = FALSE`: 用户自定义分类，仅创建者可见和修改

---

### 3. records - 账单记录表（核心表）

存储所有收支记录，是系统的核心数据表。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 记录ID |
| user_id | UUID | FOREIGN KEY, NOT NULL | 用户ID |
| category_id | UUID | FOREIGN KEY, NULLABLE | 分类ID |
| type | VARCHAR(10) | NOT NULL, CHECK | 类型: income/expense |
| amount | DECIMAL(10,2) | NOT NULL, CHECK > 0 | 金额（精确到分） |
| date | DATE | NOT NULL, DEFAULT TODAY | 记账日期 |
| time | TIME | DEFAULT NOW | 记账时间 |
| remark | TEXT | NULLABLE | 备注 |
| image_url | TEXT | NULLABLE | 票据图片URL |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**:
- `idx_records_user_id` ON `user_id`
- `idx_records_date` ON `date DESC` (按日期倒序，优化列表查询)
- `idx_records_category_id` ON `category_id`
- `idx_records_type` ON `type`
- `idx_records_user_date` ON `(user_id, date DESC)` (复合索引，优化用户+日期查询)

**关系**:
- `user_id` → `users(id)` (ON DELETE CASCADE)
- `category_id` → `categories(id)` (ON DELETE SET NULL)

**约束**:
- `amount > 0`: 金额必须大于0
- `type IN ('income', 'expense')`: 类型只能是收入或支出

---

### 4. budgets - 预算表

存储用户的月度预算设置。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 预算ID |
| user_id | UUID | FOREIGN KEY, NOT NULL | 用户ID |
| month | VARCHAR(7) | NOT NULL | 月份（格式: YYYY-MM） |
| amount | DECIMAL(10,2) | NOT NULL, CHECK > 0 | 预算金额 |
| category_id | UUID | FOREIGN KEY, NULLABLE | 分类ID（NULL表示总预算） |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**:
- `idx_budgets_user_id` ON `user_id`
- `idx_budgets_month` ON `month`

**关系**:
- `user_id` → `users(id)` (ON DELETE CASCADE)
- `category_id` → `categories(id)` (ON DELETE SET NULL)

**唯一约束**:
- `UNIQUE(user_id, month, category_id)`: 用户每月每个分类只能有一个预算

**业务逻辑**:
- `category_id = NULL`: 月度总预算
- `category_id != NULL`: 特定分类的预算

---

### 5. accounts - 账本表（可选功能）

支持多账本管理，如日常账本、旅游账本等。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 账本ID |
| user_id | UUID | FOREIGN KEY, NOT NULL | 用户ID |
| name | VARCHAR(20) | NOT NULL | 账本名称 |
| icon | VARCHAR(50) | DEFAULT 'icon-qianbao' | 图标名称 |
| is_default | BOOLEAN | DEFAULT FALSE | 是否默认账本 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**:
- `idx_accounts_user_id` ON `user_id`

**关系**:
- `user_id` → `users(id)` (ON DELETE CASCADE)

**业务逻辑**:
- 每个用户至少有一个默认账本
- `is_default = TRUE` 的账本在记账时作为默认选项

---

## 触发器

### update_updated_at_column

自动更新所有表的 `updated_at` 字段。

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

应用于：`users`, `categories`, `records`, `budgets`, `accounts`

---

## 行级安全策略 (RLS)

所有表都启用了 RLS，确保数据隔离和安全性。

### 核心原则
1. **用户隔离**: 用户只能访问自己的数据
2. **系统数据共享**: 系统预设分类所有用户可见
3. **认证验证**: 基于 `auth.uid()` 进行权限验证

### 策略示例

**records 表**:
- ✅ SELECT: `user_id` 匹配当前用户
- ✅ INSERT: `user_id` 必须是当前用户
- ✅ UPDATE: `user_id` 必须是当前用户
- ✅ DELETE: `user_id` 必须是当前用户

**categories 表**:
- ✅ SELECT: 系统分类 OR 自己创建的分类
- ✅ INSERT: 仅能创建属于自己的分类
- ✅ UPDATE: 仅能更新自己创建的分类（不能更新系统分类）
- ✅ DELETE: 仅能删除自己创建的分类（不能删除系统分类）

详见 `supabase/rls_policies.sql`

---

## 常用查询

### 1. 获取用户某月的所有账单

```sql
SELECT 
  r.*,
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color
FROM records r
LEFT JOIN categories c ON r.category_id = c.id
WHERE r.user_id = 'user-uuid'
  AND r.date >= '2026-09-01'
  AND r.date <= '2026-09-30'
ORDER BY r.date DESC, r.time DESC;
```

### 2. 统计某月收支总额

```sql
SELECT 
  type,
  SUM(amount) as total
FROM records
WHERE user_id = 'user-uuid'
  AND date >= '2026-09-01'
  AND date <= '2026-09-30'
GROUP BY type;
```

### 3. 按分类统计支出占比

```sql
SELECT 
  c.name,
  c.color,
  SUM(r.amount) as total,
  ROUND(SUM(r.amount) / (SELECT SUM(amount) FROM records WHERE user_id = 'user-uuid' AND type = 'expense' AND date >= '2026-09-01' AND date <= '2026-09-30') * 100, 2) as percentage
FROM records r
JOIN categories c ON r.category_id = c.id
WHERE r.user_id = 'user-uuid'
  AND r.type = 'expense'
  AND r.date >= '2026-09-01'
  AND r.date <= '2026-09-30'
GROUP BY c.id, c.name, c.color
ORDER BY total DESC;
```

### 4. 检查预算使用情况

```sql
SELECT 
  b.amount as budget_amount,
  COALESCE(SUM(r.amount), 0) as spent_amount,
  b.amount - COALESCE(SUM(r.amount), 0) as remaining
FROM budgets b
LEFT JOIN records r ON r.user_id = b.user_id 
  AND r.type = 'expense'
  AND TO_CHAR(r.date, 'YYYY-MM') = b.month
  AND (b.category_id IS NULL OR r.category_id = b.category_id)
WHERE b.user_id = 'user-uuid'
  AND b.month = '2026-09'
GROUP BY b.id, b.amount;
```

---

## 性能优化建议

1. **分页查询**: 使用 `LIMIT` 和 `OFFSET`，避免一次加载过多数据
2. **索引优化**: 已为常用查询字段创建索引
3. **批量操作**: 使用事务处理批量插入/更新
4. **定期清理**: 定期归档或删除过期数据（如3年前的数据）

---

## 扩展性考虑

### 未来可能的扩展

1. **多币种支持**: 添加 `currency` 字段
2. **标签系统**: 创建 `tags` 表和 `record_tags` 关联表
3. **定期账单**: 创建 `recurring_records` 表，支持自动记账
4. **共享账本**: 创建 `account_members` 表，支持多人记账

---

**最后更新**: 2026-09-29
