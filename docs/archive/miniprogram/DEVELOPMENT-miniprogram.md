# 开发指南

## 环境搭建

### 1. 安装 Node.js

确保安装 Node.js 16 或更高版本：

```bash
node -v  # 应显示 v16.x.x 或更高
npm -v   # 应显示 8.x.x 或更高
```

下载地址: https://nodejs.org/

---

### 2. 安装 HBuilderX（推荐）或 VS Code

#### 方案 A: HBuilderX（官方推荐）

1. 下载 HBuilderX: https://www.dcloud.io/hbuilderx.html
2. 安装「uni-app 编译器」插件
3. 导入项目目录

#### 方案 B: VS Code

1. 安装 VS Code: https://code.visualstudio.com/
2. 安装插件:
   - `uni-create-view`
   - `uni-helper`
   - `Vue Language Features (Volar)`
3. 全局安装 uni-app CLI:

```bash
npm install -g @dcloudio/uvm
uvm
```

---

### 3. 安装微信开发者工具

1. 下载: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 登录微信账号
3. 设置 → 安全设置 → 开启「服务端口」

---

### 4. 注册 Supabase 账号

1. 访问: https://app.supabase.com
2. 使用 GitHub 账号登录（免费）
3. 创建新项目:
   - Organization: 个人账号
   - Project Name: `accounting-app`
   - Database Password: 保存好密码
   - Region: 选择离你最近的区域

---

## 项目初始化

### 1. 安装依赖

```bash
cd frontend
npm install
```

依赖列表：
- `vue`: ^3.2.0
- `@dcloudio/vite-plugin-uni`: 最新版
- `@supabase/supabase-js`: ^2.38.0
- `pinia`: ^2.1.0

---

### 2. 配置 Supabase

#### 2.1 获取项目凭证

在 Supabase Dashboard:
1. 进入你的项目
2. 点击左侧「Settings」→「API」
3. 复制以下信息:
   - `Project URL`
   - `anon public` key

#### 2.2 配置环境变量

```bash
# 在项目根目录创建 .env 文件
cp .env.example .env
```

编辑 `.env`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. 初始化数据库

在 Supabase Dashboard:

1. 进入「SQL Editor」
2. 新建查询
3. 依次执行以下 SQL 文件:

```sql
-- 1. 创建表结构
-- 复制粘贴 supabase/schema.sql 的内容
-- 点击「Run」

-- 2. 插入初始数据
-- 复制粘贴 supabase/seed.sql 的内容
-- 点击「Run」

-- 3. 配置安全策略
-- 复制粘贴 supabase/rls_policies.sql 的内容
-- 点击「Run」
```

#### 验证数据库

进入「Table Editor」，应该能看到：
- ✅ users 表
- ✅ categories 表（有 35 条预设数据）
- ✅ records 表
- ✅ budgets 表
- ✅ accounts 表

---

### 4. 配置 Storage（图片上传）

1. 进入「Storage」
2. 点击「Create a new bucket」:
   - Name: `receipts`
   - Public: ✅ 勾选（公开访问）
3. 点击「Create bucket」

#### 配置存储策略

进入 `receipts` bucket → Policies:

```sql
-- 允许用户上传自己的图片
CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许所有人查看图片
CREATE POLICY "Public access to receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- 允许用户删除自己的图片
CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 启动项目

### 1. 开发模式

```bash
cd frontend
npm run dev:mp-weixin
```

编译完成后，会生成 `dist/dev/mp-weixin` 目录。

---

### 2. 在微信开发者工具中打开

1. 打开微信开发者工具
2. 选择「导入项目」
3. 目录选择: `frontend/dist/dev/mp-weixin`
4. AppID: 点击「测试号」（或使用自己的 AppID）
5. 点击「导入」

---

### 3. 配置合法域名（重要）

在微信开发者工具中:
1. 点击右上角「详情」
2. 「本地设置」→ 勾选「不校验合法域名」

> **注意**: 正式发布时需要在微信公众平台配置 Supabase 域名为合法域名。

---

## 开发流程

### 1. 创建新页面

```bash
# 使用 HBuilderX: 右键 pages 文件夹 → 新建页面
# 或手动创建:
mkdir frontend/pages/demo
touch frontend/pages/demo/demo.vue
```

在 `pages.json` 中注册:
```json
{
  "pages": [
    {
      "path": "pages/demo/demo",
      "style": {
        "navigationBarTitleText": "演示页面"
      }
    }
  ]
}
```

---

### 2. 调用 API

```javascript
// 在页面中使用
import { getRecords } from '@/api/record'

