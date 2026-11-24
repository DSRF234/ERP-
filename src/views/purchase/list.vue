<template>
  <div>
    <PageHeader title="采购订单" sub="采购单全流程：新建 → 审核 → 进行中 → 已完成">
      <el-button v-can="'b-purchase-create'" size="small" type="primary" :icon="Plus" @click="router.push('/purchase/create')">新建采购单</el-button>
      <el-button v-can="'b-supplier-view'" size="small" @click="drawer = true">供应商管理</el-button>
    </PageHeader>

    <StatCards :items="stats" />

    <div class="toolbar">
      <el-input v-model="kw" size="small" style="width: 240px" clearable :prefix-icon="Search"
        placeholder="输入采购单编号/采购员/制单人/物流公司" />
      <el-button size="small" type="primary" @click="page = 1">搜索</el-button>
      <el-select v-model="status" size="small" style="width: 118px">
        <el-option label="全部状态" value="all" />
        <el-option v-for="s in STATUS" :key="s" :label="s" :value="s" />
      </el-select>
      <el-select v-model="category" size="small" style="width: 124px">
        <el-option label="全部货品类型" value="all" />
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="warehouse" size="small" style="width: 140px">
        <el-option label="全部收货仓" value="all" />
        <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
      </el-select>
      <span class="grow">共 {{ view.length }} 单</span>
    </div>

    <div class="card">
      <el-table :data="tableRows" size="small" class="order-table" :span-method="spanMethod">
        <el-table-column label="采购编号" width="114">
          <template #default="{ row }"><span class="mono">{{ row.order.no }}</span></template>
        </el-table-column>
        <el-table-column label="采购员" width="56">
          <template #default="{ row }">{{ row.order.buyer }}</template>
        </el-table-column>
        <el-table-column label="制单人" width="56">
          <template #default="{ row }">{{ row.order.creator }}</template>
        </el-table-column>
        <el-table-column label="供应商" width="76" show-overflow-tooltip>
          <template #default="{ row }">{{ row.order.supplier }}</template>
        </el-table-column>
        <el-table-column label="收货仓" width="64">
          <template #default="{ row }">{{ row.order.warehouse }}</template>
        </el-table-column>

        <el-table-column label="采购货品" width="82" show-overflow-tooltip>
          <template #default="{ row }">{{ row.item.name }}</template>
        </el-table-column>
        <el-table-column label="规格" width="58">
          <template #default="{ row }">{{ row.item.spec }}</template>
        </el-table-column>
        <el-table-column label="单价" width="64" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.item.price) }}</span></template>
        </el-table-column>
        <el-table-column label="采购数量" width="64" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.item.qty) }}{{ row.item.unit }}</span></template>
        </el-table-column>
        <el-table-column label="采购金额" width="92" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.item.price * row.item.qty) }}</span></template>
        </el-table-column>
        <el-table-column label="货品类型" width="66">
          <template #default="{ row }">{{ row.item.category || row.order.category }}</template>
        </el-table-column>

        <el-table-column label="采购时间" width="78">
          <template #default="{ row }"><span class="mono">{{ row.order.date }}</span></template>
        </el-table-column>
        <el-table-column label="物流公司 / 单号" width="104" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="two-line">
              <span>{{ row.order.logistics }}</span>
              <em class="mono">{{ row.order.expressNo }}</em>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="运费" width="62" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.order.freight) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="58">
          <template #default="{ row }">
            <el-tag size="small" :type="TAG[row.order.status]">{{ row.order.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="106" fixed="right">
          <template #default="{ row }">
            <span class="ops">
            <el-button v-can="'b-purchase-audit'" v-if="row.order.status === '待审核'" link type="primary" size="small"
              @click="openAudit(row.order)">审批</el-button>
            <el-button v-can="'b-purchase-inbound'" v-if="row.order.status === '进行中'" link type="success" size="small"
              @click="warehousing(row.order)">确认入库</el-button>
            <el-button v-can="'b-purchase-delete'" link type="danger" size="small"
              @click="remove(row.order)">删除</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]" :total="view.length"
          layout="total, sizes, prev, pager, next" small background />
      </div>
    </div>

    <!-- 供应商管理抽屉 -->
    <el-drawer v-model="drawer" title="供应商管理" size="960px">
      <SupplierPanel />
    </el-drawer>

    <!-- 审核弹窗 -->
    <el-dialog v-model="audit.visible" title="审核" width="820px" align-center class="audit-dlg">
      <div class="audit-info">
        <div class="ai-item">
          <label>供货商</label>
          <div class="ai-val">{{ audit.row?.supplier }}</div>
        </div>
        <div class="ai-item">
          <label>制单人</label>
          <div class="ai-val">{{ audit.row?.creator }}</div>
        </div>
        <div class="ai-item">
          <label>制单时间</label>
          <div class="ai-val">{{ audit.row?.date }}</div>
        </div>
        <div class="ai-item">
          <label>采购金额</label>
          <div class="ai-val">{{ money(auditAmount) }}</div>
        </div>
        <div class="ai-item">
          <label>运费</label>
          <div class="ai-val">{{ money(audit.row?.freight) }}</div>
        </div>
        <div class="ai-item payable">
          <label>应付金额（采购金额 + 运费）</label>
          <div class="ai-val strong">{{ money(auditAmount + Number(audit.row?.freight || 0)) }}</div>
        </div>
        <div class="ai-item">
          <label>当前状态</label>
          <div class="ai-val">{{ audit.row?.status }}</div>
        </div>
      </div>

      <div class="sec-title">采购货品</div>
      <el-table :data="auditItems" size="small" empty-text="暂无货品明细" show-summary
        :summary-method="auditSummary">
        <el-table-column type="index" label="序号" width="56" />
        <el-table-column prop="name" label="采购货品" min-width="120" />
        <el-table-column prop="spec" label="规格" width="110" />
        <el-table-column label="单价" width="96" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.price) }}</span></template>
        </el-table-column>
        <el-table-column label="采购数量" width="104" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.qty) }}{{ row.unit }}</span></template>
        </el-table-column>
        <el-table-column label="采购金额" width="118" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.price * row.qty) }}</span></template>
        </el-table-column>
        <el-table-column prop="category" label="货品类型" width="104" />
      </el-table>

      <div class="sec-title" style="margin-top: 16px">驳回原因</div>
      <el-input v-model="audit.reason" type="textarea" :rows="4" maxlength="200" show-word-limit
        placeholder="驳回时必填，审核通过可不填；填写后会通知该制单人" />

      <div class="dlg-act">
        <el-button size="small" @click="reject">驳回</el-button>
        <el-button size="small" type="primary" @click="approve">审核通过</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCards from '@/components/StatCards.vue'
