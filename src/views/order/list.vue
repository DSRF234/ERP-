<template>
  <div>
    <PageHeader :title="cfg.title" :sub="cfg.sub">
      <el-button v-if="status === 'review'" size="small" type="primary" @click="batchReview">批量审核</el-button>
      <el-button v-if="status === 'review'" size="small" @click="createVisible = true">新建订单</el-button>
      <el-button size="small">导出</el-button>
    </PageHeader>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="单号 / 收件人 / 手机号" style="width: 210px" clearable />
      <el-select v-model="f.carrier" size="small" style="width: 130px" placeholder="快递公司">
        <el-option label="全部快递" value="" />
        <el-option v-for="c in ['顺丰', '圆通', '中通', '韵达', '邮政']" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="f.left" size="small" style="width: 140px" placeholder="剩余时间状态">
        <el-option label="全部状态" value="" />
        <el-option label="已超" value="danger" />
        <el-option label="快超" value="warning" />
        <el-option label="剩余" value="info" />
      </el-select>
      <el-select v-model="f.platform" size="small" style="width: 120px" placeholder="平台">
        <el-option label="全部平台" value="" />
        <el-option v-for="p in ['天猫', '抖音', '京东', '小程序']" :key="p" :label="p" :value="p" />
      </el-select>
      <el-select v-model="f.warehouse" size="small" style="width: 140px" placeholder="发货仓库">
        <el-option label="全部仓库" value="" />
        <el-option v-for="wh in warehouses" :key="wh" :label="wh" :value="wh" />
      </el-select>
      <el-button size="small" type="primary">查找</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>{{ cfg.title }}</h3>
        <span class="extra">{{ cfg.hint }}</span>
      </div>

      <el-empty v-if="status === 'pending'" description="当前无 WMS 系统，审核通过后订单直接模拟发货并进入「已发货」" />

      <el-table v-else :data="view" size="small" max-height="600">
        <el-table-column prop="no" label="平台单号" width="150" fixed />
        <el-table-column v-if="status === 'done'" label="订单状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="afterTag(row.afterStatus)">{{ row.afterStatus || '已完结' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="status === 'done'" label="财务" width="118">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" :type="row.financePushed ? 'success' : 'info'">
              {{ row.financePushed ? '已推送对账' : '未推送' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="status === 'review'" label="剩余发货时间" width="140">
          <template #default="{ row }">
            <span :class="'tl ' + tl(row.deadline).type">{{ tl(row.deadline).text }}</span>
          </template>
        </el-table-column>
        <el-table-column label="货品明细" min-width="180">
          <template #default="{ row }">
            <div v-for="(g, i) in row.goods" :key="i" class="goods">{{ g.name }} · {{ g.spec }} ×{{ g.qty }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="receiver" label="收件人" width="86" />
        <el-table-column prop="phone" label="手机号" width="118" />
        <el-table-column prop="address" label="收件地址" min-width="170" show-overflow-tooltip />
        <el-table-column prop="note" label="买家留言" width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.note || '—' }}</template>
        </el-table-column>
        <el-table-column label="平台类型" min-width="140">
          <template #default="{ row }">{{ row.platform }} · {{ row.shop }}</template>
        </el-table-column>
        <el-table-column v-if="status === 'shipped' || status === 'done'" prop="carrier" label="快递公司" width="96" />
        <el-table-column v-if="status === 'shipped' || status === 'done'" prop="expressNo"
          label="快递单号" width="140">
          <template #default="{ row }"><span class="mono">{{ row.expressNo }}</span></template>
        </el-table-column>
        <el-table-column label="订单金额" width="108" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.amount) }}</span></template>
        </el-table-column>
        <el-table-column label="平台结算金额" width="118" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.settle) }}</span></template>
        </el-table-column>
        <el-table-column label="实际到账金额" width="118" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.actual) }}</span></template>
        </el-table-column>
        <el-table-column prop="warehouse" label="发货仓库" width="126" />
        <el-table-column prop="payTime" label="付款时间" width="136" />
        <el-table-column prop="deadline" label="最晚发货时间" width="136" />
        <el-table-column v-if="status === 'shipped' || status === 'done'" prop="shippedAt"
          label="发货时间" width="136" />
        <el-table-column prop="platformGoods" label="平台商品信息" min-width="170" show-overflow-tooltip />

        <el-table-column label="操作" :width="status === 'review' ? 150 : 130" fixed="right">
          <template #default="{ row }">
            <template v-if="status === 'review'">
              <el-button link type="primary" size="small" @click="openReview(row)">审核</el-button>
              <el-button link type="danger" size="small" @click="openReject(row)">驳回</el-button>
            </template>
            <el-button v-if="status === 'shipped'" link type="primary" size="small"
              @click="receive(row)">确认收货</el-button>
            <el-button v-if="status === 'review'" link size="small" @click="edit(row)">编辑</el-button>
            <el-button v-if="status === 'done'" link type="primary" size="small" @click="openAfter(row)">申请售后</el-button>
            <el-button v-if="status === 'done'" link size="small" @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 审核弹窗 -->
    <el-dialog v-model="reviewVisible" title="订单审核 · 库存校验" width="620px">
      <template v-if="cur">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="平台单号">{{ cur.no }}</el-descriptions-item>
          <el-descriptions-item label="收件人">{{ cur.receiver }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">{{ money(cur.amount) }}</el-descriptions-item>
          <el-descriptions-item label="发货仓库">{{ cur.warehouse }}</el-descriptions-item>
        </el-descriptions>

        <div class="check">
          <div class="check-t">库存校验结果</div>
          <div v-for="g in cur.goods" :key="g.sku" class="check-row">
            <span>{{ g.name }} ×{{ g.qty }}</span>
            <span :class="{ ok: stockOf(cur.warehouse, g.sku) >= g.qty, bad: stockOf(cur.warehouse, g.sku) < g.qty }">
              {{ cur.warehouse }} 可用 {{ stockOf(cur.warehouse, g.sku) }} 件
            </span>
          </div>
        </div>

        <el-alert v-if="enough" type="success" :closable="false" show-icon
          :title="`库存充足。审核通过后系统将模拟仓管发货并生成快递单号，订单直接进入「已发货」。`" />

        <template v-else-if="altWarehouse">
          <el-alert type="warning" :closable="false" show-icon
            :title="`当前仓库库存不足，${altWarehouse} 库存充足，是否改为从该仓发货？`" />
          <div class="alt">
            <el-radio-group v-model="useAlt" size="small">
              <el-radio :label="false">仍然驳回</el-radio>
              <el-radio :label="true">改为 {{ altWarehouse }} 发货</el-radio>
            </el-radio-group>
          </div>
        </template>

        <template v-else>
          <el-alert type="error" :closable="false" show-icon title="所有仓库库存均不足，无法通过审核，请驳回并说明原因。" />
          <div class="stock-list">
            <span v-for="(v, k) in stockStore.warehousesFor(cur.goods[0].sku, cur.goods[0].qty)"
              :key="k">{{ k }}：{{ v }} 件</span>
          </div>
        </template>
      </template>

      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="danger" plain @click="toReject">驳回</el-button>
        <el-button type="primary" :disabled="!canPass" @click="pass">确认审核通过并发货</el-button>
      </template>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectVisible" title="驳回订单" width="480px">
      <el-form label-width="80px">
        <el-form-item label="平台单号">{{ cur && cur.no }}</el-form-item>
        <el-form-item label="驳回原因">
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请填写驳回原因，将同步至平台备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="doReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 申请售后 -->
    <el-dialog v-model="afterVisible" title="申请售后" width="480px">
      <el-form label-width="86px" size="small">
        <el-form-item label="订单编号">{{ cur && cur.no }}</el-form-item>
        <el-form-item label="处理方式">
          <el-select v-model="afterForm.type" style="width:100%">
            <el-option v-for="t in ['退货', '仅退款', '换货', '补发', '补差价']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="售后原因">
          <el-input v-model="afterForm.reason" type="textarea" :rows="3" placeholder="请填写售后原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="afterVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAfter">提交</el-button>
      </template>
    </el-dialog>

    <!-- 新建订单 -->
    <el-dialog v-model="createVisible" title="新建订单" width="640px">
      <el-form :model="form" label-width="96px" size="small">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="平台"><el-select v-model="form.platform" style="width:100%">
            <el-option v-for="p in ['天猫','抖音','京东','小程序']" :key="p" :label="p" :value="p" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="店铺"><el-input v-model="form.shop" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收件人"><el-input v-model="form.receiver" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="手机号"><el-input v-model="form.phone" maxlength="11" placeholder="11 位手机号" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="收件地址"><el-input v-model="form.address" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="商品名称"><el-input v-model="form.goodsName" placeholder="如：雅诗兰黛小棕瓶" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="数量"><el-input v-model.number="form.qty" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="订单金额"><el-input v-model.number="form.amount" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="买家留言"><el-input v-model="form.note" placeholder="选填" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="createOrder">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { money, timeLeft } from '@/utils/format'
import { useOrderStore } from '@/stores/order'
import { useStockStore, WAREHOUSES } from '@/stores/stock'
import { tickets as afterTickets, nowStr } from '@/data/aftersale'

const props = defineProps({ status: { type: String, default: 'review' } })
const store = useOrderStore()
const stockStore = useStockStore()
const warehouses = WAREHOUSES

const CONFIG = {
  review:  { title: '订单审核', sub: '对接平台与小程序的订单，审核通过后自动模拟发货', hint: '需校验发货仓库存，不足时提示换仓或驳回' },
  pending: { title: '待发货', sub: '暂无真实 WMS，审核通过后直接模拟发货', hint: '接入 WMS 后该页才会出现待出库订单' },
  shipped: { title: '已发货', sub: '已生成快递公司与运单号，等待确认收货', hint: '确认收货后订单完结并自动推送财务管理' },
  done:    { title: '已完结', sub: '已确认收货，已推送财务管理', hint: '可在对账中心与发货数据中查看' }
}
const cfg = CONFIG[props.status]

const kw = ref('')
const f = reactive({ carrier: '', left: '', platform: '', warehouse: '' })
const rows = computed(() => store.byStatus(props.status))

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.no, r.receiver, r.phone].some(v => String(v).includes(k))
  const okC = !f.carrier || r.carrier === f.carrier
  const okL = !f.left || timeLeft(r.deadline).type === f.left
  const okP = !f.platform || r.platform === f.platform
  const okW = !f.warehouse || r.warehouse === f.warehouse
  return okKw && okC && okL && okP && okW
}))

