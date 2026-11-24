import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { KEY, read, write, replaceAll } from './persist'
import { stockRows, inboundStock } from '@/data/stock'

/**
 * 库存记录（门面层）
 * ------------------------------------------------------------------
 * 数据在 data/stock.js —— 全站唯一一份库存：
 *   · 库存记录页展示
 *   · 订单发货时扣减（stores/stock.js → data/stock.js）
 *   · 采购确认入库时增加并回写来源采购单
 * 这里补上：库存状态（含临期）、剩余容量、按货品设预警、盘点差异回写、持久化。
 */
const UNIT_DAYS = { 年: 365, 月: 30, 日: 1 }
const DAY = 24 * 60 * 60 * 1000

const leftDaysOf = r => (r.expiry && r.expiry !== '—')
  ? Math.ceil((new Date(`${r.expiry}T00:00:00`) - new Date()) / DAY)
  : null

const nearExpiryOf = r => {
  if (!r.expiry || r.expiry === '—' || !Number(r.warnDays)) return false
  return leftDaysOf(r) <= Number(r.warnDays) * (UNIT_DAYS[r.warnUnit] || 30)
}

/** 库存状态：剩余 0 缺货；≤ 预警值或临期 → 预警；否则正常 */
export const statusOf = r => {
  const avail = Math.max(0, Number(r.left) - Number(r.locked || 0))
  if (avail <= 0) return '缺货'
  if (avail <= Number(r.warnValue || 0) || nearExpiryOf(r)) return '预警'
  return '正常'
}

/** 剩余容量：剩余 ÷（剩余 + 累计出库） */
const capOf = r => {
  const total = Number(r.left || 0) + Number(r.outQty || 0)
  return total > 0 ? Math.max(0, Math.min(100, Math.round((Number(r.left) / total) * 100))) : 0
}

/** 批次号 B20260101 → 2026-01-01，用于「本月入库/出库」按自然月统计 */
const dateOfBatch = batch => {
  const m = String(batch || '').match(/^B(\d{4})(\d{2})(\d{2})$/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : ''
}
const baseName = n => String(n || '').split(' ')[0]

export const useInventoryStore = defineStore('inventory', () => {
  const saved = read(KEY.inventory, null)
  if (Array.isArray(saved) && saved.length) replaceAll(stockRows, saved)
  watch(stockRows, v => write(KEY.inventory, v), { deep: true })

  const batches = stockRows

  const rows = computed(() => batches.map(r => ({
    ...r,
    status: statusOf(r),
    cap: capOf(r),
    leftDays: leftDaysOf(r),
    inDate: r.inDate || dateOfBatch(r.batch),
    outDate: r.outDate || (r.outQty ? dateOfBatch(r.batch) : ''),
    outNo: r.outNo || ''
  })))

  const categories = computed(() => [...new Set(batches.map(b => b.category).filter(Boolean))])
  const warehouses = computed(() => [...new Set(batches.map(b => b.warehouse).filter(Boolean))])
  const suppliers = computed(() => [...new Set(batches.map(b => b.supplier).filter(Boolean))])

  const goodsPool = computed(() => {
    const map = new Map()
    batches.forEach(b => {
      if (!map.has(b.code)) map.set(b.code, { code: b.code, name: b.name, supplier: b.supplier, batches: [], left: 0 })
      const g = map.get(b.code)
      g.batches.push(b.batch)
      g.left += Number(b.left || 0)
      if (!g.supplier) g.supplier = b.supplier
    })
    return [...map.values()]
  })

  /**
   * 采购到货入库：按 货码 或 货品主名 + 仓库 匹配已有批次并累加，
   * 匹配不到才新建（供应商货码 SO-xxx 与库存货码 SE-xxx 目前靠主名对齐）。
   */
  function inbound({ name, code, warehouse, qty, unit, supplier, orderNo, category }) {
    const num = Number(qty) || 0
    const hit = batches.find(b => b.warehouse === warehouse &&
      (b.code === code || baseName(b.name) === baseName(name)))
    if (hit) {
      hit.left = Number(hit.left) + num
      hit.inQty = Number(hit.inQty || 0) + num
      if (orderNo) {
        hit.inNo = orderNo
        hit.lastRef = orderNo
        hit.lastRefQty = num
        hit.lastRefAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
        hit.inDate = hit.lastRefAt.slice(0, 10)
      }
      return hit
    }
    return inboundStock(code || `NEW-${Date.now()}`, warehouse, num, {
      name, type: category || '未分类', supplier: supplier || '—', refNo: orderNo || ''
    })
  }

  /** 盘点差异回写 */
  function adjust({ name, batch, warehouse, diff }) {
    const hit = batches.find(b => b.name === name && b.batch === batch && (!warehouse || b.warehouse === warehouse))
    if (!hit) return null
    const before = Number(hit.left)
    hit.left = Math.max(0, before + Number(diff || 0))
    return { before, after: hit.left }
  }

  /** 设置预警：按货码，全部批次同步 */
  function setWarn({ codes, days, unit, value }) {
    batches.forEach(b => {
      if (!codes.includes(b.code)) return
      b.warnDays = Number(days)
      b.warnUnit = unit
      b.warnValue = Number(value)
    })
  }

  function reload() {
    replaceAll(batches, read(KEY.inventory, []))
  }

  return { batches, rows, categories, warehouses, suppliers, goodsPool, inbound, adjust, setWarn, reload }
})
