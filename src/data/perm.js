/**
 * 全站权限口径（唯一真源）
 * ------------------------------------------------------------------
 * 结构：模块 → 页面 → 操作
 *   · 每个页面下的第一项固定是「查看页面」，相当于该页的只读权限；
 *   · 其余各项是页面内的实际按钮 / 动作。
 *   · 勾了任一操作，页面自动获得查看权；只有查看权 = 只能看不能动。
 *
 * 页面清单与路由一一对应（见 src/router/index.js），操作清单来自各页面
 * 实际存在的按钮，按钮改动时请同步本文件，界面计数一律由 TOTAL_PERMS 推导。
 */
import { posts } from './system'

export const PERM_TREE = [
  {
    id: 'm-dashboard', label: '数据看板', icon: 'DataLine', flat: true,
    children: [
      { id: 'p-dashboard', label: '数据看板', path: '/dashboard', children: [
        { id: 'b-dashboard-view', label: '查看页面' }
      ] }
    ]
  },
  {
    id: 'm-order', label: '订单管理', icon: 'Document',
    children: [
      { id: 'p-order-review', label: '订单审核', path: '/order/review', children: [
        { id: 'b-order-review-view', label: '查看页面' },
        { id: 'b-order-review-create', label: '新建订单' },
        { id: 'b-order-review-audit', label: '审核订单' },
        { id: 'b-order-review-batch', label: '批量审核' },
        { id: 'b-order-review-reject', label: '驳回订单' },
        { id: 'b-order-export', label: '导出订单' }
      ] },
      { id: 'p-order-pending', label: '待发货', path: '/order/pending', children: [
        { id: 'b-order-pending-view', label: '查看页面' },
        { id: 'b-order-pending-outbound', label: '模拟出库回传' },
        { id: 'b-order-export2', label: '导出订单' }
      ] },
      { id: 'p-order-shipped', label: '已发货', path: '/order/shipped', children: [
        { id: 'b-order-shipped-view', label: '查看页面' },
        { id: 'b-order-shipped-receive', label: '确认收货' },
        { id: 'b-order-export3', label: '导出订单' }
      ] },
      { id: 'p-order-done', label: '已完结', path: '/order/done', children: [
        { id: 'b-order-done-view', label: '查看页面' },
        { id: 'b-order-done-aftersale', label: '发起售后' },
        { id: 'b-order-export4', label: '导出订单' }
      ] }
    ]
  },
  {
    id: 'm-purchase', label: '采购管理', icon: 'ShoppingCart',
    children: [
      { id: 'p-purchase', label: '采购订单', path: '/purchase', children: [
        { id: 'b-purchase-view', label: '查看页面' },
        { id: 'b-purchase-create', label: '新建采购单' },
        { id: 'b-purchase-audit', label: '审批采购单' },
        { id: 'b-purchase-inbound', label: '确认入库' },
        { id: 'b-purchase-delete', label: '删除采购单' },
        { id: 'b-purchase-export', label: '导出采购单' }
      ] },
      { id: 'p-purchase-create', label: '新建采购单', path: '/purchase/create', menu: false, children: [
        { id: 'b-purchase-create-view', label: '查看页面' },
        { id: 'b-purchase-create-add', label: '添加货品' },
        { id: 'b-purchase-create-del', label: '删除货品' },
        { id: 'b-purchase-create-submit', label: '提交审核' }
      ] },
      { id: 'p-supplier', label: '供应商管理', path: '/purchase/supplier', children: [
        { id: 'b-supplier-view', label: '查看页面' },
        { id: 'b-supplier-add', label: '添加供应商' },
        { id: 'b-supplier-status', label: '停用 / 复用供应商' },
        { id: 'b-supplier-goods', label: '维护供货货品' }
      ] }
    ]
  },
  {
    id: 'm-inventory', label: '库存管理', icon: 'Box',
    children: [
      { id: 'p-stock', label: '库存记录', path: '/inventory/stock', children: [
        { id: 'b-stock-view', label: '查看页面' },
        { id: 'b-stock-warn', label: '设置库存预警' }
      ] },
      { id: 'p-stocktake', label: '库存盘点', path: '/inventory/stocktake', children: [
        { id: 'b-stocktake-view', label: '查看页面' },
        { id: 'b-stocktake-create', label: '创建盘点任务' },
        { id: 'b-stocktake-add', label: '添加盘点货品' },
        { id: 'b-stocktake-submit', label: '提交盘点结果' }
      ] }
    ]
  },
  {
    id: 'm-aftersale', label: '售后管理', icon: 'Service',
    children: [
      { id: 'p-after-wait', label: '售后待处理', path: '/aftersale/wait', children: [
        { id: 'b-after-wait-view', label: '查看页面' },
        { id: 'b-after-wait-audit', label: '审核售后单' },
        { id: 'b-after-wait-export', label: '导出售后单' }
      ] },
      { id: 'p-after-doing', label: '售后处理中', path: '/aftersale/doing', children: [
        { id: 'b-after-doing-view', label: '查看页面' },
        { id: 'b-after-doing-refund', label: '确认退款' },
        { id: 'b-after-doing-exchange', label: '创建换货单' },
        { id: 'b-after-doing-resend', label: '创建补发单' },
        { id: 'b-after-doing-address', label: '完成改址' }
      ] },
      { id: 'p-after-done', label: '售后处理完成', path: '/aftersale/done', children: [
        { id: 'b-after-done-view', label: '查看页面' },
        { id: 'b-after-done-export', label: '导出售后单' },
        { id: 'b-after-done-copy', label: '复制单据信息' }
      ] }
    ]
  },
  {
    id: 'm-finance', label: '财务管理', icon: 'Money',
    children: [
      { id: 'p-fin-recon', label: '对账中心', path: '/finance/reconciliation', children: [
        { id: 'b-fin-recon-view', label: '查看页面' },
        { id: 'b-fin-recon-query', label: '查询对账' },
        { id: 'b-fin-recon-check', label: '核对账单' },
        { id: 'b-fin-recon-export', label: '导出对账单' }
      ] },
      { id: 'p-fin-shipment', label: '发货数据', path: '/finance/shipment', children: [
        { id: 'b-fin-shipment-view', label: '查看页面' },
        { id: 'b-fin-shipment-query', label: '查询发货数据' },
        { id: 'b-fin-shipment-export', label: '导出发货数据' }
      ] },
      { id: 'p-fin-goods', label: '商品信息', path: '/finance/goods', children: [
        { id: 'b-fin-goods-view', label: '查看页面' }
      ] },
      { id: 'p-fin-aging', label: '库存积压', path: '/finance/aging', children: [
        { id: 'b-fin-aging-view', label: '查看页面' }
      ] },
      { id: 'p-fin-payable', label: '应付账款台账', path: '/finance/payable', children: [
        { id: 'b-fin-payable-view', label: '查看页面' },
        { id: 'b-fin-payable-query', label: '查询应付台账' },
        { id: 'b-fin-payable-audit', label: '审核应付单' },
        { id: 'b-fin-payable-confirm', label: '确认应付' },
        { id: 'b-fin-payable-export', label: '导出应付台账' }
      ] }
    ]
  },
  {
    id: 'm-system', label: '系统设置', icon: 'Setting',
    children: [
      { id: 'p-sys-post', label: '职位管理', path: '/system/post', children: [
        { id: 'b-sys-post-view', label: '查看页面' },
        { id: 'b-sys-post-create', label: '新建职位' },
        { id: 'b-sys-post-edit', label: '编辑职位' },
        { id: 'b-sys-post-perm', label: '分配职位权限' },
        { id: 'b-sys-post-delete', label: '删除职位' },
        { id: 'b-sys-post-staff', label: '查看职位人员' },
        { id: 'b-sys-post-export', label: '导出职位' }
      ] },
      { id: 'p-sys-account', label: '账号管理', path: '/system/account', children: [
        { id: 'b-sys-account-view', label: '查看页面' },
        { id: 'b-sys-account-create', label: '新建账号' },
        { id: 'b-sys-account-edit', label: '编辑账号' },
        { id: 'b-sys-account-reset', label: '重置密码' },
        { id: 'b-sys-account-delete', label: '删除账号' },
        { id: 'b-sys-account-export', label: '导出账号' }
      ] },
      { id: 'p-sys-perm', label: '权限管理', path: '/system/permission', children: [
        { id: 'b-sys-perm-view', label: '查看页面' },
        { id: 'b-sys-perm-save', label: '保存权限分配' },
        { id: 'b-sys-perm-restore', label: '恢复默认权限' }
      ] },
      { id: 'p-sys-wh', label: '发货仓设置', path: '/system/warehouse', children: [
        { id: 'b-sys-wh-view', label: '查看页面' },
        { id: 'b-sys-wh-edit', label: '编辑仓库' },
        { id: 'b-sys-wh-export', label: '导出仓库' }
      ] }
    ]
  }
]

