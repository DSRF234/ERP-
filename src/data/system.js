/**
 * 系统设置 · 共享数据层
 * 口径来源：《erpPRD.docx》2.6 系统设置 + 《Map1.pdf》字段清单
 *
 * 职位 → 账号为「一对多」，账号权限完全继承职位，不在账号层单独授权。
 * 权限树共 7 个模块、22 个页面、75 项按钮级权限。
 * （PRD 原定总数 71，按各页面实际按钮清单展开后为 75；界面计数一律由 TOTAL_PERMS 推导，勿再写死数字）
 */
import { reactive } from 'vue'

/* ---------------- 部门 ---------------- */
export const DEPTS = ['管理层', '电商运营部', '采购部', '仓储部', '财务部', '售后部']

/* ---------------- 数据范围 ---------------- */
export const SCOPES = ['全部数据', '本部门及下级', '本部门', '仅本人', '自定义']

/* ---------------- 权限树（模块 → 页面 → 按钮） ---------------- */
const P = (id, label) => ({ id, label })
const PG = (id, label, btns) => ({ id, label, children: btns.map(([bid, blabel]) => P(bid, blabel)) })
const M = (id, label, pages) => ({ id, label, children: pages })

export const PERM_TREE = [
  M('m-order', '订单管理', [
    PG('p-order-review', '订单审核', [
      ['b-order-review-view', '查看'], ['b-order-review-pass', '审核'],
      ['b-order-review-reject', '驳回'], ['b-order-review-edit', '编辑'],
      ['b-order-review-add', '新建订单'], ['b-order-review-export', '导出']
    ]),
    PG('p-order-pending', '待发货', [
      ['b-order-pending-view', '查看'], ['b-order-pending-edit', '编辑'],
      ['b-order-pending-back', '撤回订单'], ['b-order-pending-print', '打印面单'],
      ['b-order-pending-export', '导出']
    ]),
    PG('p-order-shipped', '已发货', [
      ['b-order-shipped-view', '查看'], ['b-order-shipped-edit', '编辑'],
      ['b-order-shipped-print', '打印面单'], ['b-order-shipped-export', '导出']
    ]),
    PG('p-order-done', '已完结', [
      ['b-order-done-view', '查看'], ['b-order-done-export', '导出'],
      ['b-order-done-copy', '复制信息'], ['b-order-done-aftersale', '申请售后']
    ])
  ]),
  M('m-purchase', '采购管理', [
    PG('p-po', '采购订单', [
      ['b-po-view', '查看'], ['b-po-add', '新建'], ['b-po-edit', '编辑'],
      ['b-po-submit', '提交'], ['b-po-del', '删除']
    ]),
    PG('p-poh', '历史采购单', [['b-poh-view', '查看'], ['b-poh-export', '导出']]),
    PG('p-sup', '供应商管理', [
      ['b-sup-view', '查看'], ['b-sup-add', '新增'],
      ['b-sup-edit', '编辑'], ['b-sup-del', '删除']
    ])
  ]),
  M('m-inv', '库存管理', [
    PG('p-stock', '库存记录', [
      ['b-stock-view', '查看'], ['b-stock-warn', '设置预警'], ['b-stock-export', '导出']
    ]),
    PG('p-take', '仓库盘点', [
      ['b-take-view', '查看'], ['b-take-add', '创建任务'],
      ['b-take-do', '盘点'], ['b-take-export', '导出']
    ])
  ]),
  /* 售后按钮清单严格按 PRD：待处理 3 项、处理中 4 项（不含质检）、完成 2 项 */
  M('m-after', '售后管理', [
    PG('p-wait', '售后待处理', [
      ['b-wait-view', '查看'], ['b-wait-audit', '审核'], ['b-wait-export', '导出']
    ]),
    PG('p-doing', '售后处理中', [
      ['b-doing-view', '查看'], ['b-doing-refund', '退款'],
      ['b-doing-exchange', '换货'], ['b-doing-resend', '补发']
    ]),
    PG('p-adone', '售后处理完成', [['b-adone-view', '查看'], ['b-adone-export', '导出']])
  ]),
  M('m-fin', '财务管理', [
    PG('p-rec', '对账中心', [
      ['b-rec-view', '查看'], ['b-rec-check', '核对'], ['b-rec-export', '导出']
    ]),
    PG('p-ship', '发货数据', [['b-ship-view', '查看'], ['b-ship-export', '导出']]),
    PG('p-goods', '商品信息', [['b-goods-view', '查看'], ['b-goods-export', '导出']]),
    PG('p-aging', '库存积压', [['b-aging-view', '查看'], ['b-aging-export', '导出']]),
    PG('p-pay', '应付账款台账', [
      ['b-pay-view', '查看'], ['b-pay-audit', '审核'], ['b-pay-pay', '付款']
    ])
  ]),
  M('m-dash', '数据看板', [PG('p-dash', '经营数据看板', [['b-dash-view', '查看'], ['b-dash-export', '导出']])]),
  M('m-sys', '系统设置', [
    PG('p-sys-post', '职位管理', [
      ['b-sys-post-view', '查看'], ['b-sys-post-add', '新建'],
      ['b-sys-post-edit', '编辑'], ['b-sys-post-off', '停用'], ['b-sys-post-del', '删除']
    ]),
    PG('p-sys-acc', '账号管理', [
      ['b-sys-acc-view', '查看'], ['b-sys-acc-add', '新建'], ['b-sys-acc-edit', '编辑'],
      ['b-sys-acc-pwd', '重置密码'], ['b-sys-acc-off', '停用'], ['b-sys-acc-del', '删除']
    ]),
    PG('p-sys-perm', '权限管理', [['b-sys-perm-view', '查看'], ['b-sys-perm-save', '保存分配']]),
    PG('p-sys-wh', '发货仓设置', [['b-sys-wh-view', '查看'], ['b-sys-wh-edit', '更改地区']])
  ])
]

