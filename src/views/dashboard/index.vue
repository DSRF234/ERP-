<template>
  <div>
    <PageHeader title="经营数据看板" sub="统计区间 2026-11-01 ~ 11-15 · 数据更新至 11-15 24:00" />

    <div class="grid grid-5" style="margin-bottom: 12px">
      <StatCard v-for="k in data.kpis" :key="k.label" v-bind="k" />
    </div>

    <div class="grid grid-2" style="margin-bottom: 12px">
      <div class="card">
        <div class="card-head">
          <h3>销售额趋势</h3>
          <span class="extra">单位：万元　·　11-11 大促 268.4 万</span>
        </div>
        <div style="padding: 8px 12px 4px">
          <TrendChart :labels="data.trend.labels" :series="data.trend.series" :max="300" />
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>渠道销售占比</h3><span class="extra">按 GMV</span></div>
        <div style="padding: 12px 16px">
          <div v-for="c in share" :key="c.name" class="share-row">
            <span class="dot" :style="{ background: c.color }"></span>
            <span class="name">{{ c.name }}</span>
            <div class="bar"><i :style="{ width: c.pct * 1.9 + '%', background: c.color }"></i></div>
            <span class="pct">{{ c.pct }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-3">
      <div class="card">
        <div class="card-head"><h3>渠道经营明细</h3><span class="extra">GMV 单位：万元</span></div>
        <el-table :data="data.channels" size="small" :show-header="true">
          <el-table-column label="渠道" min-width="120">
            <template #default="{ row }">
              <span class="dot" :style="{ background: row.color }"></span>{{ row.name }}
            </template>
          </el-table-column>
          <el-table-column prop="orders" label="订单量" align="right" min-width="86">
            <template #default="{ row }">{{ row.orders.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="gmv" label="GMV" align="right" min-width="72" />
          <el-table-column prop="aov" label="客单价" align="right" min-width="72" />
          <el-table-column label="毛利率" align="right" min-width="72">
            <template #default="{ row }">{{ row.rate }}%</template>
          </el-table-column>
          <el-table-column label="差异单" align="right" min-width="72">
            <template #default="{ row }">{{ row.diff || '—' }}</template>
          </el-table-column>
        </el-table>
      </div>

      <div class="card">
        <div class="card-head"><h3>待办提醒</h3><span class="extra">共 4 项</span></div>
        <div style="padding: 4px 16px 10px">
          <div v-for="t in data.todos" :key="t.title" class="todo">
            <i class="bar" :class="t.level"></i>
            <div class="txt">
              <div class="t">{{ t.title }}</div>
              <div class="s">{{ t.desc }}</div>
            </div>
            <div class="n">{{ t.value }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>本周重点</h3></div>
        <div style="padding: 16px; font-size: 12.5px; line-height: 2; color: var(--text2)">
          <p>· 大促后遗症：11-11 订单退货率预计上浮 2pt，注意售后工单承接。</p>
          <p>· 华南仓积压 TOP1 香薰礼盒已超 150 天，建议本周出清仓方案。</p>
          <p>· 京东自营代发佣金口径待确认，影响 R8 类差异 6 笔。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import TrendChart from '@/components/TrendChart.vue'
import { getDashboard } from '@/api'

const data = ref({ kpis: [], trend: { labels: [], series: [] }, channels: [], todos: [] })

const share = computed(() => {
  const total = data.value.channels.reduce((s, c) => s + c.gmv, 0) || 1
  return data.value.channels.map(c => ({ ...c, pct: +(c.gmv / total * 100).toFixed(1) }))
})

onMounted(async () => { data.value = await getDashboard() })
</script>

<style scoped>
.share-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; }
.share-row .name { width: 78px; font-size: 12.5px; }
.share-row .bar { flex: 1; height: 10px; background: #f5f7fa; border-radius: 3px; overflow: hidden; }
.share-row .bar i { display: block; height: 100%; border-radius: 3px; }
.share-row .pct { width: 44px; text-align: right; font-size: 12px; color: var(--text3); font-variant-numeric: tabular-nums; }

.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 7px; vertical-align: 1px; }

.todo { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px dashed #f0f2f5; }
.todo:last-child { border-bottom: none; }
.todo .bar { width: 3px; border-radius: 2px; flex: none; background: var(--blue); }
.todo .bar.a { background: var(--red); }
.todo .bar.b { background: var(--amber); }
.todo .bar.c { background: var(--green); }
.todo .txt { flex: 1; }
.todo .t { font-size: 12.5px; }
.todo .s { font-size: 11.5px; color: var(--text3); margin-top: 3px; }
.todo .n { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
</style>
