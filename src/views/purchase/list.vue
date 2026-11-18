<template>
  <div>
    <PageHeader title="采购订单" sub="采购单全流程：新建 → 审核 → 进行中 → 已完成">
      <el-button size="small" type="primary" :icon="Plus" @click="router.push('/purchase/create')">新建采购单</el-button>
      <el-button size="small" @click="drawer = true">供应商管理</el-button>
    </PageHeader>

    <StatCards :items="stats" />

    <div class="toolbar">
      <el-input v-model="kw" size="small" style="width: 260px" clearable :prefix-icon="Search"
        placeholder="输入采购单编号/采购员/物流公司" />
      <el-select v-model="status" size="small" style="width: 132px">
        <el-option label="全部状态" value="" />
        <el-option v-for="s in STATUS" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button size="small" type="primary" @click="page = 1">搜索</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="grow">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <el-table :data="paged" size="small">
        <el-table-column prop="no" label="采购编号" width="152" />
        <el-table-column prop="buyer" label="采购员" width="90" />
        <el-table-column prop="supplier" label="供应商" min-width="170" show-overflow-tooltip />
        <el-table-column prop="warehouse" label="收货仓" width="100" />
        <el-table-column prop="date" label="采购时间" width="140" />
        <el-table-column prop="expressNo" label="物流单号" width="150" />
        <el-table-column prop="logistics" label="物流公司" width="118" />
        <el-table-column prop="category" label="货品类型" width="100" />
        <el-table-column label="运费" width="92" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.freight) }}</span></template>
        </el-table-column>
        <el-table-column label="总采购金额" width="122" align="right">
          <template #default="{ row }"><span class="mono strong">{{ money(row.amount) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="96">
          <template #default="{ row }">
            <el-tag size="small" :type="TAG[row.status]">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="112" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
            <el-button link type="primary" size="small" :disabled="row.status !== '待审核'"
              @click="openAudit(row)">审批</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :page-sizes="[5, 10, 20]"
          :total="view.length" layout="total, sizes, prev, pager, next" small background />
      </div>
    </div>

    <!-- 供应商管理抽屉 -->
    <el-drawer v-model="drawer" title="供应商管理" size="960px">
      <SupplierPanel />
    </el-drawer>

    <!-- 审核弹窗 -->
    <el-dialog v-model="audit.visible" title="审核" width="520px" align-center>
      <div class="kv">
        <span class="k">采购单编号</span><span class="v">{{ audit.row?.no }}</span>
        <span class="k">供货商</span><span class="v">{{ audit.row?.supplier }}</span>
        <span class="k">制单时间</span><span class="v">{{ audit.row?.date }}</span>
        <span class="k">采购金额</span><span class="v"><b>{{ money(audit.row?.amount) }}</b></span>
        <span class="k">当前状态</span>
        <span class="v"><el-tag size="small" :type="TAG[audit.row?.status]">{{ audit.row?.status }}</el-tag></span>
      </div>
      <div style="margin-top: 14px">
        <div class="fld-label">驳回原因</div>
        <el-input v-model="audit.reason" type="textarea" :rows="3" maxlength="200" show-word-limit
          placeholder="驳回时必填，审核通过可不填；填写后会通知该制单人" />
      </div>
      <div class="dlg-act">
        <el-button size="small" @click="audit.visible = false">取消</el-button>
        <el-button size="small" type="danger" plain @click="reject">驳回</el-button>
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

const router = useRouter()
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
const status = ref('')
const page = ref(1)
const size = ref(5)
const drawer = ref(false)

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.no, r.buyer, r.logistics, r.supplier, r.expressNo].some(v => String(v).includes(k))
  const okStatus = !status.value || r.status === status.value
  return okKw && okStatus
}))
const paged = computed(() => view.value.slice((page.value - 1) * size.value, page.value * size.value))

const sum = (arr, key) => arr.reduce((s, r) => s + Number(r[key] || 0), 0)
const wan = v => (v >= 10000 ? (v / 10000).toFixed(2) + ' 万元' : v.toLocaleString('zh-CN') + ' 元')
const stats = computed(() => {
  const all = rows.value
  return [
    { label: '总采购订单', value: all.length, unit: '单' },
    { label: '已采购订单', value: all.filter(r => r.status === '已完成').length, unit: '单' },
    { label: '进行中订单', value: all.filter(r => r.status === '进行中').length, unit: '单', tone: 'warn' },
    { label: '未审核订单', value: all.filter(r => r.status === '待审核').length, unit: '单', tone: 'warn' },
    { label: '总采购金额', value: wan(sum(all, 'amount')) },
    { label: '总运费金额', value: wan(sum(all, 'freight')) }
  ]
})

function reset() { kw.value = ''; status.value = ''; page.value = 1 }

// 筛选后当前页超出范围时回到最后一页
watch(() => view.value.length, n => {
  const max = Math.max(1, Math.ceil(n / size.value))
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
.fld-label { margin-bottom: 6px; font-size: 12.5px; color: var(--ink-2); }
</style>
