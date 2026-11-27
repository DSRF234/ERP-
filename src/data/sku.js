/**
 * 商品主数据（全站唯一真源）
 * ------------------------------------------------------------------
 * 一个商品的基础信息固定为 7 项，只在这里定义一次：
 *   商品名称 name ｜ 商品编码 spu ｜ 进货单价 purchasePrice
 *   SKU 码 sku    ｜ 规格型号 spec ｜ 供应商 supplier ｜ 货品类型 category
 *
 * 商品编码（spu）是商品级编号，一个商品有多个规格时共用；
 * SKU 码（sku）是规格级编号，库存、订单明细、采购明细都以它为准。
 *
 * 业务表只存编码，展示时按编码回填本表字段，保证各模块看到的基础信息完全一致。
 * 新增商品：只在这里加一行。
 */

export const SKUS = [
  { spu: 'SP-100231', sku: 'SKU-100231', name: '雅诗兰黛小棕瓶', spec: '50ml', supplier: '广州雅美化妆品', category: '美妆个护', purchasePrice: 560, retail: 1286 },
  { spu: 'SP-100188', sku: 'SKU-100188', name: '兰蔻小黑瓶', spec: '30ml', supplier: '广州雅美化妆品', category: '美妆个护', purchasePrice: 480, retail: 899 },
  { spu: 'SP-200118', sku: 'SKU-200118', name: '星野纯棉四件套', spec: '1.8m 灰', supplier: '南通家纺制造厂', category: '家居日用', purchasePrice: 168, retail: 399 },
  { spu: 'SP-300045', sku: 'SKU-300045', name: '星野香薰礼盒', spec: '3件装', supplier: '深圳香氛实业', category: '家居日用', purchasePrice: 86, retail: 199 },
  { spu: 'SP-400011', sku: 'SKU-400011', name: '星野收纳箱', spec: '大号', supplier: '台州塑料制品', category: '家居日用', purchasePrice: 118, retail: 264 },
  { spu: 'SP-300052', sku: 'SKU-300052', name: '星野香薰蜡烛', spec: '小号', supplier: '深圳香氛实业', category: '家居日用', purchasePrice: 40, retail: 76 },
  { spu: 'SP-2026001', sku: 'SE-2026-001', name: '洗面奶', spec: '100g/支', supplier: '某林林公司', category: '美妆个护', purchasePrice: 55, retail: 98 },
  { spu: 'SP-2026002', sku: 'SE-2026-002', name: '眼睫毛膏', spec: '5ml', supplier: '美妆公司', category: '美妆个护', purchasePrice: 32, retail: 68 },
  { spu: 'SP-2026003', sku: 'SE-2026-003', name: '牙膏', spec: '120g', supplier: '某林林公司', category: '家居日用', purchasePrice: 7, retail: 19.9 },
  { spu: 'SP-2026819', sku: 'SE-2026-819', name: '睫毛膏', spec: '8g', supplier: '某林林公司', category: '美妆个护', purchasePrice: 4, retail: 15 },
  { spu: 'SP-2026021', sku: 'AS-2026-021', name: '抽纸', spec: '3层130抽', supplier: '美妆公司', category: '家居日用', purchasePrice: 18, retail: 39.9 },
  { spu: 'SP-2026022', sku: 'AS-2026-022', name: '精华液', spec: '30ml', supplier: '广州雅美化妆品', category: '美妆个护', purchasePrice: 210, retail: 499 }
]

/** 按 SKU 码索引——业务表统一用它 */
export const SKU_MAP = Object.fromEntries(SKUS.map(s => [s.sku, s]))
/** 按商品编码索引 */
export const SPU_MAP = Object.fromEntries(SKUS.map(s => [s.spu, s]))

export const skuOf = code => SKU_MAP[code] || {}

/**
 * 用主数据回填一条业务明细上的冗余字段。
 * 业务表仍保留 name/spec（主数据被删时兜底显示），但展示以主数据为准。
 */
export function applySkuMaster(row, codeKey = 'sku') {
  const s = SKU_MAP[row[codeKey]]
  if (!s) return row
  row.name = s.name
  row.spec = s.spec
  row.supplier = s.supplier
  row.spu = s.spu
  row.category = s.category
  if ('purchasePrice' in row) row.purchasePrice = s.purchasePrice
  return row
}

/** 进货单价：主数据优先，采购成交价其次 */
export const purchasePriceOf = code => SKU_MAP[code]?.purchasePrice ?? 0
