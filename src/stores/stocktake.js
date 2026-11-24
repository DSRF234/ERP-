import { defineStore } from 'pinia'
import { reactive, computed, watch } from 'vue'
import { KEY, read, write, replaceAll } from './persist'
import { useInventoryStore } from './inventory'

/**
 * 库存盘点
 * 状态文案按 PRD：待盘点 / 已完结 / 有差异。
 * 差异保存后生成库存调整单并回写库存记录（原来只提示、不回写）。
 */
const row = (o) => ({
  realQty: null, remark: '', remarkText: '', ...o
})

const seed = () => [
  row({ no: 'PD202607121211', poNo: 'CG202607221421', name: '洗面奶 100g', code: 'SE-2026-001', batch: 'B20260101', category: '家居日用', supplier: '某林林公司', warehouse: '华东主仓', inType: '采购入库', produceDate: '2026-01-14', expireDate: '2027-01-14', stockQty: 680, realQty: 672, owner: '杨主管', status: '有差异', remark: '货架里侧少 8 支，已拍照留证，待复核。' }),
  row({ no: 'PD202607121211', poNo: 'CG202607221421', name: '睫毛膏 8g', code: 'SE-2026-819', batch: 'B20261021', category: '美妆个护', supplier: '某林林公司', warehouse: '华东主仓', inType: '采购入库', produceDate: '2026-09-12', expireDate: '2027-09-12', stockQty: 102, realQty: 102, owner: '杨主管', status: '已完结', remark: '' }),
  row({ no: 'PD202609121113', poNo: '—', name: '抽纸 3层', code: 'AS-2026-021', batch: 'B20260819', category: '家居日用', supplier: '美妆公司', warehouse: '华南仓', inType: '调拨入库', produceDate: '2026-07-14', expireDate: '2027-07-14', stockQty: 0, realQty: null, owner: '李丽霞', status: '待盘点', remark: '' }),
  row({ no: 'PD202602011230', poNo: 'CG202607180916', name: '牙膏 30g', code: 'SE-2026-003', batch: 'B20260714', category: '家居日用', supplier: '某林林公司', warehouse: '平台仓2', inType: '采购入库', produceDate: '2026-09-12', expireDate: '2027-09-12', stockQty: 800, realQty: null, owner: '王强', status: '待盘点', remark: '' }),
  row({ no: 'PD202601121108', poNo: 'CG202607150622', name: '精华液 30ml', code: 'AS-2026-022', batch: 'B20260114', category: '美妆个护', supplier: '雅美化妆品', warehouse: '华南仓', inType: '采购入库', produceDate: '2026-01-14', expireDate: '2027-01-14', stockQty: 30, realQty: 28, owner: '李丽霞', status: '有差异', remark: '破损 2 瓶已报废，等仓库确认后调整库存。' }),
  row({ no: 'PD202601121108', poNo: 'CG202607150622', name: '眼睫毛 5ml', code: 'SE-2026-002', batch: 'B20260912', category: '美妆个护', supplier: '美妆公司', warehouse: '华南仓', inType: '调拨入库', produceDate: '2026-07-14', expireDate: '2027-07-14', stockQty: 230, realQty: 230, owner: '李丽霞', status: '已完结', remark: '' })
]

