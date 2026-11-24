/**
 * 本地持久化工具
 * ------------------------------------------------------------------
 * 原型没有后端，但「提交后列表看不到」「入库库存不变」这类问题
 * 本质是各页面各存一份内存数据。这里统一用 localStorage 落盘：
 *   · 刷新、换标签页、重新登录后数据都还在；
 *   · 通过 storage 事件让其它标签页同步（并发审批那道用例靠它）。
 * 版本号进 key，改数据结构时 +1 即可丢弃旧数据。
 */
export const KEY = {
  supplier: 'xy_erp_supplier_v3',
  purchase: 'xy_erp_purchase_v3',
  inventory: 'xy_erp_inventory_v3',
  stocktake: 'xy_erp_stocktake_v3',
  message: 'xy_erp_message_v3'
}

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return typeof fallback === 'function' ? fallback() : fallback
    const val = JSON.parse(raw)
    return Array.isArray(val) || (val && typeof val === 'object') ? val : fallback
  } catch (e) {
    return typeof fallback === 'function' ? fallback() : fallback
  }
}

export function write(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (e) { /* 隐私模式忽略 */ }
}

/** 把持久化内容整体覆盖回响应式对象/数组（跨标签页同步用） */
export function replaceAll(target, next) {
  if (Array.isArray(target)) {
    target.splice(0, target.length, ...next)
  } else {
    Object.keys(target).forEach(k => { delete target[k] })
    Object.assign(target, next)
  }
}

export function resetAll() {
  Object.values(KEY).forEach(k => { try { localStorage.removeItem(k) } catch (e) {} })
}
