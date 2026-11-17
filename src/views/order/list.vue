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
        <el-option v-for="c in carriers" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="f.left" size="small" style="width: 140px" placeholder="剩余时间状态">
        <el-option label="全部状态" value="" />
        <el-option label="已超" value="danger" />
        <el-option label="快超" value="warning" />
        <el-option label="剩余" value="info" />
      </el-select>
      <el-select v-model="f.platform" size="small" style="width: 130px" placeholder="平台">
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

      <el-table :data="view" size="small" max-height="600">
        <el-table-column prop="no" label="平台单号" width="150" fixed />
        <el-table-column label="剩余发货时间" width="140">
          <template #default="{ row }">
            <span :class="'tl ' + tl(row.deadline).type">{{ tl(row.deadline).text }}</span>
          </template>
        </el-table-column>
        <el-table-column label="货品明细" min-width="220">
          <template #default="{ row }">
            <div v-for="(g, i) in row.goods" :key="i" class="goods">{{ g.name }} · {{ g.spec }} ×{{ g.qty }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="receiver" label="收件人" width="90" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="address" label="收件地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="note" label="买家留言" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.note || '—' }}</template>
        </el-table-column>
        <el-table-column label="平台类型" min-width="150">
          <template #default="{ row }">{{ row.platform }} · {{ row.shop }}</template>
        </el-table-column>
        <el-table-column prop="carrier" label="快递公司" width="100" />
        <el-table-column label="订单金额" width="110" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.amount) }}</span></template>
        </el-table-column>
        <el-table-column label="平台结算金额" width="120" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.settle) }}</span></template>
        </el-table-column>
        <el-table-column label="实际到账金额" width="120" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.actual) }}</span></template>
        </el-table-column>
        <el-table-column prop="warehouse" label="发货仓库" width="130" />
        <el-table-column prop="payTime" label="付款时间" width="140" />
        <el-table-column prop="deadline" label="最晚发货时间" width="140" />
        <el-table-column prop="platformGoods" label="平台商品信息" min-width="190" show-overflow-tooltip />
        <el-table-column v-if="status === 'shipped' || status === 'done'" prop="expressNo"
          label="快递单号" width="150" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="status === 'review'" link type="primary" size="small" @click="openReview(row)">审核</el-button>
            <el-button v-if="status === 'review'" link type="danger" size="small" @click="openReject(row)">驳回</el-button>
            <el-button v-if="status === 'pending'" link type="primary" size="small" @click="withdraw(row)">撤回订单</el-button>
            <el-button link size="small" @click="edit(row)">编辑</el-button>
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
          title="校验通过：当前仓库库存充足，确认后将下发 WMS 出库。" />

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
            <span v-for="(v, k) in cur.stock" :key="k">{{ k }}：{{ v }} 件</span>
          </div>
        </template>
      </template>

      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="danger" plain @click="toReject">驳回</el-button>
        <el-button type="primary" :disabled="!canPass" @click="pass">确认审核通过</el-button>
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
          <el-col :span="12"><el-form-item label="快递公司"><el-select v-model="form.carrier" style="width:100%">
            <el-option v-for="c in carriers" :key="c" :label="c" :value="c" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="买家留言"><el-input v-model="form.note" placeholder="选填" /></el-form-item></el-col>
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

const props = defineProps({ status: { type: String, default: 'review' } })

const CONFIG = {
  review:  { title: '订单审核', sub: '对接平台与小程序的订单，审核通过后下发 WMS 出库', hint: '审核需校验发货仓库存，不足时提示换仓或驳回' },
  pending: { title: '待发货', sub: '已审核通过，已下发 WMS，等待仓库出库', hint: '可编辑订单信息，未出库前可撤回' },
  shipped: { title: '已发货', sub: 'WMS 出库后回传状态与快递单号', hint: '运单号由 WMS 回传，按订单号唯一比对' },
  done:    { title: '已完结', sub: '平台回传买家已收货，订单归档', hint: '仅可查看与导出' }
}
const cfg = CONFIG[props.status]
const carriers = ['顺丰', '圆通', '中通', '邮政']
const warehouses = ['华东主仓', '华南仓', '平台仓1', '平台仓2']

