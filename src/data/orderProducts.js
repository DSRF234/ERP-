import { stockRows } from './stock'
import { skuOf } from './sku'

/**
 * 订单商品目录
 * ------------------------------------------------------------------
 * 不单独维护一份商品表：按编码聚合共享库存（data/stock.js），
 * 保证「新建订单选中的商品」和「审核时扣减的库存」永远是同一套 SKU。
 *
 * 名称 / 规格 / 分类统一取商品主数据（data/sku.js），此处不再各写一份，
 * 避免同一个商品在不同模块出现两种规格；主数据缺失时回落到库存行上的值。
 */
export function productCatalog() {
  const map = new Map()
  stockRows.forEach(r => {
    const avail = Math.max(0, Number(r.left || 0) - Number(r.locked || 0))
    let p = map.get(r.code)
    if (!p) {
      const master = skuOf(r.code)
      p = {
        sku: r.code,
        code: r.code,
        spu: master.spu || '—',
        name: master.name || r.name,
        spec: master.spec || r.spec || '—',
        unit: r.unit || '件',
        category: master.category || r.category || '—',
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