import SupplierPanel from '@/components/purchase/SupplierPanel.vue'
import { money } from '@/utils/format'
import { usePurchaseStore, amountOf } from '@/stores/purchase'

defineOptions({ name: 'PurchaseList' })

const router = useRouter()
const route = useRoute()
const purchase = usePurchaseStore()

const STATUS = ['待审核', '进行中', '已完成', '已驳回']
const TAG = { 待审核: 'info', 进行中: 'warning', 已完成: 'success', 已驳回: 'danger' }

const kw = ref(String(route.query.kw || ''))
const status = ref('all')
const category = ref('all')
const warehouse = ref('all')
const page = ref(1)
const pageSize = ref(10)
const drawer = ref(false)

const categories = computed(() => [...new Set(purchase.list.map(r => r.category).filter(Boolean))])
const warehouses = computed(() => [...new Set(purchase.list.map(r => r.warehouse).filter(Boolean))])

/** 单据级筛选（搜索支持编号/采购员/制单人/物流/供应商 + 货品名） */
const view = computed(() => purchase.list.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.no, r.buyer, r.creator, r.logistics, r.supplier, r.expressNo,
    ...(r.items || []).map(i => i.name)].some(v => String(v).includes(k))
  const okStatus = status.value === 'all' || r.status === status.value
  const okCat = category.value === 'all' || r.category === category.value ||
    (r.items || []).some(i => i.category === category.value)
  const okWh = warehouse.value === 'all' || r.warehouse === warehouse.value
  return okKw && okStatus && okCat && okWh
}))

