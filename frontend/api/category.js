import { supabase, handleApiError } from './index'

/**
 * 获取所有分类
 */
export async function getCategories(type = 'all') {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (type !== 'all') {
      query = query.eq('type', type)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * 创建自定义分类
 */
export async function createCategory(category) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: category.user_id,
        name: category.name,
        type: category.type,
        icon: category.icon || 'icon-qita',
        color: category.color || '#1989fa',
        is_system: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    handleApiError(error)
  }
}