/** 盘点任务可选货品池：直接取库存批次，保证「盘点 = 库存里的货」 */
export const useStocktakeStore = defineStore('stocktake', () => {
  const rows = reactive(read(KEY.stocktake, seed()))
  const adjustments = reactive(read(KEY.stocktake + '_adj', []))
  watch(rows, v => write(KEY.stocktake, v), { deep: true })
  watch(adjustments, v => write(KEY.stocktake + '_adj', v), { deep: true })

  const inv = () => useInventoryStore()

  /** 可盘点的货品（取库存批次，带上供应商/类型供筛选） */
  const pool = computed(() => inv().batches.map(b => ({
    code: b.code, name: b.name, spec: '', batch: b.batch, category: b.category,
    supplier: b.supplier, stockQty: b.left, warehouse: b.warehouse
  })))

  const list = computed(() => rows)
  const groupsOf = no => rows.filter(r => r.no === no)

  function nextTaskNo() {
    const d = new Date()
    const p = n => String(n).padStart(2, '0')
    const base = `PD${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}`
    if (!rows.some(r => r.no === base || r.no.startsWith(base + '-'))) return base
    let seq = 2
    while (rows.some(r => r.no === `${base}-${p(seq)}`)) seq++
    return `${base}-${p(seq)}`
  }

  /** 同一批次同一时间只允许一条待盘点（PRD 7） */
  function pendingConflict(goods) {
    for (const g of goods) {
      const hit = rows.find(r => r.status === '待盘点' && r.code === g.code && r.batch === g.batch)
      if (hit) return { name: hit.name, no: hit.no, batch: hit.batch }
    }
    return null
  }

  function createTask({ warehouse, owner, remark, goods }) {
    if (!warehouse) return { ok: false, msg: '请选择供货仓库' }
    if (!owner) return { ok: false, msg: '请选择负责人' }
    if (!goods || !goods.length) return { ok: false, msg: '请至少添加一个盘点商品' }
    const conflict = pendingConflict(goods)
    if (conflict) {
      return { ok: false, msg: `【${conflict.name}】批次 ${conflict.batch} 已有待盘点任务 ${conflict.no}，请先盘完再建` }
    }
    const no = nextTaskNo()
    goods.forEach(g => {
      rows.unshift({
        no, poNo: '—', name: g.name, code: g.code, batch: g.batch,
        category: g.category || '未分类', supplier: g.supplier || '—',
        warehouse, inType: warehouse === '华东主仓' ? '采购入库' : '调拨入库',
        produceDate: '2026-09-12', expireDate: '2027-09-12',
        stockQty: g.stockQty, realQty: null, owner, status: '待盘点', remark: remark || ''
      })
    })
    return { ok: true, no, count: goods.length }
  }

  /** 保存盘点结果：一致→已完结；不一致→有差异 + 生成调整单 + 回写库存 */
  function saveCheck({ no, name, batch, realQty, remark }) {
    const r = rows.find(x => x.no === no && x.name === name && (!batch || x.batch === batch))
    if (!r) return { ok: false, msg: '盘点明细不存在' }
    if (r.status !== '待盘点') return { ok: false, msg: '该盘点单已处理，不能重复提交' }
    const val = Number(realQty)
    if (realQty === '' || realQty === null || Number.isNaN(val)) return { ok: false, msg: '请填写实盘数后才能保存' }
    if (!Number.isInteger(val) || val < 0) return { ok: false, msg: '实盘数只能是非负整数' }
    if (val > 100000) return { ok: false, msg: '实盘数需在 0~100000 之间' }

    r.realQty = val
    r.remark = remark || ''
    r.status = val === Number(r.stockQty) ? '已完结' : '有差异'

    if (r.status === '有差异') {
      const diff = val - Number(r.stockQty)
      const res = inv().adjust({ name: r.name, batch: r.batch, warehouse: r.warehouse, diff })
      const d = new Date()
      const p = n => String(n).padStart(2, '0')
      const adjNo = `TZ${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}`
      adjustments.unshift({
        no: adjNo, taskNo: r.no, name: r.name, code: r.code, batch: r.batch,
        warehouse: r.warehouse, diff, before: res?.before ?? r.stockQty,
        after: res?.after ?? r.stockQty, reason: r.remark,
        time: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
      })
      return { ok: true, status: r.status, diff, adjNo }
    }
    return { ok: true, status: r.status, diff: 0 }
  }

  function reload() {
    replaceAll(rows, read(KEY.stocktake, seed()))
    replaceAll(adjustments, read(KEY.stocktake + '_adj', []))
  }

  return { rows, list, adjustments, pool, groupsOf, nextTaskNo, createTask, saveCheck, pendingConflict, reload }
})
