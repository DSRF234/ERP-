import { defineStore } from 'pinia'
import { reactive, computed, watch } from 'vue'
import { KEY, read, write, replaceAll } from './persist'

/**
 * 库存记录（货品批次库存）
 * 采购确认入库、盘点差异回写都写这里，库存页直接读，跨模块才联动得起来。
 */
const seed = () => [
  {
    name: '洗面奶 100g', code: 'SE-2026-001', batch: 'B20260101', category: '家居日用',
    supplier: '某林林公司', warehouse: '华东主仓', unit: '支',
    inNo: 'BQ20260101111', inQty: 1200, inDate: '2026-11-05',
    outNo: 'CK20261118021', outQty: 520, outDate: '2026-11-18',
    left: 680, capacity: 791, warnValue: 200, warnDays: 12, warnUnit: '月', expiry: '2027-09-01'
  },
  {
    name: '睫毛膏 8g', code: 'SE-2026-819', batch: 'B20261021', category: '美妆个护',
    supplier: '某林林公司', warehouse: '华南仓', unit: '支',
    inNo: 'BQ20260101113', inQty: 300, inDate: '2026-11-08',
    outNo: 'CK20261120007', outQty: 198, outDate: '2026-11-20',
    left: 102, capacity: 300, warnValue: 150, warnDays: 1, warnUnit: '月', expiry: '2026-12-10'
  },
  {
    name: '抽纸 3层', code: 'AS-2026-021', batch: 'B20260819', category: '家居日用',
    supplier: '美妆公司', warehouse: '平台仓1', unit: '件',
    inNo: 'BQ20260819002', inQty: 2400, inDate: '2026-09-19',
    outNo: 'CK20261028012', outQty: 2400, outDate: '2026-10-28',
    left: 0, capacity: 800, warnValue: 100, warnDays: 3, warnUnit: '月', expiry: '2027-03-15'
  },
  {
    name: '眼睫毛 5ml', code: 'SE-2026-002', batch: 'B20260912', category: '美妆个护',
    supplier: '美妆公司', warehouse: '华东主仓', unit: '支',
    inNo: 'BQ20260912003', inQty: 860, inDate: '2026-11-12',
    outNo: 'CK20261121015', outQty: 630, outDate: '2026-11-21',
    left: 230, capacity: 852, warnValue: 300, warnDays: 3, warnUnit: '月', expiry: '2027-01-20'
  },
  {
    name: '牙膏 30g', code: 'SE-2026-003', batch: 'B20260714', category: '家居日用',
    supplier: '某林林公司', warehouse: '平台仓2', unit: '个',
    inNo: 'BQ20260714004', inQty: 1500, inDate: '2026-10-14',
    outNo: 'CK20261030009', outQty: 700, outDate: '2026-10-30',
    left: 800, capacity: 1509, warnValue: 200, warnDays: 3, warnUnit: '月', expiry: '2028-02-28'
  },
  {
    name: '精华液 30ml', code: 'AS-2026-022', batch: 'B20260114', category: '美妆个护',
    supplier: '雅美化妆品', warehouse: '华南仓', unit: '瓶',
    inNo: 'BQ20260114005', inQty: 640, inDate: '2026-11-03',
    outNo: 'CK20261122003', outQty: 610, outDate: '2026-11-22',
    left: 30, capacity: 600, warnValue: 60, warnDays: 2, warnUnit: '月', expiry: '2026-12-25'
  }
]

const UNIT_DAYS = { 年: 365, 月: 30, 日: 1 }
const DAY = 24 * 60 * 60 * 1000

export const leftDaysOf = batch =>
  batch.expiry ? Math.ceil((new Date(`${batch.expiry}T00:00:00`) - new Date()) / DAY) : null

export const nearExpiryOf = batch => {
  if (!batch.expiry || !Number(batch.warnDays)) return false
  return leftDaysOf(batch) <= Number(batch.warnDays) * (UNIT_DAYS[batch.warnUnit] || 30)
}

/** 库存状态：剩余 0 缺货；≤ 预警值或临期 → 预警；否则正常 */
export const statusOf = batch =>
  batch.left <= 0 ? '缺货' : (batch.left <= batch.warnValue || nearExpiryOf(batch) ? '预警' : '正常')

export const capOf = batch =>
  batch.capacity > 0 ? Math.max(0, Math.min(100, Math.round((batch.left / batch.capacity) * 100))) : 0

export const useInventoryStore = defineStore('inventory', () => {
  const batches = reactive(read(KEY.inventory, seed()))
  watch(batches, v => write(KEY.inventory, v), { deep: true })

  const rows = computed(() => batches.map(b => ({
    ...b,
    status: statusOf(b),
    cap: capOf(b),
    leftDays: leftDaysOf(b)
  })))

  const categories = computed(() => [...new Set(batches.map(b => b.category).filter(Boolean))])
  const warehouses = computed(() => [...new Set(batches.map(b => b.warehouse).filter(Boolean))])
  const suppliers = computed(() => [...new Set(batches.map(b => b.supplier).filter(Boolean))])

  /** 按货品维度（货码）汇总，供设置预警弹窗使用 */
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

  /** 采购到货入库：已有同货品同仓批次就累加，没有就新建批次 */
  function inbound({ name, code, warehouse, qty, unit, supplier, orderNo, category }) {
    const num = Number(qty) || 0
    const today = new Date()
    const p = n => String(n).padStart(2, '0')
    const date = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`
    // 采购明细用的是「洗面奶」，库存批次是「洗面奶 100g」，按主名匹配同一个货
    const base = nm => String(nm || '').split(' ')[0]
    let hit = batches.find(b => b.warehouse === warehouse &&
      (b.code === code || base(b.name) === base(name)))
    if (hit) {
      hit.inQty += num
      hit.left += num
      // 入库同时扩容仓位，剩余容量百分比才不会一入库就变 100%
      hit.capacity += num
      hit.inNo = orderNo || hit.inNo
      hit.inDate = date
      return hit
    }
    const sibling = batches.find(b => b.code === code || base(b.name) === base(name))
    hit = {
      name: sibling ? sibling.name : name, code: code || `NEW-${Date.now()}`,
      batch: `B${date.replace(/-/g, '')}`,
      category: category || '未分类', supplier: supplier || '—',
      warehouse, unit: unit || '件',
      inNo: orderNo || '—', inQty: num, inDate: date,
      outNo: '', outQty: 0, outDate: '',
      left: num, capacity: num, warnValue: 100, warnDays: 3, warnUnit: '月', expiry: ''
    }
    batches.push(hit)
    return hit
  }

  /** 盘点差异回写：left 直接加减差异数量 */
  function adjust({ name, batch, warehouse, diff }) {
    const hit = batches.find(b => b.name === name && b.batch === batch && (!warehouse || b.warehouse === warehouse))
    if (!hit) return null
    const before = hit.left
    hit.left = Math.max(0, hit.left + Number(diff || 0))
    return { before, after: hit.left }
  }

  /** 设置预警：按货码，全部批次同步（PRD 7） */
  function setWarn({ codes, days, unit, value }) {
    const d = Number(days)
    const v = Number(value)
    batches.forEach(b => {
      if (!codes.includes(b.code)) return
      b.warnDays = d
      b.warnUnit = unit
      b.warnValue = v
    })
  }

  function reload() {
    replaceAll(batches, read(KEY.inventory, seed()))
  }

  return { batches, rows, categories, warehouses, suppliers, goodsPool, inbound, adjust, setWarn, reload }
})
