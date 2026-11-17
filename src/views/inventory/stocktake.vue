<template>
  <div>
    <PageHeader title="库存盘点" sub="创建盘点任务 · 录入实盘数 · 差异留痕">
      <el-button size="small" type="primary" :icon="Plus" @click="openCreate">创建盘点任务</el-button>
    </PageHeader>

    <StatCards :items="stats" />

    <div class="toolbar">
      <el-input v-model="kw" size="small" style="width: 260px" clearable :prefix-icon="Search"
        placeholder="输入盘点号/货品名称/负责人" />
      <el-select v-model="inType" size="small" style="width: 130px">
        <el-option label="全部入库类型" value="" />
        <el-option label="采购入库" value="采购入库" />
        <el-option label="调拨入库" value="调拨入库" />
      </el-select>
      <el-button size="small" type="primary" @click="page = 1">搜索</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="grow">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <el-table :data="paged" size="small">
        <el-table-column prop="no" label="盘点单号" width="150" />
        <el-table-column prop="poNo" label="采购单号" width="150" />
        <el-table-column prop="name" label="货品名称" min-width="150" />
        <el-table-column prop="warehouse" label="仓库" width="100" />
        <el-table-column prop="inType" label="入库类型" width="100" />
        <el-table-column prop="produceDate" label="货品生产日期" width="124" />
        <el-table-column prop="expireDate" label="货品有效期" width="124" />
        <el-table-column label="库存数" width="88" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.stockQty) }}</span></template>
        </el-table-column>
        <el-table-column label="实盘数" width="88" align="right">
          <template #default="{ row }">
            <span class="mono">{{ row.realQty === null ? '—' : num(row.realQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="盘点状态" width="96">
          <template #default="{ row }">
            <el-tag size="small" :type="TAG[row.status]">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="88" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openCheck(row)">
              {{ row.status === '待盘点' ? '盘点' : '查看' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :page-sizes="[5, 10, 20]"
          :total="view.length" layout="total, sizes, prev, pager, next" small background />
      </div>
    </div>

    <!-- 创建盘点任务 -->
    <el-dialog v-model="dg.visible" title="创建盘点任务" width="720px" align-center>
      <p class="dlg-hint">盘点单号规则：PD + 年 + 月 + 日 + 时间，由系统自动生成；创建后任务状态为「待盘点」。</p>
      <el-form label-width="76px" size="small">
        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="选择仓库">
              <el-select v-model="dg.warehouse" style="width: 100%">
                <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="dg.owner" style="width: 100%">
                <el-option v-for="o in owners" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="dg.remark" type="textarea" :rows="2" maxlength="200" show-word-limit
            placeholder="选填，如：月末全仓盘点" />
        </el-form-item>
      </el-form>

      <div class="detail-head">
        <h4>盘点明细</h4>
        <span class="extra">已选 {{ dg.goods.length }} 个商品</span>
      </div>
      <div class="detail-tool">
        <el-select v-model="dg.goods" multiple filterable collapse-tags collapse-tags-tooltip
          placeholder="添加商品：输入货品名称/编码，同步供应商管理的货品" style="flex: 1">
          <el-option v-for="g in pool" :key="g.code" :label="`${g.name}（${g.code}）`" :value="g.code" />
        </el-select>
        <el-button size="small" @click="dg.goods = pool.map(g => g.code)">全选</el-button>
        <el-button size="small" @click="dg.goods = []">清空</el-button>
      </div>
      <el-table :data="pickedGoods" size="small" max-height="200" empty-text="还没有添加商品">
        <el-table-column prop="name" label="货品名称" min-width="140" />
        <el-table-column prop="code" label="货码编号" width="130" />
        <el-table-column prop="spec" label="规格" width="100" />
        <el-table-column label="库存数" width="90" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.stockQty) }}</span></template>
        </el-table-column>
      </el-table>

      <div class="dlg-act">
        <el-button size="small" @click="dg.visible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveCreate">确定</el-button>
      </div>
    </el-dialog>

    <!-- 盘点 / 查看 -->
    <el-dialog v-model="chk.visible" :title="chk.readonly ? '查看盘点' : '盘点'" width="460px" align-center>
      <div class="kv">
        <span class="k">盘点单号</span><span class="v">{{ chk.row?.no }}</span>
        <span class="k">货品名称</span><span class="v">{{ chk.row?.name }}</span>
        <span class="k">库存数</span><span class="v"><b>{{ num(chk.row?.stockQty) }}</b></span>
        <span class="k">实盘数</span>
        <span class="v">
          <el-input v-if="!chk.readonly" v-model="chk.val" size="small" style="width: 150px"
            placeholder="只写数字" @input="chk.val = String(chk.val).replace(/[^\d]/g, '')" />
          <b v-else>{{ num(chk.row?.realQty) }}</b>
        </span>
        <span class="k">差异</span>
        <span class="v">{{ diffText }}</span>
      </div>
      <p class="dlg-hint" style="margin: 14px 0 0">
        【实盘数】只能输入数字，未填写时不能保存；填写后状态变为「已完成」，
        与库存数不一致时为「有差异」，操作变为「查看」。
      </p>
      <div class="dlg-act">
        <el-button v-if="!chk.readonly" size="small" @click="chk.visible = false">取消</el-button>
        <el-button v-if="chk.readonly" size="small" type="primary" @click="chk.visible = false">关闭</el-button>
        <el-button v-else size="small" type="primary" @click="saveCheck">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCards from '@/components/StatCards.vue'

const TAG = { 待盘点: 'info', 已完成: 'success', 有差异: 'danger' }
const warehouses = ['华东主仓', '华南仓', '平台仓1', '平台仓2']
const owners = ['杨主管', '李丽霞', '王强']

const rows = ref([
  { no: 'PD202607121211', poNo: 'CG202607221421', name: '洗面奶 100g', warehouse: '华东主仓', inType: '采购入库', produceDate: '2026-01-14', expireDate: '2027-01-14', stockQty: 680, realQty: 672, owner: '杨主管', status: '有差异' },
  { no: 'PD202607121211', poNo: 'CG202607221421', name: '睫毛膏 8g', warehouse: '华东主仓', inType: '采购入库', produceDate: '2026-09-12', expireDate: '2027-09-12', stockQty: 102, realQty: 102, owner: '杨主管', status: '已完成' },
  { no: 'PD202609121113', poNo: '—', name: '抽纸 3层', warehouse: '华南仓', inType: '调拨入库', produceDate: '2026-07-14', expireDate: '2027-07-14', stockQty: 0, realQty: null, owner: '李丽霞', status: '待盘点' },
  { no: 'PD202602011230', poNo: 'CG202607180916', name: '牙膏 30g', warehouse: '平台仓2', inType: '采购入库', produceDate: '2026-09-12', expireDate: '2027-09-12', stockQty: 800, realQty: null, owner: '王强', status: '待盘点' },
  { no: 'PD202601121108', poNo: 'CG202607150622', name: '精华液 30ml', warehouse: '华南仓', inType: '采购入库', produceDate: '2026-01-14', expireDate: '2027-01-14', stockQty: 30, realQty: 28, owner: '李丽霞', status: '有差异' },
  { no: 'PD202601121108', poNo: 'CG202607150622', name: '眼睫毛 5ml', warehouse: '华南仓', inType: '调拨入库', produceDate: '2026-07-14', expireDate: '2027-07-14', stockQty: 230, realQty: 230, owner: '李丽霞', status: '已完成' }
])

const kw = ref('')
const inType = ref('')
const page = ref(1)
const size = ref(5)

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.no, r.name, r.owner].some(v => String(v).includes(k))
  const okType = !inType.value || r.inType === inType.value
  return okKw && okType
}))
const paged = computed(() => view.value.slice((page.value - 1) * size.value, page.value * size.value))

