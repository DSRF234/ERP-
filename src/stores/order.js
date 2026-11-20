import { defineStore } from 'pinia'
import { offsetHours } from '@/utils/format'

/**
 * 订单全局状态
 *
 * 当前没有真实 WMS 与财务系统，中间环节按以下方式模拟：
 *   审核通过 → 系统自动"仓管已发货"，随机生成快递公司与运单号
 *   → 状态直接进入「已发货」
 *   → 点「确认收货」进入「已完结」
 *   → 已完结订单自动推送到财务管理（发货数据 / 对账中心）
 *
 * 接入真实 WMS 后：把 autoShip() 换成调用 WMS 出库接口，其余流程不变。
 */
export const CARRIERS = [
  { name: '顺丰', prefix: 'SF', len: 12 },
  { name: '圆通', prefix: 'YT', len: 13 },
  { name: '中通', prefix: 'ZT', len: 12 },
  { name: '韵达', prefix: 'YD', len: 13 },
  { name: '邮政', prefix: 'YZ', len: 13 }
]

function genExpress() {
  const c = CARRIERS[Math.floor(Math.random() * CARRIERS.length)]
  let no = c.prefix
  for (let i = 0; i < c.len; i++) no += Math.floor(Math.random() * 10)
  return { carrier: c.name, expressNo: no }
}

