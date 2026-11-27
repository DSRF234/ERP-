/**
 * 商品主数据（全站唯一真源）
 * ------------------------------------------------------------------
 * 一个商品的编码、名称、规格、单位、供应商、成本价只在这里定义一次。
 * 订单明细、采购明细、库存记录都只是「引用了某个 code」，
 * 展示时统一按 code 回填本表的字段，避免各模块各存一份导致对不上。
 *
 * 新增商品：只在这里加一行；其余模块通过 code 自动取到最新基础信息。
 */

export const SKUS = [
  { code: 'SKU-100231', name: '雅诗兰黛小棕瓶', spec: '50ml', unit: '瓶', supplier: '广州雅美化妆品', category: '美妆个护', costPrice: 560, retail: 1286 },
  { code: 'SKU-100188', name: '兰蔻小黑瓶', spec: '30ml', unit: '瓶', supplier: '广州雅美化妆品', category: '美妆个护', costPrice: 480, retail: 899 },
  { code: 'SKU-200118', name: '星野纯棉四件套', spec: '1.8m 灰', unit: '套', supplier: '南通家纺制造厂', category: '家居日用', costPrice: 168, retail: 399 },
  { code: 'SKU-300045', name: '星野香薰礼盒', spec: '3件装', unit: '盒', supplier: '深圳香氛实业', category: '家居日用', costPrice: 86, retail: 199 },
  { code: 'SKU-400011', name: '星野收纳箱', spec: '大号', unit: '个', supplier: '台州塑料制品', category: '家居日用', costPrice: 118, retail: 264 },
  { code: 'SKU-300052', name: '星野香薰蜡烛', spec: '小号', unit: '个', supplier: '深圳香氛实业', category: '家居日用', costPrice: 40, retail: 76 },
  { code: 'SE-2026-001', name: '洗面奶', spec: '100g/支', unit: '支', supplier: '某林林公司', category: '美妆个护', costPrice: 55, retail: 98 },
  { code: 'SE-2026-002', name: '眼睫毛膏', spec: '5ml', unit: '支', supplier: '美妆公司', category: '美妆个护', costPrice: 32, retail: 68 },
  { code: 'SE-2026-003', name: '牙膏', spec: '120g', unit: '支', supplier: '某林林公司', category: '家居日用', costPrice: 7, retail: 19.9 },
  { code: 'SE-2026-819', name: '睫毛膏', spec: '8g', unit: '支', supplier: '某林林公司', category: '美妆个护', costPrice: 4, retail: 15 },
  { code: 'AS-2026-021', name: '抽纸', spec: '3层130抽', unit: '包', supplier: '美妆公司', category: '家居日用', costPrice: 18, retail: 39.9 },
  { code: 'AS-2026-022', name: '精华液', spec: '30ml', unit: '瓶', supplier: '广州雅美化妆品', category: '美妆个护', costPrice: 210, retail: 499 }
]

export const SKU_MAP = Object.fromEntries(SKUS.map(s => [s.code, s]))

/** 取商品主数据；找不到时返回空对象，调用方自行兜底 */
export const skuOf = code => SKU_MAP[code] || {}

/**
 * 用主数据覆盖一条业务明细上的冗余字段。
 * 明细表仍保留 name/spec（防止主数据被删后显示空白），但以主数据为准。
 */
export function applySkuMaster(row, codeKey = 'code') {
  const code = row[codeKey] || row.sku
  const s = SKU_MAP[code]
  if (!s) return row
  row.name = s.name
  row.spec = s.spec
  row.supplier = s.supplier
  if ('unit' in row) row.unit = s.unit
  if ('category' in row) row.category = s.category
  return row
}
