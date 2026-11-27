import { watch } from 'vue'
import { useOrderStore } from '@/stores/order'
import { purchaseOrders } from '@/data/purchase'
import { stockRows } from '@/data/stock'
import { applySkuMaster } from '@/data/sku'
import { tickets } from '@/data/aftersale'
import { accounts, postName, deptOfAccount } from '@/data/system'
import { ACCOUNTS } from '@/stores/user'

/**
 * 数据库同步层
 * ---------------------------------------------------------------
 * 启动：GET /api/bootstrap → 用库里的数据替换前端数组
 * 变更：监听四个集合 → 防抖 900ms → PUT /api/bootstrap（整表快照）
 *
 * 原型阶段用「整表快照」而不是逐条 CRUD：改动点集中在数据层，
 * 不用在十几个 store 动作里各插一次接口调用。接入正式后端时，
 * 把 pushSnapshot() 换成对应的增量接口即可。
 */
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

const PWD_KEY = 'xy_erp_pwd_map'
const readPwdMap = () => {
  try { return JSON.parse(localStorage.getItem(PWD_KEY) || '{}') } catch (e) { return {} }
}

export const replaceAll = (target, list) => {
  target.splice(0, target.length, ...(Array.isArray(list) ? list : []))
}

const request = async (path, options = {}) => {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    let msg = `接口 ${path} 返回 ${res.status}`
    try { const j = await res.json(); if (j && j.msg) msg = j.msg } catch (e) { /* ignore */ }
    throw new Error(msg)
  }
  return res.json()
}

const pwdOf = account => {
  const map = readPwdMap()
  if (map[account]) return map[account]
  return ACCOUNTS.find(a => a.account === account)?.password || 'Xy@2026'
}

function snapshot(pinia) {
  const O = useOrderStore(pinia)
  return {
    orders: O.orders,
    purchase: purchaseOrders,
    stock: stockRows,
    aftersales: tickets,
    users: accounts.map(a => ({
      account: a.account,
      password: pwdOf(a.account),
      name: a.name,
      post: postName(a.postId),
      dept: deptOfAccount(a),
      phone: a.phone,
      status: a.status,
      lastLogin: a.lastLogin
    }))
  }
}

let hydrating = false

/** 启动时从数据库加载；库空则把前端种子灌进去 */
export async function loadFromDb(pinia) {
  const { data } = await request('/api/bootstrap')
  const empty = !data.orders?.length && !data.purchase?.length && !data.stock?.length && !data.aftersales?.length

  if (empty) {
    /* 灌种子前也按主数据回填一遍，避免种子里各写一份导致基础信息不一致 */
    const O0 = useOrderStore(pinia)
    O0.orders.forEach(o => (o.goods || []).forEach(g => applySkuMaster(g, 'sku')))
    purchaseOrders.forEach(p => (p.items || []).forEach(i => applySkuMaster(i, 'code')))
    stockRows.forEach(r => applySkuMaster(r, 'code'))
    const stat = await request('/api/bootstrap', { method: 'PUT', body: JSON.stringify(snapshot(pinia)) })
    console.info('[db] 首次启动，已写入初始数据', stat)
    return { seeded: true, ...stat }
  }

  hydrating = true
  const O = useOrderStore(pinia)
  /* 商品基础信息以主数据为准：订单明细与采购明细上的名称/规格/单位一律按 code 回填 */
  ;(data.orders || []).forEach(o => (o.goods || []).forEach(g => applySkuMaster(g, 'sku')))
  ;(data.purchase || []).forEach(p => (p.items || []).forEach(i => applySkuMaster(i, 'code')))
  ;(data.stock || []).forEach(r => applySkuMaster(r, 'code'))
  replaceAll(O.orders, data.orders)
  replaceAll(purchaseOrders, data.purchase)
  replaceAll(stockRows, data.stock)
  replaceAll(tickets, data.aftersales)

  if (data.users?.length) {
    const POST_ID_BY_NAME = { 老板: 'post-boss', 运营: 'post-ops', 采购: 'post-buy', 仓管: 'post-wh', 售后: 'post-after', 财务: 'post-fin' }
    replaceAll(accounts, data.users.map((u, i) => ({
      id: 'acc-db-' + (i + 1),
      name: u.name,
      account: u.account,
      phone: u.phone,
      postId: POST_ID_BY_NAME[u.post] || '',
      status: u.status || '启用',
      lastLogin: u.lastLogin || '',
      remark: ''
    })))
  }
  hydrating = false
  return { seeded: false, orders: data.orders.length, purchase: data.purchase.length, stock: data.stock.length, aftersales: data.aftersales.length }
}

/** 变更后自动落库 */
export function setupAutoSave(pinia) {
  let timer = null
  let lastJson = ''

  const push = () => {
    if (hydrating) return
    const body = JSON.stringify(snapshot(pinia))
    if (body === lastJson) return
    lastJson = body
    request('/api/bootstrap', { method: 'PUT', body })
      .then(() => console.debug('[db] 已保存'))
      .catch(e => console.error('[db] 保存失败：', e.message))
  }

  const debounce = () => {
    if (hydrating) return
    clearTimeout(timer)
    timer = setTimeout(push, 900)
  }

  const O = useOrderStore(pinia)
  watch(() => O.orders, debounce, { deep: true })
  watch(purchaseOrders, debounce, { deep: true })
  watch(stockRows, debounce, { deep: true })
  watch(tickets, debounce, { deep: true })
}

export { BASE as API_BASE }
