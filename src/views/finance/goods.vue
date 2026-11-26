<template>
  <div>
    <PageHeader title="商品信息" sub="商品毛利表 · 收入 / 成本 / 毛利率" />

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="商品编码 / 名称 / 型号" style="width: 220px" clearable />
      <el-select v-model="supplier" size="small" style="width: 180px" placeholder="全部供应商">
        <el-option label="全部供应商" value="" />
        <el-option v-for="s in suppliers" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 款 · 毛利合计 {{ money(sumProfit) }}</span>
    </div>

    <div class="card">
      <el-table :data="view" size="small" max-height="580">
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
          <el-table-column label="收入" width="112" align="right">
            <template #default="{ row }"><span class="mono">{{ money(row.revenue) }}</span></template>
          </el-table-column>
          <el-table-column label="成本" width="112" align="right">
            <template #default="{ row }"><span class="mono">{{ money(row.cost) }}</span></template>
          </el-table-column>
          <el-table-column label="毛利额" width="112" align="right">
            <template #default="{ row }"><span class="mono strong">{{ money(row.profit) }}</span></template>
          </el-table-column>
          <el-table-column label="毛利率" width="92" align="right">
            <template #default="{ row }">
              <el-tag size="small" :type="row.rate >= 40 ? 'success' : 'warning'" effect="plain">{{ row.rate }}%</el-tag>
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

const kw = ref('')
const supplier = ref('')

/* 编码、型号、供应商与库存中心保持一致；收入 / 成本为演示用的经营数据 */
const rows = [
  { code: 'SKU-100231', name: '雅诗兰黛小棕瓶', spec: '50ml', supplier: '广州雅美化妆品', qty: 1864, revenue: 309000, cost: 136000 },
  { code: 'SKU-100188', name: '兰蔻小黑瓶', spec: '30ml', supplier: '广州雅美化妆品', qty: 986, revenue: 412000, cost: 207000 },
  { code: 'SKU-200118', name: '星野纯棉四件套', spec: '1.8m 灰', supplier: '南通家纺制造厂', qty: 2140, revenue: 386000, cost: 216000 },
  { code: 'SKU-300045', name: '星野香薰礼盒', spec: '3件装', supplier: '深圳香氛实业', qty: 3120, revenue: 284000, cost: 149000 },
  { code: 'SKU-400011', name: '星野收纳箱', spec: '大号', supplier: '台州塑料制品', qty: 1680, revenue: 268000, cost: 152000 },
  { code: 'SE-2026-001', name: '洗面奶', spec: '100g/支', supplier: '某林林公司', qty: 2400, revenue: 216000, cost: 132000 },
  { code: 'SE-2026-002', name: '眼睫毛膏', spec: '5ml', supplier: '美妆公司', qty: 760, revenue: 128000, cost: 74000 }
].map(r => ({
  ...r,
  profit: r.revenue - r.cost,
  rate: +((r.revenue - r.cost) / r.revenue * 100).toFixed(1)
}))

const suppliers = computed(() => [...new Set(rows.map(r => r.supplier))])

const view = computed(() => rows.filter(r => {
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
.strong { font-weight: 600; color: var(--ink); }
</style>
