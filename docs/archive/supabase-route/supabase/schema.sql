-- 个人记账小程序 - 数据库结构设计
-- 创建日期: 2026-09-29
-- 数据库: PostgreSQL (Supabase)

-- ========================================
-- 1. 用户表 (users)
-- ========================================
-- 说明: 存储用户基本信息，与 Supabase Auth 集成
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_users_auth_id ON users(auth_id);

-- ========================================
-- 2. 分类表 (categories)
-- ========================================
-- 说明: 收支分类，支持预设和用户自定义
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(20) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  icon VARCHAR(50) DEFAULT 'icon-qita',
  color VARCHAR(20) DEFAULT '#1989fa',
  is_system BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);

-- ========================================
-- 3. 账单记录表 (records)
-- ========================================
-- 说明: 核心表，存储所有收支记录
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME DEFAULT CURRENT_TIME,
  remark TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_records_user_id ON records(user_id);
CREATE INDEX idx_records_date ON records(date DESC);
CREATE INDEX idx_records_category_id ON records(category_id);
CREATE INDEX idx_records_type ON records(type);
CREATE INDEX idx_records_user_date ON records(user_id, date DESC);

-- ========================================
-- 4. 预算表 (budgets)
-- ========================================
-- 说明: 月度预算设置
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  month VARCHAR(7) NOT NULL, -- 格式: YYYY-MM
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month, category_id)
);

-- 创建索引
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_month ON budgets(month);

-- ========================================
-- 5. 账本表 (accounts) - 可选功能
-- ========================================
-- 说明: 支持多账本管理（如日常、旅游、报销等）
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(20) NOT NULL,
  icon VARCHAR(50) DEFAULT 'icon-qianbao',
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- ========================================
-- 触发器: 自动更新 updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 注释说明
-- ========================================
COMMENT ON TABLE users IS '用户信息表';
COMMENT ON TABLE categories IS '收支分类表';
COMMENT ON TABLE records IS '账单记录表（核心）';
COMMENT ON TABLE budgets IS '月度预算表';
COMMENT ON TABLE accounts IS '账本表（多账本功能）';
