<template>
  <div>
    <PageHeader :title="cfg.title" :sub="cfg.sub">
      <el-button size="small">导出数据</el-button>
    </PageHeader>

    <!-- 处理中：队列看板 -->
    <div v-if="status === 'doing'" class="queues">
      <div class="q all"><b>{{ rows.length }}</b><span>全部处理中</span></div>
      <div v-for="q in queues" :key="q.key" class="q" :class="{ on: activeQ === q.key, hot: q.key === 'back' && q.n > 0 }"
        @click="activeQ = activeQ === q.key ? '' : q.key">
        <b>{{ q.n }}</b><span>{{ q.label }}</span>
      </div>
    </div>

    <!-- 完成页：四个指标 -->
    <div v-if="status === 'done'" class="kpis">
      <div class="kpi"><div class="k">今日处理完成</div><div class="v">12<i>单</i></div></div>
      <div class="kpi"><div class="k">一次解决率</div><div class="v">92.4<i>%</i></div></div>
      <div class="kpi"><div class="k">拒绝率</div><div class="v">6.8<i>%</i></div></div>
      <div class="kpi"><div class="k">本期退款金额</div><div class="v">3.86<i>万</i></div></div>
    </div>

    <div class="filters">
      <el-input v-model="kw" size="small" :placeholder="status === 'done' ? '订单号 / 售后单号' : '输入订单号或客户'" style="width: 210px" clearable />
      <el-select v-model="f.channel" size="small" style="width: 120px" placeholder="全部渠道">
        <el-option label="全部渠道" value="" />
        <el-option v-for="c in ['天猫','京东','抖音','小程序']" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="f.type" size="small" style="width: 140px" placeholder="全部类型">
        <el-option label="全部类型" value="" />
        <el-option v-for="t in types" :key="t" :label="t" :value="t" />
      </el-select>
      <el-button size="small" type="primary">查询</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>{{ cfg.title }}</h3>
        <span class="extra">{{ cfg.hint }}</span>
      </div>
      <el-table :data="view" size="small" max-height="580">
        <el-table-column prop="ticket" label="售后单号" width="150" />
        <el-table-column prop="orderNo" label="订单编号" width="150" />
        <el-table-column prop="type" label="处理方式" width="110" />
        <el-table-column prop="reason" label="售后原因" min-width="150" />
        <el-table-column prop="applyTime" label="申请时间" width="140" />
        <el-table-column v-if="status === 'wait'" label="剩余处理时长" width="140">
          <template #default="{ row }">
            <span :class="'tl ' + tl(row.sla).type">{{ tl(row.sla).text }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="status !== 'done'" prop="logistics" label="物流状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.logistics === '已签收' ? 'success' : 'info'">{{ row.logistics }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="goods" label="商品信息" min-width="180" show-overflow-tooltip />
        <el-table-column label="退款金额" width="110" align="right">
          <template #default="{ row }">
            <span class="mono">{{ row.amount > 0 ? money(row.amount) : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="status === 'done'" prop="result" label="审核结果" width="100" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-if="status === 'wait'" link type="primary" size="small" @click="openAudit(row)">审核</el-button>
            <el-button v-if="status === 'doing' && row.queue === 'refund' && activeQ !== 'back'" link type="primary" size="small" @click="refund(row)">退款</el-button>
            <el-button link size="small" @click="openDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 审核弹窗 -->
    <el-dialog v-model="auditVisible" title="售后审核" width="680px">
      <template v-if="cur">
        <div class="sec-t">处理方式</div>
        <el-radio-group v-model="form.type" class="types">
          <el-radio v-for="t in typeDefs" :key="t.k" :label="t.k" border>
            <div class="rt">{{ t.k }}</div>
            <div class="rs">{{ t.d }}</div>
          </el-radio>
        </el-radio-group>

        <div class="sec-t" style="margin-top:16px">审核结论</div>
        <el-radio-group v-model="form.result">
          <el-radio label="agree">同意，按申请执行</el-radio>
          <el-radio label="partial" :disabled="form.type === '更改地址'">部分同意，调整退款金额</el-radio>
          <el-radio label="reject">拒绝申请</el-radio>
        </el-radio-group>

        <el-row :gutter="12" style="margin-top:14px">
          <el-col :span="12">
            <div class="field"><label>责任归属</label>
              <el-select v-model="form.duty" size="small" style="width:100%">
                <el-option v-for="d in duties" :key="d" :label="d" :value="d" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="12" v-if="form.type !== '更改地址'">
            <div class="field"><label>是否要求寄回</label>
              <el-select v-model="form.back" size="small" style="width:100%">
                <el-option label="无需寄回" value="no" />
                <el-option label="要求寄回（生成退回地址与退货单）" value="yes" />
              </el-select>
            </div>
          </el-col>
        </el-row>

        <div class="field" style="margin-top:12px">
          <label>退款金额</label>
          <el-input v-model.number="form.amount" size="small" :disabled="noRefund || form.result === 'reject'" style="width:200px">
            <template #prepend>￥</template>
          </el-input>
          <span class="hint">{{ amountHint }}</span>
        </div>

        <div class="field" style="margin-top:12px">
          <label>审核备注</label>
          <el-input v-model="form.remark" type="textarea" :rows="2" size="small" placeholder="给客户的说明，同步进售后沟通记录" />
        </div>

        <el-alert class="tipbox" :closable="false" :title="flowHint" />
      </template>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" size="640px" title="售后详情">
      <template v-if="cur">
        <div class="sec-t">售后申请信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单编号">{{ cur.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="处理方式">{{ cur.type }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ cur.orderTime }}</el-descriptions-item>
          <el-descriptions-item label="售后原因">{{ cur.reason }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">{{ money(cur.orderAmount) }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ cur.applyTime }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ cur.customer }}</el-descriptions-item>
          <el-descriptions-item label="收货地址">浙江省杭州市余杭区…（已加密）</el-descriptions-item>
        </el-descriptions>

        <div class="sec-t" style="margin-top:16px">商品明细</div>
        <el-table :data="[{ g: cur.goods, sku: cur.sku, qty: cur.qty, price: cur.amount }]" size="small" border>
          <el-table-column prop="g" label="商品" />
          <el-table-column prop="sku" label="SKU" width="130" />
          <el-table-column prop="qty" label="数量" width="70" align="right" />
          <el-table-column label="单价" width="100" align="right">
            <template #default="{ row }">{{ money(row.price) }}</template>
          </el-table-column>
        </el-table>

        <div class="sec-t" style="margin-top:16px">物流信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="当前状态">{{ cur.logistics }}</el-descriptions-item>
          <el-descriptions-item label="物流单号">{{ cur.expressNo || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { money, timeLeft, offsetHours } from '@/utils/format'

const props = defineProps({ status: { type: String, default: 'wait' } })

const CONFIG = {
  wait:  { title: '售后待处理', sub: '客户已提交、客服还没给结论的售后单', hint: '超时单据标红，左侧菜单显示待处理角标' },
  doing: { title: '售后处理中', sub: '审核已通过、还没走完的售后单', hint: '按六个处理节点分队列' },
  done:  { title: '售后处理完成', sub: '已给终态的售后单，用于复盘与对账', hint: '终态单据只读，可复制信息' }
}
const cfg = CONFIG[props.status]

const types = ['退货', '仅退款', '部分仅退款', '换货', '补发', '补差价', '更改地址']
const duties = ['物流破损', '仓库错发', '商品质量', '客户原因', '价格原因', '其他']
const typeDefs = [
  { k: '退货', d: '寄回后退款' },
  { k: '仅退款', d: '不用寄回' },
  { k: '换货', d: '错发或破损' },
  { k: '补发', d: '漏发或少件' },
  { k: '补差价', d: '不退不换，只退差额' },
  { k: '更改地址', d: '只改收货地址' }
]

const queues = [
  { key: 'back', label: '待客户退回', n: 2 },
  { key: 'transit', label: '退回在途', n: 1 },
  { key: 'qc', label: '已收货待质检', n: 1 },
  { key: 'refund', label: '待退款', n: 2 },
  { key: 'exchange', label: '换货待发货', n: 1 },
  { key: 'resend', label: '待补发', n: 1 }
]
const activeQ = ref('')

const kw = ref('')
const f = reactive({ channel: '', type: '' })

const RAW = [
  { ticket: 'AS20261116001', orderNo: 'TM20261116001', channel: '天猫', type: '退货', reason: '商品破损',
    applyTime: '2026-11-16 09:20', sla: offsetHours(-6), logistics: '已签收', goods: '雅诗兰黛小棕瓶 50ml ×1',
    sku: 'SKU-100231', qty: 1, customer: '陈**', orderTime: '2026-11-14 10:22',
    orderAmount: 1286, amount: 1286, expressNo: 'ZT7788990011', result: '—', queue: '', s: 'wait' },
  { ticket: 'AS20261116002', orderNo: 'XC20261115003', channel: '小程序', type: '补发', reason: '少件',
    applyTime: '2026-11-16 08:10', sla: offsetHours(5), logistics: '已签收', goods: '星野香薰礼盒 ×3',
    sku: 'SKU-300045', qty: 1, customer: '赵**', orderTime: '2026-11-13 16:12',
    orderAmount: 199, amount: 0, expressNo: 'SF1122334455', result: '—', queue: '', s: 'wait' },
  { ticket: 'AS20261115003', orderNo: 'DY20261114022', channel: '抖音', type: '仅退款', reason: '未按约定时间发货',
    applyTime: '2026-11-15 14:30', sla: offsetHours(28), logistics: '待签收', goods: '星野收纳箱 大号 ×2',
    sku: 'SKU-400011', qty: 2, customer: '郑**', orderTime: '2026-11-14 12:30',
    orderAmount: 528, amount: 528, expressNo: 'YT9988776655', result: '—', queue: '', s: 'wait' },
  { ticket: 'AS20261114004', orderNo: 'JD20261115012', channel: '京东', type: '换货', reason: '规格不符',
    applyTime: '2026-11-14 11:00', sla: offsetHours(-30), logistics: '运输中', goods: '兰蔻小黑瓶 30ml ×1',
    sku: 'SKU-100188', qty: 1, customer: '周**', orderTime: '2026-11-13 21:40',
    orderAmount: 899, amount: 0, expressNo: 'YZ5566778899', result: '—', queue: 'exchange', s: 'doing' },
  { ticket: 'AS20261113005', orderNo: 'TM20261112008', channel: '天猫', type: '退货', reason: '不喜欢',
    applyTime: '2026-11-13 10:15', sla: offsetHours(-24), logistics: '退回在途', goods: '雅诗兰黛小棕瓶 50ml ×2',
    sku: 'SKU-100231', qty: 2, customer: '吴**', orderTime: '2026-11-12 18:12',
    orderAmount: 2340, amount: 2340, expressNo: 'ZT1122334455', result: '—', queue: 'transit', s: 'doing' },
  { ticket: 'AS20261112006', orderNo: 'XC20261110002', channel: '小程序', type: '仅退款', reason: '商品质量问题',
    applyTime: '2026-11-12 09:00', sla: offsetHours(-12), logistics: '已签收', goods: '星野香薰蜡烛 ×1',
    sku: 'SKU-300052', qty: 1, customer: '孙**', orderTime: '2026-11-10 11:00',
    orderAmount: 76, amount: 76, expressNo: 'SF9988776655', result: '—', queue: 'refund', s: 'doing' },
  { ticket: 'AS20261110007', orderNo: 'TM20261108021', channel: '天猫', type: '退货', reason: '商品破损',
    applyTime: '2026-11-10 15:20', sla: offsetHours(-90), logistics: '已签收', goods: '雅诗兰黛小棕瓶 50ml ×1',
    sku: 'SKU-100231', qty: 1, customer: '刘**', orderTime: '2026-11-08 09:30',
    orderAmount: 1080, amount: 1080, expressNo: 'ZT5544332211', result: '同意', queue: '', s: 'done' },
  { ticket: 'AS20261109008', orderNo: 'DY20261107015', channel: '抖音', type: '补差价', reason: '降价补差',
    applyTime: '2026-11-09 10:00', sla: offsetHours(-120), logistics: '已签收', goods: '星野纯棉四件套 ×1',
    sku: 'SKU-200118', qty: 1, customer: '王**', orderTime: '2026-11-07 14:00',
    orderAmount: 359, amount: 30, expressNo: 'YT1234567890', result: '同意', queue: '', s: 'done' }
]

const rows = ref(RAW.filter(r => r.s === props.status))

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.ticket, r.orderNo, r.customer].some(v => String(v).includes(k))
  const okC = !f.channel || r.channel === f.channel
  const okT = !f.type || r.type === f.type
  const okQ = props.status !== 'doing' || !activeQ.value || r.queue === activeQ.value
  return okKw && okC && okT && okQ
}))

const reset = () => { kw.value = ''; f.channel = ''; f.type = ''; activeQ.value = '' }
const tl = v => timeLeft(v)

/* 审核 */
const auditVisible = ref(false)
const detailVisible = ref(false)
const cur = ref(null)
const form = reactive({ type: '退货', result: 'agree', duty: '商品破损', back: 'no', amount: 0, remark: '' })

const noRefund = computed(() => ['换货', '补发', '更改地址'].includes(form.type))
const amountHint = computed(() => {
  if (form.result === 'reject') return '拒绝申请不涉及退款，金额记 0'
  if (noRefund.value) return '当前处理方式不涉及退款，金额固定为 0'
  return `可退金额上限 ${money(cur.value?.orderAmount || 0)}，金额原路退回`
})
const flowHint = computed(() =>
  form.result === 'reject'
    ? '拒绝后单据直接进入「售后处理完成」。'
    : form.type === '更改地址'
      ? '同意后系统直接将订单收货地址更新为新地址，单据直接完结，不进入处理中。'
      : '同意后进入「售后处理中」对应队列：退货→待客户退回，换货→换货待发货，补发→待补发，其余→待退款。'
)

watch(() => form.type, t => {
  if (['换货', '补发', '更改地址'].includes(t)) form.amount = 0
  else if (cur.value) form.amount = cur.value.orderAmount
})
watch(() => form.result, r => { if (r === 'reject') form.amount = 0 })

function openAudit(row) {
  cur.value = row
  form.type = row.type === '部分仅退款' ? '仅退款' : row.type
  form.result = 'agree'
  form.amount = ['换货', '补发', '更改地址'].includes(form.type) ? 0 : row.orderAmount
  form.remark = ''
  auditVisible.value = true
}
function openDetail(row) { cur.value = row; detailVisible.value = true }

function submitAudit() {
  if (form.result !== 'reject' && !noRefund.value && form.amount <= 0) {
    ElMessage.error('退款金额必须大于 0'); return
  }
  if (form.amount > (cur.value?.orderAmount || 0)) {
    ElMessage.error('退款金额不能超过实付金额'); return
  }
  rows.value = rows.value.filter(r => r !== cur.value)
  auditVisible.value = false
  ElMessage.success(form.result === 'reject' ? '已拒绝，单据进入处理完成' : '审核通过，单据已流转')
}
function refund(row) {
  ElMessage.success(`退款 ${money(row.amount)} 已提交，预计 1-3 个工作日到账`)
}
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.tl.danger { color: var(--danger); font-weight: 600; }
.tl.warning { color: var(--warn); font-weight: 600; }
.tl.info { color: var(--ink-2); }

.queues { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.q { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 10px 16px; cursor: pointer; min-width: 108px; }
.q b { display: block; font-size: 19px; font-weight: 600; }
.q span { font-size: 11.5px; color: var(--ink-3); }
.q.on { border-color: var(--brand); background: var(--brand-l); }
.q.on b { color: var(--brand-d); }
.q.hot { border-color: #F0C36B; background: var(--warn-l); }
.q.all { cursor: default; background: var(--fill); }

.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
.kpi { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; }
.kpi .k { font-size: 12px; color: var(--ink-3); }
.kpi .v { font-size: 24px; font-weight: 600; margin-top: 6px; }
.kpi .v i { font-size: 13px; font-weight: 400; color: var(--ink-3); font-style: normal; margin-left: 3px; }

.sec-t { font-size: 12.5px; font-weight: 600; margin-bottom: 9px; padding-left: 8px; border-left: 3px solid var(--brand); }
.types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.types :deep(.el-radio) { margin-right: 0; height: auto; padding: 8px 12px; width: 100%; }
.types :deep(.el-radio__label) { line-height: 1.4; }
.rt { font-size: 12.5px; font-weight: 600; }
.rs { font-size: 11px; color: var(--ink-3); }
.field { display: flex; align-items: center; gap: 10px; }
.field label { width: 76px; font-size: 12.5px; color: var(--ink-2); flex: none; }
.hint { font-size: 11.5px; color: var(--ink-3); }
.tipbox { margin-top: 14px; }
</style>
