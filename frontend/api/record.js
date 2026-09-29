import { supabase, handleApiError } from './index'

/**
 * 获取账单列表
 * @param {Object} params - 查询参数
 */
export async function getRecords({ userId, month, type, page = 1, pageSize = 20 }) {
  try {
    let query = supabase
      .from('records')
      .select(`
        *,
        category:categories(id, name, icon, color)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('time', { ascending: false })

    if (month) {
      const startDate = `${month}-01`
      const endDate = `${month}-31`
      query = query.gte('date', startDate).lte('date', endDate)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error

    return {
      records: data || [],
      total: count || 0,
      page,
      pageSize
    }
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * 创建账单
 */
export async function createRecord(record) {
  try {
    const { data, error } = await supabase
      .from('records')
      .insert({
        user_id: record.user_id,
        category_id: record.category_id,
        type: record.type,
        amount: record.amount,
        date: record.date || new Date().toISOString().split('T')[0],
        time: record.time || new Date().toTimeString().split(' ')[0],
        remark: record.remark || null,
        image_url: record.image_url || null
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * 更新账单
 */
export async function updateRecord(recordId, updates) {
  try {
    const { data, error } = await supabase
      .from('records')
      .update(updates)
      .eq('id', recordId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * 删除账单
 */
export async function deleteRecord(recordId) {
  try {
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', recordId)

    if (error) throw error
  } catch (error) {
    handleApiError(error)
  }
}
