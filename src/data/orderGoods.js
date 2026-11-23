/**
 * 订单商品库（编辑订单时选择商品用）
 *
 * 字段与原型 GOODS 对齐：sku / name / brand / model / spec / price。
 * 现有订单里出现过的商品（如 SKU-100231）也放在这里，
 * 保证编辑历史订单时能在选择器里找到原商品。
 */
export const ORDER_GOODS = [
  { sku: 'SKU-100231', name: '雅诗兰黛小棕瓶', brand: '雅诗兰黛', model: '小棕瓶', spec: '50ml', price: 643.00 },
  { sku: 'SKU-100188', name: '兰蔻小黑瓶', brand: '兰蔻', model: '小黑瓶', spec: '30ml', price: 899.00 },
  { sku: 'SKU-200118', name: '星野纯棉四件套', brand: '星野', model: '纯棉四件套', spec: '1.8m 灰', price: 459.00 },
  { sku: 'SKU-300045', name: '星野香薰礼盒', brand: '星野', model: '香薰礼盒', spec: '3件装', price: 199.00 },
  { sku: 'SKU-300052', name: '星野香薰蜡烛', brand: '星野', model: '香薰蜡烛', spec: '小号', price: 76.00 },
  { sku: 'SKU-400011', name: '星野收纳箱', brand: '星野', model: '收纳箱', spec: '大号', price: 264.00 },

  { sku: 'SKU-1001', name: 'Miss Dior花漾女士淡香水', brand: 'DIOR', model: 'EDT', spec: '50ml/瓶', price: 899.00 },
  { sku: 'SKU-1002', name: '苏颜娜胶原水乳霜套装', brand: '苏颜娜', model: '新年礼盒装', spec: '3件套/盒', price: 299.00 },
  { sku: 'SKU-1003', name: '星野氨基酸洁面乳', brand: '星野', model: '温和型', spec: '120g/支', price: 69.00 },
  { sku: 'SKU-1004', name: '小苍兰香氛洗发水', brand: '星野', model: '滋润型', spec: '500ml/瓶', price: 59.00 },
  { sku: 'SKU-1005', name: '白桃乌龙身体乳', brand: '星野', model: '清爽型', spec: '250ml/支', price: 89.00 },
  { sku: 'SKU-1006', name: '柔光气垫粉底', brand: 'MISSHA', model: '21号自然色', spec: '15g/盒', price: 158.00 },
  { sku: 'SKU-1007', name: '蜜桃润唇膏', brand: '星野', model: '保湿型', spec: '3.5g/支', price: 39.00 },
  { sku: 'SKU-1008', name: '植萃修护精华液', brand: '苏颜娜', model: '修护型', spec: '30ml/瓶', price: 268.00 },
  { sku: 'SKU-1009', name: '云朵一次性洗脸巾', brand: '星野', model: '加厚款', spec: '80抽/包', price: 19.90 },
  { sku: 'SKU-1010', name: '山茶花护手霜礼盒', brand: '星野', model: '礼盒装', spec: '5支/盒', price: 128.00 }
]
