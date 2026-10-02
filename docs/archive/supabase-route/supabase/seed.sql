-- 个人记账小程序 - 初始数据
-- 说明: 插入预设分类数据

-- ========================================
-- 预设支出分类
-- ========================================
INSERT INTO categories (name, type, icon, color, is_system, sort_order) VALUES
  ('餐饮', 'expense', 'icon-canyin', '#FF6B6B', TRUE, 1),
  ('交通', 'expense', 'icon-jiaotong', '#4ECDC4', TRUE, 2),
  ('购物', 'expense', 'icon-gouwu', '#FFE66D', TRUE, 3),
  ('日用', 'expense', 'icon-riyong', '#95E1D3', TRUE, 4),
  ('蔬菜', 'expense', 'icon-shucai', '#38A169', TRUE, 5),
  ('水果', 'expense', 'icon-shuiguo', '#F687B3', TRUE, 6),
  ('零食', 'expense', 'icon-lingshi', '#FC8181', TRUE, 7),
  ('运动', 'expense', 'icon-yundong', '#4299E1', TRUE, 8),
  ('娱乐', 'expense', 'icon-yule', '#9F7AEA', TRUE, 9),
  ('通讯', 'expense', 'icon-tongxun', '#48BB78', TRUE, 10),
  ('服饰', 'expense', 'icon-fushi', '#ED64A6', TRUE, 11),
  ('美容', 'expense', 'icon-meirong', '#F687B3', TRUE, 12),
  ('住房', 'expense', 'icon-zhufang', '#4299E1', TRUE, 13),
  ('居家', 'expense', 'icon-jujia', '#38B2AC', TRUE, 14),
  ('孩子', 'expense', 'icon-haizi', '#FBD38D', TRUE, 15),
  ('长辈', 'expense', 'icon-zhangbei', '#FC8181', TRUE, 16),
  ('社交', 'expense', 'icon-shejiao', '#F6AD55', TRUE, 17),
  ('旅游', 'expense', 'icon-lvyou', '#4FD1C5', TRUE, 18),
  ('数码', 'expense', 'icon-shuma', '#667EEA', TRUE, 19),
  ('汽车', 'expense', 'icon-qiche', '#63B3ED', TRUE, 20),
  ('医疗', 'expense', 'icon-yiliao', '#F56565', TRUE, 21),
  ('书籍', 'expense', 'icon-shuji', '#805AD5', TRUE, 22),
  ('学习', 'expense', 'icon-xuexi', '#3182CE', TRUE, 23),
  ('宠物', 'expense', 'icon-chongwu', '#ED8936', TRUE, 24),
  ('礼物', 'expense', 'icon-liwu', '#E53E3E', TRUE, 25),
  ('办公', 'expense', 'icon-bangong', '#718096', TRUE, 26),
  ('维修', 'expense', 'icon-weixiu', '#A0AEC0', TRUE, 27),
  ('捐赠', 'expense', 'icon-juanzeng', '#F6E05E', TRUE, 28),
  ('彩票', 'expense', 'icon-caipiao', '#FAF089', TRUE, 29),
  ('其他', 'expense', 'icon-qita', '#CBD5E0', TRUE, 30);

-- ========================================
-- 预设收入分类
-- ========================================
INSERT INTO categories (name, type, icon, color, is_system, sort_order) VALUES
  ('工资', 'income', 'icon-gongzi', '#07C160', TRUE, 1),
  ('兼职', 'income', 'icon-jianzhi', '#10B981', TRUE, 2),
  ('理财', 'income', 'icon-licai', '#34D399', TRUE, 3),
  ('礼金', 'income', 'icon-lijin', '#6EE7B7', TRUE, 4),
  ('其他', 'income', 'icon-qita', '#A7F3D0', TRUE, 5);

-- ========================================
-- 注意事项
-- ========================================
-- 1. 这些是系统预设分类 (is_system = TRUE)
-- 2. 用户可以基于这些分类创建自定义分类
-- 3. icon 字段对应前端的图标名称（需要前端配置对应的图标库）
-- 4. 颜色使用十六进制格式
-- 5. sort_order 用于前端展示排序
