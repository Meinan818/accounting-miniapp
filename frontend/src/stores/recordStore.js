import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import dayjs from 'dayjs'

const STORAGE_KEY = 'zhizhang_mock_records'

function createSampleRecords() {
  const month = dayjs().format('YYYY-MM')

  return [
    { id: 'sample-01', type: 'income', amount: 8000, category: '工资', icon: '💵', date: `${month}-01`, time: '09:00', remark: '本月工资' },
    { id: 'sample-02', type: 'expense', amount: 35, category: '餐饮', icon: '🍔', date: `${month}-05`, time: '12:30', remark: '工作日午餐' },
    { id: 'sample-03', type: 'expense', amount: 12, category: '交通', icon: '🚗', date: `${month}-08`, time: '08:20', remark: '地铁通勤' },
    { id: 'sample-04', type: 'expense', amount: 199, category: '购物', icon: '🛍️', date: `${month}-12`, time: '20:15', remark: '日用品补货' },
    { id: 'sample-05', type: 'expense', amount: 68, category: '娱乐', icon: '🎮', date: `${month}-15`, time: '19:30', remark: '周末电影' },
    { id: 'sample-06', type: 'expense', amount: 120, category: '住房', icon: '🏠', date: `${month}-18`, time: '10:00', remark: '水电燃气' },
    { id: 'sample-07', type: 'expense', amount: 88, category: '医疗', icon: '💊', date: `${month}-20`, time: '16:40', remark: '常用药品' },
    { id: 'sample-08', type: 'expense', amount: 76, category: '学习', icon: '📚', date: `${month}-22`, time: '21:10', remark: '专业书籍' },
    { id: 'sample-09', type: 'expense', amount: 260, category: '餐饮', icon: '🍔', date: `${month}-25`, time: '18:40', remark: '朋友聚餐' },
    { id: 'sample-10', type: 'expense', amount: 376, category: '购物', icon: '🛍️', date: `${month}-28`, time: '15:20', remark: '换季衣物' },
  ]
}

function isLegacySample(records) {
  return Array.isArray(records)
    && records.length <= 2
    && records.every((record) => String(record.id).startsWith('sample'))
}

function loadRecords() {
  if (typeof window === 'undefined') {
    return createSampleRecords()
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return createSampleRecords()
    }

    const parsed = JSON.parse(saved)

    if (isLegacySample(parsed)) {
      return createSampleRecords()
    }

    return Array.isArray(parsed) ? parsed : createSampleRecords()
  } catch (error) {
    console.warn('读取本地假账单失败：', error)
    return createSampleRecords()
  }
}

export const useRecordStore = defineStore('record', () => {
  const records = ref(loadRecords())

  const monthRecords = computed(() => {
    const currentMonth = dayjs().format('YYYY-MM')
    return records.value.filter((record) => record.date?.startsWith(currentMonth))
  })

  const monthExpense = computed(() => monthRecords.value
    .filter((record) => record.type === 'expense')
    .reduce((total, record) => total + Number(record.amount || 0), 0))

  const monthIncome = computed(() => monthRecords.value
    .filter((record) => record.type === 'income')
    .reduce((total, record) => total + Number(record.amount || 0), 0))

  const categoryExpenses = computed(() => monthRecords.value
    .filter((record) => record.type === 'expense')
    .reduce((summary, record) => {
      summary[record.category] = (summary[record.category] || 0) + Number(record.amount || 0)
      return summary
    }, {}))

  const categoryIncome = computed(() => monthRecords.value
    .filter((record) => record.type === 'income')
    .reduce((summary, record) => {
      summary[record.category] = (summary[record.category] || 0) + Number(record.amount || 0)
      return summary
    }, {}))

  function addRecord(record) {
    const newRecord = {
      ...record,
      id: `record-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount: Number(record.amount),
    }

    records.value.unshift(newRecord)
    return newRecord
  }

  function clearRecords() {
    records.value = []
  }

  watch(records, (newRecords) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords))
    }
  }, { deep: true })

  return {
    records,
    monthRecords,
    monthExpense,
    monthIncome,
    categoryExpenses,
    categoryIncome,
    addRecord,
    clearRecords,
  }
})
