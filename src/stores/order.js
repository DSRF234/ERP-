import { defineStore } from 'pinia'
import { offsetHours } from '@/utils/format'
import { useStockStore } from '@/stores/stock'

/**
 * 订单全局状态
 *
 * 当前没有真实 WMS 与财务系统，中间环节按以下方式模拟：
 *   审核通过 → 生成出库单号，订单进入「待发货」（此时扣减可用库存）
 *   → 待发货页点「模拟出库回传」代替 WMS 回传，生成运单号进入「已发货」
 *   → 点「确认收货」进入「已完结」
 *   → 已完结订单自动推送到财务管理（发货数据 / 对账中心）
 *
 * 接入真实 WMS 后：把 ship() 换成 WMS 出库回传接口，其余流程不变。
 */
export const CARRIERS = [
  { name: '顺丰', prefix: 'SF', len: 12 },
  { name: '圆通', prefix: 'YT', len: 13 },
  { name: '中通', prefix: 'ZT', len: 12 },
  { name: '韵达', prefix: 'YD', len: 13 },
  { name: '邮政', prefix: 'YZ', len: 13 }
]

/** 按快递公司生成运单号；不传公司时随机取一家 */
function genExpress(carrierName) {
  const c = CARRIERS.find(x => x.name === carrierName) || CARRIERS[Math.floor(Math.random() * CARRIERS.length)]
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
    warehouse: '华东主仓', payTime: '2026-11-16 10:22', orderTime: '2026-11-16 10:22', deadline: offsetHours(6), platformGoods: '雅诗兰黛小棕瓶50ml',
    goods: [{ name: '雅诗兰黛小棕瓶', spec: '50ml', qty: 2, sku: 'SKU-100231' }],
    stock: { '华东主仓': 1, '华南仓': 6, '平台仓1': 0, '平台仓2': 0 }, status: 'review' },

  { no: 'DY20261116003', platform: '抖音', shop: '官方店', receiver: '李**', phone: '13900002345',
    address: '广东省广州市白云区机场路 12 号', note: '尽快发货', carrier: '圆通', amount: 459, settle: 0, actual: 459,
    warehouse: '华南仓', payTime: '2026-11-16 09:41', orderTime: '2026-11-16 09:41', deadline: offsetHours(-5), platformGoods: '星野纯棉四件套',
    goods: [{ name: '星野纯棉四件套', spec: '1.8m 灰', qty: 1, sku: 'SKU-200118' }],
    stock: { '华东主仓': 20, '华南仓': 12, '平台仓1': 0, '平台仓2': 0 }, status: 'review' },

  { no: 'XC20261116007', platform: '小程序', shop: '小程序商城', receiver: '赵**', phone: '13700003456',
    address: '江苏省苏州市工业园区星湖街 88 号', note: '', carrier: '顺丰', amount: 168, settle: 0, actual: 168,
    warehouse: '华东主仓', payTime: '2026-11-16 08:05', orderTime: '2026-11-16 08:05', deadline: offsetHours(30), platformGoods: '星野香薰蜡烛',
    goods: [{ name: '星野香薰蜡烛', spec: '小号', qty: 1, sku: 'SKU-300052' }],
    stock: { '华东主仓': 0, '华南仓': 0, '平台仓1': 0, '平台仓2': 0 }, status: 'review' },

  { no: 'JD20261115012', platform: '京东', shop: '京东自营', receiver: '周**', phone: '13600004567',
    address: '北京市朝阳区建国路 89 号', note: '', carrier: '邮政', amount: 899, settle: 26.97, actual: 872.03,
    warehouse: '平台仓2', payTime: '2026-11-15 21:40', orderTime: '2026-11-15 21:40', deadline: offsetHours(-2), platformGoods: '兰蔻小黑瓶30ml',
    goods: [{ name: '兰蔻小黑瓶', spec: '30ml', qty: 1, sku: 'SKU-100188' }],
    stock: { '华东主仓': 5, '华南仓': 3, '平台仓1': 8, '平台仓2': 10 }, status: 'shipped',
    expressNo: 'YZ5566778899', shippedAt: '2026-11-16 09:10' },

  { no: 'DY20261114022', platform: '抖音', shop: '官方店', receiver: '郑**', phone: '13400006789',
    address: '四川省成都市武侯区天府大道 1 号', note: '', carrier: '圆通', amount: 528, settle: 0, actual: 528,
    warehouse: '华南仓', payTime: '2026-11-14 12:30', orderTime: '2026-11-14 12:30', deadline: offsetHours(-12), platformGoods: '星野收纳箱大号',
    goods: [{ name: '星野收纳箱', spec: '大号', qty: 2, sku: 'SKU-400011' }],
    stock: { '华东主仓': 30, '华南仓': 25, '平台仓1': 0, '平台仓2': 0 }, status: 'shipped',
    expressNo: 'YT7788990011', shippedAt: '2026-11-15 10:20' },

  { no: 'TM20261112008', platform: '天猫', shop: '旗舰店', receiver: '刘**', phone: '13500007890',
    address: '上海市浦东新区世纪大道 100 号', note: '', carrier: '中通', amount: 2340, settle: 117, actual: 2223,
    warehouse: '华东主仓', payTime: '2026-11-12 09:00', orderTime: '2026-11-12 09:00', deadline: offsetHours(-40), platformGoods: '雅诗兰黛小棕瓶50ml',
    goods: [{ name: '雅诗兰黛小棕瓶', spec: '50ml', qty: 2, sku: 'SKU-100231' }],
    stock: { '华东主仓': 9, '华南仓': 2, '平台仓1': 0, '平台仓2': 0 }, status: 'done', afterStatus: '已完结', financePushed: true,
    expressNo: 'ZT1122334455', shippedAt: '2026-11-13 11:00', doneAt: '2026-11-16 18:30' },

  { no: 'XC20261110004', platform: '小程序', shop: '小程序商城', receiver: '孙**', phone: '13300008901',
    address: '湖北省武汉市洪山区珞喻路 129 号', note: '', carrier: '顺丰', amount: 76, settle: 0, actual: 76,
    warehouse: '华东主仓', payTime: '2026-11-10 09:00', orderTime: '2026-11-10 09:00', deadline: offsetHours(-60), platformGoods: '星野香薰蜡烛',
    goods: [{ name: '星野香薰蜡烛', spec: '小号', qty: 1, sku: 'SKU-300052' }],
    stock: { '华东主仓': 40, '华南仓': 10, '平台仓1': 0, '平台仓2': 0 }, status: 'done', afterStatus: '已完结', financePushed: true,
    expressNo: 'SF1122334455', shippedAt: '2026-11-10 15:20', doneAt: '2026-11-13 09:40' }
]

