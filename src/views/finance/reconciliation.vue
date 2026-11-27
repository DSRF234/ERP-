<template>
  <div>
    <PageHeader title="对账中心" sub="核对平台账单的实际到账金额">
      <el-button v-can="'b-fin-recon-export'" size="small">导出</el-button>
    </PageHeader>

    <div class="kpis">
      <div class="kpi"><div class="k">订单金额合计</div><div class="v">{{ money(sum.order) }}</div></div>
      <div class="kpi"><div class="k">平台结算金额合计</div><div class="v">{{ money(sum.settle) }}</div></div>
      <div class="kpi"><div class="k">实际到账合计</div><div class="v">{{ money(sum.actual) }}</div></div>
      <div class="kpi warn"><div class="k">待核对单据</div><div class="v">{{ unchecked }}<i>笔</i></div></div>
    </div>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="单据编号 / 店铺 / 商品名称" style="width: 240px" clearable />
      <el-button size="small" type="primary">查询</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>平台账单</h3>
        <span class="extra">订单完结后自动汇入，核对后收录不可修改</span>
      </div>
      <el-table :data="view" size="small" max-height="540">
        <el-table-column prop="no" label="单据编号" width="160" />
        <el-table-column prop="shop" label="店铺" min-width="170" />
        <el-table-column prop="goods" label="商品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="time" label="下单时间" width="145" />
        <el-table-column prop="qty" label="商品数量" width="90" align="right" />
        <el-table-column label="订单金额" width="110" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.amount) }}</span></template>
        </el-table-column>
        <el-table-column label="平台结算金额" width="130" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.settle) }}</span></template>
        </el-table-column>
        <el-table-column label="实际到账金额" width="130" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.actual) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.checked ? 'success' : 'warning'">
              {{ row.checked ? '已核对' : '待核对' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button v-can="'b-fin-recon-check'" link type="primary" size="small" :disabled="row.checked" @click="check(row)">核对</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { money } from '@/utils/format'
import { RECON_DEMO } from '@/data/finance'
import { useOrderStore } from '@/stores/order'

const store = useOrderStore()
const kw = ref('')

/** 已核对状态用本地 Map 记录，避免污染订单 store */
const checkedMap = ref({})

const rows = computed(() => {
  const fromOrders = store.financeToCheck.map(o => ({
    no: 'DZ' + o.no.slice(2),
    shop: o.platform + ' · ' + o.shop,
    goods: o.goods.map(g => g.name).join('、'),
    time: o.orderTime || o.payTime,
    type: '销售出库',
    qty: o.goods.reduce((s, g) => s + g.qty, 0),
    amount: o.amount,
    settle: o.settle,
    actual: o.actual,
    checked: !!checkedMap.value[o.no]
  }))

  return [...fromOrders, ...RECON_DEMO]
})

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.no, r.shop, r.goods].some(v => String(v).includes(k))
  return okKw
}))
const reset = () => { kw.value = '' }

const sum = computed(() => view.value.reduce((s, r) => ({
  order: s.order + r.amount, settle: s.settle + r.settle, actual: s.actual + r.actual
}), { order: 0, settle: 0, actual: 0 }))
const unchecked = computed(() => rows.value.filter(r => !r.checked).length)

function check(row) {
  const key = row.no.startsWith('DZ') ? row.no.replace(/^DZ/, '') : row.no
  const hit = store.orders.find(o => o.no === key || 'DZ' + o.no.slice(2) === row.no)
  if (hit) checkedMap.value = { ...checkedMap.value, [hit.no]: true }
  ElMessage.success(`单据 ${row.no} 已核对收录`)
}
</script>

<style scoped>
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
.kpi { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; }
.kpi .k { font-size: 12px; color: var(--ink-3); }
.kpi .v { font-size: 21px; font-weight: 600; margin-top: 7px; font-variant-numeric: tabular-nums; }
.kpi .v i { font-size: 13px; font-weight: 400; color: var(--ink-3); font-style: normal; margin-left: 3px; }
.kpi.warn .v { color: var(--warn); }
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.tip { margin-top: 14px; padding: 12px 14px; background: var(--brand-l); border: 1px solid #BFE3F2;
  border-radius: 6px; font-size: 12.5px; color: #0E7FB2; }
.tip b { font-weight: 600; }
</style>
