import { defineStore } from 'pinia'
import { reactive, computed, watch } from 'vue'
import { KEY, read, write, replaceAll } from './persist'
import { useInventoryStore } from './inventory'
import { useMessageStore } from './message'

/**
 * 采购订单
 * 新建、审核、驳回、删除、确认入库统一走这里：
 *   · 新建的单据真的会出现在列表首行（原来只弹提示不落库）；
 *   · 确认入库会写库存记录（原来写的是另一套 stock store，库存页看不到）；
 *   · 驳回会给制单人发一条站内通知。
 */
export const amountOf = o => (o.items || []).reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0)

const it = (code, name, spec, unit, price, qty, category) => ({ code, name, spec, unit, price, qty, category })

const seed = () => [
  { no: 'CG202607221421', buyer: '张某某', creator: '王佳丽', supplier: '某林林公司', warehouse: '华东主仓', category: '家居日用', logistics: '某邦物流公司', expressNo: 'DB1234567891234', freight: 100, date: '2026-07-22 14:27', status: '待审核',
    items: [it('SO-2026-001', '洗面奶', '100g/支', '支', 20, 1000, '家居日用')] },
  { no: 'CG202607221418', buyer: '李某', creator: '李某', supplier: '美妆公司', warehouse: '华南仓', category: '美妆个护', logistics: '某东物流公司', expressNo: 'DB1234567891235', freight: 80, date: '2026-07-22 11:03', status: '待审核',
    items: [it('SO-2026-031', '精华液', '30ml/瓶', '瓶', 46.5, 1000, '美妆个护')] },
  { no: 'CG202607211207', buyer: '张某某', creator: '张某某', supplier: '某林林公司', warehouse: '华东主仓', category: '家居日用', logistics: '某邦物流公司', expressNo: 'DB1234567891188', freight: 120, date: '2026-07-21 09:42', status: '进行中',
    items: [it('SO-2026-001', '洗面奶', '100g/支', '支', 20, 1500, '家居日用'), it('SO-2026-003', '牙膏', '30g/个', '个', 8.2, 1000, '家居日用')] },
  { no: 'CG202607201155', buyer: '王某', creator: '王某', supplier: '雅美化妆品', warehouse: '平台仓1', category: '美妆个护', logistics: '某东物流公司', expressNo: 'JD7788001122', freight: 60, date: '2026-07-20 16:18', status: '进行中',
    items: [it('SO-2026-032', '小棕瓶', '50ml/瓶', '瓶', 128.6, 1000, '美妆个护')] },
  { no: 'CG202607191022', buyer: '李某', creator: '李某', supplier: '美妆公司', warehouse: '华东主仓', category: '美妆个护', logistics: '某邦物流公司', expressNo: 'DB1234567891023', freight: 95, date: '2026-07-19 10:05', status: '进行中',
    items: [it('SO-2026-011', '眼睫毛', '5ml/支', '支', 6.6, 2000, '美妆个护'), it('SO-2026-012', '抽纸', '3层/包', '件', 3.55, 4000, '家居日用')] },
  { no: 'CG202607180916', buyer: '张某某', creator: '张某某', supplier: '某林林公司', warehouse: '华南仓', category: '家居日用', logistics: '某东物流公司', expressNo: 'JD7788000987', freight: 130, date: '2026-07-18 08:56', status: '已完成',
    items: [it('SO-2026-001', '洗面奶', '100g/支', '支', 9.13, 10000, '家居日用')] },
  { no: 'CG202607170844', buyer: '王某', creator: '王某', supplier: '雅美化妆品', warehouse: '华东主仓', category: '美妆个护', logistics: '某邦物流公司', expressNo: 'DB1234567890876', freight: 70, date: '2026-07-17 14:31', status: '已完成',
    items: [it('SO-2026-031', '精华液', '30ml/瓶', '瓶', 26.3, 2000, '美妆个护')] },
  { no: 'CG202607160733', buyer: '李某', creator: '李某', supplier: '美妆公司', warehouse: '平台仓2', category: '美妆个护', logistics: '某东物流公司', expressNo: 'JD7788000765', freight: 45, date: '2026-07-16 09:12', status: '已完成',
    items: [it('SO-2026-012', '抽纸', '3层/包', '件', 7.9, 2000, '家居日用')] },
  { no: 'CG202607150622', buyer: '张某某', creator: '张某某', supplier: '某林林公司', warehouse: '华东主仓', category: '家居日用', logistics: '某邦物流公司', expressNo: 'DB1234567890654', freight: 110, date: '2026-07-15 15:44', status: '已完成',
    items: [it('SO-2026-001', '洗面奶', '100g/支', '支', 20, 2000, '家居日用'), it('SO-2026-003', '牙膏', '30g/个', '个', 13.7, 2000, '家居日用')] },
  { no: 'CG202607140511', buyer: '王某', creator: '王某', supplier: '雅美化妆品', warehouse: '华南仓', category: '美妆个护', logistics: '某邦物流公司', expressNo: 'DB1234567890543', freight: 88, date: '2026-07-14 11:26', status: '已驳回',
    items: [it('SO-2026-031', '精华液', '30ml/瓶', '瓶', 16.95, 2000, '美妆个护')] },
  { no: 'CG202607130422', buyer: '李某', creator: '李某', supplier: '美妆公司', warehouse: '华东主仓', category: '美妆个护', logistics: '某东物流公司', expressNo: 'JD7788000432', freight: 55, date: '2026-07-13 10:08', status: '进行中',
    items: [it('SO-2026-011', '眼睫毛', '5ml/支', '支', 10.9, 2000, '美妆个护')] },
  { no: 'CG202607120315', buyer: '张某某', creator: '张某某', supplier: '某林林公司', warehouse: '华东主仓', category: '家居日用', logistics: '某邦物流公司', expressNo: 'DB1234567890321', freight: 100, date: '2026-07-12 17:02', status: '待审核',
    items: [it('SO-2026-001', '洗面奶', '100g/支', '支', 22.45, 2000, '家居日用')] }
]

