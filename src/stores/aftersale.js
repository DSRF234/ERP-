import { defineStore } from 'pinia'
import { tickets as sharedTickets } from '@/data/aftersale'
import { useOrderStore } from '@/stores/order'

/**
 * 售后工单 store —— 数据源与售后管理页共用 src/data/aftersale 的 tickets 数组。
 *
 * 为什么不在这里另存一份 SEED：
 * 售后管理三页（待处理 / 处理中 / 处理完成）的列表、审核、退款、换货、库存判断
 * 全部围绕 data/aftersale 那份数据展开。若 store 独立维护一份数组，就会出现
 * 「菜单角标 2 单、列表 7 单」「订单页发起售后后在售后页看不到」这类自相矛盾。
 * 因此这里直接把同一个 reactive 数组挂到 state 上，任何一处 push / 改 status
 * 都会立刻在另一处可见。
 *
 * 订单联动：售后状态变化时同步写回订单（售后中 / 已退款 / 已完结），
 * 只有「已完结」的订单才推送财务对账。
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

/**
 * 申请售后类型：与「处理方式」强制同值。
 * 历史上前端把「退货」写成「退货退款」，导致详情里「申请售后类型 退货退款 / 处理方式 退货」
 * 自相矛盾；统一口径后两者永远一致（退款与否由「是否寄回」体现，不再造第二个名字）。
 */
const APPLY_TYPE = { '退货': '退货', '仅退款': '仅退款', '部分仅退款': '部分仅退款', '换货': '换货', '补发': '补发', '补差价': '补差价', '更改地址': '更改地址' }

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
    /** 从已完结订单发起售后：创建后订单变为「售后中」，并停止推送财务 */
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
      useOrderStore().setAfterStatus(order.no, '售后中')
      return ticket
    },

    /** 审核：按结论分流（口径与 data/aftersale 的 auditTicket 一致） */
    approve(ticket, form) {
      const t = this.tickets.find(x => x.ticket === ticket.ticket)
      if (!t) return
      const order = useOrderStore()
      t.type = form.type
      t.applyType = APPLY_TYPE[form.type] || form.type
      if (form.amount != null) t.amount = form.amount
      if (form.result === 'reject') {
        t.status = 'done'; t.result = '拒绝'; t.queue = ''
        t.amount = 0; t.refundWay = ''; t.addressSync = ''
        t.finishedAt = now(); t.who = form.who || t.who
        order.setAfterStatus(t.orderNo, '已完结')     /* 拒绝＝无售后占用，恢复推送财务 */
        return
      }
      /* 仅退款 / 部分仅退款 / 补差价：同意即按原支付渠道打款，直达「处理完成」 */
      if (['仅退款', '部分仅退款', '补差价'].includes(form.type)) {
        t.status = 'done'; t.result = '同意'; t.queue = ''
        t.refundWay = '原路退回（原支付渠道）'
        t.finishedAt = now(); t.who = form.who || t.who
        order.setAfterStatus(t.orderNo, '已退款')
        return
      }
      /* 其余（退货 / 换货 / 补发 / 更改地址）：同意后一律进「处理中」 */
      t.status = 'doing'
      t.queue = { '退货': 'back', '换货': 'exchange', '补发': 'resend', '更改地址': 'address' }[form.type] || 'refund'
      order.setAfterStatus(t.orderNo, '售后中')
    },

    /** 处理中：退款完成 → 订单「已退款」，不再推送财务 */
    refund(ticket) {
      const t = this.tickets.find(x => x.ticket === ticket.ticket)
      if (!t) return
      t.status = 'done'; t.result = '同意'; t.queue = ''
      t.finishedAt = now()
      useOrderStore().setAfterStatus(t.orderNo, '已退款')
    },

    /** 处理中：换货 / 补发完成 → 订单「已完结」，恢复推送财务 */
    completeExchange(ticket) {
      const t = this.tickets.find(x => x.ticket === ticket.ticket)
      if (!t) return
      t.status = 'done'; t.result = '同意'; t.queue = ''
      t.finishedAt = now()
      useOrderStore().setAfterStatus(t.orderNo, '已完结')
    }
  }
})
