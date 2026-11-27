import { reactive } from 'vue'
import { applySkuMaster, skuOf } from './sku'

/**
 * 库存 · 共享数据层
 *
 * 全系统只有这一份库存：
 *   · 库存记录页展示它
 *   · 订单审核发货时扣减它
 *   · 采购确认入库时增加它，并回写入库单号（采购单号）
 *
 * 字段口径：
 *   code 货码 / left 剩余数量 / inQty 累计入库 / outQty 累计出库
 *   lastRef 最近一次入库对应的采购单号 —— 采购与库存一一对应的依据
 */
const mk = (o) => ({
  unit: '件', supplier: '—', warnDays: 3, warnUnit: '月', lastRef: '',
  locked: 0, expiry: '—', ...o
})

export const stockRows = reactive([
  /* —— 采购侧商品 —— */
  mk({ name: '洗面奶 100g', code: 'SE-2026-001', batch: 'B20260101', category: '家居日用', supplier: '某林林公司',
       warehouse: '华东主仓', inNo: 'BQ20260101111', inQty: 1200, outQty: 520, left: 680, warnValue: 200, warnDays: 12, unit: '支', expiry: '2027-09-01',
       inDate: '2026-11-05', outNo: 'CK20261118021', outDate: '2026-11-18' }),
  mk({ name: '睫毛膏 8g', code: 'SE-2026-819', batch: 'B20261021', category: '美妆个护', supplier: '某林林公司',
       warehouse: '华南仓', inNo: 'BQ20260101113', inQty: 300, outQty: 198, left: 102, warnValue: 150, warnDays: 1, unit: '支', expiry: '2026-12-10',
       inDate: '2026-11-08', outNo: 'CK20261120007', outDate: '2026-11-20' }),
  mk({ name: '抽纸 3层', code: 'AS-2026-021', batch: 'B20260819', category: '家居日用', supplier: '美妆公司',
       warehouse: '平台仓1', inNo: 'BQ20260819002', inQty: 2400, outQty: 2400, left: 0, warnValue: 100, unit: '件', expiry: '2027-03-15',
       inDate: '2026-09-19', outNo: 'CK20261028012', outDate: '2026-10-28' }),
  mk({ name: '眼睫毛 5ml', code: 'SE-2026-002', batch: 'B20260912', category: '美妆个护', supplier: '美妆公司',
       warehouse: '华东主仓', inNo: 'BQ20260912003', inQty: 860, outQty: 630, left: 230, warnValue: 300, unit: '支', expiry: '2027-01-20',
       inDate: '2026-11-12', outNo: 'CK20261121015', outDate: '2026-11-21' }),
  mk({ name: '牙膏 30g', code: 'SE-2026-003', batch: 'B20260714', category: '家居日用', supplier: '某林林公司',
       warehouse: '平台仓2', inNo: 'BQ20260714004', inQty: 1500, outQty: 700, left: 800, warnValue: 200, unit: '个', expiry: '2028-02-28',
       inDate: '2026-10-14', outNo: 'CK20261030009', outDate: '2026-10-30' }),
  mk({ name: '精华液 30ml', code: 'AS-2026-022', batch: 'B20260114', category: '美妆个护', supplier: '雅美化妆品',
       warehouse: '华南仓', inNo: 'BQ20260114005', inQty: 640, outQty: 610, left: 30, warnValue: 60, warnDays: 2, unit: '瓶', expiry: '2026-12-25',
       inDate: '2026-11-03', outNo: 'CK20261122003', outDate: '2026-11-22' }),

  /* —— 订单侧商品 —— */
  mk({ name: '雅诗兰黛小棕瓶', code: 'SKU-100231', batch: 'B20261101', category: '美妆个护', supplier: '广州雅美化妆品',
       warehouse: '华东主仓', inNo: 'RK20261101001', inQty: 421, outQty: 420, left: 1, warnValue: 200, unit: '瓶', expiry: '2028-11-01' }),
  mk({ name: '雅诗兰黛小棕瓶', code: 'SKU-100231', batch: 'B20261101', category: '美妆个护', supplier: '广州雅美化妆品',
       warehouse: '华南仓', inNo: 'RK20261101002', inQty: 620, outQty: 140, left: 480, warnValue: 150, unit: '瓶', expiry: '2028-11-01' }),
  mk({ name: '兰蔻小黑瓶', code: 'SKU-100188', batch: 'B20261103', category: '美妆个护', supplier: '广州雅美化妆品',
       warehouse: '华东主仓', inNo: 'RK20261103001', inQty: 220, outQty: 60, left: 160, warnValue: 200, unit: '瓶', expiry: '2028-11-03' }),
  mk({ name: '星野纯棉四件套', code: 'SKU-200118', batch: 'B20261108', category: '家居日用', supplier: '南通家纺制造厂',
       warehouse: '华东主仓', inNo: 'RK20261108001', inQty: 2400, outQty: 160, left: 2240, warnValue: 300, unit: '套', expiry: '2031-11-08' }),
  mk({ name: '星野纯棉四件套', code: 'SKU-200118', batch: 'B20261108', category: '家居日用', supplier: '南通家纺制造厂',
       warehouse: '华南仓', inNo: 'RK20261108002', inQty: 380, outQty: 80, left: 300, warnValue: 200, unit: '套', expiry: '2031-11-08' }),
  mk({ name: '星野香薰礼盒', code: 'SKU-300045', batch: 'B20260930', category: '家居日用', supplier: '深圳香氛实业',
       warehouse: '华南仓', inNo: 'RK20260930001', inQty: 1240, outQty: 0, left: 1240, warnValue: 150, unit: '盒', expiry: '2028-09-30' }),
  mk({ name: '星野收纳箱', code: 'SKU-400011', batch: 'B20261010', category: '家居日用', supplier: '台州塑料制品',
       warehouse: '华南仓', inNo: 'RK20261010001', inQty: 1580, outQty: 0, left: 1580, warnValue: 200, unit: '个', expiry: '2031-10-10' }),
  mk({ name: '星野香薰蜡烛', code: 'SKU-300052', batch: 'B20261010', category: '家居日用', supplier: '深圳香氛实业',
       warehouse: '华东主仓', inNo: 'RK20261010002', inQty: 400, outQty: 400, left: 0, warnValue: 100, unit: '个', expiry: '2028-10-10' })
])

