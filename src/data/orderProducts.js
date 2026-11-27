import { stockRows } from './stock'

/**
 * 订单商品目录
 * ------------------------------------------------------------------
 * 不单独维护一份商品表：直接按 code 聚合共享库存（data/stock.js），
 * 保证「新建订单选中的商品」和「审核时扣减的库存」永远是同一套 SKU。
 *
 * 库存行只有名称/编码/单位，规格在这里补齐；没有登记的编码显示 —。
 */
const SPEC = {
  'SKU-100231': '50ml',
  'SKU-100188': '30ml',
  'SKU-200118': '1.8m 灰',
  'SKU-300045': '礼盒装',
  'SKU-300052': '小号',
  'SKU-400011': '大号',
  'SE-2026-001': '100g',
  'SE-2026-002': '5ml',
  'SE-2026-003': '30g',
  'SE-2026-819': '8g',
  'AS-2026-021': '3 层',
  'AS-2026-022': '30ml'
}

/** 把库存行按编码聚合成商品：total 为四仓可用合计，byWh 为分仓可用 */
export function productCatalog() {
  const map = new Map()
  stockRows.forEach(r => {
    const avail = Math.max(0, Number(r.left || 0) - Number(r.locked || 0))
    let p = map.get(r.code)
    if (!p) {
      p = {
        sku: r.code,
        code: r.code,
        name: r.name,
        spec: SPEC[r.code] || '—',
        unit: r.unit || '件',
        category: r.category || '—',
        total: 0,
        byWh: {}
      }
      map.set(r.code, p)
    }
    p.byWh[r.warehouse] = (p.byWh[r.warehouse] || 0) + avail
    p.total += avail
  })
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh'))
}
