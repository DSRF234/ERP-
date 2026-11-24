import { defineStore } from 'pinia'
import { reactive, computed, watch } from 'vue'
import { KEY, read, write, replaceAll } from './persist'

/**
 * 供应商主数据
 * 采购单的供应商下拉、添加货品弹窗、供应商管理面板都读这一份，
 * 停用后的供应商立刻从下拉里消失（原来三处各写一份硬编码）。
 */
const seed = () => [
  {
    name: '某林林公司', owner: '某林公', phone: '12345678901',
    address: '河北省石家庄市正定县新龙科技2211号', status: '合作中', remark: '',
    goods: [
      { code: 'SO-2026-001', name: '洗面奶', type: '家居日用', spec: '100g/支', price: 9.99, minPrice: 12.02 },
      { code: 'SO-2026-002', name: '睫毛膏', type: '美妆个护', spec: '8g/支', price: 8.20, minPrice: 9.80 },
      { code: 'SO-2026-003', name: '牙膏', type: '家居日用', spec: '30g/个', price: 12.00, minPrice: 19.50 }
    ]
  },
  {
    name: '美妆公司', owner: '张经理', phone: '12333445678',
    address: '河北省石家庄市正定县新龙科技222号', status: '合作中', remark: '',
    goods: [
      { code: 'SO-2026-011', name: '眼睫毛', type: '美妆个护', spec: '5ml/支', price: 6.60, minPrice: 8.40 },
      { code: 'SO-2026-012', name: '抽纸', type: '家居日用', spec: '3层/包', price: 3.50, minPrice: 4.20 }
    ]
  },
  {
    name: '和正日化', owner: '王主管', phone: '13800138001',
    address: '广州市白云区机场路 12 号', status: '已停用', remark: '',
    goods: [{ code: 'SO-2026-021', name: '护手霜', type: '美妆个护', spec: '50g/支', price: 7.80, minPrice: 9.90 }]
  },
  {
    name: '雅美化妆品', owner: '陈志强', phone: '13900139002',
    address: '深圳市宝安区福永街道 66 号', status: '已停用', remark: '',
    goods: [
      { code: 'SO-2026-031', name: '精华液', type: '美妆个护', spec: '30ml/瓶', price: 68.00, minPrice: 79.00 },
      { code: 'SO-2026-032', name: '小棕瓶', type: '美妆个护', spec: '50ml/瓶', price: 380.00, minPrice: 420.00 }
    ]
  }
]

export const useSupplierStore = defineStore('supplier', () => {
  const suppliers = reactive(read(KEY.supplier, seed()))
  watch(suppliers, v => write(KEY.supplier, v), { deep: true })

  /** 仅「合作中」的供应商，供采购单下拉使用 */
  const activeSuppliers = computed(() => suppliers.filter(s => s.status === '合作中'))
  const activeNames = computed(() => activeSuppliers.value.map(s => s.name))

  const find = name => suppliers.find(s => s.name === name) || null
  const goodsOf = name => find(name)?.goods || []

  /** 名称查重（忽略首尾空格，避免「某林林公司 」绕过） */
  const nameExists = (name, except) => {
    const k = String(name || '').trim()
    return suppliers.some(s => s.name.trim() === k && s.name !== except)
  }
  /** 电话查重（只比数字） */
  const phoneExists = (phone, except) => {
    const k = String(phone || '').replace(/\D/g, '')
    return suppliers.some(s => String(s.phone || '').replace(/\D/g, '') === k && s.name !== except)
  }

  function add(form) {
    suppliers.unshift({
      name: String(form.name).trim(),
      owner: String(form.owner).trim(),
      phone: String(form.phone).replace(/\D/g, ''),
      address: String(form.address).trim(),
      remark: form.remark || '',
      status: '合作中',
      goods: []
    })
  }

  function toggleStatus(name) {
    const s = find(name)
    if (!s) return null
    s.status = s.status === '合作中' ? '已停用' : '合作中'
    return s.status
  }

  /** 同一供应商下货号唯一 */
  function codeExists(name, code) {
    const s = find(name)
    if (!s) return false
    return s.goods.some(g => String(g.code).trim().toUpperCase() === String(code).trim().toUpperCase())
  }

  function addGoods(name, g) {
    const s = find(name)
    if (!s) return false
    const price = Number(g.price)
    s.goods.push({
      code: String(g.code).trim().toUpperCase(),
      name: String(g.name).trim(),
      type: g.type,
      spec: g.spec || '—',
      price,
      // 最低成交价：历史成交记录，没有记录时为空，不再直接等于进货价
      minPrice: g.minPrice === undefined || g.minPrice === '' ? null : Number(g.minPrice)
    })
    return true
  }

  function removeGoods(name, code) {
    const s = find(name)
    if (!s) return
    const i = s.goods.findIndex(g => g.code === code)
    if (i > -1) s.goods.splice(i, 1)
  }

  function remove(name) {
    const i = suppliers.findIndex(s => s.name === name)
    if (i > -1) suppliers.splice(i, 1)
  }

  function reload() {
    replaceAll(suppliers, read(KEY.supplier, seed()))
  }

  return {
    suppliers, activeSuppliers, activeNames,
    find, goodsOf, nameExists, phoneExists, codeExists,
    add, toggleStatus, addGoods, removeGoods, remove, reload
  }
})