const kw = ref('')
const f = reactive({ carrier: '', left: '', platform: '', warehouse: '' })

const RAW = [
  { no: 'TM20261116001', platform: '天猫', shop: '旗舰店', receiver: '陈**', phone: '13800001234',
    address: '浙江省杭州市余杭区文一西路 969 号', note: '', carrier: '中通', amount: 1286, settle: 64.3, actual: 1221.7,
    warehouse: '华东主仓', payTime: '2026-11-16 10:22', deadline: '2026-11-18 10:22', platformGoods: '雅诗兰黛小棕瓶50ml',
    goods: [{ name: '雅诗兰黛小棕瓶', spec: '50ml', qty: 2, sku: 'SKU-100231' }],
    stock: { '华东主仓': 1, '华南仓': 6, '平台仓1': 0, '平台仓2': 0 }, s: 'review' },
  { no: 'DY20261116003', platform: '抖音', shop: '官方店', receiver: '李**', phone: '13900002345',
    address: '广东省广州市白云区机场路 12 号', note: '尽快发货', carrier: '圆通', amount: 459, settle: 0, actual: 459,
    warehouse: '华南仓', payTime: '2026-11-16 09:41', deadline: '2026-11-17 09:41', platformGoods: '星野纯棉四件套',
    goods: [{ name: '星野纯棉四件套', spec: '1.8m 灰', qty: 1, sku: 'SKU-200118' }],
    stock: { '华东主仓': 20, '华南仓': 12, '平台仓1': 0, '平台仓2': 0 }, s: 'review' },
  { no: 'XC20261116007', platform: '小程序', shop: '小程序商城', receiver: '赵**', phone: '13700003456',
    address: '江苏省苏州市工业园区星湖街 88 号', note: '', carrier: '顺丰', amount: 168, settle: 0, actual: 168,
    warehouse: '华东主仓', payTime: '2026-11-16 08:05', deadline: '2026-11-18 08:05', platformGoods: '星野香薰礼盒',
    goods: [{ name: '星野香薰礼盒', spec: '3件装', qty: 1, sku: 'SKU-300045' }],
    stock: { '华东主仓': 0, '华南仓': 0, '平台仓1': 0, '平台仓2': 0 }, s: 'review' },
  { no: 'JD20261115012', platform: '京东', shop: '京东自营', receiver: '周**', phone: '13600004567',
    address: '北京市朝阳区建国路 89 号', note: '', carrier: '邮政', amount: 899, settle: 26.97, actual: 872.03,
    warehouse: '平台仓2', payTime: '2026-11-15 21:40', deadline: '2026-11-17 21:40', platformGoods: '兰蔻小黑瓶30ml',
    goods: [{ name: '兰蔻小黑瓶', spec: '30ml', qty: 1, sku: 'SKU-100188' }],
    stock: { '华东主仓': 5, '华南仓': 3, '平台仓1': 8, '平台仓2': 10 }, s: 'pending' },
  { no: 'TM20261115008', platform: '天猫', shop: '旗舰店', receiver: '吴**', phone: '13500005678',
    address: '上海市浦东新区世纪大道 100 号', note: '', carrier: '中通', amount: 2340, settle: 117, actual: 2223,
    warehouse: '华东主仓', payTime: '2026-11-15 18:12', deadline: '2026-11-17 18:12', platformGoods: '雅诗兰黛小棕瓶50ml',
    goods: [{ name: '雅诗兰黛小棕瓶', spec: '50ml', qty: 2, sku: 'SKU-100231' }],
    stock: { '华东主仓': 9, '华南仓': 2, '平台仓1': 0, '平台仓2': 0 }, s: 'pending' },
  { no: 'DY20261114022', platform: '抖音', shop: '官方店', receiver: '郑**', phone: '13400006789',
    address: '四川省成都市武侯区天府大道 1 号', note: '', carrier: '圆通', amount: 528, settle: 0, actual: 528,
    warehouse: '华南仓', payTime: '2026-11-14 12:30', deadline: '2026-11-16 12:30', platformGoods: '星野收纳箱大号',
    goods: [{ name: '星野收纳箱', spec: '大号', qty: 2, sku: 'SKU-400011' }],
    stock: { '华东主仓': 30, '华南仓': 25, '平台仓1': 0, '平台仓2': 0 }, s: 'shipped', expressNo: 'ZT7788990011' },
  { no: 'XC20261113004', platform: '小程序', shop: '小程序商城', receiver: '孙**', phone: '13300007890',
    address: '湖北省武汉市洪山区珞喻路 129 号', note: '', carrier: '顺丰', amount: 76, settle: 0, actual: 76,
    warehouse: '华东主仓', payTime: '2026-11-13 09:00', deadline: '2026-11-15 09:00', platformGoods: '星野香薰蜡烛',
    goods: [{ name: '星野香薰蜡烛', spec: '小号', qty: 1, sku: 'SKU-300052' }],
    stock: { '华东主仓': 40, '华南仓': 10, '平台仓1': 0, '平台仓2': 0 }, s: 'done', expressNo: 'SF1122334455' }
]