const now = () => {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const SEED = [
  { no: 'TM20261116001', platform: '天猫', shop: '旗舰店', receiver: '陈**', phone: '13800001234',
    address: '浙江省杭州市余杭区文一西路 969 号', note: '', carrier: '中通', amount: 1286, settle: 64.30, actual: 1221.70,
    warehouse: '华东主仓', payTime: '2026-11-16 10:22', deadline: offsetHours(6), platformGoods: '雅诗兰黛小棕瓶50ml',
    goods: [{ name: '雅诗兰黛小棕瓶', spec: '50ml', qty: 2, sku: 'SKU-100231' }],
    stock: { '华东主仓': 1, '华南仓': 6, '平台仓1': 0, '平台仓2': 0 }, status: 'review' },

  { no: 'DY20261116003', platform: '抖音', shop: '官方店', receiver: '李**', phone: '13900002345',
    address: '广东省广州市白云区机场路 12 号', note: '尽快发货', carrier: '圆通', amount: 459, settle: 0, actual: 459,
    warehouse: '华南仓', payTime: '2026-11-16 09:41', deadline: offsetHours(-5), platformGoods: '星野纯棉四件套',
    goods: [{ name: '星野纯棉四件套', spec: '1.8m 灰', qty: 1, sku: 'SKU-200118' }],
    stock: { '华东主仓': 20, '华南仓': 12, '平台仓1': 0, '平台仓2': 0 }, status: 'review' },

  { no: 'XC20261116007', platform: '小程序', shop: '小程序商城', receiver: '赵**', phone: '13700003456',
    address: '江苏省苏州市工业园区星湖街 88 号', note: '', carrier: '顺丰', amount: 168, settle: 0, actual: 168,
    warehouse: '华东主仓', payTime: '2026-11-16 08:05', deadline: offsetHours(30), platformGoods: '星野香薰礼盒',
    goods: [{ name: '星野香薰礼盒', spec: '3件装', qty: 1, sku: 'SKU-300045' }],
    stock: { '华东主仓': 0, '华南仓': 0, '平台仓1': 0, '平台仓2': 0 }, status: 'review' },

  { no: 'JD20261115012', platform: '京东', shop: '京东自营', receiver: '周**', phone: '13600004567',
    address: '北京市朝阳区建国路 89 号', note: '', carrier: '邮政', amount: 899, settle: 26.97, actual: 872.03,
    warehouse: '平台仓2', payTime: '2026-11-15 21:40', deadline: offsetHours(-2), platformGoods: '兰蔻小黑瓶30ml',
    goods: [{ name: '兰蔻小黑瓶', spec: '30ml', qty: 1, sku: 'SKU-100188' }],
    stock: { '华东主仓': 5, '华南仓': 3, '平台仓1': 8, '平台仓2': 10 }, status: 'shipped',
    expressNo: 'YZ5566778899', shippedAt: '2026-11-16 09:10' },

  { no: 'DY20261114022', platform: '抖音', shop: '官方店', receiver: '郑**', phone: '13400006789',
    address: '四川省成都市武侯区天府大道 1 号', note: '', carrier: '圆通', amount: 528, settle: 0, actual: 528,
    warehouse: '华南仓', payTime: '2026-11-14 12:30', deadline: offsetHours(-12), platformGoods: '星野收纳箱大号',
    goods: [{ name: '星野收纳箱', spec: '大号', qty: 2, sku: 'SKU-400011' }],
    stock: { '华东主仓': 30, '华南仓': 25, '平台仓1': 0, '平台仓2': 0 }, status: 'shipped',
    expressNo: 'YT7788990011', shippedAt: '2026-11-15 10:20' },

  { no: 'TM20261112008', platform: '天猫', shop: '旗舰店', receiver: '刘**', phone: '13500007890',
    address: '上海市浦东新区世纪大道 100 号', note: '', carrier: '中通', amount: 2340, settle: 117, actual: 2223,
    warehouse: '华东主仓', payTime: '2026-11-12 09:00', deadline: offsetHours(-40), platformGoods: '雅诗兰黛小棕瓶50ml',
    goods: [{ name: '雅诗兰黛小棕瓶', spec: '50ml', qty: 2, sku: 'SKU-100231' }],
    stock: { '华东主仓': 9, '华南仓': 2, '平台仓1': 0, '平台仓2': 0 }, status: 'done',
    expressNo: 'ZT1122334455', shippedAt: '2026-11-13 11:00', doneAt: '2026-11-16 18:30' },

  { no: 'XC20261110004', platform: '小程序', shop: '小程序商城', receiver: '孙**', phone: '13300008901',
    address: '湖北省武汉市洪山区珞喻路 129 号', note: '', carrier: '顺丰', amount: 76, settle: 0, actual: 76,
    warehouse: '华东主仓', payTime: '2026-11-10 09:00', deadline: offsetHours(-60), platformGoods: '星野香薰蜡烛',
    goods: [{ name: '星野香薰蜡烛', spec: '小号', qty: 1, sku: 'SKU-300052' }],
    stock: { '华东主仓': 40, '华南仓': 10, '平台仓1': 0, '平台仓2': 0 }, status: 'done',
    expressNo: 'SF1122334455', shippedAt: '2026-11-10 15:20', doneAt: '2026-11-13 09:40' }
]

export const useOrderStore = defineStore('order', {
  state: () => ({ orders: SEED.map(o => ({ ...o })) }),

  getters: {
    /** 按状态取列表 */
    byStatus: s => st => s.orders.filter(o => o.status === st),
    /** 财务：已发货未结算（含已发货与已完结） */
    financeUnsettled: s => s.orders.filter(o => o.status === 'shipped' || o.status === 'done'),
    /** 财务：已完成待核对 */
    financeToCheck: s => s.orders.filter(o => o.status === 'done'),
    counts: s => ({
      review: s.orders.filter(o => o.status === 'review').length,
      pending: s.orders.filter(o => o.status === 'pending').length,
      shipped: s.orders.filter(o => o.status === 'shipped').length,
      done: s.orders.filter(o => o.status === 'done').length
    })
  },

  actions: {
    /** 审核通过：模拟仓管已发货，随机生成快递公司与单号，直接进入已发货 */
    approve(order, warehouse) {
      const target = this.orders.find(o => o.no === order.no)
      if (!target) return null
      const { carrier, expressNo } = genExpress()
      if (warehouse) target.warehouse = warehouse
      target.status = 'shipped'
      target.carrier = carrier
      target.expressNo = expressNo
      target.shippedAt = now()
      return { carrier, expressNo }
    },

    /** 驳回：移出待审核列表 */
    reject(order) {
      const i = this.orders.findIndex(o => o.no === order.no)
      if (i >= 0) this.orders.splice(i, 1)
    },

    /** 撤回订单：退回审核 */
    withdraw(order) {
      const target = this.orders.find(o => o.no === order.no)
      if (!target) return
      target.status = 'review'
      delete target.expressNo
      delete target.shippedAt
    },

    /** 确认收货：已发货 → 已完结，同时推送财务 */
    confirmReceive(order) {
      const target = this.orders.find(o => o.no === order.no)
      if (!target) return
      target.status = 'done'
      target.doneAt = now()
      target.financePushed = true
      return target
    },

    /** 新建订单：直接进入待审核 */
    create(form) {
      const { carrier, expressNo } = genExpress()
      const seq = String(this.orders.length + 1).padStart(3, '0')
      this.orders.unshift({
        no: 'NEW20261120' + seq,
        platform: form.platform, shop: form.shop || '自建店铺',
        receiver: form.receiver, phone: form.phone, address: form.address,
        note: form.note || '', carrier, amount: 0, settle: 0, actual: 0,
        warehouse: '华东主仓',
        payTime: now(), deadline: now(),
        platformGoods: '—',
        goods: [{ name: '待补充商品', spec: '—', qty: 1, sku: '—' }],
        stock: { '华东主仓': 10, '华南仓': 10, '平台仓1': 10, '平台仓2': 10 },
        status: 'review', expressNo
      })
    }
  }
})