/* ---------------- 派生索引 ---------------- */
export const MODULES = PERM_TREE
export const PAGES = PERM_TREE.flatMap(m => m.children)
export const ALL_BUTTON_IDS = PAGES.flatMap(p => p.children.map(o => o.id))
export const TOTAL_PERMS = ALL_BUTTON_IDS.length

/** 路由路径 → 页面节点 */
export const PAGE_BY_PATH = Object.fromEntries(PAGES.filter(p => p.path).map(p => [p.path, p]))
/** 页面节点 id → 页面节点 */
export const PAGE_BY_ID = Object.fromEntries(PAGES.map(p => [p.id, p]))
/** 操作 id → 所属页面 */
export const PAGE_OF_OP = (() => {
  const m = {}
  PAGES.forEach(p => p.children.forEach(o => { m[o.id] = p }))
  return m
})()

/** 页面的「查看」操作 id */
export const viewIdOf = path => PAGE_BY_PATH[path]?.children[0]?.id || ''
/** 页面是否可见 */
export const canView = (perms, path) => {
  const id = viewIdOf(path)
  return !!id && (perms || []).includes(id)
}
/** 某个操作是否可用 */
export const canDo = (perms, opId) => (perms || []).includes(opId)
/** 页面是否「可操作」（除查看外还有任一操作被勾选） */
export const canOperate = (perms, page) => page.children.slice(1).some(o => canDo(perms, o.id))

