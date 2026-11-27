<template>
  <div>
    <PageHeader title="数据看板" sub="全渠道经营数据 · 财务收支面板">
      <el-radio-group v-model="period" size="small">
        <el-radio-button v-for="p in PERIODS" :key="p.key" :label="p.key">{{ p.name }}</el-radio-button>
      </el-radio-group>
    </PageHeader>

    <div class="fund">
      <div class="fund-main">
        <div class="lbl">现有资金</div>
        <div class="num" :class="{ neg: funds.net < 0 }">{{ funds.text.net }}</div>
        <div class="sub">{{ periodMeta.name }}：实际到账 − 应付账款</div>
      </div>
      <div class="fund-item">
        <span>实际到账合计</span>
        <b class="pos">{{ funds.text.receipt }}</b>
        <i>{{ periodMeta.name }}对账中心 {{ reconCount }} 张单据</i>
      </div>
      <div class="fund-item">
        <span>应付合计</span>
        <b class="neg">{{ funds.text.payable }}</b>
        <i>{{ periodMeta.name }}已完成入库的采购单</i>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi" v-for="k in kpis" :key="k.label" :class="{ warn: k.warn }">
        <div class="k">{{ k.label }}</div>
        <div class="v">{{ k.value }}<i v-if="k.unit">{{ k.unit }}</i></div>
        <div class="d">{{ k.desc }}</div>
      </div>
    </div>

    <div class="grid2">
      <div class="card">
        <div class="card-head">
          <h3>销售额趋势</h3>
          <span class="extra">{{ periodMeta.granule }} · 单位：{{ amountUnit }}</span>
        </div>
        <div style="padding: 10px 14px 6px">
          <svg width="100%" viewBox="0 0 660 210" preserveAspectRatio="none" style="display:block">
            <g v-for="t in yTicks" :key="t">
              <line :x1="40" :y1="py(t)" :x2="648" :y2="py(t)" stroke="#EDEFF2" />
              <text :x="32" :y="py(t)+3.5" font-size="10" fill="#8A949E" text-anchor="end">{{ t }}</text>
            </g>
            <polygon :points="area" fill="#169BD5" opacity="0.10" />
            <polyline :points="line" fill="none" stroke="#169BD5" stroke-width="2" stroke-linejoin="round" />
            <circle v-for="(v,i) in trend.series" :key="i" :cx="px(i)" :cy="py(v)" r="2.6"
              fill="#fff" stroke="#169BD5" stroke-width="1.4">
              <title>{{ trend.labels[i] }}　{{ fmtMoney(v) }}</title>
            </circle>
            <text v-for="(l,i) in trend.labels" :key="'l'+i" v-show="showLabel(i)" :x="px(i)" :y="196"
              font-size="10" fill="#8A949E" text-anchor="middle">{{ l }}</text>
          </svg>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>渠道销售占比</h3><span class="extra">按 GMV</span></div>
        <div style="padding: 12px 16px">
          <div v-for="c in share" :key="c.name" class="row">
            <span class="dot" :style="{ background: c.color }"></span>
            <span class="nm">{{ c.name }}</span>
            <div class="bar"><i :style="{ width: Math.max(c.pct, 1) + '%', background: c.color }"></i></div>
            <span class="pc">{{ c.pct }}%</span>
          </div>
          <div v-if="!share.length" class="empty">该时间段暂无订单</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 12px">
      <div class="card-head"><h3>渠道经营明细</h3><span class="extra">{{ periodMeta.name }} · 共 {{ scoped.length }} 单</span></div>
      <el-table :data="channels" size="small" empty-text="该时间段暂无订单">
        <el-table-column label="渠道" min-width="120">
          <template #default="{ row }"><span class="dot" :style="{background: row.color}"></span>{{ row.name }}</template>
        </el-table-column>
        <el-table-column prop="orders" label="订单量" align="right" min-width="90" />
        <el-table-column label="GMV" align="right" min-width="110">
          <template #default="{ row }"><span class="mono">{{ fmtMoney(row.gmv) }}</span></template>
        </el-table-column>
        <el-table-column label="客单价" align="right" min-width="100">
          <template #default="{ row }"><span class="mono">{{ fmtMoney(row.aov) }}</span></template>
        </el-table-column>
        <el-table-column label="平台结算" align="right" min-width="110">
          <template #default="{ row }"><span class="mono">{{ fmtMoney(row.settle) }}</span></template>
        </el-table-column>
        <el-table-column label="占比" align="right" min-width="80">
          <template #default="{ row }">{{ row.pct }}%</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useOrderStore } from '@/stores/order'
