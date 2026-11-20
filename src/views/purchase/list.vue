<template>
  <div>
    <PageHeader title="采购订单" sub="采购单全流程：新建 → 审核 → 进行中 → 已完成">
      <el-button size="small" type="primary" :icon="Plus" @click="router.push('/purchase/create')">新建采购单</el-button>
      <el-button size="small" @click="drawer = true">供应商管理</el-button>
    </PageHeader>

    <StatCards :items="stats" />

    <div class="toolbar">
      <el-input v-model="kw" size="small" style="width: 240px" clearable :prefix-icon="Search"
        placeholder="输入采购单编号/采购员/物流公司" />
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
      <span class="grow">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <el-table :data="paged" size="small" class="order-table">
        <el-table-column prop="no" label="采购编号" width="120" />
        <el-table-column prop="buyer" label="采购员" width="76" />
        <el-table-column prop="supplier" label="供应商" min-width="120" show-overflow-tooltip />
        <el-table-column prop="warehouse" label="收货仓" width="86" />
        <el-table-column prop="date" label="采购时间" width="118" />
        <el-table-column prop="expressNo" label="物流单号" width="124" />
        <el-table-column prop="logistics" label="物流公司" width="86" />
        <el-table-column prop="category" label="货品类型" width="78" />
        <el-table-column label="运费" width="78" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.freight) }}</span></template>
        </el-table-column>
        <el-table-column label="总采购金额" width="104" align="right">
          <template #default="{ row }"><span class="mono strong">{{ money(row.amount) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="76">
          <template #default="{ row }">
            <el-tag size="small" :type="TAG[row.status]">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
            <el-button v-if="row.status === '待审核'" link type="primary" size="small"
              @click="openAudit(row)">审批</el-button>
            <el-button v-if="row.status === '进行中'" link type="success" size="small"
              @click="warehousing(row)">确认入库</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" :page-size="PAGE_SIZE"
          :total="view.length" layout="total, prev, pager, next" small background />
      </div>
    </div>

    <!-- 供应商管理抽屉 -->
    <el-drawer v-model="drawer" title="供应商管理" size="960px">
      <SupplierPanel />
    </el-drawer>

    <!-- 审核弹窗 -->
    <el-dialog v-model="audit.visible" title="审核" width="780px" align-center class="audit-dlg">
      <div class="audit-info">
        <div class="ai-item">
          <label>供货商</label>
          <div class="ai-val">{{ audit.row?.supplier }}</div>
        </div>
        <div class="ai-item">
          <label>制单人</label>
          <div class="ai-val">{{ audit.row?.buyer }}</div>
        </div>
        <div class="ai-item">
          <label>制单时间</label>
          <div class="ai-val">{{ audit.row?.date }}</div>
        </div>
        <div class="ai-item">
          <label>采购金额</label>
          <div class="ai-val">{{ money(audit.row?.amount) }}</div>
        </div>
        <div class="ai-item">
          <label>运费</label>
          <div class="ai-val">{{ money(audit.row?.freight) }}</div>
        </div>
        <div class="ai-item">
          <label>当前状态</label>
          <div class="ai-val">{{ audit.row?.status }}</div>
        </div>
      </div>

      <div class="sec-title">采购货品</div>
      <el-table :data="auditGoods" size="small" empty-text="暂无货品明细">
        <el-table-column type="index" label="序号" width="56" />
        <el-table-column prop="name" label="采购货品" min-width="120" />
        <el-table-column prop="spec" label="规格" width="110" />
        <el-table-column label="单价" width="96" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.price) }}</span></template>
        </el-table-column>
        <el-table-column label="采购数量" width="104" align="right">
          <template #default="{ row }"><span class="mono">{{ row.qty }}{{ row.unit }}</span></template>
        </el-table-column>
        <el-table-column label="采购金额" width="118" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.amount) }}</span></template>
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCards from '@/components/StatCards.vue'
import SupplierPanel from '@/components/purchase/SupplierPanel.vue'
import { money } from '@/utils/format'
import { useStockStore } from '@/stores/stock'

