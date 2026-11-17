<template>
  <div>
    <PageHeader title="对账中心" sub="订单 · 出库 · 结算 三单核对">
      <el-button size="small">导出差异明细</el-button>
      <el-button size="small" type="primary">批量核对</el-button>
    </PageHeader>

    <div class="filters">
      <el-select v-model="channel" size="small" style="width: 130px" placeholder="全部渠道">
        <el-option label="全部渠道" value="" />
        <el-option label="天猫" value="天猫" />
        <el-option label="抖音" value="抖音" />
        <el-option label="京东自营" value="京东自营" />
        <el-option label="自营小程序" value="自营小程序" />
      </el-select>

      <el-radio-group v-model="status" size="small">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="ok">已匹配</el-radio-button>
        <el-radio-button label="part">部分匹配</el-radio-button>
        <el-radio-button label="miss">未匹配</el-radio-button>
      </el-radio-group>

      <el-input v-model="keyword" size="small" placeholder="订单号 / 子单号" style="width: 190px; margin-left: auto" clearable />
    </div>

    <div class="card">
      <div class="card-head">
        <h3>三单核对</h3>
        <span class="extra">共 12,486 条，当前页 {{ rows.length }} 条 · 点击行查看差异详情</span>
      </div>
      <el-table :data="rows" size="small" @row-click="openDetail">
        <el-table-column prop="id" label="订单号" min-width="160" />
        <el-table-column prop="channel" label="渠道" min-width="96" />
        <el-table-column prop="warehouse" label="发货仓" min-width="120" />
        <el-table-column label="订单金额" align="right" min-width="96">
          <template #default="{ row }">{{ money(row.orderAmount) }}</template>
        </el-table-column>
        <el-table-column label="出库金额" align="right" min-width="96">
          <template #default="{ row }">{{ money(row.outAmount) }}</template>
        </el-table-column>
        <el-table-column label="结算金额" align="right" min-width="96">
          <template #default="{ row }">{{ money(row.settleAmount) }}</template>
        </el-table-column>
        <el-table-column label="差额" align="right" min-width="88">
          <template #default="{ row }">
            <span :class="{ neg: row.diff < 0 }">{{ money(row.diff) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="差异类型" min-width="200">
          <template #default="{ row }">
            <template v-if="row.rule !== '—'">
              <el-tag size="small" type="info" effect="plain">{{ row.rule }}</el-tag>
              <span style="margin-left: 6px">{{ row.ruleName }}</span>
            </template>
            <span v-else style="color: #c0c6d0">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="96">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawer" size="660px" :title="detail?.id">
      <template v-if="detail">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 18px">
          <el-descriptions-item label="渠道">{{ detail.channel }}</el-descriptions-item>
          <el-descriptions-item label="店铺">{{ detail.shop }}</el-descriptions-item>
          <el-descriptions-item label="发货仓">{{ detail.warehouse }}</el-descriptions-item>
          <el-descriptions-item label="结算周期">{{ detail.period }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ detail.orderTime }}</el-descriptions-item>
          <el-descriptions-item label="差异类型">{{ detail.rule }} {{ detail.ruleName }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="sec">资金三单对比</h4>
        <el-table :data="detail.money" size="small" border>
          <el-table-column label="数据源" width="140">
            <template #default="{ row }">{{ row[0] }}</template>
          </el-table-column>
          <el-table-column label="金额" align="right" width="140">
            <template #default="{ row }">{{ money(row[1]) }}</template>
          </el-table-column>
          <el-table-column label="说明">
            <template #default="{ row }">{{ row[2] }}</template>
          </el-table-column>
        </el-table>

        <h4 class="sec">差异归因</h4>
        <div class="alert">{{ detail.reason }}</div>
      </template>

      <template #footer>
        <el-button @click="drawer = false">关闭</el-button>
        <el-button type="warning" plain @click="act('已标记为在途，月末结转')">标记在途</el-button>
        <el-button @click="act('已生成调账单，待财务主管复核')">手工调账</el-button>
        <el-button type="primary" @click="act('已转工单，责任人：财务-张会计')">转工单处理</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { getReconciliations } from '@/api'

const list = ref([])
const status = ref('all')
const channel = ref('')
const keyword = ref('')
const drawer = ref(false)
const detail = ref(null)

const rows = computed(() =>
  list.value.filter(r =>
    (!channel.value || r.channel === channel.value) &&
    (!keyword.value || r.id.includes(keyword.value))
  )
)

const money = v => (v === null || v === undefined ? '—' : v.toLocaleString('zh-CN', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
}))
const statusType = s => ({ ok: 'success', part: 'warning', miss: 'danger' }[s] || 'info')
const statusText = s => ({ ok: '已匹配', part: '部分匹配', miss: '未匹配' }[s] || s)

function openDetail(row) { detail.value = row; drawer.value = true }
function act(msg) { drawer.value = false; ElMessage.success(msg) }

async function load() { list.value = await getReconciliations({ status: status.value }) }
onMounted(load)
watch(status, load)
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.neg { color: var(--red); }
.sec { font-size: 13px; font-weight: 600; margin: 20px 0 9px; padding-left: 9px; border-left: 3px solid var(--blue); }
.alert {
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;
  padding: 11px 13px; font-size: 12.5px; line-height: 1.8; color: #78350f;
}
:deep(.el-table__row) { cursor: pointer; }
</style>
