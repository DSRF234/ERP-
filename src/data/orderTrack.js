/**
 * 订单物流轨迹（演示数据）
 * ------------------------------------------------------------------
 * 真实环境应由 WMS / 承运商官网回传；当前系统没有对接，这里按
 * 发货仓城市、收货地址与发货时间生成确定性的模拟轨迹：
 *   · 已发货：只展示发货时间点之后已经发生的节点；
 *   · 已完结：补上签收节点（优先用确认收货时间）。
 * 待审核 / 待发货订单没有运单号，不生成轨迹。
 */

const CITY = {
  '华东主仓': { city: '上海', area: '上海 · 青浦区' },
  '华南仓': { city: '广州', area: '广州 · 白云区' },
  '平台仓1': { city: '杭州', area: '杭州 · 余杭区' },
  '平台仓2': { city: '北京', area: '北京 · 朝阳区' }
}

const pad = n => String(n).padStart(2, '0')

function parseTime(str) {
  const m = String(str || '').match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (!m) return null
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
}

function addHours(date, h) {
  const d = new Date(date.getTime() + h * 3600000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 从收货地址里取目的地城市，取不到时退化为地址前 8 个字 */
function destOf(address) {
  const s = String(address || '')
  const hit = s.match(/([\u4e00-\u9fa5]{2,6})市/)
  return hit ? hit[1] : (s.slice(0, 8) || '收货地')
}

/**
 * @param {object} order 订单（需含 warehouse / address / carrier / shippedAt / status）
 * @returns {{from:string,to:string,updated:string,events:Array<{time:string,state:string,place:string,desc:string}>}}
 */
export function orderTrackOf(order) {
  const from = CITY[order?.warehouse] || { city: '发货仓', area: order?.warehouse || '发货仓' }
  const to = destOf(order?.address)
  const carrier = order?.carrier || '快递'
  const sameCity = from.city === to
  const nextHub = sameCity ? `${to}分拨中心` : `${to}转运中心`
  const base = parseTime(order?.shippedAt) || parseTime(order?.payTime) || new Date()
  const now = new Date()
  const elapsed = (now.getTime() - base.getTime()) / 3600000

  const planned = [
    { at: 0, state: '已发货', place: from.area, desc: `商家已打包出库，等待${carrier}快递揽收` },
    { at: 2, state: '已揽收', place: `${from.city} · 揽收网点`, desc: `${carrier}快递已揽收，快递员 王海（138****3092）` },
    { at: 8, state: '运输中', place: `${from.city}转运中心`, desc: `快件已到达【${from.city}转运中心】` },
    { at: 18, state: '运输中', place: nextHub, desc: `快件已从【${from.city}转运中心】发出，下一站【${nextHub}】` },
    { at: 26, state: '派送中', place: to, desc: '快递员 张伟（138****6621）正在派送，请保持电话畅通' },
    { at: 30, state: '已签收', place: to, desc: '快件已签收，签收人：本人。如有问题请联系商家售后' }
  ]

  // 只有已完结订单才可能出现「已签收」节点，避免已发货订单提前显示签收
  const signed = planned[planned.length - 1]
  const events = planned.slice(0, -1).filter(e => e.at <= elapsed)
  if (!events.length) events.push(planned[0])
  if (order?.status === 'done') events.push(signed)

  const list = events.map(e => ({
    time: e.state === '已签收'
      ? (order?.doneAt || addHours(base, e.at))
      : addHours(base, e.at),
    state: e.state,
    place: e.place,
    desc: e.desc
  }))

  return {
    from: from.area,
    to,
    updated: list[list.length - 1]?.time || addHours(base, 0),
    events: list.reverse()
  }
}
