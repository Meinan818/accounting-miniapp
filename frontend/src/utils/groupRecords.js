// 根据确认回执的稳定账单ID恢复关联，不靠金额/备注猜对应关系。
export function linkGroupRecords(group, records) {
  if (!Array.isArray(group.recordIds)) return []
  const byId = new Map(records.map(record => [record.id, record]))
  return group.recordIds.flatMap((id, index) => {
    const record = byId.get(id)
    return record && group.items[index] ? [{ ...record, draftGroupId: group.id, draftItemId: group.items[index].id }] : []
  })
}
