import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import dayjs from 'dayjs'

const STORAGE_KEY = 'zhizhang_mock_records'

function createSampleRecords() {
  const month = dayjs().format('YYYY-MM')

  return [
    {
      id: 'sample-food',
      type: 'expense',
      amount: 520,
      category: '餐饮',
      icon: '🍔',
      date: `${month}-05`,
      time: '12:30',
      remark: '本月餐饮示例数据',
    },
    {
      id: 'sample-other',
      type: 'expense',
      amount: 714,
      category: '其他',
      icon: '📝',
      date: `${month}-12`,
      time: '18:30',
      remark: '本月其他示例数据',
    },
  ]
}

function loadRecords() {
  if (typeof window === 'undefined') {
    return createSampleRecords()
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : createSampleRecords()
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