export default {
  async onLoad() {
    try {
      const { records } = await getRecords({
        userId: 'xxx',
        month: '2026-09'
      })
      console.log(records)
    } catch (error) {
      console.error(error)
    }
  }
}
```

---

### 3. 调试技巧

#### 查看日志
```javascript
console.log('Debug:', data)  // 在微信开发者工具的 Console 中查看
```

#### 查看网络请求
1. 微信开发者工具 → 调试器 → Network
2. 查看 Supabase API 请求和响应

#### 模拟器测试
- 微信开发者工具的模拟器
- 真机调试（扫码预览）

#### Storage 查看
```javascript
// 查看本地存储
const value = uni.getStorageSync('key')
console.log(value)
```

---

### 4. 热重载

修改代码后会自动重新编译，微信开发者工具会自动刷新。

如果没有刷新:
1. 手动点击「编译」按钮
2. 或重启微信开发者工具

---

## 常见问题

### Q1: 编译失败，提示 `Cannot find module`

**解决**:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

### Q2: Supabase 请求失败，提示网络错误

**检查**:
1. `.env` 文件配置是否正确
2. 微信开发者工具是否勾选「不校验合法域名」
3. Supabase 项目是否正常运行

**测试连接**:
```javascript
// 在页面 onLoad 中测试
import { supabase } from '@/api/index'

const { data, error } = await supabase.from('categories').select('*').limit(1)
console.log('Test:', data, error)
```

---

### Q3: RLS 策略导致查询返回空数据

**原因**: 未登录或 RLS 策略配置错误

**解决**:
1. 确保已调用登录接口
2. 检查 `supabase/rls_policies.sql` 是否正确执行
3. 在 Supabase Dashboard → Authentication → Policies 中检查策略

**临时禁用 RLS（仅测试）**:
```sql
ALTER TABLE records DISABLE ROW LEVEL SECURITY;
```

---

### Q4: 图片上传失败

**检查**:
1. Storage bucket 是否创建
2. Storage 策略是否配置
3. 图片大小是否超过限制（Supabase 免费版限制 50MB）

**测试上传**:
```javascript
import { uploadReceipt } from '@/api/upload'

uni.chooseImage({
  count: 1,
  success: async (res) => {
    const tempFilePath = res.tempFilePaths[0]
    const url = await uploadReceipt(tempFilePath, 'user-id')
    console.log('Uploaded:', url)
  }
})
```

---

### Q5: 真机预览时白屏

**原因**: 
1. 域名校验失败
2. 未配置合法域名

**解决**:
- 开发阶段：使用「开发版」扫码预览
- 正式版本：在微信公众平台配置 Supabase 域名

---

## Git 工作流

### 1. 初始化 Git

```bash
git init
git add .
git commit -m "chore: 项目初始化"
```

---

### 2. 创建分支

```bash
# 创建功能分支
git checkout -b feature/record-list

# 开发完成后
git add .
git commit -m "feat(record): 完成账单列表页面"
```

---

### 3. 提交规范

```
<type>(<scope>): <subject>

类型:
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/配置

示例:
feat(record): 添加账单删除功能
fix(login): 修复微信登录失败问题
docs(readme): 更新安装步骤
```

---

### 4. 推送到 GitHub

```bash
# 关联远程仓库
git remote add origin https://github.com/your-username/accounting-app.git

# 推送代码
git push -u origin main
```

---

## 性能优化建议

### 1. 图片优化
- 压缩上传的图片（使用 uni.compressImage）
- 使用 WebP 格式
- 懒加载列表图片

### 2. 列表优化
- 使用虚拟列表（长列表场景）
- 分页加载（每页 20 条）
- 防抖搜索（输入延迟 300ms）

### 3. 缓存策略
- 分类数据缓存到本地（有效期 1 天）
- 用户信息缓存
- API 请求去重

---

## 打包发布

### 1. 构建生产版本

```bash
npm run build:mp-weixin
```

生成目录: `dist/build/mp-weixin`

---

### 2. 上传到微信平台

1. 微信开发者工具 → 上传
2. 填写版本号和描述
3. 上传成功后，到微信公众平台提交审核

---

### 3. 审核准备

需要准备:
- 隐私政策页面
- 用户协议页面
- 小程序图标和截图
- 功能介绍

---

## 有用的资源

- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [Supabase 文档](https://supabase.com/docs)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Vue 3 文档](https://cn.vuejs.org/)

---

**最后更新**: 2026-09-29