import { tickets } from '@/data/aftersale'
import { fundSummary, RECON_DEMO } from '@/data/finance'

/* 现有资金：到账 − 应付 */
const funds = computed(() => fundSummary(orderStore.financeToCheck, startOf(period.value)))
const reconCount = computed(() => {
  const from = startOf(period.value)
  const inRange = t => {
    const d = new Date(String(t || '').replace(' ', 'T'))
    return !isNaN(d.getTime()) && d >= from
  }
  return orderStore.financeToCheck.filter(o => inRange(o.orderTime || o.payTime)).length +
    RECON_DEMO.filter(r => inRange(r.time)).length
})

const PERIODS = [
  { key: 'day', name: '本日', granule: '按 4 小时' },
  { key: 'week', name: '本周', granule: '按天' },
  { key: 'month', name: '本月', granule: '按天' },
  { key: 'quarter', name: '本季度', granule: '按月' }
]
const period = ref('month')
const periodMeta = computed(() => PERIODS.find(p => p.key === period.value))

const orderStore = useOrderStore()

/* ---------------- 时间段 ---------------- */
const startOf = (key, base = new Date()) => {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  if (key === 'day') return d
  if (key === 'week') {
    const wd = (d.getDay() + 6) % 7
    return new Date(d.getTime() - wd * 86400000)
  }
  if (key === 'month') return new Date(d.getFullYear(), d.getMonth(), 1)
  return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)
}

const parseTime = s => {
  if (!s) return null
  const t = new Date(String(s).replace(' ', 'T'))
  return isNaN(t.getTime()) ? null : t
}

const scoped = computed(() => {
  const from = startOf(period.value)
  return orderStore.orders.filter(o => {
    const t = parseTime(o.orderTime || o.payTime)
    return t && t >= from
  })
})

/* ---------------- 金额格式化 ---------------- */
const fmtMoney = v => {
  const n = Number(v || 0)
  if (n >= 10000) return (n / 10000).toFixed(2) + ' 万'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
const amountUnit = computed(() => {
  const max = Math.max(0, ...scoped.value.map(o => Number(o.amount) || 0))
  return max >= 10000 ? '万元' : '元'
})

/* ---------------- KPI ---------------- */
const kpis = computed(() => {
  const list = scoped.value
  const gmv = list.reduce((s, o) => s + Number(o.amount || 0), 0)
  const settle = list.reduce((s, o) => s + Number(o.settle || 0), 0)
  const aov = list.length ? gmv / list.length : 0
  const pendingAfter = tickets.filter(t => t.status === 'wait' || t.status === 'doing').length

  return [
    { label: '销售额 GMV', value: fmtMoney(gmv), desc: `${periodMeta.value.name}累计` },
    { label: '订单量', value: list.length.toLocaleString('zh-CN'), unit: '单', desc: `客单价 ￥${aov.toFixed(2)}` },
    { label: '平台结算', value: fmtMoney(settle), desc: '按平台费率 5% 估算' },
    { label: '待发货订单', value: list.filter(o => o.status === 'pending').length, unit: '单', warn: true, desc: '审核通过未出库' },
    { label: '待处理售后', value: pendingAfter, unit: '单', warn: true, desc: '待处理 + 处理中' }
  ]
})

/* ---------------- 趋势 ---------------- */
function buildBuckets() {
  const key = period.value
  const now = new Date()
  const from = startOf(key)
  const buckets = []

  if (key === 'day') {
    for (let h = 0; h < 24; h += 4) {
      buckets.push({ label: `${String(h).padStart(2, '0')}:00`, test: d => d.getHours() >= h && d.getHours() < h + 4 })
    }
  } else if (key === 'quarter') {
    const m0 = Math.floor(now.getMonth() / 3) * 3
    for (let i = 0; i < 3; i++) {
      const m = m0 + i
      buckets.push({ label: `${m + 1}月`, test: d => d.getMonth() === m })
    }
  } else {
    const end = key === 'week'
      ? new Date(from.getTime() + 6 * 86400000)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0)
    for (let t = new Date(from); t <= end; t.setDate(t.getDate() + 1)) {
      const d = new Date(t)
      buckets.push({
        label: `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`,
        test: x => x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate()
      })
    }
  }
  return buckets
}

