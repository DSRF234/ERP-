<template>
  <div>
    <PageHeader title="发货数据" sub="已发货未结算 · 在途资金">
      <el-button size="small">导出</el-button>
    </PageHeader>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="订单号 / 平台单号" style="width: 220px" clearable />
      <el-select v-model="f.status" size="small" style="width: 150px" placeholder="全部状态">
        <el-option label="全部状态" value="" />
        <el-option label="运输中（未完结）" value="shipped" />
        <el-option label="已签收（已完结）" value="done" />
      </el-select>
      <el-button size="small" type="primary">查找</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>已发货未结算表</h3>
        <span class="extra">订单完结后自动进入本表，用于跟踪在途资金</span>
      </div>
      <el-table :data="view" size="small" max-height="580">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="no" label="订单号" width="160" />
        <el-table-column prop="channel" label="渠道" width="110" />
        <el-table-column prop="shipDate" label="发货日期" width="120" />
        <el-table-column label="订单金额" width="120" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.amount) }}</span></template>
        </el-table-column>
        <el-table-column label="平台结算金额" width="130" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.settle) }}</span></template>
        </el-table-column>
        <el-table-column label="实际到账金额" width="130" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.actual) }}</span></template>
        </el-table-column>
        <el-table-column prop="expect" label="预计结算日期" width="130" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'done' ? 'success' : 'warning'">
              {{ row.status === 'done' ? '已签收' : '运输中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="110">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">系统推送</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { money } from '@/utils/format'
import { useOrderStore } from '@/stores/order'

const store = useOrderStore()
const kw = ref('')
const f = reactive({ status: '' })

function addDays(dt, n) {
  if (!dt) return '—'
  const d = new Date(dt.replace(/-/g, '/'))
  d.setDate(d.getDate() + n)
  const p = x => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const rows = computed(() => store.financeUnsettled.map(o => ({
  no: o.no,
  channel: o.platform + ' · ' + o.shop,
  shipDate: (o.shippedAt || '').slice(0, 10) || '—',
  amount: o.amount,
  settle: o.settle,
  actual: o.actual,
  expect: addDays(o.shippedAt, 7),
  status: o.status
})))

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || r.no.includes(k)
  const okS = !f.status || r.status === f.status
  return okKw && okS
}))
const reset = () => { kw.value = ''; f.status = '' }
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.tip { margin-top: 14px; padding: 12px 14px; background: var(--brand-l); border: 1px solid #BFE3F2;
  border-radius: 6px; font-size: 12.5px; color: #0E7FB2; }
.tip b { font-weight: 600; }
</style>