const num = v => (v === null || v === undefined ? '—' : v.toLocaleString('zh-CN'))
const stats = computed(() => {
  const all = view.value
  const orders = new Set(all.map(r => r.no))
  return [
    { label: '盘点单总数', value: orders.size, unit: '个' },
    { label: '待盘点', value: all.filter(r => r.status === '待盘点').length, unit: '个', tone: 'warn' },
    { label: '有差异', value: all.filter(r => r.status === '有差异').length, unit: '个', tone: 'danger' },
    { label: '本月盘点货品', value: all.reduce((s, r) => s + Number(r.stockQty || 0), 0).toLocaleString('zh-CN'), unit: '件' }
  ]
})

function reset() { kw.value = ''; inType.value = ''; page.value = 1 }

watch(() => view.value.length, n => {
  const max = Math.max(1, Math.ceil(n / size.value))
  if (page.value > max) page.value = max
})

/* ------- 货品池（同步库存/供应商货品） ------- */
const pool = [
  { code: 'SE-2026-001', name: '洗面奶 100g', spec: '100g/支', stockQty: 680 },
  { code: 'SE-2026-819', name: '睫毛膏 8g', spec: '8g/支', stockQty: 102 },
  { code: 'AS-2026-021', name: '抽纸 3层', spec: '3层/包', stockQty: 0 },
  { code: 'SE-2026-002', name: '眼睫毛 5ml', spec: '5ml/支', stockQty: 230 },
  { code: 'SE-2026-003', name: '牙膏 30g', spec: '30g/个', stockQty: 800 },
  { code: 'AS-2026-022', name: '精华液 30ml', spec: '30ml/瓶', stockQty: 30 }
]