const reset = () => { kw.value = ''; Object.assign(f, { carrier: '', left: '', platform: '', warehouse: '' }) }
const tl = v => timeLeft(v)

/* 售后状态配色：已完结（绿）/ 售后中（橙）/ 已退款（红） */
const AFTER_TAG = { '已完结': 'success', '售后中': 'warning', '已退款': 'danger' }
const afterTag = v => AFTER_TAG[v] || 'info'

/* 审核 */
const reviewVisible = ref(false)
const rejectVisible = ref(false)
const createVisible = ref(false)
const cur = ref(null)
const useAlt = ref(true)
const rejectReason = ref('')
const form = reactive({ platform: '天猫', shop: '', receiver: '', phone: '', address: '', note: '',
  goodsName: '', qty: 1, amount: 0 })

const stockOf = (wh, sku) => stockStore.availableOf(sku, wh)
const enough = computed(() =>
  !!cur.value && cur.value.goods.every(g => stockOf(cur.value.warehouse, g.sku) >= g.qty))
const altWarehouse = computed(() => {
  if (!cur.value) return null
  const need = cur.value.goods[0]
  const map = stockStore.warehousesFor(need.sku, need.qty)
  return Object.entries(map).find(([wh, v]) => wh !== cur.value.warehouse && v >= need.qty)?.[0] || null
})
const canPass = computed(() => enough.value || (altWarehouse.value && useAlt.value))

