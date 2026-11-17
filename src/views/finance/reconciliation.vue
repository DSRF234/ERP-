<template>
  <div>
    <PageHeader title="对账中心" sub="核对平台账单的实际到账金额">
      <el-button size="small">导出</el-button>
    </PageHeader>

    <div class="kpis">
      <div class="kpi"><div class="k">订单金额合计</div><div class="v">{{ money(sum.order) }}</div></div>
      <div class="kpi"><div class="k">平台结算金额合计</div><div class="v">{{ money(sum.settle) }}</div></div>
      <div class="kpi"><div class="k">实际到账合计</div><div class="v">{{ money(sum.actual) }}</div></div>
      <div class="kpi warn"><div class="k">未核对单据</div><div class="v">{{ unchecked }}<i>笔</i></div></div>
    </div>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="单据编号 / 店铺 / 商品名称" style="width: 240px" clearable />
      <el-select v-model="f.type" size="small" style="width: 140px" placeholder="全部单据类型">
        <el-option label="全部单据类型" value="" />
        <el-option label="销售出库" value="销售出库" />
        <el-option label="退货入库" value="退货入库" />
      </el-select>
      <el-button size="small" type="primary">查询</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>平台账单</h3>
        <span class="extra">核对后单据收录，不可再修改</span>
      </div>
      <el-table :data="view" size="small" max-height="560">
        <el-table-column prop="no" label="单据编号" width="160" />
        <el-table-column prop="shop" label="店铺" min-width="160" />
        <el-table-column prop="goods" label="商品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="time" label="下单时间" width="150" />
        <el-table-column prop="type" label="单据类型" width="110" />
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
            <el-tag size="small" :type="row.checked ? 'success' : 'warning'">{{ row.checked ? '已核对' : '待核对' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :disabled="row.checked" @click="check(row)">核对</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="tip">
      <b>约束</b>　只有财务人员能操作财务板块，其他业务人员及领导无权操作，财务部门领导只能查看。
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { money } from '@/utils/format'

const kw = ref('')
const f = reactive({ type: '' })

const rows = ref([
  { no: 'DZ20261116001', shop: '天猫 · 星野优选旗舰店', goods: '雅诗兰黛小棕瓶 50ml', time: '2026-11-16 10:22',
    type: '销售出库', qty: 2, amount: 1286, settle: 64.30, actual: 1221.70, checked: false },
  { no: 'DZ20261116002', shop: '抖音 · 官方旗舰店', goods: '星野纯棉四件套', time: '2026-11-16 09:41',
    type: '销售出库', qty: 1, amount: 459, settle: 0, actual: 459, checked: false },
  { no: 'DZ20261116003', shop: '小程序 · 商城', goods: '星野香薰礼盒', time: '2026-11-16 08:05',
    type: '销售出库', qty: 1, amount: 168, settle: 0, actual: 168, checked: true },
  { no: 'DZ20261115008', shop: '天猫 · 星野优选旗舰店', goods: '兰蔻小黑瓶 30ml', time: '2026-11-15 21:40',
    type: '销售出库', qty: 1, amount: 899, settle: 26.97, actual: 872.03, checked: false },
  { no: 'DZ20261115011', shop: '抖音 · 官方旗舰店', goods: '星野收纳箱 大号', time: '2026-11-15 18:12',
    type: '退货入库', qty: 1, amount: -528, settle: 0, actual: -528, checked: true }
])

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.no, r.shop, r.goods].some(v => String(v).includes(k))
  const okT = !f.type || r.type === f.type
  return okKw && okT
}))
const reset = () => { kw.value = ''; f.type = '' }

const sum = computed(() => view.value.reduce((s, r) => ({
  order: s.order + r.amount, settle: s.settle + r.settle, actual: s.actual + r.actual
}), { order: 0, settle: 0, actual: 0 }))
const unchecked = computed(() => rows.value.filter(r => !r.checked).length)

function check(row) {
  row.checked = true
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
