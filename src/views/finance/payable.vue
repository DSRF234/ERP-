<template>
  <div>
    <PageHeader title="应付账款台账" sub="采购单应付 · 总金额与状态">
      <el-button v-can="'b-fin-payable-export'" size="small">导出</el-button>
    </PageHeader>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="采购单编号 / 采购商品" style="width: 220px" clearable />
      <el-select v-model="f.status" size="small" style="width: 140px" placeholder="全部状态">
        <el-option label="全部状态" value="" />
        <el-option v-for="s in STATUS" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button size="small" type="primary">查找</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 条 · 应付合计 {{ money(sumTotal) }}</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>应付账款台账</h3>
        <span class="extra">储存所有采购订单与需财务支出的订单</span>
      </div>
      <el-table :data="view" size="small" max-height="560">
        <el-table-column prop="no" label="采购单编号" width="150" />
        <el-table-column prop="warehouse" label="收货仓" width="110" />
        <el-table-column prop="goods" label="采购商品" min-width="200" show-overflow-tooltip />
        <el-table-column prop="date" label="采购时间" width="120" />
        <el-table-column label="采购金额" width="110" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.amount) }}</span></template>
        </el-table-column>
        <el-table-column label="运费" width="90" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.freight) }}</span></template>
        </el-table-column>
        <el-table-column label="总金额" width="120" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.total) }}</span></template>
        </el-table-column>
        <el-table-column label="采购单状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="TAG[row.status] || 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="应付确认" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.checked" size="small" type="success" effect="plain">已确认</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-can="'b-fin-payable-audit'" link type="primary" size="small" @click="openAudit(row)">审核</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 审核：展示该采购单全部信息 -->
    <el-drawer v-model="drawer" size="560px" :title="'应付审核 · ' + (cur ? cur.no : '')">
      <template v-if="cur">
        <div class="sec-t">采购单信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="采购单编号">{{ cur.no }}</el-descriptions-item>
          <el-descriptions-item label="收货仓">{{ cur.warehouse }}</el-descriptions-item>
          <el-descriptions-item label="采购时间">{{ cur.date }}</el-descriptions-item>
          <el-descriptions-item label="采购单状态">
            <el-tag size="small" :type="TAG[cur.status] || 'info'">{{ cur.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="采购金额">{{ money(cur.amount) }}</el-descriptions-item>
          <el-descriptions-item label="运费">{{ money(cur.freight) }}</el-descriptions-item>
          <el-descriptions-item label="应付总金额">{{ money(cur.total) }}</el-descriptions-item>
          <el-descriptions-item label="采购数量">{{ curItems.reduce((s,i)=>s+i.qty,0) }} 件</el-descriptions-item>
          <el-descriptions-item label="应付确认">{{ cur.checked ? '已确认' : '待确认' }}</el-descriptions-item>
        </el-descriptions>

        <div class="sec-t" style="margin-top:16px">采购货品明细</div>
        <el-table :data="curItems" size="small" border>
          <el-table-column type="index" label="序号" width="56" />
          <el-table-column prop="no" label="货品编码" width="130" />
          <el-table-column prop="name" label="采购货品" min-width="150" />
          <el-table-column prop="qty" label="数量" width="90" align="right" />
          <el-table-column label="单价" width="100" align="right">
            <template #default="{ row }">{{ money(row.price) }}</template>
          </el-table-column>
          <el-table-column label="金额" width="110" align="right">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </el-table-column>
        </el-table>

        <div class="sec-t" style="margin-top:16px">付款信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="供应商">{{ cur.ref.supplier }}</el-descriptions-item>
          <el-descriptions-item label="结算方式">月结 30 天</el-descriptions-item>
          <el-descriptions-item label="应付款日">{{ cur.date }}</el-descriptions-item>
          <el-descriptions-item label="付款状态">
            {{ cur.checked ? '已确认应付，待付款' : '未确认' }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <template #footer>
        <el-button @click="drawer = false">关闭</el-button>
        <el-button v-can="'b-fin-payable-confirm'" type="primary" :disabled="!cur || cur.checked" @click="confirmPayable">
          {{ cur && cur.checked ? '已确认应付' : '确认应付' }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { money } from '@/utils/format'
import { purchaseOrders, totalOf, payableOf, qtyOf, checkPayable } from '@/data/purchase'

const STATUS = ['待审核', '进行中', '已完成', '已驳回']
const TAG = { 待审核: 'info', 进行中: 'warning', 已完成: 'success', 已驳回: 'danger' }

const kw = ref('')
const f = reactive({ status: '' })
const drawer = ref(false)
const cur = ref(null)

const rows = computed(() => purchaseOrders.map(o => ({
  no: o.no,
  warehouse: o.warehouse,
  goods: o.items.map(i => `${i.name} ×${i.qty}`).join('、') || '—',
  date: o.date,
  amount: totalOf(o),
  freight: o.freight,
  total: payableOf(o),
  status: o.status,
  checked: o.payableChecked,
  items: o.items,
  ref: o
})))

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.no, r.goods].some(v => String(v).includes(k))
  const okS = !f.status || r.status === f.status
  return okKw && okS
}))

const sumTotal = computed(() => view.value.reduce((s, r) => s + r.total, 0))
const reset = () => { kw.value = ''; f.status = '' }

const curItems = computed(() => {
  if (!cur.value) return []
  return (cur.value.items || []).map(i => ({
    no: i.code, name: i.name, spec: i.spec,
    qty: i.qty, price: i.price, amount: i.price * i.qty
  }))
})

function openAudit(row) {
  cur.value = row
  drawer.value = true
}

function confirmPayable() {
  if (!cur.value) return
  const res = checkPayable(cur.value.no)
  if (!res.ok) { ElMessage.error(res.msg); return }
  drawer.value = false
  ElMessage.success(`${cur.value.no} 应付账款已确认，合计 ${money(cur.value.total)}`)
}
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.sec-t { font-size: 12.5px; font-weight: 600; margin-bottom: 9px; padding-left: 8px; border-left: 3px solid var(--brand); }
.muted { color: var(--ink-3); }
</style>
