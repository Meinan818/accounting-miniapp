// Supabase 客户端初始化
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 配置缺失，请检查 .env 文件')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

// 错误处理函数
export function handleApiError(error) {
  console.error('API Error:', error)

  let message = '操作失败，请稍后重试'

  if (error.message.includes('JWT')) {
    message = '登录已过期，请重新登录'
  } else if (error.message.includes('violates row-level security')) {
    message = '无权限访问该数据'
  } else if (error.message.includes('duplicate key')) {
    message = '数据已存在'
  } else if (error.message) {
    message = error.message
  }

  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })

  throw error
}