/* ---------------- 一行一货品：单据字段纵向合并 ---------------- */
const pagedOrders = computed(() => view.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const tableRows = computed(() => pagedOrders.value.flatMap(order => {
  const items = order.items && order.items.length
    ? order.items
    : [{ name: '—', spec: '—', price: 0, qty: 0, unit: '', category: order.category }]
  return items.map((item, i) => ({ order, item, itemIndex: i, rowspan: i === 0 ? items.length : 0 }))
}))
/** 单据级列索引：这些列在首行向下合并 */
const MERGE_COLS = [0, 1, 2, 3, 4, 11, 12, 13, 14, 15]
function spanMethod({ row, columnIndex }) {
  if (!MERGE_COLS.includes(columnIndex)) return { rowspan: 1, colspan: 1 }
  if (row.itemIndex === 0) return { rowspan: row.rowspan, colspan: 1 }
  return { rowspan: 0, colspan: 0 }
}

/* ---------------- 统计卡：金额与运费按筛选结果全量合计（PRD 4.1） ---------------- */
const sum = (arr, key) => arr.reduce((s, r) => s + Number(r[key] || 0), 0)
const wan = v => (v >= 10000 ? `${(v / 10000).toFixed(2)} 万元` : `${v.toLocaleString('zh-CN')} 元`)
const stats = computed(() => {
  const all = view.value
  return [
    { label: '总采购订单', value: all.length, unit: '单' },
    { label: '已完成订单', value: all.filter(r => r.status === '已完成').length, unit: '单' },
    { label: '进行中订单', value: all.filter(r => r.status === '进行中').length, unit: '单', tone: 'warn' },
    { label: '未审核订单', value: all.filter(r => r.status === '待审核').length, unit: '单', tone: 'warn' },
    { label: '总采购金额', value: wan(sum(all, 'amount')) },
    { label: '总运费金额', value: wan(sum(all, 'freight')) }
  ]
})

watch([() => view.value.length, pageSize], () => {
  const max = Math.max(1, Math.ceil(view.value.length / pageSize.value))
  if (page.value > max) page.value = max
})
watch(() => route.query.kw, v => { kw.value = String(v || '') })

const num = v => Number(v || 0).toLocaleString('zh-CN')

/* ---------------- 删除 ---------------- */
async function remove(row) {
  try {
    await ElMessageBox.confirm(`是否删除采购单【${row.no}】？删除后不可恢复。`, '删除采购单', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    const res = purchase.remove(row.no)
    res.ok ? ElMessage.success('已删除') : ElMessage.error(res.msg)
  } catch (e) { /* 取消 */ }
}

/* ---------------- 审核 ---------------- */
const audit = reactive({ visible: false, row: null, reason: '' })
const auditItems = computed(() => audit.row?.items || [])
const auditAmount = computed(() => (audit.row ? amountOf(audit.row) : 0))
function auditSummary({ columns, data }) {
  const out = []
  columns.forEach((col, i) => {
    if (i === 0) out[i] = '合计'
    else if (i === 5) out[i] = money(data.reduce((s, r) => s + Number(r.price || 0) * Number(r.qty || 0), 0))
    else out[i] = ''
  })
  return out
}

function openAudit(row) {
  audit.row = row
  audit.reason = ''
  audit.visible = true
}
function approve() {
  const res = purchase.approve(audit.row.no)
  if (!res.ok) return ElMessage.error(res.msg)
  audit.visible = false
  ElMessage.success(`采购单 ${audit.row.no} 审核通过，状态变为「进行中」`)
}
function reject() {
  const res = purchase.reject(audit.row.no, audit.reason)
  if (!res.ok) return ElMessage.error(res.msg)
  audit.visible = false
  ElMessage.success(`已驳回并通知制单人 ${res.to}（顶栏铃铛可查看）`)
}

/* ---------------- 确认入库 ---------------- */
function warehousing(row) {
  const total = (row.items || []).reduce((s, i) => s + Number(i.qty || 0), 0)
  ElMessageBox.confirm(
    `采购单 ${row.no} 将按收货仓「${row.warehouse}」入库，共 ${row.items.length} 个货品、合计 ${num(total)} 件；入库后单据转为「已完成」，库存记录同步增加。`,
    '确认入库', { type: 'warning', confirmButtonText: '确认入库' }
  ).then(() => {
    const res = purchase.inbound(row.no)
    if (!res.ok) return ElMessage.error(res.msg)
    ElMessage.success(`入库完成：${row.warehouse} 库存 +${num(res.total)}，可在「库存记录」查看`)
  }).catch(() => {})
}
</script>

<style scoped>
.strong { font-weight: 600; }
.order-table :deep(.el-table__cell) { font-size: 11.5px; }
.order-table :deep(.cell) { padding: 0 6px; }
.order-table .ops { display: flex; gap: 2px; align-items: center; white-space: nowrap; }
.two-line { display: flex; flex-direction: column; line-height: 1.35; }
.two-line em { font-style: normal; font-size: 10.5px; color: var(--ink-3); }

/* 审核弹窗 */
.audit-dlg :deep(.el-dialog__header) {
  padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--line-2);
}
.audit-info {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 16px;
  padding: 16px; background: #F5F6F8; border-radius: 6px;
}
.ai-item label { display: block; margin-bottom: 6px; font-size: 12px; color: var(--ink-2); }
.ai-val {
  height: 30px; line-height: 28px; padding: 0 9px;
  background: #fff; border: 1px solid var(--line); border-radius: 4px;
  font-size: 12.5px; color: var(--ink);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ai-item.payable .ai-val { border-color: var(--brand); background: var(--brand-l); color: var(--brand-d); }
.sec-title { margin: 16px 0 8px; font-size: 13px; font-weight: 600; color: var(--ink); }
</style>