/* ---------------- 当前账号权限 ---------------- */
const KNOWN = new Set(ALL_BUTTON_IDS)
const singleViewIds = () => PAGES.map(p => p.children[0].id)

/**
 * 职位默认权限：按职位名称 / 部门关键字推导。
 * 原则：只给该职位职责范围内的页面，且「给了操作一定连带其页面查看权」；
 * 不做「默认全站可看」，否则权限就失去意义。
 */
export function defaultsFor(post) {
  const n = `${post?.name || ''}${post?.dept || ''}`
  if (/老板|总经理|管理层|总监/.test(n)) return [...ALL_BUTTON_IDS]
  /* 全局演示职位：会议演示用，开放全部页面与操作 */
  if (/演示/.test(n)) return [...ALL_BUTTON_IDS]

  const ids = new Set()
  const op = id => {
    const page = PAGE_OF_OP[id]
    if (page) ids.add(page.children[0].id)
    ids.add(id)
  }
  const pageAll = key => {
    const p = PAGES.find(x => x.id === `p-${key}`)
    if (p) p.children.forEach(c => ids.add(c.id))
  }
  const pageView = key => {
    const p = PAGES.find(x => x.id === `p-${key}`)
    if (p) ids.add(p.children[0].id)
  }

  if (/财务/.test(n)) {
    pageAll('fin-recon'); pageAll('fin-shipment'); pageAll('fin-payable')
    pageView('fin-goods'); pageView('fin-aging')
    pageView('order-done'); pageView('purchase')
  } else if (/仓|物流/.test(n)) {
    pageAll('stock'); pageAll('stocktake')
    pageView('order-pending'); op('b-order-pending-outbound')
    pageView('purchase'); op('b-purchase-inbound')
    pageView('sys-wh')
  } else if (/售后|客服/.test(n)) {
    pageAll('after-wait'); pageAll('after-doing'); pageAll('after-done')
    pageView('order-done'); op('b-order-done-aftersale')
    pageView('order-review')
  } else if (/采购|供应/.test(n)) {
    pageAll('purchase'); pageAll('purchase-create'); pageAll('supplier')
    pageView('stock'); pageView('fin-payable')
  } else if (/运营|电商/.test(n)) {
    pageView('dashboard')
    pageAll('order-review'); pageAll('order-pending')
    pageAll('order-shipped'); pageAll('order-done')
    pageView('after-wait'); pageView('stock')
    pageView('fin-goods'); pageView('fin-aging')
  } else if (/系统|管理员|IT/.test(n)) {
    pageView('dashboard')
    pageAll('sys-post'); pageAll('sys-account'); pageAll('sys-perm'); pageAll('sys-wh')
  } else {
    pageView('dashboard')
  }
  return [...ids]
}