const trend = computed(() => {
  const buckets = buildBuckets()
  const series = buckets.map(b => {
    const sum = scoped.value
      .filter(o => { const t = parseTime(o.orderTime || o.payTime); return t && b.test(t) })
      .reduce((s, o) => s + Number(o.amount || 0), 0)
    return amountUnit.value === '万元' ? +(sum / 10000).toFixed(2) : Math.round(sum)
  })
  return { labels: buckets.map(b => b.label), series }
})

const yMax = computed(() => {
  const max = Math.max(0, ...trend.value.series)
  if (max === 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(max)))
  return Math.ceil(max / pow) * pow
})
const yTicks = computed(() => {
  const m = yMax.value
  return [0, m / 4, m / 2, m * 0.75, m].map(v => +(Math.round(v * 100) / 100))
})

const px = i => {
  const n = trend.value.labels.length
  return n <= 1 ? 40 : 40 + (648 - 40) * i / (n - 1)
}
const py = v => 14 + (176 - 14) * (1 - v / yMax.value)
const line = computed(() => trend.value.series.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' '))
const area = computed(() => {
  const n = trend.value.series.length
  if (!n) return ''
  return `40,${py(0)} ${line.value} ${px(n - 1).toFixed(1)},${py(0)}`
})
const showLabel = i => {
  const n = trend.value.labels.length
  const step = Math.ceil(n / 8)
  return i % step === 0 || i === n - 1
}

/* ---------------- 渠道 ---------------- */
const COLOR = { 天猫: '#169BD5', 抖音: '#8C7AE6', 京东: '#1E8E5A', 小程序: '#B26A00' }

const channels = computed(() => {
  const map = new Map()
  scoped.value.forEach(o => {
    const name = o.platform || '其他'
    const cur = map.get(name) || { name, color: COLOR[name] || '#8A949E', orders: 0, gmv: 0, settle: 0 }
    cur.orders += 1
    cur.gmv += Number(o.amount || 0)
    cur.settle += Number(o.settle || 0)
    map.set(name, cur)
  })
  const list = [...map.values()]
  const total = list.reduce((s, c) => s + c.gmv, 0)
  return list
    .map(c => ({
      ...c,
      aov: c.orders ? c.gmv / c.orders : 0,
      pct: total ? +(c.gmv / total * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.gmv - a.gmv)
})

const share = computed(() => channels.value.filter(c => c.pct > 0))
</script>

<style scoped>
.fund { display: grid; grid-template-columns: 1.4fr repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
.fund-main { background: #0E7A6B; border-radius: 8px; padding: 16px 18px; color: #fff; }
.fund-main .lbl { font-size: 12px; opacity: .82; }
.fund-main .num { font-size: 27px; font-weight: 600; letter-spacing: -.5px; margin: 8px 0 6px; font-variant-numeric: tabular-nums; }
.fund-main .num.neg { color: #FFD5D2; }
.fund-main .sub { font-size: 11.5px; opacity: .78; }
.fund-item { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
.fund-item span { font-size: 12px; color: var(--ink-3); }
.fund-item b { font-size: 20px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
.fund-item b.pos { color: #1E8E5A; }
.fund-item b.neg { color: var(--danger); }
.fund-item i { font-style: normal; font-size: 11.5px; color: var(--ink-3); }
@media (max-width: 960px) { .fund { grid-template-columns: 1fr 1fr; } }
.kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 12px; }
.kpi { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; }
.kpi .k { font-size: 12px; color: var(--ink-3); }
.kpi .v { font-size: 25px; font-weight: 600; margin: 7px 0 6px; letter-spacing: -.4px; font-variant-numeric: tabular-nums; }
.kpi .v i { font-size: 13px; font-weight: 400; color: var(--ink-3); font-style: normal; margin-left: 3px; }
.kpi .d { font-size: 11.5px; color: var(--ink-3); }
.kpi.warn .v { color: var(--warn); }
.grid2 { display: grid; grid-template-columns: 1.6fr 1fr; gap: 12px; }
.row { display: flex; align-items: center; gap: 8px; padding: 7px 0; }
.row .nm { width: 76px; font-size: 12.5px; }
.row .bar { flex: 1; height: 10px; background: var(--fill); border-radius: 3px; overflow: hidden; }
.row .bar i { display: block; height: 100%; border-radius: 3px; }
.row .pc { width: 44px; text-align: right; font-size: 12px; color: var(--ink-3); }
.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 7px; }
.empty { padding: 18px 0; text-align: center; font-size: 12px; color: var(--ink-3); }
@media (max-width: 1280px) { .kpis { grid-template-columns: repeat(3, 1fr); } .grid2 { grid-template-columns: 1fr; } }
</style>