/* 历史已完结订单：与售后预置单一一对应 */
const HIST = [
  {
    "no": "TM20261116002",
    "platform": "天猫",
    "shop": "天猫店铺",
    "receiver": "陈**",
    "phone": "138****6621",
    "address": "浙江省杭州市余杭区",
    "note": "",
    "carrier": "中通",
    "amount": 1286.0,
    "settle": 64.3,
    "actual": 1221.7,
    "warehouse": "华东主仓",
    "payTime": "2026-11-14 10:22",
    "orderTime": "2026-11-14 10:22",
    "platformGoods": "雅诗兰黛小棕瓶 50ml",
    "goods": [
      {
        "name": "雅诗兰黛小棕瓶",
        "spec": "50ml",
        "qty": 1,
        "sku": "SKU-100231"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261116002",
    "shippedAt": "2026-11-14 10:22",
    "doneAt": "2026-11-14 10:22",
    "financePushed": false
  },
  {
    "no": "XC20261115003",
    "platform": "小程序",
    "shop": "小程序店铺",
    "receiver": "李**",
    "phone": "139****3308",
    "address": "广东省广州市白云区",
    "note": "",
    "carrier": "中通",
    "amount": 199.0,
    "settle": 9.95,
    "actual": 189.05,
    "warehouse": "华东主仓",
    "payTime": "2026-11-13 16:12",
    "orderTime": "2026-11-13 16:12",
    "platformGoods": "星野香薰礼盒",
    "goods": [
      {
        "name": "星野香薰礼盒",
        "spec": "—",
        "qty": 1,
        "sku": "SKU-300045"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261115003",
    "shippedAt": "2026-11-13 16:12",
    "doneAt": "2026-11-13 16:12",
    "financePushed": false
  },
  {
    "no": "DY20261114023",
    "platform": "抖音",
    "shop": "抖音店铺",
    "receiver": "王**",
    "phone": "137****9012",
    "address": "江苏省南京市鼓楼区",
    "note": "",
    "carrier": "中通",
    "amount": 528.0,
    "settle": 26.4,
    "actual": 501.6,
    "warehouse": "华东主仓",
    "payTime": "2026-11-14 12:30",
    "orderTime": "2026-11-14 12:30",
    "platformGoods": "星野收纳箱 大号",
    "goods": [
      {
        "name": "星野收纳箱",
        "spec": "大号",
        "qty": 2,
        "sku": "SKU-400011"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261114023",
    "shippedAt": "2026-11-14 12:30",
    "doneAt": "2026-11-14 12:30",
    "financePushed": false
  },
  {
    "no": "TM20261117009",
    "platform": "天猫",
    "shop": "天猫店铺",
    "receiver": "赵**",
    "phone": "136****4477",
    "address": "上海市浦东新区",
    "note": "",
    "carrier": "中通",
    "amount": 2572.0,
    "settle": 128.6,
    "actual": 2443.4,
    "warehouse": "华东主仓",
    "payTime": "2026-11-15 20:10",
    "orderTime": "2026-11-15 20:10",
    "platformGoods": "雅诗兰黛小棕瓶 50ml",
    "goods": [
      {
        "name": "雅诗兰黛小棕瓶",
        "spec": "50ml",
        "qty": 2,
        "sku": "SKU-100231"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261117009",
    "shippedAt": "2026-11-15 20:10",
    "doneAt": "2026-11-15 20:10",
    "financePushed": false
  },
  {
    "no": "DY20261116012",
    "platform": "抖音",
    "shop": "抖音店铺",
    "receiver": "周**",
    "phone": "135****2089",
    "address": "北京市朝阳区",
    "note": "",
    "carrier": "中通",
    "amount": 359.0,
    "settle": 17.95,
    "actual": 341.05,
    "warehouse": "华东主仓",
    "payTime": "2026-11-16 21:05",
    "orderTime": "2026-11-16 21:05",
    "platformGoods": "星野纯棉四件套",
    "goods": [
      {
        "name": "星野纯棉四件套",
        "spec": "—",
        "qty": 1,
        "sku": "SKU-200118"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261116012",
    "shippedAt": "2026-11-16 21:05",
    "doneAt": "2026-11-16 21:05",
    "financePushed": false
  },
  {
    "no": "JD20261117005",
    "platform": "京东",
    "shop": "京东店铺",
    "receiver": "吴**",
    "phone": "134****7731",
    "address": "四川省成都市武侯区",
    "note": "",
    "carrier": "中通",
    "amount": 528.0,
    "settle": 26.4,
    "actual": 501.6,
    "warehouse": "华东主仓",
    "payTime": "2026-11-17 09:30",
    "orderTime": "2026-11-17 09:30",
    "platformGoods": "星野收纳箱 大号",
    "goods": [
      {
        "name": "星野收纳箱",
        "spec": "大号",
        "qty": 2,
        "sku": "SKU-400011"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261117005",
    "shippedAt": "2026-11-17 09:30",
    "doneAt": "2026-11-17 09:30",
    "financePushed": false
  },
  {
    "no": "XC20261116004",
    "platform": "小程序",
    "shop": "小程序店铺",
    "receiver": "郑**",
    "phone": "133****5590",
    "address": "湖北省武汉市洪山区",
    "note": "",
    "carrier": "中通",
    "amount": 899.0,
    "settle": 44.95,
    "actual": 854.05,
    "warehouse": "华东主仓",
    "payTime": "2026-11-15 18:50",
    "orderTime": "2026-11-15 18:50",
    "platformGoods": "兰蔻小黑瓶 30ml",
    "goods": [
      {
        "name": "兰蔻小黑瓶",
        "spec": "30ml",
        "qty": 1,
        "sku": "SKU-100188"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261116004",
    "shippedAt": "2026-11-15 18:50",
    "doneAt": "2026-11-15 18:50",
    "financePushed": false
  },
  {
    "no": "JD20261115013",
    "platform": "京东",
    "shop": "京东店铺",
    "receiver": "孙**",
    "phone": "132****6642",
    "address": "陕西省西安市雁塔区",
    "note": "",
    "carrier": "中通",
    "amount": 899.0,
    "settle": 44.95,
    "actual": 854.05,
    "warehouse": "华东主仓",
    "payTime": "2026-11-13 21:40",
    "orderTime": "2026-11-13 21:40",
    "platformGoods": "兰蔻小黑瓶 30ml",
    "goods": [
      {
        "name": "兰蔻小黑瓶",
        "spec": "30ml",
        "qty": 1,
        "sku": "SKU-100188"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261115013",
    "shippedAt": "2026-11-13 21:40",
    "doneAt": "2026-11-13 21:40",
    "financePushed": false
  },
  {
    "no": "TM20261112009",
    "platform": "天猫",
    "shop": "天猫店铺",
    "receiver": "刘**",
    "phone": "131****8803",
    "address": "福建省厦门市思明区",
    "note": "",
    "carrier": "中通",
    "amount": 2340.0,
    "settle": 117.0,
    "actual": 2223.0,
    "warehouse": "华东主仓",
    "payTime": "2026-11-12 18:12",
    "orderTime": "2026-11-12 18:12",
    "platformGoods": "雅诗兰黛小棕瓶 50ml",
    "goods": [
      {
        "name": "雅诗兰黛小棕瓶",
        "spec": "50ml",
        "qty": 2,
        "sku": "SKU-100231"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261112009",
    "shippedAt": "2026-11-12 18:12",
    "doneAt": "2026-11-12 18:12",
    "financePushed": false
  },
  {
    "no": "XC20261110002",
    "platform": "小程序",
    "shop": "小程序店铺",
    "receiver": "黄**",
    "phone": "130****2214",
    "address": "山东省济南市历下区",
    "note": "",
    "carrier": "中通",
    "amount": 76.0,
    "settle": 3.8,
    "actual": 72.2,
    "warehouse": "华东主仓",
    "payTime": "2026-11-10 11:00",
    "orderTime": "2026-11-10 11:00",
    "platformGoods": "星野香薰蜡烛",
    "goods": [
      {
        "name": "星野香薰蜡烛",
        "spec": "—",
        "qty": 1,
        "sku": "SKU-300052"
      }
    ],
    "status": "done",
    "afterStatus": "已退款",
    "expressNo": "ZT0261110002",
    "shippedAt": "2026-11-10 11:00",
    "doneAt": "2026-11-10 11:00",
    "financePushed": false
  },
  {
    "no": "TM20261109004",
    "platform": "天猫",
    "shop": "天猫店铺",
    "receiver": "徐**",
    "phone": "138****6621",
    "address": "浙江省杭州市余杭区",
    "note": "",
    "carrier": "中通",
    "amount": 359.0,
    "settle": 17.95,
    "actual": 341.05,
    "warehouse": "华东主仓",
    "payTime": "2026-11-09 14:05",
    "orderTime": "2026-11-09 14:05",
    "platformGoods": "星野纯棉四件套",
    "goods": [
      {
        "name": "星野纯棉四件套",
        "spec": "—",
        "qty": 1,
        "sku": "SKU-200118"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261109004",
    "shippedAt": "2026-11-09 14:05",
    "doneAt": "2026-11-09 14:05",
    "financePushed": false
  },
  {
    "no": "JD20261106003",
    "platform": "京东",
    "shop": "京东店铺",
    "receiver": "马**",
    "phone": "139****3308",
    "address": "广东省广州市白云区",
    "note": "",
    "carrier": "中通",
    "amount": 899.0,
    "settle": 44.95,
    "actual": 854.05,
    "warehouse": "华东主仓",
    "payTime": "2026-11-06 20:15",
    "orderTime": "2026-11-06 20:15",
    "platformGoods": "兰蔻小黑瓶 30ml",
    "goods": [
      {
        "name": "兰蔻小黑瓶",
        "spec": "30ml",
        "qty": 1,
        "sku": "SKU-100188"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261106003",
    "shippedAt": "2026-11-06 20:15",
    "doneAt": "2026-11-06 20:15",
    "financePushed": false
  },
  {
    "no": "XC20261108001",
    "platform": "小程序",
    "shop": "小程序店铺",
    "receiver": "朱**",
    "phone": "137****9012",
    "address": "江苏省南京市鼓楼区",
    "note": "",
    "carrier": "中通",
    "amount": 398.0,
    "settle": 19.9,
    "actual": 378.1,
    "warehouse": "华东主仓",
    "payTime": "2026-11-08 15:40",
    "orderTime": "2026-11-08 15:40",
    "platformGoods": "星野香薰礼盒",
    "goods": [
      {
        "name": "星野香薰礼盒",
        "spec": "—",
        "qty": 2,
        "sku": "SKU-300045"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261108001",
    "shippedAt": "2026-11-08 15:40",
    "doneAt": "2026-11-08 15:40",
    "financePushed": false
  },
  {
    "no": "TM20261114015",
    "platform": "天猫",
    "shop": "天猫店铺",
    "receiver": "胡**",
    "phone": "136****4477",
    "address": "上海市浦东新区",
    "note": "",
    "carrier": "中通",
    "amount": 76.0,
    "settle": 3.8,
    "actual": 72.2,
    "warehouse": "华东主仓",
    "payTime": "2026-11-13 15:40",
    "orderTime": "2026-11-13 15:40",
    "platformGoods": "星野香薰蜡烛",
    "goods": [
      {
        "name": "星野香薰蜡烛",
        "spec": "—",
        "qty": 1,
        "sku": "SKU-300052"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "expressNo": "ZT0261114015",
    "shippedAt": "2026-11-13 15:40",
    "doneAt": "2026-11-13 15:40",
    "financePushed": false
  },
  {
    "no": "TM20261108021",
    "platform": "天猫",
    "shop": "天猫店铺",
    "receiver": "郭**",
    "phone": "135****2089",
    "address": "北京市朝阳区",
    "note": "",
    "carrier": "中通",
    "amount": 1080.0,
    "settle": 54.0,
    "actual": 1026.0,
    "warehouse": "华东主仓",
    "payTime": "2026-11-08 09:30",
    "orderTime": "2026-11-08 09:30",
    "platformGoods": "雅诗兰黛小棕瓶 50ml",
    "goods": [
      {
        "name": "雅诗兰黛小棕瓶",
        "spec": "50ml",
        "qty": 1,
        "sku": "SKU-100231"
      }
    ],
    "status": "done",
    "afterStatus": "已退款",
    "expressNo": "ZT0261108021",
    "shippedAt": "2026-11-08 09:30",
    "doneAt": "2026-11-08 09:30",
    "financePushed": false
  },
  {
    "no": "DY20261107015",
    "platform": "抖音",
    "shop": "抖音店铺",
    "receiver": "林**",
    "phone": "134****7731",
    "address": "四川省成都市武侯区",
    "note": "",
    "carrier": "中通",
    "amount": 359.0,
    "settle": 17.95,
    "actual": 341.05,
    "warehouse": "华东主仓",
    "payTime": "2026-11-07 14:00",
    "orderTime": "2026-11-07 14:00",
    "platformGoods": "星野纯棉四件套",
    "goods": [
      {
        "name": "星野纯棉四件套",
        "spec": "—",
        "qty": 1,
        "sku": "SKU-200118"
      }
    ],
    "status": "done",
    "afterStatus": "已退款",
    "expressNo": "ZT0261107015",
    "shippedAt": "2026-11-07 14:00",
    "doneAt": "2026-11-07 14:00",
    "financePushed": false
  },
  {
    "no": "DY20261105009",
    "platform": "抖音",
    "shop": "抖音店铺",
    "receiver": "何**",
    "phone": "133****5590",
    "address": "湖北省武汉市洪山区",
    "note": "",
    "carrier": "中通",
    "amount": 264.0,
    "settle": 13.2,
    "actual": 250.8,
    "warehouse": "华东主仓",
    "payTime": "2026-11-05 19:40",
    "orderTime": "2026-11-05 19:40",
    "platformGoods": "星野收纳箱 大号",
    "goods": [
      {
        "name": "星野收纳箱",
        "spec": "大号",
        "qty": 1,
        "sku": "SKU-400011"
      }
    ],
    "status": "done",
    "afterStatus": "已完结",
    "expressNo": "ZT0261105009",
    "shippedAt": "2026-11-05 19:40",
    "doneAt": "2026-11-05 19:40",
    "financePushed": true
  },
  {
    "no": "TM20261104007",
    "platform": "天猫",
    "shop": "天猫店铺",
    "receiver": "高**",
    "phone": "132****6642",
    "address": "陕西省西安市雁塔区",
    "note": "",
    "carrier": "中通",
    "amount": 152.0,
    "settle": 7.6,
    "actual": 144.4,
    "warehouse": "华东主仓",
    "payTime": "2026-11-01 10:10",
    "orderTime": "2026-11-01 10:10",
    "platformGoods": "星野香薰蜡烛",
    "goods": [
      {
        "name": "星野香薰蜡烛",
        "spec": "—",
        "qty": 2,
        "sku": "SKU-300052"
      }
    ],
    "status": "done",
    "afterStatus": "已完结",
    "expressNo": "ZT0261104007",
    "shippedAt": "2026-11-01 10:10",
    "doneAt": "2026-11-01 10:10",
    "financePushed": true
  },
  {
    "no": "JD20261103008",
    "platform": "京东",
    "shop": "京东店铺",
    "receiver": "罗**",
    "phone": "131****8803",
    "address": "福建省厦门市思明区",
    "note": "",
    "carrier": "中通",
    "amount": 359.0,
    "settle": 17.95,
    "actual": 341.05,
    "warehouse": "华东主仓",
    "payTime": "2026-11-03 16:30",
    "orderTime": "2026-11-03 16:30",
    "platformGoods": "星野纯棉四件套",
    "goods": [
      {
        "name": "星野纯棉四件套",
        "spec": "—",
        "qty": 1,
        "sku": "SKU-200118"
      }
    ],
    "status": "done",
    "afterStatus": "已完结",
    "expressNo": "ZT0261103008",
    "shippedAt": "2026-11-03 16:30",
    "doneAt": "2026-11-03 16:30",
    "financePushed": true
  },
  {
    "no": "JD20261112021",
    "platform": "京东",
    "shop": "京东店铺",
    "receiver": "梁**",
    "phone": "130****2214",
    "address": "山东省济南市历下区",
    "note": "",
    "carrier": "中通",
    "amount": 718.0,
    "settle": 35.9,
    "actual": 682.1,
    "warehouse": "华东主仓",
    "payTime": "2026-11-11 10:20",
    "orderTime": "2026-11-11 10:20",
    "platformGoods": "星野纯棉四件套",
    "goods": [
      {
        "name": "星野纯棉四件套",
        "spec": "—",
        "qty": 2,
        "sku": "SKU-200118"
      }
    ],
    "status": "done",
    "afterStatus": "已退款",
    "expressNo": "ZT0261112021",
    "shippedAt": "2026-11-11 10:20",
    "doneAt": "2026-11-11 10:20",
    "financePushed": false
  },
  {
    "no": "DY20261111018",
    "platform": "抖音",
    "shop": "抖音店铺",
    "receiver": "宋**",
    "phone": "138****6621",
    "address": "浙江省杭州市余杭区",
    "note": "",
    "carrier": "中通",
    "amount": 152.0,
    "settle": 7.6,
    "actual": 144.4,
    "warehouse": "华东主仓",
    "payTime": "2026-11-10 20:30",
    "orderTime": "2026-11-10 20:30",
    "platformGoods": "星野香薰蜡烛",
    "goods": [
      {
        "name": "星野香薰蜡烛",
        "spec": "—",
        "qty": 2,
        "sku": "SKU-300052"
      }
    ],
    "status": "done",
    "afterStatus": "已完结",
    "expressNo": "ZT0261111018",
    "shippedAt": "2026-11-10 20:30",
    "doneAt": "2026-11-10 20:30",
    "financePushed": true
  },
  {
    "no": "XC20261110007",
    "platform": "小程序",
    "shop": "小程序店铺",
    "receiver": "谢**",
    "phone": "139****3308",
    "address": "广东省广州市白云区",
    "note": "",
    "carrier": "中通",
    "amount": 199.0,
    "settle": 9.95,
    "actual": 189.05,
    "warehouse": "华东主仓",
    "payTime": "2026-10-28 19:15",
    "orderTime": "2026-10-28 19:15",
    "platformGoods": "星野香薰礼盒",
    "goods": [
      {
        "name": "星野香薰礼盒",
        "spec": "—",
        "qty": 1,
        "sku": "SKU-300045"
      }
    ],
    "status": "done",
    "afterStatus": "已完结",
    "expressNo": "ZT0261110007",
    "shippedAt": "2026-10-28 19:15",
    "doneAt": "2026-10-28 19:15",
    "financePushed": true
  },
  {
    "no": "TM20261109016",
    "platform": "天猫",
    "shop": "天猫店铺",
    "receiver": "唐**",
    "phone": "137****9012",
    "address": "江苏省南京市鼓楼区",
    "note": "",
    "carrier": "中通",
    "amount": 1286.0,
    "settle": 64.3,
    "actual": 1221.7,
    "warehouse": "华东主仓",
    "payTime": "2026-11-09 12:00",
    "orderTime": "2026-11-09 12:00",
    "platformGoods": "雅诗兰黛小棕瓶 50ml",
    "goods": [
      {
        "name": "雅诗兰黛小棕瓶",
        "spec": "50ml",
        "qty": 1,
        "sku": "SKU-100231"
      }
    ],
    "status": "done",
    "afterStatus": "已完结",
    "expressNo": "ZT0261109016",
    "shippedAt": "2026-11-09 12:00",
    "doneAt": "2026-11-09 12:00",
    "financePushed": true
  },
  {
    "no": "XC20261108014",
    "platform": "小程序",
    "shop": "小程序店铺",
    "receiver": "许**",
    "phone": "136****4477",
    "address": "上海市浦东新区",
    "note": "",
    "carrier": "中通",
    "amount": 1798.0,
    "settle": 89.9,
    "actual": 1708.1,
    "warehouse": "华东主仓",
    "payTime": "2026-11-08 21:10",
    "orderTime": "2026-11-08 21:10",
    "platformGoods": "兰蔻小黑瓶 30ml",
    "goods": [
      {
        "name": "兰蔻小黑瓶",
        "spec": "30ml",
        "qty": 2,
        "sku": "SKU-100188"
      }
    ],
    "status": "done",
    "afterStatus": "已完结",
    "expressNo": "ZT0261108014",
    "shippedAt": "2026-11-08 21:10",
    "doneAt": "2026-11-08 21:10",
    "financePushed": true
  },
  {
    "no": "DY20261117018",
    "platform": "抖音",
    "shop": "抖音店铺",
    "receiver": "袁**",
    "phone": "136****2215",
    "address": "江苏省南京市建邺区",
    "note": "",
    "carrier": "中通",
    "amount": 264.0,
    "settle": 13.2,
    "actual": 250.8,
    "warehouse": "华南仓",
    "payTime": "2026-11-17 19:05",
    "orderTime": "2026-11-17 19:05",
    "deadline": "2026-11-19 19:05",
    "platformGoods": "星野收纳箱 大号",
    "goods": [
      {
        "name": "星野收纳箱",
        "spec": "大号",
        "qty": 1,
        "sku": "SKU-400011"
      }
    ],
    "status": "shipped",
    "afterStatus": "售后中",
    "financePushed": false,
    "expressNo": "ZT9900112233",
    "shippedAt": "2026-11-18 08:30"
  },
  {
    "no": "JD20261107004",
    "platform": "京东",
    "shop": "京东店铺",
    "receiver": "范**",
    "phone": "138****3391",
    "address": "湖北省武汉市江汉区",
    "note": "",
    "carrier": "邮政",
    "amount": 899.0,
    "settle": 26.97,
    "actual": 872.03,
    "warehouse": "华东主仓",
    "payTime": "2026-11-07 14:50",
    "orderTime": "2026-11-07 14:50",
    "deadline": "2026-11-09 14:50",
    "platformGoods": "兰蔻小黑瓶 30ml",
    "goods": [
      {
        "name": "兰蔻小黑瓶",
        "spec": "30ml",
        "qty": 1,
        "sku": "SKU-100188"
      }
    ],
    "status": "done",
    "afterStatus": "售后中",
    "financePushed": false,
    "expressNo": "YZ6677889900",
    "shippedAt": "2026-11-08 09:10",
    "doneAt": "2026-11-10 16:00"
  }

]

export const useOrderStore = defineStore('order', {
  state: () => ({ orders: [...SEED, ...HIST].map(o => ({ ...o })) }),

  getters: {
    /** 按状态取列表 */
    byStatus: s => st => s.orders.filter(o => o.status === st),
    /** 财务：已发货未结算（运输中 + 已完结且无售后占用） */
    financeUnsettled: s => s.orders.filter(o =>
      o.status === 'shipped' || (o.status === 'done' && o.afterStatus === '已完结')),
    /** 财务：已完成待核对 —— 只有「已完结」才推送 */
    financeToCheck: s => s.orders.filter(o => o.status === 'done' && o.afterStatus === '已完结'),
    counts: s => ({
      review: s.orders.filter(o => o.status === 'review').length,
      pending: s.orders.filter(o => o.status === 'pending').length,
      shipped: s.orders.filter(o => o.status === 'shipped').length,
      done: s.orders.filter(o => o.status === 'done').length
    })
  },

  actions: {
    /**
     * 审核通过：校验订单状态与库存，通过后进入「待发货」并扣减可用库存。
     * carrierName 为空时随机取一家快递公司（单条审核沿用此行为）；
     * 批量审核传入用户选择的统一快递公司。
     */
    approve(order, warehouse, carrierName) {
      const target = this.orders.find(o => o.no === order.no)
      if (!target) return { ok: false, msg: '订单不存在' }
      if (target.status !== 'review') return { ok: false, msg: '只有待审核订单可以审核' }

      const stock = useStockStore()
      const wh = warehouse || target.warehouse

      // 库存校验：任一 SKU 不足直接拒绝，避免「已发货但没扣库存」
      for (const g of target.goods) {
        const avail = stock.availableOf(g.sku, wh)
        if (avail < g.qty) {
          return { ok: false, msg: `${wh} 的「${g.name}」可用 ${avail} 件，不足 ${g.qty} 件，请换仓或驳回` }
        }
      }

      const { carrier } = genExpress(carrierName)
      target.warehouse = wh
      target.status = 'pending'
      target.carrier = carrier
      target.approvedAt = now()
      target.outboundNo = 'OUT' + Date.now().toString().slice(-10)
      // 尚未发货，清掉可能残留的运单信息与待处理标记
      delete target.expressNo
      delete target.shippedAt
      delete target.deferredAt

      target.goods.forEach(g => stock.deduct(g.sku, wh, g.qty))
      return { ok: true, carrier, outboundNo: target.outboundNo }
    },

    /** 模拟 WMS 出库回传：待发货 → 已发货，生成运单号 */
    ship(order, trackingNo) {
      const target = this.orders.find(o => o.no === order.no)
      if (!target || target.status !== 'pending') return null
      const res = genExpress(target.carrier)
      target.expressNo = trackingNo || res.expressNo
      target.status = 'shipped'
      target.shippedAt = now()
      delete target.outboundNo
      return { carrier: target.carrier, expressNo: target.expressNo }
    },

    /** 稍后处理：标记待处理，列表中整行标红并显示「待处理」标签 */
    defer(orders) {
      const t = now()
      orders.forEach(o => {
        const target = this.orders.find(x => x.no === o.no)
        if (target && !target.deferredAt) target.deferredAt = t
      })
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
      if (!target) return { ok: false, msg: '订单不存在' }
      if (target.status === 'done') return { ok: false, msg: '订单已完结，无需重复确认' }
      if (target.status !== 'shipped') return { ok: false, msg: '只有已发货订单可以确认收货' }
      target.status = 'done'
      target.doneAt = now()
      target.afterStatus = '已完结'
      target.financePushed = true
      return { ok: true }
    },

    /**
     * 售后触发：售后中 / 已退款 / 已完结。
     * 只有「已完结」才推送财务 —— 售后处理期间与已退款的订单不进入对账，
     * 避免「钱退了还在对账表里」。
     */
    setAfterStatus(orderNo, st) {
      const VALID = ['已完结', '售后中', '已退款']
      if (!VALID.includes(st)) return { ok: false, msg: `非法的订单售后状态：${st}` }
      const target = this.orders.find(o => o.no === orderNo)
      if (!target) return { ok: false, msg: '订单不存在' }
      target.afterStatus = st
      target.financePushed = st === '已完结'
      return { ok: true }
    },

    /** 新建订单：直接进入待审核 */
    create(form) {
      const { carrier } = genExpress()
      const amount = Number(form.amount) || 0
      const settle = +(amount * 0.05).toFixed(2)

      const picked = (Array.isArray(form.items) ? form.items : [])
        .filter(i => i && i.sku)
        .map(i => ({
          sku: i.sku,
          name: i.name || i.sku,
          spec: i.spec || '—',
          qty: Number(i.qty) || 1
        }))
      // 兼容旧调用（goodsName + qty），新页面统一传 items
      const goods = picked.length
        ? picked
        : [{ name: form.goodsName || '待补充商品', spec: '—', qty: Number(form.qty) || 1, sku: 'SKU-100231' }]

      const order = {
        no: 'NEW' + Date.now().toString().slice(-9),
        platform: form.platform, shop: form.shop || '自建店铺',
        receiver: form.receiver, phone: form.phone,
        province: form.province || '',
        address: form.address,
        note: form.note || '', carrier,
        amount, settle, actual: +(amount - settle).toFixed(2),
        warehouse: form.warehouse || '华东主仓',
        payTime: now(), orderTime: now(), deadline: offsetHours(48),
        platformGoods: goods.map(g => `${g.name} ×${g.qty}`).join('、'),
        goods,
        status: 'review'
      }
      this.orders.unshift(order)
      return order
    }
  }
})