export const usePurchaseStore = defineStore('purchase', () => {
  const orders = reactive(read(KEY.purchase, seed()))
  watch(orders, v => write(KEY.purchase, v), { deep: true })

  const list = computed(() => orders.map(o => ({ ...o, amount: amountOf(o), itemCount: (o.items || []).length })))
  const byNo = no => orders.find(o => o.no === no) || null

  /**
   * 采购编号：CG + YYYYMMDD + 时分，14 位；
   * 同一分钟内再建单时追加 2 位流水（CG202611241501-02），保证不重号。
   */
  function nextNo() {
    const d = new Date()
    const p = n => String(n).padStart(2, '0')
    const base = `CG${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}`
    if (!orders.some(o => o.no === base || o.no.startsWith(`${base}-`))) return base
    let seq = 2
    while (orders.some(o => o.no === `${base}-${p(seq)}`)) seq++
    return `${base}-${p(seq)}`
  }

  function add(payload) {
    const rec = {
      ...payload,
      status: '待审核',
      date: payload.date || new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
    orders.unshift(rec)
    return rec
  }

  function approve(no) {
    const o = byNo(no)
    if (!o) return { ok: false, msg: '单据不存在' }
    if (o.status !== '待审核') return { ok: false, msg: `该单据当前状态为「${o.status}」，不能重复审核` }
    o.status = '进行中'
    return { ok: true }
  }

  function reject(no, reason) {
    const o = byNo(no)
    if (!o) return { ok: false, msg: '单据不存在' }
    if (o.status !== '待审核') return { ok: false, msg: `该单据当前状态为「${o.status}」，不能重复审核` }
    if (!String(reason || '').trim()) return { ok: false, msg: '驳回时必须填写驳回原因' }
    o.status = '已驳回'
    o.rejectReason = String(reason).trim()
    const msg = useMessageStore()
    msg.push({ to: o.creator, title: `采购单 ${o.no} 已被驳回`, body: `驳回原因：${o.rejectReason}` })
    return { ok: true, to: o.creator }
  }

  /** 确认入库：明细逐行写进库存记录，单据转已完成 */
  function inbound(no) {
    const o = byNo(no)
    if (!o) return { ok: false, msg: '单据不存在' }
    if (o.status !== '进行中') return { ok: false, msg: '只有「进行中」的单据才能确认入库' }
    const inv = useInventoryStore()
    ;(o.items || []).forEach(i => {
      inv.inbound({
        name: i.name, code: i.code, warehouse: o.warehouse, qty: i.qty,
        unit: i.unit, supplier: o.supplier, orderNo: o.no, category: i.category || o.category
      })
    })
    o.status = '已完成'
    o.inboundAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    return { ok: true, total: (o.items || []).reduce((s, i) => s + Number(i.qty || 0), 0) }
  }

  function remove(no) {
    const i = orders.findIndex(o => o.no === no)
    if (i === -1) return { ok: false, msg: '单据不存在' }
    if (orders[i].status === '进行中') return { ok: false, msg: '「进行中」的单据不能删除，请先确认入库' }
    orders.splice(i, 1)
    return { ok: true }
  }

  function reload() { replaceAll(orders, read(KEY.purchase, seed())) }

  return { orders, list, byNo, nextNo, add, approve, reject, inbound, remove, reload }
})
