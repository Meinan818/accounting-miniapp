import test from 'node:test'
import assert from 'node:assert/strict'
import { searchRecords, getCategoryWheel, JOURNAL_COLORS } from '../src/utils/journal.js'
const rows = [
  { id:'a',type:'expense',amount:12.5,category:'餐饮',remark:'Coffee 咖啡',date:'2026-10-03',time:'12:00' },
  { id:'b',type:'income',amount:100,category:'工资',remark:'九月工资',date:'2026-10-02',time:'09:00' },
  { id:'gone',type:'expense',amount:20,category:'餐饮',remark:'咖啡',date:'2026-10-03',deletedAt:'2026-10-03T00:00:00Z' },
]
test('只读搜索支持分类/备注/金额/日期/收支且不恢复删除项', () => {
  for(const [query,ids]of [['餐饮',['a']],['COFFEE',['a']],['12.50',['a']],['2026-10-02',['b']],['收入',['b']],['咖啡',['a']]])assert.deepEqual(searchRecords(rows,query).map(r=>r.id),ids)
})
test('多关键词同时匹配，空白返回原顺序有效记录，不改输入', () => {
  const before=JSON.stringify(rows);assert.deepEqual(searchRecords(rows,'咖啡 12.50').map(r=>r.id),['a']);assert.deepEqual(searchRecords(rows,'   ').map(r=>r.id),['a','b']);assert.equal(JSON.stringify(rows),before)
})
test('搜索无匹配返回空数组，特殊字符按字面不执行正则', () => {
  assert.deepEqual(searchRecords(rows,'不存在'),[]);assert.deepEqual(searchRecords(rows,'.*'),[]);assert.deepEqual(searchRecords(rows,'['),[])
})
test('搜索不改对象身份，坏列表明确失败', () => {
  assert.equal(searchRecords(rows,'Coffee')[0],rows[0]);assert.throws(()=>searchRecords(null,'a'),/读取/)
})
test('分类色谱按实际整数分铺满100%，保留分类顺序/输入', () => {
  const input=[{category:'餐饮',amountCents:100},{category:'交通',amountCents:300}],before=JSON.stringify(input)
  const wheel=getCategoryWheel(input);assert.equal(wheel.segments[0].start,0);assert.equal(wheel.segments[0].end,25);assert.equal(wheel.segments[1].start,25);assert.equal(wheel.segments[1].end,100);assert(wheel.background.startsWith('conic-gradient('));assert.equal(JSON.stringify(input),before)
})
test('空分类不虚构扇区，一类完整填充', () => {
  assert.deepEqual(getCategoryWheel([]).segments,[]);const one=getCategoryWheel([{category:'工资',amountCents:10000}]);assert.equal(one.segments[0].end,100)
})
test('多类别颜色循环、累计小数最后精确闭合', () => {
  const input=Array.from({length:9},(_,i)=>({category:String(i),amountCents:i+1})),wheel=getCategoryWheel(input);assert.equal(wheel.segments.at(-1).end,100);assert.equal(wheel.segments[6].color,JOURNAL_COLORS[0]);assert(wheel.segments.every(s=>s.end>=s.start))
})
test('图形金额损坏或超安全范围拒绝，而非画错误比例', () => {
  for(const amountCents of [0,-1,NaN,Infinity,1.1])assert.throws(()=>getCategoryWheel([{category:'A',amountCents}]),/金额/)
  assert.throws(()=>getCategoryWheel([{amountCents:Number.MAX_SAFE_INTEGER},{amountCents:1}]),/安全范围/);assert.throws(()=>getCategoryWheel(null),/分类数据/)
})

test('近7天足迹按业务日期，排除删除/未确认/未来或窗口外记录', async () => {
  const { getRecentDays } = await import('../src/utils/journal.js')
  const input=[...rows,{id:'future',type:'expense',date:'2026-10-25'},{id:'old',type:'expense',date:'2026-09-01'},{id:'draft',kind:'draft-group',date:'2026-10-03'}]
  const days=getRecentDays(input,'2026-10-03');assert.equal(days.length,7);assert.equal(days[0].date,'2026-09-27');assert.equal(days.at(-1).date,'2026-10-03');assert.equal(days.find(d=>d.date==='2026-10-03').count,1);assert.equal(days.find(d=>d.date==='2026-10-02').count,1);assert.equal(days.reduce((n,d)=>n+d.count,0),2)
})
test('足迹正确跨年，零记录不虚构打卡', async () => {
  const { getRecentDays } = await import('../src/utils/journal.js');const days=getRecentDays([],'2026-01-02');assert.equal(days[0].date,'2025-12-27');assert.equal(days.at(-1).date,'2026-01-02');assert(days.every(d=>d.count===0))
})
test('多笔同日足迹计笔数且不改记录身份/日期', async () => {
  const { getRecentDays } = await import('../src/utils/journal.js');const input=[rows[0],{...rows[0],id:'new'}],before=JSON.stringify(input);assert.equal(getRecentDays(input,'2026-10-03').at(-1).count,2);assert.equal(JSON.stringify(input),before)
})
test('足迹坏查询日期或列表明确拒绝，不把错误当正常空账本', async () => {
  const { getRecentDays } = await import('../src/utils/journal.js');assert.throws(()=>getRecentDays([], '2026-02-30'),/日期/);assert.throws(()=>getRecentDays(null,'2026-10-03'),/日期/)
})