export const ALL_BUTTON_IDS = PERM_TREE.flatMap(m => m.children.flatMap(p => p.children.map(b => b.id)))
export const TOTAL_PERMS = ALL_BUTTON_IDS.length // 75（以按钮清单为准，勿写死）

export const MODULE_COUNT = id => {
  const m = PERM_TREE.find(x => x.id === id)
  return m ? m.children.reduce((n, p) => n + p.children.length, 0) : 0
}

/* ---------------- 职位 ---------------- */
const pick = pred => ALL_BUTTON_IDS.filter(pred)

export const posts = reactive([
  {
    id: 'post-boss', name: '老板', dept: '管理层', scope: '全部数据', status: '启用',
    builtin: true, perms: [...ALL_BUTTON_IDS], note: `系统内置职位，默认拥有全部 ${ALL_BUTTON_IDS.length} 项权限，可在权限管理中调整`
  },
  {
    id: 'post-ops', name: '运营', dept: '电商运营部', scope: '本部门', status: '启用',
    perms: pick(id => id.startsWith('b-order-') || id === 'b-stock-view' || id.startsWith('b-dash-') || ['b-wait-view', 'b-doing-view', 'b-adone-view'].includes(id)),
    note: '负责卖货、订单审核与异常发起'
  },
  {
    id: 'post-buy', name: '采购', dept: '采购部', scope: '本部门', status: '启用',
    perms: pick(id => id.startsWith('b-po') || id.startsWith('b-poh') || id.startsWith('b-sup') || id === 'b-stock-view' || id === 'b-stock-warn'),
    note: '负责采购下单、供应商与到货跟进'
  },
  {
    id: 'post-wh', name: '仓管', dept: '仓储部', scope: '本部门', status: '启用',
    perms: pick(id => id.startsWith('b-stock') || id.startsWith('b-take') || ['b-order-pending-view', 'b-order-pending-print', 'b-order-shipped-view', 'b-order-shipped-edit', 'b-doing-view'].includes(id)),
    note: '负责出入库、盘点与退货收货质检（质检在 WMS 执行）'
  },
  {
    id: 'post-after', name: '售后', dept: '售后部', scope: '本部门', status: '启用',
    perms: pick(id => id.startsWith('b-wait') || id.startsWith('b-doing') || id.startsWith('b-adone') || ['b-order-review-view', 'b-order-shipped-view', 'b-order-done-view', 'b-order-done-copy'].includes(id)),
    note: '负责售后受理审核、退款与换补跟进'
  },
  {
    id: 'post-fin', name: '财务', dept: '财务部', scope: '本部门', status: '停用',
    perms: pick(id => id.startsWith('b-rec') || id.startsWith('b-ship') || id.startsWith('b-goods') || id.startsWith('b-aging') || id.startsWith('b-pay') || id === 'b-order-done-view'),
    note: '负责对账、赔付与应付账款'
  }
])

/* 恢复默认用：以当前内置基线为准 */
export const DEFAULT_PERMS = Object.fromEntries(posts.map(p => [p.id, [...p.perms]]))

