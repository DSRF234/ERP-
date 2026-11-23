/**
 * 售后管理 · 共享数据层
 * 口径来源：《erpPRD.docx》2.3 售后管理 + 《Map1.pdf》字段清单 + 《ERP系统流程》泳道图
 *
 * 单据流转（口径：审核结论决定去「处理中」还是「处理完成」）：
 *   仅退款 / 部分仅退款 / 补差价：同意与拒绝都**直达 done**（同意=按原支付路径打款，拒绝=不打款、金额记 0）
 *   其他所有方式（退货 / 换货 / 补发 / 更改地址）：
 *     同意 --> doing（进入对应队列，等后续动作）
 *     拒绝 --> 直接 done（不产生任何后续作业）
 *   doing --确认退款 / 生成换货单 / 生成补发单 / 地址变更完成--> done
 */
import { reactive } from 'vue'
import { WAREHOUSE_NAMES } from './system'

export const nowStr = () => {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
export const todayStr = () => nowStr().slice(0, 10)
const offsetH = h => {
  const d = new Date(Date.now() + h * 3600000)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
export const stampStr = () => nowStr().replace(/[-: ]/g, '').slice(0, 8)

/* 六节点流程条 */
export const STEPS = ['申请提交', '售后审核', '客户寄回', '仓库质检', '退款/换货/补发', '完成']
export const ADDR_STEPS = ['申请提交', '售后审核', '地址变更', '完成']

/* 队列 → 所处节点下标（address 对应 ADDR_STEPS 的「地址变更」节点） */
export const QUEUE_STEP = { back: 2, transit: 2, qc: 3, refund: 4, exchange: 4, resend: 4, address: 2 }
export const QUEUE_TEXT = {
  back: '待客户退回', transit: '退回在途', qc: '已收货待质检',
  refund: '待退款', exchange: '换货待发货', resend: '待补发', address: '地址变更待生效'
}
export const QUEUE_ORDER = ['back', 'transit', 'qc', 'refund', 'exchange', 'resend', 'address']

/**
 * 唯一「审核同意后直接打款完结、不进处理中」的三类。
 * 其余处理方式（退货 / 换货 / 补发 / 更改地址）同意后一律进处理中。
 */
export const REFUND_ONLY = ['仅退款', '部分仅退款', '补差价']

/* 各仓可用库存（演示数据，换货/补发建单时校验） */
export const STOCK = {
  'SKU-100231': { 华东主仓: 42, 华南仓: 12, 平台仓1: 6, 平台仓2: 0 },
  'SKU-300045': { 华东主仓: 0, 华南仓: 0, 平台仓1: 0, 平台仓2: 0 },
  'SKU-400011': { 华东主仓: 18, 华南仓: 3, 平台仓1: 9, 平台仓2: 0 },
  'SKU-100188': { 华东主仓: 26, 华南仓: 0, 平台仓1: 4, 平台仓2: 12 },
  'SKU-300052': { 华东主仓: 9, 华南仓: 2, 平台仓1: 0, 平台仓2: 5 },
  'SKU-200118': { 华东主仓: 7, 华南仓: 1, 平台仓1: 0, 平台仓2: 3 }
}
export const stockOf = (sku, wh) => {
  const m = STOCK[sku]
  if (!m) return 20
  return m[wh] ?? 0
}
export const WAREHOUSE_OPTIONS = WAREHOUSE_NAMES.map(n => ({ name: n, desc: n === '华东主仓' || n === '华南仓' ? '自营仓' : '平台仓' }))

/* ---------------- 售后单 ---------------- */
const C = (name, phone, addr) => ({ name, phone, addr })

export const tickets = reactive([
  /* ===== 待处理（客服尚未审核） ===== */
  {
    ticket: 'AS20261116001', orderNo: 'TM20261116002', channel: '天猫',
    applyType: '退货退款', type: '退货', reason: '商品破损', proofs: ['破损外箱.jpg', '瓶身裂纹.jpg', '开箱.mp4'],
    applyTime: '2026-11-16 09:20', sla: offsetH(6), logistics: '已签收',
    expressNo: 'ZT7788990011', goods: '雅诗兰黛小棕瓶 50ml ×1', sku: 'SKU-100231', qty: 1,
    orderTime: '2026-11-14 10:22', orderAmount: 1286, amount: 0,
    customer: C('陈**', '138****6621', '浙江省杭州市余杭区 ******'),
    message: '收到时外箱被压扁了，里面的瓶子有一道裂纹，麻烦尽快处理。',
    status: 'wait', queue: '', result: '—', duty: '', auditRemark: '', auditor: '', auditTime: '',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261116002', orderNo: 'XC20261115003', channel: '小程序',
    applyType: '补发', type: '补发', reason: '少件', proofs: ['包裹称重.jpg'],
    applyTime: '2026-11-16 08:10', sla: offsetH(-4), logistics: '已签收',
    expressNo: 'SF1122334455', goods: '星野香薰礼盒 ×3', sku: 'SKU-300045', qty: 1,
    orderTime: '2026-11-13 16:12', orderAmount: 199, amount: 0,
    customer: C('赵**', '139****3308', '江苏省南京市鼓楼区 ******'),
    message: '礼盒里少了一个香薰蜡烛，只收到两个。',
    status: 'wait', queue: '', result: '—', duty: '', auditRemark: '', auditor: '', auditTime: '',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261115003', orderNo: 'DY20261114023', channel: '抖音',
    applyType: '仅退款', type: '仅退款', reason: '未按约定时间发货', proofs: ['聊天记录.jpg'],
    applyTime: '2026-11-15 14:30', sla: offsetH(30), logistics: '待签收',
    expressNo: 'YT9988776655', goods: '星野收纳箱 大号 ×2', sku: 'SKU-400011', qty: 2,
    orderTime: '2026-11-14 12:30', orderAmount: 528, amount: 0,
    customer: C('郑**', '137****9920', '广东省深圳市南山区 ******'),
    message: '下单时写了 48 小时内发货，已经第 5 天了才出库。',
    status: 'wait', queue: '', result: '—', duty: '', auditRemark: '', auditor: '', auditTime: '',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },

  {
    ticket: 'AS20261118015', orderNo: 'TM20261117009', channel: '天猫',
    applyType: '部分仅退款', type: '部分仅退款', reason: '部分商品破损', proofs: ['外箱照片.jpg', '内件破损.jpg'],
    applyTime: '2026-11-18 09:40', sla: offsetH(-11), logistics: '已签收',
    expressNo: 'ZT8899001122', goods: '雅诗兰黛小棕瓶 50ml ×2', sku: 'SKU-100231', qty: 2,
    orderTime: '2026-11-15 20:10', orderAmount: 2572, amount: 0,
    customer: C('施**', '138****4419', '江苏省无锡市滨湖区 ******'),
    message: '两瓶里有一瓶瓶盖裂了，另一瓶没动过，只退一瓶的钱就行。',
    status: 'wait', queue: '', result: '—', duty: '', auditRemark: '', auditor: '', auditTime: '',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261118016', orderNo: 'DY20261116012', channel: '抖音',
    applyType: '补差价', type: '补差价', reason: '同款降价', proofs: ['降价页截图.jpg', '订单截图.jpg'],
    applyTime: '2026-11-18 08:25', sla: offsetH(3), logistics: '已签收',
    expressNo: 'YT4455667788', goods: '星野纯棉四件套 ×1', sku: 'SKU-200118', qty: 1,
    orderTime: '2026-11-16 21:05', orderAmount: 359, amount: 0,
    customer: C('罗**', '137****6620', '湖南省长沙市岳麓区 ******'),
    message: '16 号刚买的，今天直播间同款降到 309，申请补 50 差价。',
    status: 'wait', queue: '', result: '—', duty: '', auditRemark: '', auditor: '', auditTime: '',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261117017', orderNo: 'JD20261117005', channel: '京东',
    applyType: '更改地址', type: '更改地址', reason: '收货地址填错', proofs: [],
    applyTime: '2026-11-17 16:10', sla: offsetH(-20), logistics: '运输中',
    expressNo: 'YZ7788112233', goods: '星野收纳箱 大号 ×2', sku: 'SKU-400011', qty: 2,
    orderTime: '2026-11-17 09:30', orderAmount: 528, amount: 0,
    customer: C('唐**', '135****9908', '重庆市渝北区 ******'),
    message: '地址选成旧家了，件还在路上，麻烦改到公司地址。',
    status: 'wait', queue: '', result: '—', duty: '', auditRemark: '', auditor: '', auditTime: '',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261117018', orderNo: 'XC20261116004', channel: '小程序',
    applyType: '换货', type: '换货', reason: '外盒破损', proofs: ['外盒压痕.jpg', '内件完好.jpg'],
    applyTime: '2026-11-17 10:35', sla: offsetH(22), logistics: '已签收',
    expressNo: 'SF3344551177', goods: '兰蔻小黑瓶 30ml ×1', sku: 'SKU-100188', qty: 1,
    orderTime: '2026-11-15 18:50', orderAmount: 899, amount: 0,
    customer: C('贺**', '136****7782', '辽宁省大连市中山区 ******'),
    message: '外盒被压扁了，精华液没漏，但送人的，想换一盒完好包装的。',
    status: 'wait', queue: '', result: '—', duty: '', auditRemark: '', auditor: '', auditTime: '',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },

  /* ===== 处理中（七个队列：待退回 / 在途 / 待质检 / 待退款 / 待换货 / 待补发 / 地址变更） ===== */
  {
    ticket: 'AS20261114004', orderNo: 'JD20261115013', channel: '京东',
    applyType: '换货', type: '换货', reason: '规格不符', proofs: ['实物对比.jpg'],
    applyTime: '2026-11-14 11:00', sla: '2026-11-16 11:00', logistics: '运输中',
    expressNo: 'YZ5566778899', goods: '兰蔻小黑瓶 30ml ×1', sku: 'SKU-100188', qty: 1,
    orderTime: '2026-11-13 21:40', orderAmount: 899, amount: 0,
    customer: C('周**', '136****4417', '浙江省杭州市拱墅区 ******'),
    message: '要的是 30ml，收到的是 50ml，差价我不补。',
    status: 'doing', queue: 'exchange', result: '同意', duty: '仓库错发',
    auditRemark: '按错发换货处理，无需客户承担运费', auditor: '张丽珊', auditTime: '2026-11-14 15:20',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261113005', orderNo: 'TM20261112009', channel: '天猫',
    applyType: '退货退款', type: '退货', reason: '不喜欢', proofs: ['商品实拍.jpg'],
    applyTime: '2026-11-13 10:15', sla: '2026-11-16 10:15', logistics: '退回在途',
    expressNo: 'ZT1122334455', goods: '雅诗兰黛小棕瓶 50ml ×2', sku: 'SKU-100231', qty: 2,
    orderTime: '2026-11-12 18:12', orderAmount: 2340, amount: 2340,
    customer: C('吴**', '138****7783', '上海市浦东新区 ******'),
    message: '买多了，未拆封，想退掉。',
    status: 'doing', queue: 'transit', result: '同意', duty: '客户原因',
    auditRemark: '未拆封，同意退货，运费客户承担', auditor: '张丽珊', auditTime: '2026-11-13 11:40',
    who: '', finishedAt: '', workOrder: 'TH20261113001', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261112006', orderNo: 'XC20261110002', channel: '小程序',
    applyType: '仅退款', type: '仅退款', reason: '商品质量问题', proofs: ['燃烧发黑.jpg', '开箱.mp4'],
    applyTime: '2026-11-12 09:00', sla: '2026-11-16 09:00', logistics: '已签收',
    expressNo: 'SF9988776655', goods: '星野香薰蜡烛 ×1', sku: 'SKU-300052', qty: 1,
    orderTime: '2026-11-10 11:00', orderAmount: 76, amount: 76,
    customer: C('孙**', '139****5521', '浙江省宁波市鄞州区 ******'),
    message: '点燃后冒黑烟，烛芯有异味，不敢用了。',
    status: 'done', queue: '', result: '同意', duty: '商品质量',
    auditRemark: '质量问题，无需寄回，直接退款', auditor: '张丽珊', auditTime: '2026-11-12 10:30',
    who: '张丽珊', finishedAt: '2026-11-12 10:35', workOrder: '', refundWay: '原路退回', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261111009', orderNo: 'TM20261109004', channel: '天猫',
    applyType: '退货退款', type: '退货', reason: '尺码不符', proofs: ['尺码标.jpg'],
    applyTime: '2026-11-11 16:40', sla: '2026-11-14 16:40', logistics: '退回已到仓',
    expressNo: 'ZT6655443322', goods: '星野纯棉四件套 ×1', sku: 'SKU-200118', qty: 1,
    orderTime: '2026-11-09 14:05', orderAmount: 359, amount: 359,
    customer: C('马**', '135****8834', '四川省成都市武侯区 ******'),
    message: '床品尺寸拍错了，已经寄回，单号 ZT6655443322。',
    status: 'doing', queue: 'qc', result: '同意', duty: '客户原因',
    auditRemark: '同意退货，客户已寄回，运费客户承担', auditor: '张丽珊', auditTime: '2026-11-11 17:30',
    who: '', finishedAt: '', workOrder: 'TH20261111002', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261108010', orderNo: 'JD20261106003', channel: '京东',
    applyType: '退货退款', type: '退货', reason: '商品瑕疵', proofs: ['划痕特写.jpg'],
    applyTime: '2026-11-08 10:05', sla: '2026-11-11 10:05', logistics: '已签收',
    expressNo: 'YZ1122998877', goods: '兰蔻小黑瓶 30ml ×1', sku: 'SKU-100188', qty: 1,
    orderTime: '2026-11-06 20:15', orderAmount: 899, amount: 899,
    customer: C('黄**', '137****6109', '湖北省武汉市洪山区 ******'),
    message: '瓶身有明显划痕，要求退货退款。',
    status: 'doing', queue: 'back', result: '同意', duty: '商品质量',
    auditRemark: '已生成退回地址，等待客户寄回', auditor: '张丽珊', auditTime: '2026-11-08 11:20',
    who: '', finishedAt: '', workOrder: 'TH20261108003', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261110014', orderNo: 'XC20261108001', channel: '小程序',
    applyType: '补发', type: '补发', reason: '漏发', proofs: ['开箱视频.mp4', '清单.jpg'],
    applyTime: '2026-11-10 13:25', sla: '2026-11-12 13:25', logistics: '已签收',
    expressNo: 'SF2233445566', goods: '星野香薰礼盒 ×2', sku: 'SKU-300045', qty: 2,
    orderTime: '2026-11-08 15:40', orderAmount: 398, amount: 0,
    customer: C('邓**', '138****9931', '福建省厦门市思明区 ******'),
    message: '两套礼盒都少了一个蜡烛，需要补发 2 个。',
    status: 'doing', queue: 'resend', result: '同意', duty: '仓库错发',
    auditRemark: '同意补发 2 件，待仓库确认库存', auditor: '张丽珊', auditTime: '2026-11-10 14:10',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },

  {
    ticket: 'AS20261115019', orderNo: 'TM20261114015', channel: '天猫',
    applyType: '退货退款', type: '退货', reason: '商品破损', proofs: ['蜡烛碎裂.jpg', '外箱.jpg'],
    applyTime: '2026-11-15 11:20', sla: '2026-11-18 11:20', logistics: '已签收',
    expressNo: 'ZT2200334455', goods: '星野香薰蜡烛 ×1', sku: 'SKU-300052', qty: 1,
    orderTime: '2026-11-13 15:40', orderAmount: 76, amount: 76,
    customer: C('孔**', '139****3374', '安徽省合肥市蜀山区 ******'),
    message: '蜡烛碎了一支，才 70 多块，不用寄回了，直接退吧。',
    status: 'doing', queue: 'refund', result: '同意', duty: '物流破损',
    auditRemark: '货值低，免寄回，同意直接退款', auditor: '张丽珊', auditTime: '2026-11-15 13:50',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  },

  {
    ticket: 'AS20261118020', orderNo: 'DY20261117018', channel: '抖音',
    applyType: '更改地址', type: '更改地址', reason: '收货地址填错', proofs: ['新地址截图.jpg'],
    applyTime: '2026-11-18 09:20', sla: offsetH(6), logistics: '运输中',
    expressNo: 'ZT9900112233', goods: '星野收纳箱 大号 ×1', sku: 'SKU-400011', qty: 1,
    orderTime: '2026-11-17 19:05', orderAmount: 264, amount: 0,
    customer: C('袁**', '136****2215', '江苏省南京市建邺区 ******'),
    message: '刚下单地址选成家里了，件还在路上，麻烦改到公司地址。',
    status: 'doing', queue: 'address', result: '同意', duty: '客户原因',
    auditRemark: '同意改址，需同步至承运商改派后再完结', auditor: '张丽珊', auditTime: '2026-11-18 10:05',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '待同步至订单与承运商', syncTime: '', repeat: false
  },

  /* ===== 处理完成 ===== */
  {
    ticket: 'AS20261110007', orderNo: 'TM20261108021', channel: '天猫',
    applyType: '退货退款', type: '退货', reason: '商品破损', proofs: ['破损.jpg'],
    applyTime: '2026-11-10 15:20', sla: '2026-11-13 15:20', logistics: '已签收',
    expressNo: 'ZT5544332211', goods: '雅诗兰黛小棕瓶 50ml ×1', sku: 'SKU-100231', qty: 1,
    orderTime: '2026-11-08 09:30', orderAmount: 1080, amount: 1080,
    customer: C('刘**', '138****2205', '浙江省杭州市西湖区 ******'),
    message: '外包装完好但瓶子碎了。',
    status: 'done', queue: '', result: '同意', duty: '物流破损',
    auditRemark: '物流破损，全额退款，已生成退货单', auditor: '张丽珊', auditTime: '2026-11-10 16:10',
    who: '张丽珊', finishedAt: '2026-11-13 09:42', workOrder: 'TH20261110004',
    refundWay: '原路退回', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261109008', orderNo: 'DY20261107015', channel: '抖音',
    applyType: '补差价', type: '补差价', reason: '降价补差', proofs: ['降价截图.jpg'],
    applyTime: '2026-11-09 10:00', sla: '2026-11-12 10:00', logistics: '已签收',
    expressNo: 'YT1234567890', goods: '星野纯棉四件套 ×1', sku: 'SKU-200118', qty: 1,
    orderTime: '2026-11-07 14:00', orderAmount: 359, amount: 30,
    customer: C('王**', '136****3390', '北京市朝阳区 ******'),
    message: '刚买完就降价 30 元，申请补差。',
    status: 'done', queue: '', result: '同意', duty: '价格原因',
    auditRemark: '符合 7 天价保，退差价 30 元', auditor: '张丽珊', auditTime: '2026-11-09 11:05',
    who: '张丽珊', finishedAt: '2026-11-09 15:20', workOrder: '',
    refundWay: '退至余额', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261107011', orderNo: 'DY20261105009', channel: '抖音',
    applyType: '更改地址', type: '更改地址', reason: '收货地址填错', proofs: [],
    applyTime: '2026-11-07 09:35', sla: '2026-11-08 09:35', logistics: '待签收',
    expressNo: 'YT6655001122', goods: '星野收纳箱 大号 ×1', sku: 'SKU-400011', qty: 1,
    orderTime: '2026-11-05 19:40', orderAmount: 264, amount: 0,
    customer: C('许**', '135****4472', '江苏省苏州市吴中区 ******'),
    message: '地址写成了公司，想改到家里。',
    status: 'done', queue: '', result: '同意', duty: '客户原因',
    auditRemark: '未签收，同意改地址，已同步至订单', auditor: '张丽珊', auditTime: '2026-11-07 10:10',
    who: '张丽珊', finishedAt: '2026-11-07 10:12', workOrder: '',
    refundWay: '', addressSync: '已同步至订单', syncTime: '2026-11-07 10:12', repeat: false
  },
  {
    ticket: 'AS20261106012', orderNo: 'TM20261104007', channel: '天猫',
    applyType: '仅退款', type: '仅退款', reason: '不想要了', proofs: [],
    applyTime: '2026-11-06 14:20', sla: '2026-11-07 14:20', logistics: '已签收',
    expressNo: 'ZT3344556677', goods: '星野香薰蜡烛 ×2', sku: 'SKU-300052', qty: 2,
    orderTime: '2026-11-01 10:10', orderAmount: 152, amount: 0,
    customer: C('冯**', '139****1163', '广东省广州市天河区 ******'),
    message: '已经用了一半，还是想退。',
    status: 'done', queue: '', result: '拒绝', duty: '客户原因',
    auditRemark: '已签收且已使用，不符合仅退款条件，建议改为部分退款', auditor: '张丽珊', auditTime: '2026-11-06 15:05',
    who: '张丽珊', finishedAt: '2026-11-06 15:06', workOrder: '',
    refundWay: '', addressSync: '', syncTime: '', repeat: true
  },
  {
    ticket: 'AS20261105013', orderNo: 'JD20261103008', channel: '京东',
    applyType: '换货', type: '换货', reason: '尺码不符', proofs: ['吊牌.jpg'],
    applyTime: '2026-11-05 11:15', sla: '2026-11-07 11:15', logistics: '已签收',
    expressNo: 'YZ9900112233', goods: '星野纯棉四件套 ×1', sku: 'SKU-200118', qty: 1,
    orderTime: '2026-11-03 16:30', orderAmount: 359, amount: 0,
    customer: C('何**', '137****7745', '陕西省西安市雁塔区 ******'),
    message: '尺寸买大了，想换成 1.5 米。',
    status: 'done', queue: '', result: '同意', duty: '客户原因',
    auditRemark: '同意换货，已生成换货单', auditor: '张丽珊', auditTime: '2026-11-05 12:00',
    who: '张丽珊', finishedAt: '2026-11-06 10:30', workOrder: 'HH20261105-3021',
    refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261114020', orderNo: 'JD20261112021', channel: '京东',
    applyType: '部分仅退款', type: '部分仅退款', reason: '尺码不符', proofs: ['尺码标.jpg', '床品实拍.jpg'],
    applyTime: '2026-11-14 09:50', sla: '2026-11-17 09:50', logistics: '已签收',
    expressNo: 'YZ5566770011', goods: '星野纯棉四件套 ×2', sku: 'SKU-200118', qty: 2,
    orderTime: '2026-11-11 10:20', orderAmount: 718, amount: 359,
    customer: C('曹**', '136****8817', '山东省青岛市市南区 ******'),
    message: '两套都拍错尺寸了，一套没动过，另一套已经下水洗过。',
    status: 'done', queue: '', result: '部分同意', duty: '客户原因',
    auditRemark: '未拆封的一套全额退 359 元；已拆洗的一套不予退款', auditor: '张丽珊', auditTime: '2026-11-15 09:40',
    who: '张丽珊', finishedAt: '2026-11-15 10:05', workOrder: '',
    refundWay: '原路退回', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261113021', orderNo: 'DY20261111018', channel: '抖音',
    applyType: '部分仅退款', type: '部分仅退款', reason: '使用后不满意', proofs: [],
    applyTime: '2026-11-13 14:15', sla: '2026-11-16 14:15', logistics: '已签收',
    expressNo: 'YT9900112266', goods: '星野香薰蜡烛 ×2', sku: 'SKU-300052', qty: 2,
    orderTime: '2026-11-10 20:30', orderAmount: 152, amount: 0,
    customer: C('严**', '138****5513', '江西省南昌市红谷滩区 ******'),
    message: '点了两次觉得味道不合适，想退一半的钱。',
    status: 'done', queue: '', result: '拒绝', duty: '客户原因',
    auditRemark: '已拆封点燃，气味类商品拆封后不支持部分退款', auditor: '张丽珊', auditTime: '2026-11-13 16:40',
    who: '张丽珊', finishedAt: '2026-11-13 16:42', workOrder: '',
    refundWay: '', addressSync: '', syncTime: '', repeat: true
  },
  {
    ticket: 'AS20261112022', orderNo: 'XC20261110007', channel: '小程序',
    applyType: '补差价', type: '补差价', reason: '活动价差', proofs: ['活动海报.jpg', '订单截图.jpg'],
    applyTime: '2026-11-12 11:05', sla: '2026-11-15 11:05', logistics: '已签收',
    expressNo: 'SF7788990033', goods: '星野香薰礼盒 ×1', sku: 'SKU-300045', qty: 1,
    orderTime: '2026-10-28 19:15', orderAmount: 199, amount: 0,
    customer: C('蒋**', '135****2206', '云南省昆明市五华区 ******'),
    message: '双十一活动价 159，我十月底买的，能补 40 差价吗？',
    status: 'done', queue: '', result: '拒绝', duty: '价格原因',
    auditRemark: '下单已超 7 天价保期，不予补差', auditor: '张丽珊', auditTime: '2026-11-12 11:30',
    who: '张丽珊', finishedAt: '2026-11-12 11:32', workOrder: '',
    refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261111023', orderNo: 'TM20261109016', channel: '天猫',
    applyType: '更改地址', type: '更改地址', reason: '收货地址填错', proofs: [],
    applyTime: '2026-11-11 08:40', sla: '2026-11-12 08:40', logistics: '已签收',
    expressNo: 'ZT6611223344', goods: '雅诗兰黛小棕瓶 50ml ×1', sku: 'SKU-100231', qty: 1,
    orderTime: '2026-11-09 12:00', orderAmount: 1286, amount: 0,
    customer: C('尹**', '137****7719', '河南省郑州市金水区 ******'),
    message: '想改到单位地址，下午能送到就行。',
    status: 'done', queue: '', result: '拒绝', duty: '客户原因',
    auditRemark: '快件已于 11-11 07:50 签收，无法改地址，已建议客户自行转寄', auditor: '张丽珊', auditTime: '2026-11-11 09:10',
    who: '张丽珊', finishedAt: '2026-11-11 09:12', workOrder: '',
    refundWay: '', addressSync: '', syncTime: '', repeat: false
  },
  {
    ticket: 'AS20261110024', orderNo: 'XC20261108014', channel: '小程序',
    applyType: '补发', type: '补发', reason: '少件', proofs: ['包裹称重.jpg', '装箱清单.jpg'],
    applyTime: '2026-11-10 16:30', sla: '2026-11-12 16:30', logistics: '已签收',
    expressNo: 'SF1122446688', goods: '兰蔻小黑瓶 30ml ×2', sku: 'SKU-100188', qty: 2,
    orderTime: '2026-11-08 21:10', orderAmount: 1798, amount: 0,
    customer: C('白**', '139****4402', '天津市南开区 ******'),
    message: '两瓶只发了一瓶，少一瓶。',
    status: 'done', queue: '', result: '同意', duty: '仓库错发',
    auditRemark: '核实为仓库漏发，补发 1 瓶，48 小时内出库', auditor: '张丽珊', auditTime: '2026-11-11 09:30',
    who: '张丽珊', finishedAt: '2026-11-12 09:20', workOrder: 'BF20261112-4178',
    refundWay: '', addressSync: '', syncTime: '', repeat: false
  }
])

/* ---------------- 物流轨迹（按售后单号挂载，时间正序） ---------------- */
const COMPANY = [['ZT', '中通快递'], ['SF', '顺丰速运'], ['YT', '圆通速递'], ['YZ', '中国邮政 EMS'], ['JD', '京东物流']]
export const companyOf = no => {
  const p = String(no || '').slice(0, 2).toUpperCase()
  return (COMPANY.find(c => c[0] === p) || [])[1] || '—'
}

export const TRACKS = {
  AS20261116001: {
    from: '上海 · 青浦区', to: '浙江 · 杭州余杭区', updated: '2026-11-16 14:35',
    events: [
      ['2026-11-14 18:42', '已发货', '上海市青浦区', '商家已打包出库，等待中通快递揽收'],
      ['2026-11-14 20:15', '已揽收', '上海青浦华新镇网点', '中通快递已揽收，快递员 王海（138****3092）'],
      ['2026-11-15 01:38', '运输中', '上海转运中心', '快件已到达【上海转运中心】'],
      ['2026-11-15 06:52', '运输中', '上海转运中心', '快件已从【上海转运中心】发出，下一站【杭州转运中心】'],
      ['2026-11-15 21:18', '运输中', '杭州转运中心', '快件已到达【杭州转运中心】'],
      ['2026-11-16 03:40', '运输中', '杭州余杭仓前网点', '快件已到达【杭州余杭仓前网点】，准备安排派送'],
      ['2026-11-16 08:12', '派送中', '杭州市余杭区', '快递员 张伟（138****6621）正在派送，请保持电话畅通'],
      ['2026-11-16 14:32', '已签收', '杭州市余杭区', '快件已签收，签收人：本人。外包装有明显挤压痕迹，客户已拍照留存']
    ]
  },
  AS20261115003: {
    from: '广东 · 深圳南山区', to: '浙江 · 杭州西湖区', updated: '2026-11-15 11:30',
    events: [
      ['2026-11-13 19:05', '已发货', '广东省深圳市南山区', '商家已打包出库，等待顺丰上门揽收'],
      ['2026-11-13 20:30', '已揽收', '深圳南山科技园营业点', '顺丰速运已揽收，快递员 李强（136****7712）'],
      ['2026-11-14 02:10', '运输中', '深圳中转场', '快件已到达【深圳中转场】'],
      ['2026-11-14 09:40', '运输中', '深圳中转场', '快件已发出，下一站【杭州萧山中转场】'],
      ['2026-11-15 04:25', '运输中', '杭州萧山中转场', '快件已到达【杭州萧山中转场】'],
      ['2026-11-15 08:50', '派送中', '杭州市西湖区', '快递员 李强（136****7712）正在派送'],
      ['2026-11-15 11:26', '待签收', '杭州市西湖区', '快递员已联系收件人，约定 11-15 下午送达']
    ]
  },
  AS20261114004: {
    from: '江苏 · 苏州吴江区', to: '浙江 · 杭州拱墅区', updated: '2026-11-18 08:45',
    events: [
      ['2026-11-16 16:20', '已发货', '江苏省苏州市吴江区', '商家已打包出库（超出承诺 48 小时发货时效）'],
      ['2026-11-16 17:45', '已揽收', '苏州吴江盛泽网点', '圆通速递已揽收，快递员 周涛（137****5580）'],
      ['2026-11-16 23:10', '运输中', '苏州转运中心', '快件已到达【苏州转运中心】'],
      ['2026-11-17 05:30', '运输中', '杭州转运中心', '快件已到达【杭州转运中心】'],
      ['2026-11-17 10:05', '运输中', '杭州拱墅祥符网点', '快件已到达【杭州拱墅祥符网点】'],
      ['2026-11-18 08:40', '派送中', '杭州市拱墅区', '快递员 陈明（139****8842）正在派送，请保持电话畅通']
    ]
  },
  AS20261115012: {
    from: '北京 · 大兴区', to: '浙江 · 杭州西湖区', updated: '2026-11-18 07:55',
    events: [
      ['2026-11-14 09:20', '已发货', '北京市大兴区', '商家已打包出库，等待邮政揽收'],
      ['2026-11-14 11:05', '已揽收', '北京大兴亦庄营业部', '中国邮政 EMS 已揽收，快递员 赵鹏（135****2210）'],
      ['2026-11-15 18:40', '运输中', '北京邮件处理中心', '快件已到达【北京邮件处理中心】'],
      ['2026-11-17 03:20', '运输中', '北京邮件处理中心', '快件已发出，下一站【杭州邮件处理中心】'],
      ['2026-11-18 07:50', '运输中', '杭州邮件处理中心', '快件已到达【杭州邮件处理中心】，预计 11-19 送达']
    ]
  },
  AS20261113005: {
    from: '上海 · 浦东新区（客户寄回）', to: '上海 · 青浦区（星野仓）', updated: '2026-11-18 06:20',
    events: [
      ['2026-11-16 10:40', '已揽收', '上海市浦东新区', '退回件已交寄，中通快递已揽收，快递员 王海（138****3092）'],
      ['2026-11-16 18:25', '运输中', '上海转运中心', '快件已到达【上海转运中心】'],
      ['2026-11-17 02:10', '运输中', '上海转运中心', '快件已发出，下一站【上海青浦分拨】'],
      ['2026-11-17 21:35', '运输中', '上海青浦分拨', '快件已到达【上海青浦分拨】'],
      ['2026-11-18 06:15', '运输中', '上海青浦分拨', '快件已到达【上海青浦分拨】，下一站【星野优选上海仓】']
    ]
  },
  AS20261112006: {
    from: '浙江 · 宁波鄞州区', to: '浙江 · 杭州滨江区', updated: '2026-11-11 10:52',
    events: [
      ['2026-11-10 14:10', '已发货', '浙江省宁波市鄞州区', '商家已打包出库，等待顺丰上门揽收'],
      ['2026-11-10 15:30', '已揽收', '宁波鄞州营业点', '顺丰速运已揽收，快递员 何俊（138****6634）'],
      ['2026-11-10 21:05', '运输中', '宁波中转场', '快件已到达【宁波中转场】'],
      ['2026-11-11 05:40', '运输中', '杭州萧山中转场', '快件已到达【杭州萧山中转场】'],
      ['2026-11-11 08:15', '派送中', '杭州市滨江区', '快递员 何俊（138****6634）正在派送'],
      ['2026-11-11 10:48', '已签收', '杭州市滨江区', '快件已签收，签收人：本人']
    ]
  },
  AS20261111009: {
    from: '四川 · 成都武侯区（客户寄回）', to: '江苏 · 苏州（华东主仓）', updated: '2026-11-14 15:10',
    events: [
      ['2026-11-12 09:15', '已揽收', '成都市武侯区', '退回件已交寄，中通快递已揽收'],
      ['2026-11-12 20:40', '运输中', '成都转运中心', '快件已到达【成都转运中心】'],
      ['2026-11-13 18:05', '运输中', '武汉转运中心', '快件已到达【武汉转运中心】'],
      ['2026-11-14 09:30', '运输中', '苏州转运中心', '快件已到达【苏州转运中心】'],
      ['2026-11-14 14:50', '已收货', '星野优选华东主仓', '退回件已入仓，等待仓储部质检（质检结果由 WMS 回传）']
    ]
  },
  AS20261108010: {
    from: '湖北 · 武汉洪山区', to: '江苏 · 苏州（华东主仓）', updated: '2026-11-08 12:05',
    events: [
      ['2026-11-06 20:15', '已发货', '江苏省苏州市吴江区', '商家已打包出库'],
      ['2026-11-07 09:40', '已签收', '武汉市洪山区', '快件已签收，签收人：本人。瓶身有划痕，客户已拍照'],
      ['2026-11-08 11:25', '待客户退回', '武汉市洪山区', '已生成退回地址与退货单 TH20261108003，等待客户寄回']
    ]
  },
  AS20261110007: {
    from: '上海 · 青浦区', to: '浙江 · 杭州西湖区', updated: '2026-11-09 16:24',
    events: [
      ['2026-11-08 13:05', '已发货', '上海市青浦区', '商家已打包出库，等待中通快递揽收'],
      ['2026-11-08 14:30', '已揽收', '上海青浦华新镇网点', '中通快递已揽收，快递员 王海（138****3092）'],
      ['2026-11-08 22:10', '运输中', '上海转运中心', '快件已到达【上海转运中心】'],
      ['2026-11-09 06:35', '运输中', '杭州转运中心', '快件已到达【杭州转运中心】'],
      ['2026-11-09 09:50', '派送中', '杭州市西湖区', '快递员 张伟（138****6621）正在派送'],
      ['2026-11-09 16:20', '已签收', '杭州市西湖区', '快件已签收，签收人：门卫代收。外箱完好，内瓶破碎']
    ]
  },
  AS20261109008: {
    from: '广东 · 广州白云区', to: '湖北 · 武汉洪山区', updated: '2026-11-08 15:45',
    events: [
      ['2026-11-07 17:20', '已发货', '广东省广州市白云区', '商家已打包出库，等待圆通揽收'],
      ['2026-11-07 18:45', '已揽收', '广州白云太和网点', '圆通速递已揽收，快递员 吴斌（137****9931）'],
      ['2026-11-08 02:10', '运输中', '广州转运中心', '快件已到达【广州转运中心】'],
      ['2026-11-08 11:40', '运输中', '武汉转运中心', '快件已到达【武汉转运中心】'],
      ['2026-11-08 14:05', '派送中', '武汉市洪山区', '快递员 吴斌（137****9931）正在派送'],
      ['2026-11-08 15:40', '已签收', '武汉市洪山区', '快件已签收，签收人：本人']
    ]
  },
  AS20261107011: {
    from: '广东 · 广州白云区', to: '江苏 · 苏州吴中区', updated: '2026-11-07 10:10',
    events: [
      ['2026-11-06 10:20', '已发货', '广东省广州市白云区', '商家已打包出库'],
      ['2026-11-06 19:40', '运输中', '广州转运中心', '快件已到达【广州转运中心】'],
      ['2026-11-07 08:30', '运输中', '苏州转运中心', '快件已到达【苏州转运中心】'],
      ['2026-11-07 10:10', '地址变更', '收货地址已更新', '原地址「苏州市工业园区」已替换为「苏州市吴中区」，轨迹终点同步更新']
    ]
  },
  AS20261106012: {
    from: '广东 · 广州白云区', to: '广东 · 广州天河区', updated: '2026-11-05 09:12',
    events: [
      ['2026-11-02 10:40', '已发货', '广东省广州市白云区', '商家已打包出库'],
      ['2026-11-03 15:20', '已签收', '广州市天河区', '快件已签收，签收人：本人']
    ]
  },
  AS20261105013: {
    from: '陕西 · 西安雁塔区', to: '江苏 · 苏州（华东主仓）', updated: '2026-11-06 09:40',
    events: [
      ['2026-11-04 11:20', '已签收', '西安市雁塔区', '快件已签收，签收人：本人'],
      ['2026-11-05 12:10', '换货受理', '西安市雁塔区', '已生成换货单 HH20261105-3021，等待仓库换新发货'],
      ['2026-11-06 09:35', '已换新发货', '星野优选华东主仓', '换新件已出库，圆通速递 YT3322110099']
    ]
  },
  AS20261118015: {
    from: '江苏 · 苏州（华东主仓）', to: '江苏 · 无锡滨湖区', updated: '2026-11-17 16:40',
    events: [
      ['2026-11-16 20:15', '已发货', '江苏省苏州市吴江区', '商家已打包出库，等待中通上门揽收'],
      ['2026-11-16 21:40', '已揽收', '苏州吴江盛泽网点', '中通快递已揽收，快递员 刘洋（137****4410）'],
      ['2026-11-17 03:05', '运输中', '苏州转运中心', '快件已到达【苏州转运中心】'],
      ['2026-11-17 09:20', '运输中', '无锡分拨中心', '快件已到达【无锡分拨中心】'],
      ['2026-11-17 13:05', '派送中', '无锡市滨湖区', '快递员 刘洋（137****4410）正在派送'],
      ['2026-11-17 16:32', '已签收', '无锡市滨湖区', '快件已签收，签收人：本人。外箱一角有挤压，客户当场拍照']
    ]
  },
  AS20261118016: {
    from: '广东 · 广州白云区', to: '湖南 · 长沙岳麓区', updated: '2026-11-17 16:10',
    events: [
      ['2026-11-16 21:35', '已发货', '广东省广州市白云区', '商家已打包出库，抖音仓直发'],
      ['2026-11-16 22:50', '已揽收', '广州白云嘉禾网点', '圆通速递已揽收，快递员 周敏（136****3325）'],
      ['2026-11-17 04:20', '运输中', '广州转运中心', '快件已到达【广州转运中心】'],
      ['2026-11-17 09:50', '运输中', '长沙转运中心', '快件已到达【长沙转运中心】'],
      ['2026-11-17 14:40', '派送中', '长沙市岳麓区', '快递员 周敏（136****3325）正在派送'],
      ['2026-11-17 16:05', '已签收', '长沙市岳麓区', '快件已签收，签收人：本人（家人代收）']
    ]
  },
  AS20261117017: {
    from: '江苏 · 苏州（华东主仓）', to: '重庆 · 渝北区', updated: '2026-11-18 06:10',
    events: [
      ['2026-11-17 11:20', '已发货', '江苏省苏州市吴江区', '商家已打包出库，等待 EMS 揽收'],
      ['2026-11-17 13:00', '已揽收', '苏州吴江营业部', '中国邮政 EMS 已揽收，快递员 赵鹏（135****2210）'],
      ['2026-11-17 22:45', '运输中', '苏州邮件处理中心', '快件已到达【苏州邮件处理中心】'],
      ['2026-11-18 05:10', '运输中', '重庆邮件处理中心', '快件已到达【重庆邮件处理中心】，预计 11-18 下午派送'],
      ['2026-11-18 06:05', '运输中', '重庆渝北投递部', '快件已到达【重庆渝北投递部】，尚未分配快递员，可拦截改址']
    ]
  },
  AS20261117018: {
    from: '江苏 · 苏州（华东主仓）', to: '辽宁 · 大连中山区', updated: '2026-11-17 09:05',
    events: [
      ['2026-11-16 10:30', '已发货', '江苏省苏州市吴江区', '商家已打包出库，等待顺丰上门揽收'],
      ['2026-11-16 11:50', '已揽收', '苏州吴江盛泽网点', '顺丰速运已揽收，快递员 陈明（139****8842）'],
      ['2026-11-16 19:20', '运输中', '无锡硕放航空站', '快件已到达【无锡硕放航空站】，走航空件'],
      ['2026-11-17 06:40', '运输中', '大连周水子航空站', '快件已到达【大连周水子航空站】'],
      ['2026-11-17 08:15', '派送中', '大连市中山区', '快递员 陈明（139****8842）正在派送'],
      ['2026-11-17 09:02', '已签收', '大连市中山区', '快件已签收，签收人：本人。外盒压扁，客户已拍照']
    ]
  },
  AS20261115019: {
    from: '江苏 · 苏州（华东主仓）', to: '安徽 · 合肥蜀山区', updated: '2026-11-15 08:55',
    events: [
      ['2026-11-14 09:40', '已发货', '江苏省苏州市吴江区', '商家已打包出库，等待中通上门揽收'],
      ['2026-11-14 11:15', '已揽收', '苏州吴江盛泽网点', '中通快递已揽收，快递员 王海（138****3092）'],
      ['2026-11-14 23:30', '运输中', '南京转运中心', '快件已到达【南京转运中心】'],
      ['2026-11-15 05:20', '运输中', '合肥分拨中心', '快件已到达【合肥分拨中心】'],
      ['2026-11-15 08:10', '派送中', '合肥市蜀山区', '快递员 王海（138****3092）正在派送'],
      ['2026-11-15 08:52', '已签收', '合肥市蜀山区', '快件已签收，签收人：本人。开箱后反馈蜡烛碎裂']
    ]
  },
  AS20261114020: {
    from: '江苏 · 苏州（华东主仓）', to: '山东 · 青岛南区', updated: '2026-11-13 17:20',
    events: [
      ['2026-11-12 08:50', '已发货', '江苏省苏州市吴江区', '商家已打包出库，等待 EMS 揽收'],
      ['2026-11-12 10:20', '已揽收', '苏州吴江营业部', '中国邮政 EMS 已揽收，快递员 赵鹏（135****2210）'],
      ['2026-11-13 02:35', '运输中', '青岛邮件处理中心', '快件已到达【青岛邮件处理中心】'],
      ['2026-11-13 09:10', '派送中', '青岛市市南区', '快递员 孙磊（135****6628）正在派送'],
      ['2026-11-13 17:15', '已签收', '青岛市市南区', '快件已签收，签收人：前台代收，两件同包裹']
    ]
  },
  AS20261113021: {
    from: '广东 · 广州白云区', to: '江西 · 南昌红谷滩', updated: '2026-11-12 18:30',
    events: [
      ['2026-11-11 09:20', '已发货', '广东省广州市白云区', '商家已打包出库，抖音仓直发'],
      ['2026-11-11 11:05', '已揽收', '广州白云嘉禾网点', '圆通速递已揽收，快递员 周敏（136****3325）'],
      ['2026-11-11 22:50', '运输中', '赣州转运中心', '快件已到达【赣州转运中心】'],
      ['2026-11-12 10:40', '运输中', '南昌分拨中心', '快件已到达【南昌分拨中心】'],
      ['2026-11-12 15:30', '派送中', '南昌市红谷滩区', '快递员 周敏（136****3325）正在派送'],
      ['2026-11-12 18:25', '已签收', '南昌市红谷滩区', '快件已签收，签收人：本人']
    ]
  },
  AS20261112022: {
    from: '广东 · 广州白云区', to: '云南 · 昆明五华区', updated: '2026-11-01 17:40',
    events: [
      ['2026-10-29 10:10', '已发货', '广东省广州市白云区', '商家已打包出库，等待顺丰上门揽收'],
      ['2026-10-29 12:00', '已揽收', '广州白云嘉禾网点', '顺丰速运已揽收，快递员 何俊（138****6634）'],
      ['2026-10-30 20:15', '运输中', '昆明转运中心', '快件已到达【昆明转运中心】'],
      ['2026-11-01 09:30', '派送中', '昆明市五华区', '快递员 何俊（138****6634）正在派送'],
      ['2026-11-01 17:35', '已签收', '昆明市五华区', '快件已签收，签收人：本人']
    ]
  },
  AS20261111023: {
    from: '江苏 · 苏州（华东主仓）', to: '河南 · 郑州金水区', updated: '2026-11-11 07:52',
    events: [
      ['2026-11-09 14:20', '已发货', '江苏省苏州市吴江区', '商家已打包出库，等待中通上门揽收'],
      ['2026-11-09 16:05', '已揽收', '苏州吴江盛泽网点', '中通快递已揽收，快递员 刘洋（137****4410）'],
      ['2026-11-10 08:40', '运输中', '郑州转运中心', '快件已到达【郑州转运中心】'],
      ['2026-11-11 06:30', '派送中', '郑州市金水区', '快递员 刘洋（137****4410）正在派送'],
      ['2026-11-11 07:48', '已签收', '郑州市金水区', '快件已签收，签收人：本人。客户随后申请改地址']
    ]
  },
  AS20261110024: {
    from: '江苏 · 苏州（华东主仓）', to: '天津 · 南开区', updated: '2026-11-12 10:05',
    events: [
      ['2026-11-09 09:30', '已发货', '江苏省苏州市吴江区', '商家已打包出库，等待顺丰上门揽收'],
      ['2026-11-09 11:00', '已揽收', '苏州吴江盛泽网点', '顺丰速运已揽收，快递员 陈明（139****8842）'],
      ['2026-11-10 07:20', '运输中', '天津转运中心', '快件已到达【天津转运中心】'],
      ['2026-11-10 13:40', '派送中', '天津市南开区', '快递员 陈明（139****8842）正在派送'],
      ['2026-11-10 15:08', '已签收', '天津市南开区', '快件已签收，签收人：本人。客户反馈包裹重量偏轻'],
      ['2026-11-12 09:55', '补发出库', '星野优选华东主仓', '补发单 BF20261112-4178 已出库，顺丰速运 SF8877665544']
    ]
  }
}

/* 无轨迹的单据兜底：按物流状态生成一条 */
export const trackOf = t => {
  const hit = TRACKS[t.ticket]
  if (hit) return hit
  return {
    from: '—', to: t.customer?.addr || '—', updated: t.applyTime,
    events: [[t.applyTime, t.logistics || '已签收', t.customer?.addr || '—', '轨迹数据由承运商官网回传']]
  }
}

/* ---------------- 流转动作 ---------------- */
export const auditTicket = (t, f, who) => {
  t.type = f.type
  t.duty = f.duty
  t.auditRemark = f.remark
  t.auditor = who
  t.auditTime = nowStr()
  t.result = f.result === 'reject' ? '拒绝' : f.result === 'partial' ? '部分同意' : '同意'

  /* 拒绝：任何处理方式都直接完结，不产生后续作业，也不打款 */
  if (f.result === 'reject') {
    t.status = 'done'
    t.queue = ''
    t.amount = 0
    t.refundWay = ''
    t.addressSync = ''
    t.syncTime = ''
    t.who = who
    t.finishedAt = nowStr()
    return 'rejected'
  }
  /* 仅退款 / 部分仅退款 / 补差价：不涉及寄回与仓储作业，同意即按原支付路径打款，直接完结 */
  if (REFUND_ONLY.includes(f.type)) {
    t.amount = Number(f.amount) || 0
    t.status = 'done'
    t.queue = ''
    t.who = who
    t.finishedAt = nowStr()
    t.refundWay = '原路退回（原支付渠道）'
    return 'refunded'
  }
  /* 更改地址：属于「其他处理方式」，同意后先进处理中的「地址变更待生效」，同步完成再完结 */
  if (f.type === '更改地址') {
    t.amount = 0
    t.status = 'doing'
    t.queue = 'address'
    t.who = who
    t.addressSync = '待同步至订单与承运商'
    t.syncTime = ''
    return 'address'
  }
  t.amount = Number(f.amount) || 0
  if (f.type === '退货') {
    t.queue = f.back === 'yes' ? 'back' : 'refund'
    if (f.back === 'yes') t.workOrder = 'TH' + stampStr() + '0' + (Math.floor(Math.random() * 9) + 1)
  } else if (f.type === '换货') {
    t.queue = 'exchange'
  } else if (f.type === '补发') {
    t.queue = 'resend'
  } else {
    t.queue = 'refund'
  }
  t.status = 'doing'
  return t.queue
}

export const confirmRefund = (t, { amount, way, remark }, who) => {
  t.amount = Number(amount) || 0
  t.refundWay = way
  if (remark) t.auditRemark = t.auditRemark ? `${t.auditRemark}；${remark}` : remark
  t.result = '同意'
  t.who = who
  t.finishedAt = nowStr()
  t.status = 'done'
  t.queue = ''
}

/** 处理中：地址变更同步完成 → 完结（不退款） */
export const completeAddress = (t, who) => {
  t.addressSync = '已同步至订单与承运商'
  t.syncTime = nowStr()
  t.amount = 0
  t.refundWay = ''
  t.result = '同意'
  t.who = who
  t.finishedAt = nowStr()
  t.status = 'done'
  t.queue = ''
}

export const workOrderNo = kind => {
  const pre = kind === 'exchange' ? 'HH' : 'BF'
  return pre + stampStr().slice(0, 8) + '-' + String(Math.floor(Math.random() * 9000) + 1000)
}

export const createWorkOrder = (t, kind, wh, who) => {
  t.workOrder = workOrderNo(kind)
  t.workOrderType = kind
  t.workOrderWarehouse = wh
  t.who = who
  t.finishedAt = nowStr()
  t.result = '同意'
  t.status = 'done'
  t.queue = ''
  return t.workOrder
}

/* 进度：返回 { steps, idx, finished } */
export const progressOf = t => {
  if (t.type === '更改地址' || t.applyType === '更改地址') {
    if (t.status === 'done') {
      const rejected = t.result === '拒绝'
      return { steps: ADDR_STEPS, idx: rejected ? 2 : 3, rejected }
    }
    /* doing：审核已过，停留在「地址变更」节点等客服同步 */
    if (t.status === 'doing') return { steps: ADDR_STEPS, idx: 2, rejected: false }
    return { steps: ADDR_STEPS, idx: 1, rejected: false }
  }
  if (t.status === 'wait') return { steps: STEPS, idx: 1, rejected: false }
  if (t.status === 'done') return { steps: STEPS, idx: 5, rejected: false }
  return { steps: STEPS, idx: QUEUE_STEP[t.queue] ?? 1, rejected: false }
}
