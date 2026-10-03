// 页面滚动与账单定位各自负责，防止导航回顶覆盖保存后的新行。
export function getScrollPosition(to, from, savedPosition) {
  if (savedPosition) return savedPosition
  if (to.path === from.path) return false
  if (to.path === '/bills' && typeof to.query?.added === 'string' && to.query.added) return false
  return { left: 0, top: 0 }
}
