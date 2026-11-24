/**
 * 系统设置 · 共享数据层
 * 口径来源：《erpPRD.docx》2.6 系统设置 + 《Map1.pdf》字段清单
 *
 * 职位 → 账号为「一对多」，账号权限完全继承职位，不在账号层单独授权。
 *
 * 权限树的唯一真源是 src/data/perm.js（7 个模块 / 22 个页面）。
 * 本文件不再维护第二份按钮清单：历史上这里曾有一份 75 项的旧树，
 * 与页面实际按钮长期走岔，留下了「编辑订单」「打印面单」「撤回订单」等
 * 页面上根本不存在、却能在权限树里勾选的权限点。现在职位只定义
 * 「名称 / 部门 / 数据范围 / 状态 / 说明」，默认权限由 perm.js 的
 * defaultsFor() 按职位职责推导后写入，管理员在「权限管理」里的调整
 * 存 localStorage，下次进入优先恢复。
 */
import { reactive } from 'vue'

/* ---------------- 部门 ---------------- */
export const DEPTS = ['管理层', '电商运营部', '采购部', '仓储部', '财务部', '售后部']

/* ---------------- 数据范围 ---------------- */
export const SCOPES = ['全部数据', '本部门及下级', '本部门', '仅本人', '自定义']

/* ---------------- 职位 ---------------- */
/**
 * perms 一律留空，由 perm.js 的 ensurePostPerms() → defaultsFor() 发放。
 * 在这里写死 id 就会出现「加了新按钮、某职位漏发」的同款问题，且无从校验。
 */
export const posts = reactive([
  {
    id: 'post-boss', name: '老板', dept: '管理层', scope: '全部数据', status: '启用',
    builtin: true, perms: [],
    note: '系统内置职位，默认拥有全部页面与操作权限，可在权限管理中调整'
  },
  {
    id: 'post-ops', name: '运营', dept: '电商运营部', scope: '本部门', status: '启用',
    perms: [],
    note: '负责卖货、订单审核与异常发起'
  },
  {
    id: 'post-buy', name: '采购', dept: '采购部', scope: '本部门', status: '启用',
    perms: [],
    note: '负责采购下单、供应商与到货跟进'
  },
  {
    id: 'post-wh', name: '仓管', dept: '仓储部', scope: '本部门', status: '启用',
    perms: [],
    note: '负责出入库、盘点与退货收货质检（质检在 WMS 执行）'
  },
  {
    id: 'post-after', name: '售后', dept: '售后部', scope: '本部门', status: '启用',
    perms: [],
    note: '负责售后受理审核、退款与换补跟进'
  },
  {
    id: 'post-fin', name: '财务', dept: '财务部', scope: '本部门', status: '启用',
    perms: [],
    note: '负责对账、赔付与应付账款'
  },
  {
    id: 'post-sys', name: '系统管理员', dept: '信息部', scope: '全部数据', status: '启用',
    perms: [],
    note: '负责账号、职位与权限分配，以及发货仓维护；不参与业务单据处理'
  },
  {
    id: 'post-demo', name: '全局演示', dept: '演示', scope: '全部数据', status: '启用',
    perms: [],
    note: '会议演示专用：拥有全部页面与全部操作权限，可完整走通任意业务流程'
  }
])

/* ---------------- 账号 ---------------- */
export const accounts = reactive([
  { id: 'acc-1', name: '耿子毅', account: 'genziyi', phone: '13800138001', postId: 'post-fin', status: '启用', lastLogin: '2026-11-16 18:22', remark: '' },
  { id: 'acc-2', name: '王佳丽', account: 'wangjl', phone: '13900139002', postId: 'post-ops', status: '启用', lastLogin: '2026-11-16 09:12', remark: '' },
  { id: 'acc-3', name: '李丽霞', account: 'lilx', phone: '13700137003', postId: 'post-wh', status: '启用', lastLogin: '2026-11-16 08:40', remark: '' },
  { id: 'acc-4', name: '张丽珊', account: 'zhangls', phone: '13600136004', postId: 'post-after', status: '启用', lastLogin: '2026-11-18 08:12', remark: '' },
  { id: 'acc-5', name: '齐田', account: 'qitian', phone: '13500135005', postId: 'post-boss', status: '启用', lastLogin: '2026-11-18 08:05', remark: '老板账号' },
  { id: 'acc-6', name: '管理员', account: 'sysadmin', phone: '13400134006', postId: 'post-sys', status: '启用', lastLogin: '2026-11-20 09:30', remark: '系统管理员演示账号' },
  { id: 'acc-7', name: '演示', account: 'demo', phone: '13300133007', postId: 'post-demo', status: '启用', lastLogin: '2026-11-23 09:00', remark: '全局演示账号，拥有全部权限' }
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

/** 随机初始密码：10 位，去掉 0/O/1/l/I 等易混字符 */
export const randomPassword = (len = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

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
