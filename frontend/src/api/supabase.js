import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://placeholder.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'placeholder-anon-key'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn('Supabase 尚未配置，当前使用占位客户端。请在 frontend/.env 中填写连接信息。')
}

export const supabase = createClient(
  supabaseUrl || DEFAULT_SUPABASE_URL,
  supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