/* ---------------- 账号 ---------------- */
export const accounts = reactive([
  { id: 'acc-1', name: '耿子毅', account: 'genziyi', phone: '13800138001', postId: 'post-fin', status: '停用', lastLogin: '2026-11-16 18:22', remark: '所属职位「财务」停用，账号同步停用' },
  { id: 'acc-2', name: '王佳丽', account: 'wangjl', phone: '13900139002', postId: 'post-ops', status: '启用', lastLogin: '2026-11-16 09:12', remark: '' },
  { id: 'acc-3', name: '李丽霞', account: 'lilx', phone: '13700137003', postId: 'post-wh', status: '启用', lastLogin: '2026-11-16 08:40', remark: '' },
  { id: 'acc-4', name: '张丽珊', account: 'zhangls', phone: '13600136004', postId: 'post-after', status: '启用', lastLogin: '2026-11-18 08:12', remark: '' },
  { id: 'acc-5', name: '齐田', account: 'qitian', phone: '13500135005', postId: 'post-boss', status: '启用', lastLogin: '2026-11-18 08:05', remark: '老板账号' }
])

export const postById = id => posts.find(p => p.id === id)
export const postName = id => postById(id)?.name || '未分配'
export const deptOfAccount = a => postById(a.postId)?.dept || '—'
export const accountsOfPost = id => accounts.filter(a => a.postId === id)
export const enabledPosts = () => posts.filter(p => p.status === '启用')

/**
 * 职位启停的唯一入口 —— 避免出现「职位已停用、账号还显示启用」的矛盾态。
 * 停用职位时，其下账号一并停用；
 * 重新启用职位时不自动放开账号（防止悄悄恢复一批人的登录权限），由管理员在账号管理中逐个启用。
 */
export const setPostStatus = (postId, status) => {
  const p = postById(postId)
  if (!p || p.builtin) return { post: p, affected: [] }
  p.status = status
  const affected = accountsOfPost(postId)
  if (status === '停用') affected.forEach(a => { a.status = '停用' })
  return { post: p, affected }
}
export const INIT_PASSWORD = 'Xy@2026'

/* ---------------- 省级行政区（34 个） ---------------- */
export const REGIONS = [
  { key: '华东', areas: ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'] },
  { key: '华南', areas: ['广东', '广西', '海南'] },
  { key: '华北', areas: ['北京', '天津', '河北', '山西', '内蒙古'] },
  { key: '华中', areas: ['河南', '湖北', '湖南'] },
  { key: '西南', areas: ['重庆', '四川', '贵州', '云南', '西藏'] },
  { key: '西北', areas: ['陕西', '甘肃', '青海', '宁夏', '新疆'] },
  { key: '东北', areas: ['辽宁', '吉林', '黑龙江'] },
  { key: '港澳台', areas: ['香港', '澳门', '台湾'] }
]
export const ALL_AREAS = REGIONS.flatMap(r => r.areas)

export const REGION_ALIAS = {
  华东: ['华东', '沪', '苏', '浙', '皖', '闽', '赣', '鲁'],
  华南: ['华南', '粤', '桂', '琼'],
  华北: ['华北', '京', '津', '冀', '晋', '蒙'],
  华中: ['华中', '豫', '鄂', '湘'],
  西南: ['西南', '渝', '川', '蜀', '黔', '贵', '滇', '云', '藏'],
  西北: ['西北', '陕', '秦', '甘', '陇', '青', '宁', '新'],
  东北: ['东北', '辽', '吉', '黑'],
  港澳台: ['港澳台', '港澳', '港', '澳', '台']
}

/* ---------------- 发货仓（初始化写入，本页不可新建/删除/改名） ---------------- */
export const warehouses = reactive([
  {
    id: 'wh-1', name: '华东主仓', type: '自营仓', city: '苏州',
    areas: ['江苏', '浙江', '上海', '安徽', '江西', '山东', '福建', '湖北', '湖南', '河南']
  },
  { id: 'wh-2', name: '华南仓', type: '自营仓', city: '广州', areas: ['广东', '广西', '海南', '云南', '贵州'] },
  { id: 'wh-3', name: '平台仓1', type: '平台仓', city: '杭州', areas: ['北京', '天津', '河北', '山西', '陕西', '甘肃', '宁夏', '内蒙古'] },
  { id: 'wh-4', name: '平台仓2', type: '平台仓', city: '北京', areas: ['辽宁', '吉林', '黑龙江', '四川', '重庆'] }
])

export const coveredAreas = () => {
  const s = new Set()
  warehouses.forEach(w => w.areas.forEach(a => s.add(a)))
  return s
}
export const unassignedAreas = () => ALL_AREAS.filter(a => !coveredAreas().has(a))
export const ownerOfArea = area => warehouses.find(w => w.areas.includes(area)) || null

export const WAREHOUSE_NAMES = warehouses.map(w => w.name)
