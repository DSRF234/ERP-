// 对账中心模拟数据：含三条不同状态的样本，便于演示差异处理
export const reconciliations = [
  {
    id: 'TB2026102800142', channel: '天猫', shop: '星野优选旗舰店', warehouse: '华东主仓',
    orderAmount: 1286.00, outAmount: 1286.00, settleAmount: 1209.70, diff: -14.57,
    rule: 'R4', ruleName: '佣金 / 运费不符', status: 'part',
    period: '2026-10-21 ~ 10-31', orderTime: '2026-10-28 14:22',
    money: [
      ['平台结算单', 1209.70, '佣金 64.30（5%）· 运费 12.00'],
      ['ERP 应收', 1224.27, '佣金率按 4.8% 计 · 未记运费'],
      ['银行到账', 1209.70, '10-31 已到账']
    ],
    reason: '平台按 5% 收取佣金，ERP 佣金率配置为 4.8%，差额 2.57 元；平台另扣运费 12.00 元，ERP 未记该项。'
  },
  {
    id: 'DY2026102800331', channel: '抖音', shop: '星野优选官方旗舰店', warehouse: '华南仓',
    orderAmount: 459.00, outAmount: 459.00, settleAmount: 459.00, diff: 0,
    rule: '—', ruleName: '无差异', status: 'ok',
    period: '2026-10-28 ~ 10-30', orderTime: '2026-10-28 20:11',
    money: [
      ['平台结算单', 459.00, '抖音 T+1 结算'],
      ['ERP 应收', 459.00, '活动期免佣'],
      ['银行到账', 459.00, '10-30 已到账']
    ],
    reason: '三单完全匹配，无需处理。'
  },
  {
    id: 'JD2026102700118', channel: '京东自营', shop: '京东自营旗舰店', warehouse: '平台仓（京东）',
    orderAmount: 899.00, outAmount: 899.00, settleAmount: 872.03, diff: -26.97,
    rule: 'R8', ruleName: '代发口径不符', status: 'part',
    period: '2026-10-27 ~ 11-05', orderTime: '2026-10-27 11:36',
    money: [
      ['平台结算单', 872.03, '佣金 3% = 26.97'],
      ['ERP 应收', 899.00, '未记佣金（代发模式）'],
      ['银行到账', 872.03, '11-01 已到账']
    ],
    reason: '平台仓代发订单，佣金从结算款中直接扣除，ERP 按直发口径记为全额应收，未做佣金计提。'
  },
  {
    id: 'TB2026102900876', channel: '天猫', shop: '星野优选旗舰店', warehouse: '华东主仓',
    orderAmount: 2340.00, outAmount: null, settleAmount: 2134.80, diff: null,
    rule: 'R2', ruleName: '平台有单 · ERP 无单', status: 'miss',
    period: '2026-10-21 ~ 10-31', orderTime: '2026-10-29 09:04',
    money: [
      ['平台结算单', 2134.80, '佣金 5% = 117.00'],
      ['ERP 应收', null, '系统内无此订单'],
      ['银行到账', 2134.80, '10-31 已到账']
    ],
    reason: '平台已产生结算，但 ERP 无对应订单。疑为订单抓取接口漏单（10-29 09:00-09:30 接口超时）。'
  }
]