const rows = ref(RAW.filter(r => r.s === props.status))

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

/* 库存校验 */
const reviewVisible = ref(false)
const rejectVisible = ref(false)
const createVisible = ref(false)
const cur = ref(null)
const useAlt = ref(true)
const rejectReason = ref('')
const form = reactive({ platform: '天猫', shop: '', receiver: '', phone: '', address: '', carrier: '中通', note: '' })

const stockOf = (wh, sku) => (cur.value && cur.value.stock[wh]) || 0
const enough = computed(() => {
  if (!cur.value) return false
  return cur.value.goods.every(g => stockOf(cur.value.warehouse, g.sku) >= g.qty)
})
const altWarehouse = computed(() => {
  if (!cur.value) return null
  const need = cur.value.goods[0]
  return Object.entries(cur.value.stock).find(([wh, v]) => wh !== cur.value.warehouse && v >= need.qty)?.[0] || null
})
const canPass = computed(() => enough.value || (altWarehouse.value && useAlt.value))

function openReview(row) { cur.value = row; useAlt.value = true; reviewVisible.value = true }
function openReject(row) { cur.value = row; rejectReason.value = '商品数量不足'; rejectVisible.value = true }
function toReject() { reviewVisible.value = false; rejectVisible.value = true }
function pass() {
  if (!enough.value && altWarehouse.value) cur.value.warehouse = altWarehouse.value
  rows.value = rows.value.filter(r => r !== cur.value)
  reviewVisible.value = false
  ElMessage.success('审核通过，订单已流转至待发货并下发 WMS')
}
function doReject() {
  rows.value = rows.value.filter(r => r !== cur.value)
  rejectVisible.value = false
  reviewVisible.value = false
  ElMessage.success('已驳回：' + rejectReason.value)
}
function batchReview() {
  ElMessageBox.confirm('将对当前列表全部订单执行批量审核，库存不足的订单会单独列出。', '批量审核', { type: 'warning' })
    .then(() => ElMessage.success('批量审核完成，异常订单已标红待处理')).catch(() => {})
}
function withdraw(row) {
  ElMessageBox.confirm('撤回后订单将退回审核环节，已下发的 WMS 任务同步取消。', '撤回订单', { type: 'warning' })
    .then(() => { rows.value = rows.value.filter(r => r !== row); ElMessage.success('已撤回') }).catch(() => {})
}
function edit() { ElMessage.info('打开编辑弹窗（待实现）') }
function createOrder() { createVisible.value = false; ElMessage.success('订单已创建') }
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