const router = useRouter()
const stockStore = useStockStore()
const STATUS = ['待审核', '进行中', '已完成', '已驳回']
const TAG = { 待审核: 'info', 进行中: 'warning', 已完成: 'success', 已驳回: 'danger' }

const rows = ref([
  { no: 'CG202607221421', buyer: '张某某', supplier: '某林林公司', warehouse: '华东主仓', date: '2026-07-22 14:27', expressNo: 'DB1234567891234', logistics: '某邦物流', category: '家居日用', freight: 100, amount: 20000, status: '待审核' },
  { no: 'CG202607221418', buyer: '李某', supplier: '美妆公司', warehouse: '华南仓', date: '2026-07-22 11:03', expressNo: 'DB1234567891235', logistics: '某东物流', category: '美妆个护', freight: 80, amount: 46500, status: '待审核' },
  { no: 'CG202607211207', buyer: '张某某', supplier: '某林林公司', warehouse: '华东主仓', date: '2026-07-21 09:42', expressNo: 'DB1234567891188', logistics: '某邦物流', category: '家居日用', freight: 120, amount: 38200, status: '进行中' },
  { no: 'CG202607201155', buyer: '王某', supplier: '雅美化妆品', warehouse: '平台仓1', date: '2026-07-20 16:18', expressNo: 'JD7788001122', logistics: '某东物流', category: '美妆个护', freight: 60, amount: 128600, status: '进行中' },
  { no: 'CG202607191022', buyer: '李某', supplier: '美妆公司', warehouse: '华东主仓', date: '2026-07-19 10:05', expressNo: 'DB1234567891023', logistics: '某邦物流', category: '美妆个护', freight: 95, amount: 27400, status: '进行中' },
  { no: 'CG202607180916', buyer: '张某某', supplier: '某林林公司', warehouse: '华南仓', date: '2026-07-18 08:56', expressNo: 'JD7788000987', logistics: '某东物流', category: '家居日用', freight: 130, amount: 91300, status: '已完成' },
  { no: 'CG202607170844', buyer: '王某', supplier: '雅美化妆品', warehouse: '华东主仓', date: '2026-07-17 14:31', expressNo: 'DB1234567890876', logistics: '某邦物流', category: '美妆个护', freight: 70, amount: 52600, status: '已完成' },
  { no: 'CG202607160733', buyer: '李某', supplier: '美妆公司', warehouse: '平台仓2', date: '2026-07-16 09:12', expressNo: 'JD7788000765', logistics: '某东物流', category: '美妆个护', freight: 45, amount: 15800, status: '已完成' },
  { no: 'CG202607150622', buyer: '张某某', supplier: '某林林公司', warehouse: '华东主仓', date: '2026-07-15 15:44', expressNo: 'DB1234567890654', logistics: '某邦物流', category: '家居日用', freight: 110, amount: 67400, status: '已完成' },
  { no: 'CG202607140511', buyer: '王某', supplier: '雅美化妆品', warehouse: '华南仓', date: '2026-07-14 11:26', expressNo: 'DB1234567890543', logistics: '某邦物流', category: '美妆个护', freight: 88, amount: 33900, status: '已驳回' },
  { no: 'CG202607130422', buyer: '李某', supplier: '美妆公司', warehouse: '华东主仓', date: '2026-07-13 10:08', expressNo: 'JD7788000432', logistics: '某东物流', category: '美妆个护', freight: 55, amount: 21800, status: '进行中' },
  { no: 'CG202607120315', buyer: '张某某', supplier: '某林林公司', warehouse: '华东主仓', date: '2026-07-12 17:02', expressNo: 'DB1234567890321', logistics: '某邦物流', category: '家居日用', freight: 100, amount: 44900, status: '待审核' }
])

