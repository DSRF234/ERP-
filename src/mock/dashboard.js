// 看板模拟数据：接入真实接口后整体删除本文件
export const kpis = [
  { label: '销售额 GMV', value: '1,286.4', unit: '万', warn: false,
    desc: '环比 <span class="up">↑ 12.4%</span>　同比 <span class="up">↑ 8.1%</span>' },
  { label: '订单量', value: '106,820', unit: '单', warn: false,
    desc: '客单价 ¥120.4　<span class="up">↑ 3.2%</span>' },
  { label: '毛利额 / 毛利率', value: '436.5', unit: '万', warn: false,
    desc: '毛利率 33.9%　环比 <span class="down">↓ 0.6pt</span>' },
  { label: '库存积压（>90 天）', value: '23.6', unit: '万', warn: true,
    desc: '占用资金 ¥131.4 万　库龄 >180 天 ¥5.2 万' },
  { label: '待处理差异', value: '38', unit: '笔', warn: true,
    desc: '差异金额 ¥4,260　<span class="up">A 类超时 5 笔</span>' }
]

export const trend = {
  labels: ['11-03', '11-04', '11-05', '11-06', '11-07', '11-08', '11-09',
           '11-10', '11-11', '11-12', '11-13', '11-14', '11-15'],
  series: [82.4, 88.1, 91.6, 86.3, 79.2, 84.7, 93.5, 96.2, 268.4, 142.6, 118.3, 126.7, 131.2]
}

export const channels = [
  { name: '天猫',      color: '#409EFF', orders: 49140, gmv: 591.7, aov: 120.4, rate: 32.4, diff: 14 },
  { name: '抖音',      color: '#9B7BE8', orders: 33110, gmv: 398.8, aov: 120.4, rate: 30.1, diff: 10 },
  { name: '京东自营',  color: '#67C23A', orders: 15180, gmv: 180.1, aov: 118.6, rate: 36.8, diff: 6 },
  { name: '自营小程序', color: '#E6A23C', orders: 6420,  gmv: 77.2,  aov: 120.2, rate: 38.2, diff: 8 },
  { name: '门店',      color: '#B4BCCC', orders: 2970,  gmv: 38.6,  aov: 129.9, rate: 41.5, diff: 0 }
]

export const todos = [
  { level: 'a', title: 'A 类资金差异待处理', desc: '5 笔已超 24 小时，涉及 ¥1,860', value: '5' },
  { level: 'b', title: '平台应收逾期', desc: '天猫 2 笔未结算，账龄 > 30 天', value: '8.6万' },
  { level: 'b', title: '供应商资质临期', desc: '化妆品备案 60 天内到期，未更新禁止下单', value: '3 家' },
  { level: 'c', title: '超 180 天库存建议清仓', desc: '香薰礼盒旧版 1,240 件，占资金 ¥18.6 万', value: '5.2万' }
]
