/** 金额：￥1,286.00；空值显示 — */
export function money(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return '—'
  return '￥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 剩余发货时间：已超 / 剩余 / 快超（剩余 < 10 小时预警） */
export function timeLeft(deadline) {
  if (!deadline) return { text: '—', type: 'info' }
  const end = new Date(deadline.replace(/-/g, '/')).getTime()
  const diff = end - Date.now()
  const abs = Math.abs(diff)
  const h = Math.floor(abs / 3600000)
  const m = Math.floor((abs % 3600000) / 60000)
  if (diff < 0) return { text: `已超 ${h}时${m}分`, type: 'danger' }
  if (diff < 10 * 3600000) return { text: `快超 ${h}时${m}分`, type: 'warning' }
  const d = Math.floor(h / 24)
  return { text: d > 0 ? `剩余 ${d}天${h % 24}时${m}分` : `剩余 ${h}时${m}分`, type: 'info' }
}

/** 日期时间：2026-11-16 10:22 */
export function dt(v) {
  if (!v) return '—'
  return String(v).replace('T', ' ').slice(0, 16)
}

/** 相对当前时间生成时间串：offsetHours(-4) = 4 小时前 */
export function offsetHours(h) {
  const d = new Date(Date.now() + h * 3600000)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