/* ------- 创建盘点任务 ------- */
const dg = reactive({ visible: false, warehouse: '华东主仓', owner: '杨主管', remark: '', goods: [] })
const pickedGoods = computed(() => pool.filter(g => dg.goods.includes(g.code)))

function openCreate() {
  dg.warehouse = '华东主仓'
  dg.owner = '杨主管'
  dg.remark = ''
  dg.goods = []
  dg.visible = true
}

function saveCreate() {
  if (!dg.goods.length) return ElMessage.error('请至少添加一个盘点商品')
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  const no = `PD${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}`
  pickedGoods.value.forEach(g => {
    rows.value.unshift({
      no, poNo: '—', name: g.name, warehouse: dg.warehouse,
      inType: dg.warehouse === '华东主仓' ? '采购入库' : '调拨入库',
      produceDate: '2026-09-12', expireDate: '2027-09-12',
      stockQty: g.stockQty, realQty: null, owner: dg.owner, status: '待盘点',
      remark: dg.remark
    })
  })
  dg.visible = false
  page.value = 1
  ElMessage.success(`盘点任务 ${no} 已创建，共 ${dg.goods.length} 个货品，负责人 ${dg.owner}`)
}

/* ------- 盘点 / 查看 ------- */
const chk = reactive({ visible: false, row: null, val: '', readonly: false })
const diffText = computed(() => {
  if (!chk.row) return '—'
  const real = chk.readonly ? chk.row.realQty : (chk.val === '' ? null : Number(chk.val))
  if (real === null || Number.isNaN(real)) return '—'
  const d = real - Number(chk.row.stockQty || 0)
  return d === 0 ? '0（一致）' : `${d > 0 ? '+' : ''}${d.toLocaleString('zh-CN')}`
})

function openCheck(row) {
  chk.row = row
  chk.readonly = row.status !== '待盘点'
  chk.val = chk.readonly ? String(row.realQty ?? '') : ''
  chk.visible = true
}

function saveCheck() {
  if (chk.val === '' || Number.isNaN(Number(chk.val))) return ElMessage.error('请填写实盘数后才能保存')
  const real = Number(chk.val)
  chk.row.realQty = real
  chk.row.status = real === Number(chk.row.stockQty) ? '已完成' : '有差异'
  chk.visible = false
  ElMessage.success(
    chk.row.status === '已完成'
      ? '盘点已保存，实盘数与库存数一致'
      : `盘点已保存，差异 ${real - Number(chk.row.stockQty)}，请生成库存调整单`
  )
}
</script>

<style scoped>
.detail-head {
  display: flex; align-items: center; gap: 10px; margin: 4px 0 8px;
  padding-top: 10px; border-top: 1px dashed var(--line);
}
.detail-head h4 { margin: 0; font-size: 13px; font-weight: 600; }
.detail-head .extra { margin-left: auto; font-size: 11.5px; color: var(--ink-3); }
.detail-tool { display: flex; gap: 8px; margin-bottom: 8px; }
</style>
