import { defineStore } from 'pinia'
import { tickets as sharedTickets } from '@/data/aftersale'

/**
 * 售后工单 store —— 数据源与售后管理页共用 src/data/aftersale 的 tickets 数组。
 *
 * 为什么不在这里另存一份 SEED：
 * 售后管理三页（待处理 / 处理中 / 处理完成）的列表、审核、退款、换货、库存判断
 * 全部围绕 data/aftersale 那份数据展开。若 store 独立维护一份数组，就会出现
 * 「菜单角标 2 单、列表 7 单」「订单页发起售后后在售后页看不到」这类自相矛盾。
 * 因此这里直接把同一个 reactive 数组挂到 state 上，任何一处 push / 改 status
 * 都会立刻在另一处可见。
 */
const now = () => {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
const addHours = h => {
  const d = new Date(Date.now() + h * 3600000)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 申请售后类型：与「待处理」页「申请售后类型」列同一口径 */
const APPLY_TYPE = { '退货': '退货退款', '仅退款': '仅退款', '换货': '换货', '补发': '补发', '补差价': '补差价' }

/* 单号 AS + 年月日 + 三位流水，避开已存在的单号 */
let seq = 1
const genTicket = () => {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const used = new Set(sharedTickets.map(t => t.ticket))
  let no
  do { no = 'AS' + day + String(seq++).padStart(3, '0') } while (used.has(no))
  return no
}

export const useAfterStore = defineStore('aftersale', {
  state: () => ({ tickets: sharedTickets }),
  getters: {
    byStatus: s => st => s.tickets.filter(t => t.status === st),
    counts: s => ({
      wait: s.tickets.filter(t => t.status === 'wait').length,
      doing: s.tickets.filter(t => t.status === 'doing').length,
      done: s.tickets.filter(t => t.status === 'done').length
    })
  },
  actions: {
    /** 从已完结订单发起售后：字段按售后管理页所需补齐，创建后直接出现在「待处理」 */
    createFromOrder(order, type, reason) {
      const g = (order.goods && order.goods[0]) || {}
      const ticket = {
        ticket: genTicket(),
        orderNo: order.no,
        channel: order.platform,
        applyType: APPLY_TYPE[type] || type,
        type,
        reason,
        proofs: [],
        applyTime: now(),
        sla: addHours(48),
        logistics: '已签收',
        expressNo: order.expressNo || '—',
        goods: `${g.name || '商品'} ${g.spec || ''} ×${g.qty || 1}`.replace(/\s+/g, ' ').trim(),
        sku: g.sku || '—',
        qty: g.qty || 1,
        orderTime: order.orderTime || order.payTime || now(),
        orderAmount: order.amount || 0,
        amount: 0,
        customer: {
          name: order.receiver || '',
          phone: order.phone || '',
          addr: order.address || ''
        },
        message: reason,
        status: 'wait',
        queue: '',
        result: '—',
        duty: '',
        auditRemark: '',
        auditor: '',
        auditTime: '',
        who: '',
        finishedAt: '',
        workOrder: '',
        refundWay: '',
        addressSync: '',
        syncTime: '',
        repeat: false
      }
      this.tickets.unshift(ticket)
      return ticket
    },

    /** 审核：按结论分流（口径与 data/aftersale 的 auditTicket 一致） */
    approve(ticket, form) {
      const t = this.tickets.find(x => x.ticket === ticket.ticket)
      if (!t) return
      t.type = form.type
      t.applyType = APPLY_TYPE[form.type] || form.type
      if (form.amount != null) t.amount = form.amount
      if (form.result === 'reject') {
        t.status = 'done'; t.result = '拒绝'; t.queue = ''
        t.finishedAt = now(); t.who = form.who || t.who
        return
      }
      if (form.type === '更改地址') {
        t.status = 'done'; t.result = '同意'; t.amount = 0; t.queue = ''
        t.finishedAt = now(); t.who = form.who || t.who
        return
      }
      /* 仅退款 / 部分仅退款 / 补差价：审核后直达「处理完成」，不进处理中 */
      if (['仅退款', '部分仅退款', '补差价'].includes(form.type)) {
        t.status = 'done'; t.result = '同意'; t.queue = ''
        t.finishedAt = now(); t.who = form.who || t.who
        return
      }
      t.status = 'doing'
      t.queue = { '退货': 'back', '换货': 'exchange', '补发': 'resend' }[form.type] || 'refund'
    },

    /** 处理中：退款 */
    refund(ticket) {
      const t = this.tickets.find(x => x.ticket === ticket.ticket)
      if (!t) return
      t.status = 'done'; t.result = '同意'; t.queue = ''
      t.finishedAt = now()
    }
  }
})