function openReview(row) { cur.value = row; useAlt.value = true; reviewVisible.value = true }
function openReject(row) { cur.value = row; rejectReason.value = '商品数量不足'; rejectVisible.value = true }
function toReject() { reviewVisible.value = false; rejectVisible.value = true }

function pass() {
  const wh = !enough.value && altWarehouse.value ? altWarehouse.value : null
  const res = store.approve(cur.value, wh)
  reviewVisible.value = false
  if (res) {
    ElMessage({
      type: 'success',
      duration: 4200,
      message: `审核通过，已模拟仓管发货：${res.carrier} ${res.expressNo}`
    })
  }
}

function doReject() {
  store.reject(cur.value)
  rejectVisible.value = false
  reviewVisible.value = false
  ElMessage.success('已驳回：' + rejectReason.value)
}

function batchReview() {
  ElMessageBox.confirm('将对当前列表全部订单执行批量审核，库存不足的订单会单独列出。', '批量审核', { type: 'warning' })
    .then(() => ElMessage.success('批量审核完成，异常订单已标红待处理')).catch(() => {})
}

function receive(row) {
  ElMessageBox.confirm(
    `确认订单 ${row.no} 已由客户签收？确认后订单完结，并自动推送至财务管理（对账中心 / 发货数据）。`,
    '确认收货', { type: 'info', confirmButtonText: '确认收货' }
  ).then(() => {
    store.confirmReceive(row)
    ElMessage.success('订单已完结，已推送财务管理')
  }).catch(() => {})
}

