import { purchaseOrders, totalOf } from '@/data/purchase'
import { money } from '@/utils/format'

/**
 * 财务口径（全站唯一）
 * ---------------------------------------------------------------
 * 到账合计 = 对账中心「实际到账金额」之和（含一张手工单据：销售出库 +168）
 * 应付合计 = 采购单「进行中 + 已完成」的（货款 + 运费）
 *           待审核、已驳回的不计入——还没审批，不算已产生的债务
 * 现有资金 = 到账合计 − 应付合计
 *
 * 三个页面（对账中心 / 应付台账 / 数据看板）都从这里取数，避免各算一套。
 */

/** 对账中心里非订单来源的单据（退货入库不进对账，故只保留销售出库） */
export const RECON_DEMO = [
  {
    no: 'DZ20261106003', shop: '小程序 · 商城', goods: '星野香薰礼盒', time: '2026-11-06 08:05',
    type: '销售出库', qty: 1, amount: 168, settle: 0, actual: 168, checked: true
  },

]

/** 计入应付的采购状态 */
export const PAYABLE_STATUS = ['进行中', '已完成']

/** 采购单应付金额 = 货款 + 运费 */
export const payableOf = o => totalOf(o) + Number(o.freight || 0)

/** 采购单发生日期（用于按时间段筛选） */
const dateOf = str => {
  const t = new Date(String(str || '').replace(' ', 'T'))
  return isNaN(t.getTime()) ? null : t
}

/** 应付合计（仅已审批：进行中 + 已完成）；传 from 则只算该时间点之后的单据 */
export const payableTotal = (from = null) =>
  purchaseOrders
    .filter(o => PAYABLE_STATUS.includes(o.status))
    .filter(o => {
      if (!from) return true
      const t = dateOf(o.date)
      return t && t >= from
    })
    .reduce((s, o) => s + payableOf(o), 0)

/** 待审核采购单（含潜在应付金额） */
export const pendingPurchase = () => {
  const list = purchaseOrders.filter(o => o.status === '待审核')
  return { count: list.length, amount: list.reduce((s, o) => s + payableOf(o), 0) }
}

/** 到账合计：对账中心实际到账之和；传 from 则只算该时间点之后的单据 */
export const receiptTotal = (financeToCheck, from = null) => {
  const inRange = t => {
    if (!from) return true
    const d = dateOf(t)
    return d && d >= from
  }
  const fromOrders = (financeToCheck || [])
    .filter(o => inRange(o.orderTime || o.payTime))
    .reduce((s, o) => s + Number(o.actual || 0), 0)
  const fromDemo = RECON_DEMO
    .filter(r => inRange(r.time))
    .reduce((s, r) => s + Number(r.actual || 0), 0)
  return fromOrders + fromDemo
}

/** 现有资金汇总；from 为空表示全量口径 */
export const fundSummary = (financeToCheck, from = null) => {
  const receipt = receiptTotal(financeToCheck, from)
  const payable = payableTotal(from)
  const pending = pendingPurchase()
  return {
    receipt,
    payable,
    net: receipt - payable,
    pendingCount: pending.count,
    pendingAmount: pending.amount,
    text: {
      receipt: money(receipt),
      payable: money(payable),
      net: money(receipt - payable),
      pendingAmount: money(pending.amount)
    }
  }
}
