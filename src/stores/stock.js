import { defineStore } from 'pinia'

/**
 * 库存中心
 *
 * 真实链路：ERP 下发出库指令 → WMS 扣减 → 回传库存。
 * 当前无 WMS，先由本地生成并模拟扣减，接入后在 syncFromWms() 里替换为同步接口。
 */
export const WAREHOUSES = ['华东主仓', '华南仓', '平台仓1', '平台仓2']

const SEED = [
  { sku: 'SKU-100231', name: '雅诗兰黛小棕瓶', spec: '50ml', type: '美妆个护', batch: 'B20261101',
    warehouse: '华东主仓', onHand: 421, locked: 420, inTransit: 0, warnValue: 200 },
  { sku: 'SKU-100231', name: '雅诗兰黛小棕瓶', spec: '50ml', type: '美妆个护', batch: 'B20261101',
    warehouse: '华南仓', onHand: 620, locked: 140, inTransit: 200, warnValue: 150 },
  { sku: 'SKU-100188', name: '兰蔻小黑瓶', spec: '30ml', type: '美妆个护', batch: 'B20261103',
    warehouse: '华东主仓', onHand: 220, locked: 60, inTransit: 0, warnValue: 200 },
  { sku: 'SKU-200118', name: '星野纯棉四件套', spec: '1.8m 灰', type: '家居日用', batch: 'B20261108',
    warehouse: '华东主仓', onHand: 2400, locked: 160, inTransit: 0, warnValue: 300 },
  { sku: 'SKU-200118', name: '星野纯棉四件套', spec: '1.8m 灰', type: '家居日用', batch: 'B20261108',
    warehouse: '华南仓', onHand: 380, locked: 80, inTransit: 0, warnValue: 200 },
  { sku: 'SKU-300045', name: '星野香薰礼盒', spec: '3件装', type: '家居日用', batch: 'B20260930',
    warehouse: '华南仓', onHand: 1240, locked: 0, inTransit: 0, warnValue: 150 },
  { sku: 'SKU-400011', name: '星野收纳箱', spec: '大号', type: '家居日用', batch: 'B20261010',
    warehouse: '华南仓', onHand: 1580, locked: 0, inTransit: 0, warnValue: 200 },
  { sku: 'SKU-300052', name: '星野香薰蜡烛', spec: '小号', type: '家居日用', batch: 'B20261010',
    warehouse: '华东主仓', onHand: 0, locked: 0, inTransit: 0, warnValue: 100 }
]

export const useStockStore = defineStore('stock', {
  state: () => ({ items: SEED.map(i => ({ ...i })), lastSync: '2026-11-20 02:00' }),

  getters: {
    /** 某仓某 SKU 的可售数量 = 实物 - 锁定 */
    availableOf: s => (sku, warehouse) => {
      const hit = s.items.find(i => i.sku === sku && i.warehouse === warehouse)
      if (!hit) return 0
      return Math.max(0, hit.onHand - hit.locked)
    },
    /** 某 SKU 全仓可售合计 */
    totalAvailable: s => sku =>
      s.items.filter(i => i.sku === sku).reduce((sum, i) => sum + Math.max(0, i.onHand - i.locked), 0),
    /** 可售数量满足需求的所有仓库 */
    warehousesFor: s => (sku, qty) => {
      const res = {}
      WAREHOUSES.forEach(w => {
        const hit = s.items.find(i => i.sku === sku && i.warehouse === w)
        res[w] = hit ? Math.max(0, hit.onHand - hit.locked) : 0
      })
      return res
    },
    rows: s => s.items.map(i => ({
      ...i,
      available: Math.max(0, i.onHand - i.locked),
      status: (i.onHand - i.locked) <= 0 ? '缺货' : ((i.onHand - i.locked) < i.warnValue ? '预警' : '正常')
    }))
  },

  actions: {
    /** 模拟出库扣减：审核发货时调用 */
    deduct(sku, warehouse, qty) {
      const hit = this.items.find(i => i.sku === sku && i.warehouse === warehouse)
      if (!hit) return false
      const avail = Math.max(0, hit.onHand - hit.locked)
      if (avail < qty) return false
      hit.onHand -= qty
      return true
    },
    /** 模拟入库（采购入库 / 退货入库），当前页面未调用，接入后由 WMS 回传触发 */
    inbound(sku, warehouse, qty) {
      const hit = this.items.find(i => i.sku === sku && i.warehouse === warehouse)
      if (hit) hit.onHand += qty
    },
    /** TODO: 接入 WMS 后替换为真实同步 */
    syncFromWms() { /* noop */ }
  }
})