function edit() { ElMessage.info('打开编辑弹窗（待实现）') }
function viewDetail() { ElMessage.info('查看订单详情（待实现）') }
function createOrder() {
  if (!form.receiver || !form.address) return ElMessage.error('请填写收件人与地址')
  if (!form.amount || form.amount <= 0) return ElMessage.error('请填写订单金额')
  store.create(form)
  createVisible.value = false
  ElMessage.success('订单已创建，进入待审核')
}

/* 申请售后 */
const afterVisible = ref(false)
const afterForm = reactive({ type: '退货', reason: '' })
function openAfter(row) {
  cur.value = row
  afterForm.type = '退货'
  afterForm.reason = ''
  afterVisible.value = true
}
const pad = n => String(n).padStart(2, '0')
function plusHours(h) {
  const d = new Date(Date.now() + h * 3600000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function genTicketNo() {
  const d = new Date()
  return 'AS' + `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    String(afterTickets.length + 1).padStart(3, '0')
}

/** 申请售后：写入售后共享数据层（售后页读取的就是这份） */
function submitAfter() {
  if (!afterForm.reason) return ElMessage.error('请填写售后原因')
  const o = cur.value
  const g = o.goods[0] || {}
  const APPLY_TYPE = { '退货': '退货退款', '仅退款': '仅退款', '换货': '换货', '补发': '补发', '补差价': '补差价' }

  afterTickets.unshift({
    ticket: genTicketNo(),
    orderNo: o.no,
    channel: o.platform,
    applyType: APPLY_TYPE[afterForm.type] || afterForm.type,
    type: afterForm.type,
    reason: afterForm.reason,
    proofs: [],
    applyTime: nowStr(),
    sla: plusHours(24),
    logistics: '已签收',
    expressNo: o.expressNo || '—',
    goods: `${g.name || '商品'} ${g.spec || ''} ×${g.qty || 1}`,
    sku: g.sku || '—',
    qty: g.qty || 1,
    orderTime: o.orderTime || o.payTime,
    orderAmount: o.amount,
    amount: 0,
    customer: { name: o.receiver, phone: o.phone, addr: o.address },
    message: afterForm.reason,
    status: 'wait', queue: '', result: '—', duty: '', auditRemark: '', auditor: '', auditTime: '',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  })

  store.setAfterStatus(o.no, '售后中')
  afterVisible.value = false
  const t = afterTickets[0].ticket
  ElMessage.success(`售后单 ${t} 已创建，已进入「售后待处理」，订单状态改为「售后中」`)
}
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.tl.danger { color: var(--danger); font-weight: 600; }
.tl.warning { color: var(--warn); font-weight: 600; }
.tl.info { color: var(--ink-2); }
.goods { font-size: 12px; line-height: 1.6; }
.check { margin: 14px 0; padding: 12px 14px; background: var(--brand-l); border: 1px solid #BFE3F2; border-radius: 6px; }
.check-t { font-size: 12.5px; font-weight: 600; color: var(--brand-d); margin-bottom: 8px; }
.check-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 3px 0; }
.check-row .ok { color: var(--ok); }
.check-row .bad { color: var(--danger); }
.alt { margin-top: 12px; }
.stock-list { margin-top: 10px; display: flex; gap: 16px; font-size: 12.5px; color: var(--ink-2); }
</style>
