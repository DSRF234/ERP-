<template>
  <div>
    <PageHeader title="商品信息" sub="商品毛利表 · 收入 / 成本 / 毛利率">
      <span class="scope">口径：已发货 + 已完结订单</span>
    </PageHeader>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="商品编码 / 名称 / 型号" style="width: 220px" clearable />
      <el-select v-model="supplier" size="small" style="width: 180px" placeholder="全部供应商">
        <el-option label="全部供应商" value="" />
        <el-option v-for="s in suppliers" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">
        共 {{ view.length }} 款 · 毛利合计 <b>{{ money(sumProfit) }}</b>
      </span>
    </div>

    <div class="card">
      <el-table :data="view" size="small" max-height="580" empty-text="所选条件下暂无数据">
        <el-table-column type="index" label="序号" width="56" align="center" />

        <el-table-column label="商品基础信息" align="center">
          <el-table-column prop="code" label="商品编码" width="140">
            <template #default="{ row }"><span class="mono">{{ row.code }}</span></template>
          </el-table-column>
          <el-table-column prop="name" label="商品名称" min-width="170" show-overflow-tooltip />
          <el-table-column prop="spec" label="规格型号" width="120" />
          <el-table-column prop="supplier" label="供应商" min-width="170" show-overflow-tooltip />
        </el-table-column>

        <el-table-column label="经营数据" align="center">
          <el-table-column prop="qty" label="销量" width="84" align="right" />
          <el-table-column label="收入" width="118" align="right">
            <template #default="{ row }"><span class="mono">{{ money(row.revenue) }}</span></template>
          </el-table-column>
          <el-table-column label="成本" width="118" align="right">
            <template #default="{ row }"><span class="mono">{{ money(row.cost) }}</span></template>
          </el-table-column>
          <el-table-column label="毛利额" width="118" align="right">
            <template #default="{ row }">
              <span class="mono strong" :class="{ neg: row.profit < 0 }">{{ money(row.profit) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="毛利率" width="92" align="right">
            <template #default="{ row }">
              <el-tag size="small" :type="row.rate >= 40 ? 'success' : row.rate >= 20 ? 'warning' : 'danger'" effect="plain">
                {{ row.rate }}%
              </el-tag>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { money } from '@/utils/format'
import { useOrderStore } from '@/stores/order'
import { stockRows } from '@/data/stock'

const kw = ref('')
const supplier = ref('')
const orderStore = useOrderStore()

/** 只统计已发货 / 已完结的订单，未发货不计收入 */
const SOLD = ['shipped', 'done']

const rows = computed(() => {
  const map = new Map()

  orderStore.orders.filter(o => SOLD.includes(o.status)).forEach(o => {
    const goods = o.goods || []
    const totalQty = goods.reduce((s, g) => s + Number(g.qty || 0), 0) || 1
    const unit = Number(o.amount || 0) / totalQty      // 整单金额按件数分摊到单价

    goods.forEach(g => {
      const code = g.sku || '—'
      const cur = map.get(code) || {
        code,
        name: g.name || '—',
        spec: g.spec || '—',
        qty: 0,
        revenue: 0
      }
      cur.qty += Number(g.qty || 0)
      cur.revenue += unit * Number(g.qty || 0)
      map.set(code, cur)
    })
  })

  return [...map.values()].map(r => {
    const master = stockRows.find(x => x.code === r.code)
    const costPrice = Number(master?.costPrice || 0)
    const cost = costPrice * r.qty
    const profit = r.revenue - cost
    return {
      ...r,
      spec: master?.spec && master.spec !== '—' ? master.spec : r.spec,
      supplier: master?.supplier || '—',
      costPrice,
      cost,
      profit,
      rate: r.revenue ? +((profit / r.revenue) * 100).toFixed(1) : 0
    }
  }).sort((a, b) => b.revenue - a.revenue)
})

const suppliers = computed(() => [...new Set(rows.value.map(r => r.supplier))].filter(s => s && s !== '—'))

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.code, r.name, r.spec].some(v => String(v).includes(k))
  const okSup = !supplier.value || r.supplier === supplier.value
  return okKw && okSup
}))

const sumProfit = computed(() => view.value.reduce((s, r) => s + r.profit, 0))
const reset = () => { kw.value = ''; supplier.value = '' }
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.count b { color: var(--ink); font-weight: 600; }
.strong { font-weight: 600; color: var(--ink); }
.neg { color: var(--danger); }
.scope { font-size: 12px; color: var(--ink-3); }
</style>
