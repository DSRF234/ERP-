import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { KEY, read, write, replaceAll } from './persist'
import { useMessageStore } from './message'
import {
  purchaseOrders, addOrder, approveOrder, rejectOrder as rejectRaw,
  warehousingOrder, totalOf, qtyOf
} from '@/data/purchase'

/**
 * 采购订单（门面层）
 * ------------------------------------------------------------------
 * 数据在 data/purchase.js（与应付台账、库存入库共用一份），
 * 这里只做三件事：持久化、编号唯一、业务前置校验与通知。
 * 原来各页面自己存一份 rows 的问题已消除。
 */
export const amountOf = totalOf
export const qtyOfOrder = qtyOf

export const usePurchaseStore = defineStore('purchase', () => {
  // 优先用上次会话的数据（localStorage），否则用种子
  const saved = read(KEY.purchase, null)
  if (Array.isArray(saved) && saved.length) replaceAll(purchaseOrders, saved)
  watch(purchaseOrders, v => write(KEY.purchase, v), { deep: true })

  const orders = purchaseOrders
  const list = computed(() => orders.map(o => ({
    ...o,
    amount: totalOf(o),
    itemCount: (o.items || []).length
  })))

  const byNo = no => orders.find(o => o.no === no) || null

  /** CG + YYYYMMDD + 时分（14 位）；同分钟再加 2 位流水，保证唯一 */
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
    return addOrder({ ...payload, no: payload.no || nextNo() })
  }

  function approve(no) {
    return approveOrder(no)
  }

  function reject(no, reason) {
    if (!String(reason || '').trim()) return { ok: false, msg: '驳回时必须填写驳回原因' }
    const res = rejectRaw(no)
    if (!res.ok) return res
    const o = byNo(no)
    o.rejectReason = String(reason).trim()
    useMessageStore().push({
      to: o.creator,
      title: `采购单 ${o.no} 已被驳回`,
      body: `驳回原因：${o.rejectReason}`
    })
    return { ok: true, to: o.creator }
  }

  function inbound(no) {
    return warehousingOrder(no)
  }

  function remove(no) {
    const i = orders.findIndex(o => o.no === no)
    if (i === -1) return { ok: false, msg: '单据不存在' }
    if (orders[i].status === '进行中') return { ok: false, msg: '「进行中」的单据不能删除，请先确认入库' }
    orders.splice(i, 1)
    return { ok: true }
  }

  function reload() {
    replaceAll(orders, read(KEY.purchase, []))
  }

  return { orders, list, byNo, nextNo, add, approve, reject, inbound, remove, reload }
})
