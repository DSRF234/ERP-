import { reactive } from 'vue'
import { useStockStore } from '@/stores/stock'

/**
 * 采购单 · 共享数据层
 * 采购列表、库存入库、应付台账 都读这一份，避免三张页面各存一套数据。
 *
 * 状态流转：待审核 →（审批）→ 进行中 →（确认入库）→ 已完成
 *           待审核 →（驳回）→ 已驳回
 */
const row = (no, buyer, supplier, warehouse, date, expressNo, logistics, category, freight, amount, status) => ({
  no, buyer, creator: buyer, supplier, warehouse, date, expressNo, logistics, category, freight, amount, status,
  items: [],
  approvedAt: '', stockedAt: '', payableChecked: false
})

export const purchaseOrders = reactive([
  row('CG202611061421', '张某某', '某林林公司', '华东主仓', '2026-11-06 14:27', 'DB1234567891234', '某邦物流', '家居日用', 100, 20000, '待审核'),
  row('CG202611081418', '李某', '美妆公司', '华南仓', '2026-11-08 11:03', 'DB1234567891235', '某东物流', '美妆个护', 80, 46500, '待审核'),
  row('CG202611121207', '张某某', '某林林公司', '华东主仓', '2026-11-12 09:42', 'DB1234567891188', '某邦物流', '家居日用', 120, 38200, '进行中'),
  row('CG202611141155', '王某', '雅美化妆品', '平台仓1', '2026-11-14 16:18', 'JD7788001122', '某东物流', '美妆个护', 60, 128600, '进行中'),
  row('CG202611161022', '李某', '美妆公司', '华东主仓', '2026-11-16 10:05', 'DB1234567891023', '某邦物流', '美妆个护', 95, 27400, '进行中'),
  row('CG202611180916', '张某某', '某林林公司', '华南仓', '2026-11-18 08:56', 'JD7788000987', '某东物流', '家居日用', 130, 91300, '已完成'),
  row('CG202611200844', '王某', '雅美化妆品', '华东主仓', '2026-11-20 14:31', 'DB1234567890876', '某邦物流', '美妆个护', 70, 52600, '已完成'),
  row('CG202611220733', '李某', '美妆公司', '平台仓2', '2026-11-22 09:12', 'JD7788000765', '某东物流', '美妆个护', 45, 15800, '已完成'),
  row('CG202611240622', '张某某', '某林林公司', '华东主仓', '2026-11-24 15:44', 'DB1234567890654', '某邦物流', '家居日用', 110, 67400, '已完成'),
  row('CG202611230511', '王某', '雅美化妆品', '华南仓', '2026-11-23 11:26', 'DB1234567890543', '某邦物流', '美妆个护', 88, 33900, '已驳回'),
  row('CG202611250422', '李某', '美妆公司', '华东主仓', '2026-11-25 10:08', 'JD7788000432', '某东物流', '美妆个护', 55, 21800, '进行中'),
  row('CG202611260315', '张某某', '某林林公司', '华东主仓', '2026-11-26 17:02', 'DB1234567890321', '某邦物流', '家居日用', 100, 44900, '待审核')
])

/* 演示数据补上货品明细：编码与库存中心一致，入库后能直接在库存记录里对上 */
const DEMO_GOODS = {
  家居日用: { code: 'SKU-400011', name: '星野收纳箱', spec: '大号' },
  美妆个护: { code: 'SKU-100231', name: '雅诗兰黛小棕瓶', spec: '50ml' }
}
purchaseOrders.forEach(o => {
  const g = DEMO_GOODS[o.category] || DEMO_GOODS['美妆个护']
  o.items = [{ code: g.code, name: g.name, spec: g.spec, unit: '件', price: +(o.amount / 1000).toFixed(2), qty: 1000 }]
})

/* 制单人与采购员可以是不同的人：用于验证审核弹窗「制单人」取值 */
const demoOrder = purchaseOrders.find(o => o.no === 'CG202611061421')
if (demoOrder) demoOrder.creator = '王佳丽'

/* 金额以单据的货款字段为准；没有 amount 时（历史上只有明细的单据）退回按明细累加 */
export const totalOf = o =>
  Number(o.amount || 0) || (o.items || []).reduce((s, i) => s + i.price * i.qty, 0)
export const qtyOf = o => o.items.reduce((s, i) => s + i.qty, 0)
export const payableOf = o => totalOf(o) + Number(o.freight || 0)

const pad = n => String(n).padStart(2, '0')
export const makeNo = () => {
  const d = new Date()
  return 'CG' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
    pad(d.getHours()) + pad(d.getMinutes())
}

/** 新建采购单 */
export function addOrder(form) {
  purchaseOrders.unshift({
    no: form.no || makeNo(),
    buyer: form.buyer, creator: form.creator || form.buyer,
    supplier: form.supplier, warehouse: form.warehouse,
    date: form.date, expressNo: form.expressNo || '',
    logistics: form.logistics, category: form.category,
    freight: Number(form.freight) || 0,
    amount: form.items.reduce((s, i) => s + i.price * i.qty, 0),
    status: '待审核',
    items: form.items.map(i => ({ ...i })),
    approvedAt: '', stockedAt: '', payableChecked: false
  })
  return purchaseOrders[0]
}

/** 审批通过：待审核 → 进行中 */
export function approveOrder(no) {
  const o = purchaseOrders.find(x => x.no === no)
  if (!o || o.status !== '待审核') return { ok: false, msg: '只有待审核采购单可以审批' }
  o.status = '进行中'
  o.approvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return { ok: true }
}

export function rejectOrder(no) {
  const o = purchaseOrders.find(x => x.no === no)
  if (!o || o.status !== '待审核') return { ok: false, msg: '只有待审核采购单可以驳回' }
  o.status = '已驳回'
  return { ok: true }
}

/**
 * 确认入库：按收货仓把明细写进库存中心，采购单转已完成。
 * 库存行按「货品编码 + 仓库」匹配，已存在则累加，不存在则新建 —— 这就是一一对应的依据。
 */
export function warehousingOrder(no) {
  const o = purchaseOrders.find(x => x.no === no)
  if (!o) return { ok: false, msg: '采购单不存在' }
  if (o.status !== '进行中') return { ok: false, msg: '只有进行中的采购单可以入库' }
  if (!o.items.length) return { ok: false, msg: '采购单没有货品明细，无法入库' }

  const stock = useStockStore()
  o.items.forEach(i => {
    stock.inbound(i.code, o.warehouse, i.qty, {
      name: i.name, spec: i.spec, type: o.category, refNo: o.no
    })
  })
  o.status = '已完成'
  o.stockedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return { ok: true, qty: qtyOf(o), warehouse: o.warehouse }
}

/** 确认应付 */
export function checkPayable(no) {
  const o = purchaseOrders.find(x => x.no === no)
  if (!o) return { ok: false, msg: '采购单不存在' }
  if (o.status !== '进行中' && o.status !== '已完成') {
    return { ok: false, msg: '只有进行中或已完成的采购单可以确认应付' }
  }
  o.payableChecked = true
  return { ok: true }
}
