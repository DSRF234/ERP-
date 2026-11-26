import { purchaseOrders, totalOf } from '@/data/purchase'
import { money } from '@/utils/format'

/**
 * 财务口径（全站唯一）
 * ---------------------------------------------------------------
 * 到账合计 = 对账中心「实际到账金额」之和（含两张手工单据：销售出库 +168、退货入库 -528）
 * 应付合计 = 采购单「进行中 + 已完成」的（货款 + 运费）
 *           待审核、已驳回的不计入——还没审批，不算已产生的债务
 * 现有资金 = 到账合计 − 应付合计
 *
 * 三个页面（对账中心 / 应付台账 / 数据看板）都从这里取数，避免各算一套。
 */

/** 对账中心里两张非订单来源的单据 */
export const RECON_DEMO = [
  {
    no: 'DZ20261106003', shop: '小程序 · 商城', goods: '星野香薰礼盒', time: '2026-11-06 08:05',
    type: '销售出库', qty: 1, amount: 168, settle: 0, actual: 168, checked: true
  },
  {
    no: 'DZ20261105011', shop: '抖音 · 官方旗舰店', goods: '星野收纳箱 大号', time: '2026-11-05 18:12',
    type: '退货入库', qty: 1, amount: -528, settle: 0, actual: -528, checked: true
  }
]

/** 计入应付的采购状态 */
export const PAYABLE_STATUS = ['进行中', '已完成']

/** 采购单应付金额 = 货款 + 运费 */
export const payableOf = o => totalOf(o) + Number(o.freight || 0)

/** 应付合计（仅已审批：进行中 + 已完成） */
export const payableTotal = () =>
  purchaseOrders
    .filter(o => PAYABLE_STATUS.includes(o.status))
    .reduce((s, o) => s + payableOf(o), 0)

/** 待审核采购单（含潜在应付金额） */
export const pendingPurchase = () => {
  const list = purchaseOrders.filter(o => o.status === '待审核')
  return { count: list.length, amount: list.reduce((s, o) => s + payableOf(o), 0) }
}

/** 到账合计：对账中心实际到账之和 */
export const receiptTotal = financeToCheck =>
  (financeToCheck || []).reduce((s, o) => s + Number(o.actual || 0), 0) +
  RECON_DEMO.reduce((s, r) => s + Number(r.actual || 0), 0)

/** 现有资金汇总 */
export const fundSummary = financeToCheck => {
  const receipt = receiptTotal(financeToCheck)
  const payable = payableTotal()
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
