-- 个人记账小程序 - 行级安全策略 (RLS)
-- 说明: 确保用户只能访问自己的数据

-- ========================================
-- 启用 RLS
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- users 表策略
-- ========================================

-- 用户可以查看自己的信息
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- 用户可以插入自己的信息（注册时）
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

-- 用户可以更新自己的信息
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- ========================================
-- categories 表策略
-- ========================================

-- 用户可以查看系统预设分类和自己的分类
CREATE POLICY "Users can view system and own categories"
  ON categories FOR SELECT
  USING (
    is_system = TRUE OR
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户可以创建自己的分类
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户可以更新自己的分类（不能更新系统分类）
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (
    is_system = FALSE AND
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    is_system = FALSE AND
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户可以删除自己的分类（不能删除系统分类）
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (
    is_system = FALSE AND
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ========================================
-- records 表策略
-- ========================================

-- 用户只能查看自己的账单记录
CREATE POLICY "Users can view own records"
  ON records FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户只能创建自己的账单记录
CREATE POLICY "Users can insert own records"
  ON records FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户只能更新自己的账单记录
CREATE POLICY "Users can update own records"
  ON records FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户只能删除自己的账单记录
CREATE POLICY "Users can delete own records"
  ON records FOR DELETE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ========================================
-- budgets 表策略
-- ========================================

-- 用户只能查看自己的预算
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户只能创建自己的预算
CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户只能更新自己的预算
CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户只能删除自己的预算
CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ========================================
-- accounts 表策略
-- ========================================

-- 用户只能查看自己的账本
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户只能创建自己的账本
CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户只能更新自己的账本
CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- 用户只能删除自己的账本
CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ========================================
-- 注意事项
-- ========================================
-- 1. auth.uid() 返回当前认证用户的 UUID
-- 2. 所有策略都基于 auth_id 进行用户匹配
-- 3. 系统预设分类 (is_system = TRUE) 所有用户可见，但不可修改
-- 4. 用户只能操作自己创建的数据
-- 5. 在 Supabase Dashboard 中可以测试这些策略