/**
 * 修正历史遗留的权限 id，并优先恢复「保存分配」过的结果。
 * 顺序：本地已保存 → 职位自带权限（过滤旧 id）→ 按职位推导默认值。
 */
const STORE_KEY = 'xy_erp_post_perms'

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}
  } catch (e) {
    return {}
  }
}

/**
 * 把当前各职位权限写回本地，刷新 / 重新登录后仍生效。
 * 键优先用职位唯一 id（post-xxx）：跨部门同名职位（如两个「运营」）若按名称存，
 * 后保存的会把前一个覆盖掉（BUG-02）。名称键仅在全局唯一时额外写一份，
 * 兼容旧快照与按名称排查的脚本。
 */
export function savePermsToStorage() {
  const map = {}
  const nameCount = {}
  posts.forEach(p => { nameCount[p.name] = (nameCount[p.name] || 0) + 1 })
  posts.forEach(p => {
    const perms = [...(p.perms || [])]
    if (p.id) map[p.id] = perms
    if (nameCount[p.name] === 1) map[p.name] = perms
  })
  try { localStorage.setItem(STORE_KEY, JSON.stringify(map)) } catch (e) { /* 隐私模式忽略 */ }
}

export function ensurePostPerms() {
  const saved = readSaved()
  posts.forEach(p => {
    /* 先按职位 id；旧快照只有名称键，再退回名称（同名职位不会命中唯一的名称键） */
    const s = Array.isArray(saved[p.id]) ? saved[p.id] : saved[p.name]
    if (Array.isArray(s)) {
      const clean = s.filter(id => KNOWN.has(id))
      if (clean.length) { p.perms = clean; return }
    }
    const arr = p.perms || []
    const hasStale = arr.some(id => !KNOWN.has(id))
    if (!arr.length || hasStale) p.perms = defaultsFor(p)
  })
}

/**
 * 某职位名对应的权限数组（当前登录人用）
 * 容错匹配：先按名称精确匹配，再按包含关系、部门匹配；都匹配不到时
 * 退回全量权限并告警，避免演示环境因职位名不一致把所有人锁在门外。
 */
export function permsOfPostName(name) {
  if (!name) return ALL_BUTTON_IDS
  let hit = posts.find(x => x.name === name)
  if (!hit) hit = posts.find(x => x.name.includes(name) || name.includes(x.name))
  if (!hit) hit = posts.find(x => x.dept && x.dept.includes(name))
  if (!hit) {
    console.warn(`[perm] 未找到职位「${name}」，暂按全量权限处理`)
    return ALL_BUTTON_IDS
  }
  return hit.perms || []
}

/** 允许进入的第一个页面路径（用于无权限时兜底跳转） */
export function firstAllowedPath(perms) {
  const hit = PAGES.find(p => p.path && canView(perms, p.path))
  return hit ? hit.path : ''
}