const kw = ref('')
const status = ref('all')
const category = ref('all')
const warehouse = ref('all')
const categories = computed(() => [...new Set(rows.value.map(r => r.category).filter(Boolean))])
const warehouses = computed(() => [...new Set(rows.value.map(r => r.warehouse).filter(Boolean))])
const page = ref(1)
const PAGE_SIZE = 20
const drawer = ref(false)

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.no, r.buyer, r.logistics, r.supplier, r.expressNo].some(v => String(v).includes(k))
  const okStatus = status.value === 'all' || r.status === status.value
  const okCat = category.value === 'all' || r.category === category.value
  const okWh = warehouse.value === 'all' || r.warehouse === warehouse.value
  return okKw && okStatus && okCat && okWh
}))
const paged = computed(() => view.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

const sum = (arr, key) => arr.reduce((s, r) => s + Number(r[key] || 0), 0)
const wan = v => (v >= 10000 ? (v / 10000).toFixed(2) + ' 万元' : v.toLocaleString('zh-CN') + ' 元')
const stats = computed(() => {
  // 与下方列表同一口径：计数按筛选后的行，
  // 金额与运费只统计「已完成」的单据（未完成的不计入实际采购额）
  const all = view.value
  const done = all.filter(r => r.status === '已完成')
  return [
    { label: '总采购订单', value: all.length, unit: '单' },
    { label: '已完成订单', value: done.length, unit: '单' },
    { label: '进行中订单', value: all.filter(r => r.status === '进行中').length, unit: '单', tone: 'warn' },
    { label: '未审核订单', value: all.filter(r => r.status === '待审核').length, unit: '单', tone: 'warn' },
    { label: '总采购金额', value: wan(sum(done, 'amount')) },
    { label: '总运费金额', value: wan(sum(done, 'freight')) }
  ]
})

// 筛选后当前页超出范围时回到最后一页
watch(() => view.value.length, n => {
  const max = Math.max(1, Math.ceil(n / PAGE_SIZE))
  if (page.value > max) page.value = max
})

/* ------- 删除 ------- */
async function remove(row) {
  try {
    await ElMessageBox.confirm(`是否删除采购单【${row.no}】？删除后不可恢复。`, '删除采购单', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    rows.value = rows.value.filter(r => r.no !== row.no)
    ElMessage.success('已删除')
  } catch (e) { /* 取消 */ }
}

/* ------- 审核 ------- */
const audit = reactive({ visible: false, row: null, reason: '' })
/** 当前单据的货品明细：数量 1000，单价由采购金额反推，保证与顶部金额一致 */
const auditGoods = computed(() => {
  const r = audit.row
  if (!r) return []
  const home = r.category === '家居日用'
  const qty = 1000
  return [{
    name: home ? '洗面奶' : '精华液',
    spec: home ? '100g/支' : '30ml/瓶',
    unit: home ? '支' : '瓶',
    price: Number(r.amount) / qty,
    qty,
    amount: Number(r.amount),
    category: r.category
  }]
})

const SKU_BY_CATEGORY = { '家居日用': 'SKU-200118', '美妆个护': 'SKU-100231' }

/** 确认入库：按收货仓增加库存，采购单转已完成 */
function warehousing(row) {
  const qty = 1000
  const sku = SKU_BY_CATEGORY[row.category] || 'SKU-100231'
  ElMessageBox.confirm(
    `采购单 ${row.no} 将按收货仓「${row.warehouse}」入库，库存增加 ${qty} 件，入库后单据转为「已完成」。`,
    '确认入库', { type: 'warning', confirmButtonText: '确认入库' }
  ).then(() => {
    stockStore.inbound(sku, row.warehouse, qty)
    row.status = '已完成'
    ElMessage.success(`入库完成：${row.warehouse} 库存 +${qty}，可在「库存记录」查看`)
  }).catch(() => {})
}

function openAudit(row) {
  audit.row = row
  audit.reason = ''
  audit.visible = true
}
function approve() {
  audit.row.status = '进行中'
  audit.visible = false
  ElMessage.success(`采购单 ${audit.row.no} 审核通过，状态变为「进行中」`)
}
function reject() {
  if (!audit.reason.trim()) return ElMessage.error('驳回时必须填写驳回原因')
  audit.row.status = '已驳回'
  audit.visible = false
  ElMessage.success(`已驳回并通知制单人 ${audit.row.buyer}`)
}
</script>

<style scoped>
.strong { font-weight: 600; }
/* 12 列要在 1200px 内放下，字号收一档避免逐列换行 */
.order-table :deep(.el-table__cell) { font-size: 11.5px; }

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
.sec-title { margin: 16px 0 8px; font-size: 13px; font-weight: 600; color: var(--ink); }
</style>
