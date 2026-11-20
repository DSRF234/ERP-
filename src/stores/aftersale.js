import { defineStore } from 'pinia'
import { useOrderStore } from '@/stores/order'

/**
 * 售后工单
 * 已完结订单可以发起售后，工单通过 orderNo 关联订单。
 * 注：退款暂不进入财务对账（按业务确认，财务模块保持独立）。
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

let seq = 1
const genTicket = () => 'AS' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + String(seq++).padStart(3, '0')

const SEED = [
  { ticket: 'AS20261116001', orderNo: 'TM20261116001', channel: '天猫', type: '退货', reason: '商品破损',
    applyTime: '2026-11-16 09:20', sla: addHours(-6), logistics: '已签收', goods: '雅诗兰黛小棕瓶 50ml ×1',
    sku: 'SKU-100231', qty: 1, customer: '陈**', orderTime: '2026-11-14 10:22',
    orderAmount: 1286, amount: 1286, expressNo: 'ZT7788990011', result: '—', queue: '', status: 'wait' },
  { ticket: 'AS20261116002', orderNo: 'XC20261115003', channel: '小程序', type: '补发', reason: '少件',
    applyTime: '2026-11-16 08:10', sla: addHours(5), logistics: '已签收', goods: '星野香薰礼盒 ×3',
    sku: 'SKU-300045', qty: 1, customer: '赵**', orderTime: '2026-11-13 16:12',
    orderAmount: 199, amount: 0, expressNo: 'SF1122334455', result: '—', queue: '', status: 'wait' },
  { ticket: 'AS20261114004', orderNo: 'JD20261115012', channel: '京东', type: '换货', reason: '规格不符',
    applyTime: '2026-11-14 11:00', sla: addHours(-30), logistics: '运输中', goods: '兰蔻小黑瓶 30ml ×1',
    sku: 'SKU-100188', qty: 1, customer: '周**', orderTime: '2026-11-13 21:40',
    orderAmount: 899, amount: 0, expressNo: 'YZ5566778899', result: '—', queue: 'exchange', status: 'doing' },
  { ticket: 'AS20261113005', orderNo: 'TM20261112008', channel: '天猫', type: '退货', reason: '不喜欢',
    applyTime: '2026-11-13 10:15', sla: addHours(-24), logistics: '退回在途', goods: '雅诗兰黛小棕瓶 50ml ×2',
    sku: 'SKU-100231', qty: 2, customer: '吴**', orderTime: '2026-11-12 18:12',
    orderAmount: 2340, amount: 2340, expressNo: 'ZT1122334455', result: '—', queue: 'transit', status: 'doing' },
  { ticket: 'AS20261110007', orderNo: 'TM20261108021', channel: '天猫', type: '退货', reason: '商品破损',
    applyTime: '2026-11-10 15:20', sla: addHours(-90), logistics: '已签收', goods: '雅诗兰黛小棕瓶 50ml ×1',
    sku: 'SKU-100231', qty: 1, customer: '刘**', orderTime: '2026-11-08 09:30',
    orderAmount: 1080, amount: 1080, expressNo: 'ZT5544332211', result: '同意', queue: '', status: 'done' }
]

export const useAfterStore = defineStore('aftersale', {
  state: () => ({ tickets: SEED.map(t => ({ ...t })) }),
  getters: {
    byStatus: s => st => s.tickets.filter(t => t.status === st),
    counts: s => ({
      wait: s.tickets.filter(t => t.status === 'wait').length,
      doing: s.tickets.filter(t => t.status === 'doing').length,
      done: s.tickets.filter(t => t.status === 'done').length
    })
  },
  actions: {
    /** 从已完结订单发起售后 */
    createFromOrder(order, type, reason) {
      const g = order.goods[0] || {}
      const ticket = {
        ticket: genTicket(),
        orderNo: order.no,
        channel: order.platform,
        type, reason,
        applyTime: now(),
        sla: addHours(24),
        logistics: '已签收',
        goods: `${g.name || '商品'} ${g.spec || ''} ×${g.qty || 1}`,
        sku: g.sku || '—',
        qty: g.qty || 1,
        customer: order.receiver,
        orderTime: order.orderTime || order.payTime,
        orderAmount: order.amount,
        amount: 0,
        expressNo: order.expressNo || '—',
        result: '—', queue: '', status: 'wait'
      }
      this.tickets.unshift(ticket)
      useOrderStore().setAfterStatus(order.no, '售后中')
      return ticket
    },

    /** 审核：按结论分流 */
    approve(ticket, form) {
      const t = this.tickets.find(x => x.ticket === ticket.ticket)
      if (!t) return
      t.type = form.type
      t.amount = form.amount
      const order = useOrderStore()

      if (form.result === 'reject') {
        t.status = 'done'; t.result = '拒绝'; t.queue = ''
        order.setAfterStatus(t.orderNo, '已完结')   // 拒绝＝无售后，恢复推送财务
        return
      }
      if (form.type === '更改地址') {
        t.status = 'done'; t.result = '同意'; t.amount = 0; t.queue = ''
        order.setAfterStatus(t.orderNo, '已完结')
        return
      }
      t.status = 'doing'
      t.queue = { '退货': 'back', '换货': 'exchange', '补发': 'resend' }[form.type] || 'refund'
      order.setAfterStatus(t.orderNo, '售后中')
    },

    /** 处理中：退款完成 → 订单「已退款」，不再推送财务 */
    refund(ticket) {
      const t = this.tickets.find(x => x.ticket === ticket.ticket)
      if (!t) return
      t.status = 'done'; t.result = '同意'; t.queue = ''
      useOrderStore().setAfterStatus(t.orderNo, '已退款')
    },

    /** 处理中：换货 / 补发完成 → 订单「已完结」，恢复推送财务 */
    completeExchange(ticket) {
      const t = this.tickets.find(x => x.ticket === ticket.ticket)
      if (!t) return
      t.status = 'done'; t.result = '同意'; t.queue = ''
      useOrderStore().setAfterStatus(t.orderNo, '已完结')
    }
  }
})