/* 基础信息（名称/规格/单位/供应商/成本价）统一由商品主数据回填，此处不再各写一份 */
stockRows.forEach(r => {
  applySkuMaster(r)
  const m = skuOf(r.code)
  if (m.costPrice !== undefined) r.costPrice = m.costPrice
  if (m.category) r.category = m.category
})

export const findRow = (code, warehouse) =>
  stockRows.find(r => r.code === code && r.warehouse === warehouse)

export const availableOf = (code, warehouse) => {
  const r = findRow(code, warehouse)
  return r ? Math.max(0, r.left - (r.locked || 0)) : 0
}

export const capacityOf = r => {
  const total = Number(r.left) + Number(r.outQty || 0)
  return total > 0 ? Math.round((Number(r.left) / total) * 100) : 0
}

export const statusOf = r => {
  const avail = Math.max(0, r.left - (r.locked || 0))
  if (avail <= 0) return '缺货'
  return avail < r.warnValue ? '预警' : '正常'
}

/** 出库扣减（订单发货） */
export function deductStock(code, warehouse, qty) {
  const r = findRow(code, warehouse)
  if (!r) return false
  const avail = Math.max(0, r.left - (r.locked || 0))
  if (avail < qty) return false
  r.left -= qty
  r.outQty = Number(r.outQty || 0) + qty
  return true
}

/** 入库增加（采购确认入库），并记录来源采购单 */
export function inboundStock(code, warehouse, qty, meta = {}) {
  let r = findRow(code, warehouse)
  if (!r) {
    r = mk({
      name: meta.name || code, code, warehouse,
      batch: 'B' + new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      category: meta.type || '未分类', supplier: meta.supplier || '—',
      inNo: meta.refNo || '', inQty: 0, outQty: 0, left: 0, warnValue: 100
    })
    stockRows.push(r)
  }
  if (meta.name && (!r.name || r.name === code)) r.name = meta.name
  r.left = Number(r.left) + Number(qty)
  r.inQty = Number(r.inQty || 0) + Number(qty)
  if (meta.refNo) {
    r.inNo = meta.refNo
    r.lastRef = meta.refNo
    r.lastRefQty = qty
    r.lastRefAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  }
  return r
}
