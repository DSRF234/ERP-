<template>
  <div>
    <PageHeader title="数据看板" sub="全渠道经营数据 · 财务收支面板" />

    <div class="kpis">
      <div class="kpi" v-for="k in kpis" :key="k.label" :class="{ warn: k.warn }">
        <div class="k">{{ k.label }}</div>
        <div class="v">{{ k.value }}<i v-if="k.unit">{{ k.unit }}</i></div>
        <div class="d">{{ k.desc }}</div>
      </div>
    </div>

    <div class="grid2">
      <div class="card">
        <div class="card-head"><h3>销售额与毛利趋势</h3><span class="extra">单位：万元</span></div>
        <div style="padding: 10px 14px 6px">
          <svg width="100%" viewBox="0 0 660 210" preserveAspectRatio="none" style="display:block">
            <g v-for="t in [0,100,200,300]" :key="t">
              <line :x1="40" :y1="py(t)" :x2="648" :y2="py(t)" stroke="#EDEFF2" />
              <text :x="32" :y="py(t)+3.5" font-size="10" fill="#8A949E" text-anchor="end">{{ t }}</text>
            </g>
            <polygon :points="area" fill="#169BD5" opacity="0.10" />
            <polyline :points="line" fill="none" stroke="#169BD5" stroke-width="2" stroke-linejoin="round" />
            <circle v-for="(v,i) in trend.series" :key="i" :cx="px(i)" :cy="py(v)" r="2.4"
              fill="#fff" stroke="#169BD5" stroke-width="1.4"><title>{{ trend.labels[i] }}　{{ v }} 万</title></circle>
            <text v-for="(l,i) in trend.labels" :key="'l'+i" v-show="i%2===0" :x="px(i)" :y="196"
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
            <div class="bar"><i :style="{ width: c.pct * 1.9 + '%', background: c.color }"></i></div>
            <span class="pc">{{ c.pct }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 12px">
      <div class="card-head"><h3>渠道经营明细</h3><span class="extra">GMV 单位：万元</span></div>
      <el-table :data="channels" size="small">
        <el-table-column label="渠道" min-width="120">
          <template #default="{ row }"><span class="dot" :style="{background: row.color}"></span>{{ row.name }}</template>
        </el-table-column>
        <el-table-column prop="orders" label="订单量" align="right" min-width="90" />
        <el-table-column prop="gmv" label="GMV" align="right" min-width="90" />
        <el-table-column prop="aov" label="客单价" align="right" min-width="90" />
        <el-table-column label="毛利率" align="right" min-width="90">
          <template #default="{ row }">{{ row.rate }}%</template>
        </el-table-column>
        <el-table-column label="差异单" align="right" min-width="90">
          <template #default="{ row }">{{ row.diff || '—' }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

const kpis = [
  { label: '销售额 GMV', value: '1,286.4', unit: '万', desc: '环比 ↑12.4%　同比 ↑8.1%' },
  { label: '订单量', value: '106,820', unit: '单', desc: '客单价 ￥120.4' },
  { label: '毛利额 / 毛利率', value: '436.5', unit: '万', desc: '毛利率 33.9%' },
  { label: '库存积压（>90天）', value: '23.6', unit: '万', warn: true, desc: '占用资金 ￥131.4 万' },
  { label: '待处理差异', value: '38', unit: '笔', warn: true, desc: '差异金额 ￥4,260' }
]

const channels = [
  { name: '天猫', color: '#169BD5', orders: 49140, gmv: 591.7, aov: 120.4, rate: 32.4, diff: 14 },
  { name: '抖音', color: '#8C7AE6', orders: 33110, gmv: 398.8, aov: 120.4, rate: 30.1, diff: 10 },
  { name: '京东自营', color: '#1E8E5A', orders: 15180, gmv: 180.1, aov: 118.6, rate: 36.8, diff: 6 },
  { name: '自营小程序', color: '#B26A00', orders: 6420, gmv: 77.2, aov: 120.2, rate: 38.2, diff: 8 },
  { name: '门店', color: '#8A949E', orders: 2970, gmv: 38.6, aov: 129.9, rate: 41.5, diff: 0 }
]

const trend = {
  labels: ['11-03','11-04','11-05','11-06','11-07','11-08','11-09','11-10','11-11','11-12','11-13','11-14','11-15'],
  series: [82.4, 88.1, 91.6, 86.3, 79.2, 84.7, 93.5, 96.2, 268.4, 142.6, 118.3, 126.7, 131.2]
}

const share = (() => {
  const total = channels.reduce((s, c) => s + c.gmv, 0)
  return channels.map(c => ({ ...c, pct: +(c.gmv / total * 100).toFixed(1) }))
})()

const px = i => 40 + (648 - 40) * i / (trend.labels.length - 1)
const py = v => 14 + (176 - 14) * (1 - v / 300)
const line = trend.series.map((v, i) => `${px(i)},${py(v)}`).join(' ')
const area = `40,${py(0)} ${line} ${px(trend.series.length - 1)},${py(0)}`
</script>

<style scoped>
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
@media (max-width: 1280px) { .kpis { grid-template-columns: repeat(3, 1fr); } .grid2 { grid-template-columns: 1fr; } }
</style>
