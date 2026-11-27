<template>
  <div>
    <PageHeader title="商品信息" sub="商品毛利表 · 成本单价取自采购单价，成本 = 单价 × 销量">
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
          <el-table-column label="商品编码" width="118">
            <template #default="{ row }"><span class="mono">{{ row.spu }}</span></template>
          </el-table-column>
          <el-table-column label="SKU 码" width="126">
            <template #default="{ row }"><span class="mono">{{ row.code }}</span></template>
          </el-table-column>
          <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="spec" label="规格型号" width="100" />
          <el-table-column prop="category" label="货品类型" width="92" />
          <el-table-column prop="supplier" label="供应商" min-width="140" show-overflow-tooltip />
        </el-table-column>

        <el-table-column label="经营数据" align="center">
          <el-table-column prop="qty" label="销量" width="70" align="right" />
          <el-table-column label="收入" width="104" align="right">
            <template #default="{ row }"><span class="mono">{{ money(row.revenue) }}</span></template>
          </el-table-column>
          <el-table-column label="进货单价" width="104" align="right">
            <template #default="{ row }">
              <span class="mono">{{ money(row.costPrice) }}</span>
              <el-tooltip :content="row.costFrom" placement="top">
                <el-icon class="src"><InfoFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="成本" width="104" align="right">
            <template #default="{ row }"><span class="mono">{{ money(row.cost) }}</span></template>
          </el-table-column>
          <el-table-column label="毛利额" width="104" align="right">
            <template #default="{ row }">
              <span class="mono strong" :class="{ neg: row.profit < 0 }">{{ money(row.profit) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="毛利率" width="84" align="right">
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
import { InfoFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { money } from '@/utils/format'
import { useOrderStore } from '@/stores/order'
import { skuOf } from '@/data/sku'
import { purchaseOrders } from '@/data/purchase'

/** 各 SKU 的采购单价：只统计已完成（已入库）的采购单，按数量加权平均 */
const purchaseCost = computed(() => {
  const acc = new Map()
  purchaseOrders
    .filter(o => o.status === '已完成')
    .forEach(o => (o.items || []).forEach(i => {
      const cur = acc.get(i.code) || { amt: 0, qty: 0 }
      cur.amt += i.price * i.qty
      cur.qty += i.qty
      acc.set(i.code, cur)
    }))
  const out = new Map()
  acc.forEach((v, k) => { if (v.qty) out.set(k, v.amt / v.qty) })
  return out
})

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
      /* 部分老单据的规格是空或「—」，遇到有效规格就补上，避免展示成「—」 */
      if ((!cur.spec || cur.spec === '—') && g.spec && g.spec !== '—') cur.spec = g.spec
      map.set(code, cur)
    })
  })

  return [...map.values()].map(r => {
    const master = skuOf(r.code)
    const fromPurchase = purchaseCost.value.get(r.code)
    const costPrice = fromPurchase ?? Number(master?.purchasePrice || 0)
    const costFrom = fromPurchase !== undefined
      ? '来自采购单价（已完成采购的加权平均）'
      : '暂无已完成采购，取库存初始成本'
    const cost = costPrice * r.qty
    const profit = r.revenue - cost
    return {
      ...r,
      spu: master.spu || '—',
      name: master.name || r.name,
      category: master.category || '—',
      spec: master.spec || r.spec,
      supplier: master.supplier || '—',
      costPrice,
      costFrom,
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
.src { margin-left: 4px; color: var(--ink-3); font-size: 12px; vertical-align: -1px; cursor: help; }
.scope { font-size: 12px; color: var(--ink-3); }
</style>
