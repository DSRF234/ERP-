import { defineStore } from 'pinia'
import { stockRows, availableOf, deductStock, inboundStock, capacityOf, statusOf } from '@/data/stock'

/**
 * 库存中心（门面层）
 * 真实数据在 data/stock.js，全系统共用这一份：
 *   · 库存记录页展示
 *   · 订单审核发货时扣减
 *   · 采购确认入库时增加并回写采购单号
 *
 * 接入 WMS 后，把 syncFromWms() 换成真实同步即可，页面无需改动。
 */
export const WAREHOUSES = ['华东主仓', '华南仓', '平台仓1', '平台仓2']

export const useStockStore = defineStore('stock', {
  state: () => ({ lastSync: '2026-11-24 02:00' }),

  getters: {
    items: () => stockRows,
    availableOf: () => (sku, warehouse) => availableOf(sku, warehouse),
    totalAvailable: () => sku => stockRows
      .filter(r => r.code === sku)
      .reduce((s, r) => s + Math.max(0, r.left - (r.locked || 0)), 0),
    warehousesFor: () => (sku, qty) => {
      const res = {}
      WAREHOUSES.forEach(w => { res[w] = availableOf(sku, w) })
      return res
    },
    /** 库存记录页用：补齐剩余容量与状态 */
    rows: () => stockRows.map(r => ({
      ...r,
      cap: capacityOf(r),
      available: Math.max(0, r.left - (r.locked || 0)),
      status: statusOf(r)
    }))
  },

  actions: {
    deduct(sku, warehouse, qty) {
      return deductStock(sku, warehouse, qty)
    },
    inbound(sku, warehouse, qty, meta = {}) {
      return inboundStock(sku, warehouse, qty, meta)
    },
    /** TODO: 接入 WMS 后替换为真实同步 */
    syncFromWms() { /* noop */ }
  }
})
