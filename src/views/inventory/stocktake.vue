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
    <el-dialog v-model="chk.visible" :title="chk.readonly ? '查看' : '盘点'" width="1060px"
      align-center class="take-dlg">
      <div class="sec-title">盘点明细</div>
      <el-table :data="chkItems" size="small" border class="detail-table"
        :header-cell-style="{ background: '#F7F8FA', color: 'var(--ink-2)', whiteSpace: 'normal', padding: '6px' }"
        :cell-style="{ padding: '7px 6px' }">
        <el-table-column label="盘点单号" width="112">
          <template #header>
            <div class="th2"><span>盘点单号</span><em>PD+年+月+日+时间</em></div>
          </template>
          <template #default="{ row }"><span class="pd-no">{{ row.no }}</span></template>
        </el-table-column>
        <el-table-column prop="name" label="货品名称" width="84" show-overflow-tooltip />
        <el-table-column prop="code" label="货品编码" width="88" show-overflow-tooltip />
        <el-table-column prop="batch" label="批次号" width="78" />
        <el-table-column prop="category" label="货品类型" width="64" />
        <el-table-column prop="inType" label="入库类型" width="64" />
        <el-table-column prop="warehouse" label="收货仓" width="64" />
        <el-table-column prop="poNo" label="采购单号" width="112">
          <template #header>
            <div class="th2"><span>采购单号</span><em>同步采购管理</em></div>
          </template>
        </el-table-column>
        <el-table-column prop="produceDate" label="货品生产日期" width="82" />
        <el-table-column prop="expireDate" label="货品有效期" width="80" />
        <el-table-column label="库存数" width="56" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.stockQty) }}</span></template>
        </el-table-column>
        <el-table-column label="实盘数" width="62" align="right">
          <template #default="{ row }">
            <el-input v-if="!chk.readonly" v-model="chk.vals[keyOf(row)]" size="small" class="qty-in"
              placeholder="请输入" @input="chk.vals[keyOf(row)] = onlyNum(chk.vals[keyOf(row)])" />
            <span v-else class="mono">{{ num(row.realQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="60" />
      </el-table>

      <div class="sec-title">备注</div>
      <el-input v-model="chk.remark" type="textarea" :rows="4" maxlength="200"
        :readonly="chk.readonly" placeholder="选填，如：破损、货架位置异常等说明" />

      <div class="dlg-act">
        <el-button size="small" @click="chk.visible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveCheck">确定</el-button>
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
  { no: 'PD202607121211', poNo: 'CG202607221421', name: '洗面奶 100g', code: 'SE-2026-001', batch: 'B20260101', category: '家居日用', warehouse: '华东主仓', inType: '采购入库', produceDate: '2026-01-14', expireDate: '2027-01-14', stockQty: 680, realQty: 672, owner: '杨主管', status: '有差异', remark: '货架里侧少 8 支，已拍照留证，待复核。' },
  { no: 'PD202607121211', poNo: 'CG202607221421', name: '睫毛膏 8g', code: 'SE-2026-819', batch: 'B20261021', category: '美妆个护', warehouse: '华东主仓', inType: '采购入库', produceDate: '2026-09-12', expireDate: '2027-09-12', stockQty: 102, realQty: 102, owner: '杨主管', status: '已完成', remark: '' },
  { no: 'PD202609121113', poNo: '—', name: '抽纸 3层', code: 'AS-2026-021', batch: 'B20260819', category: '家居日用', warehouse: '华南仓', inType: '调拨入库', produceDate: '2026-07-14', expireDate: '2027-07-14', stockQty: 0, realQty: null, owner: '李丽霞', status: '待盘点', remark: '' },
  { no: 'PD202602011230', poNo: 'CG202607180916', name: '牙膏 30g', code: 'SE-2026-003', batch: 'B20260714', category: '家居日用', warehouse: '平台仓2', inType: '采购入库', produceDate: '2026-09-12', expireDate: '2027-09-12', stockQty: 800, realQty: null, owner: '王强', status: '待盘点', remark: '' },
  { no: 'PD202601121108', poNo: 'CG202607150622', name: '精华液 30ml', code: 'AS-2026-022', batch: 'B20260114', category: '美妆个护', warehouse: '华南仓', inType: '采购入库', produceDate: '2026-01-14', expireDate: '2027-01-14', stockQty: 30, realQty: 28, owner: '李丽霞', status: '有差异', remark: '破损 2 瓶已报废，等仓库确认后调整库存。' },
  { no: 'PD202601121108', poNo: 'CG202607150622', name: '眼睫毛 5ml', code: 'SE-2026-002', batch: 'B20260912', category: '美妆个护', warehouse: '华南仓', inType: '调拨入库', produceDate: '2026-07-14', expireDate: '2027-07-14', stockQty: 230, realQty: 230, owner: '李丽霞', status: '已完成', remark: '' }
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
const chk = reactive({ visible: false, row: null, readonly: false, vals: {}, remark: '' })
const chkItems = computed(() => (chk.row ? rows.value.filter(r => r.no === chk.row.no) : []))
const keyOf = r => `${r.no}|${r.name}`
const onlyNum = v => String(v ?? '').replace(/[^\d]/g, '')

function openCheck(row) {
  chk.row = row
  chk.readonly = row.status !== '待盘点'
  chk.vals = {}
  chkItems.value.forEach(r => {
    chk.vals[keyOf(r)] = chk.readonly ? String(r.realQty ?? '') : ''
  })
  chk.remark = row.remark || ''
  chk.visible = true
}

function saveCheck() {
  if (chk.readonly) { chk.visible = false; return }
  const blank = chkItems.value.filter(r => String(chk.vals[keyOf(r)] ?? '').trim() === '')
  if (blank.length) return ElMessage.error('请填写实盘数后才能保存')
  let diff = 0
  chkItems.value.forEach(r => {
    const real = Number(chk.vals[keyOf(r)])
    r.realQty = real
    r.status = real === Number(r.stockQty) ? '已完成' : '有差异'
    r.remark = chk.remark
    if (r.status === '有差异') diff++
  })
  chk.visible = false
  ElMessage.success(
    diff
      ? `盘点已保存，${diff} 个货品有差异，请生成库存调整单`
      : '盘点已保存，实盘数与库存数一致'
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

/* 盘点 / 查看弹窗 */
.take-dlg { max-width: 96vw; }
/* 标题区与内容区之间加分隔，贴近原型弹窗 */
.take-dlg :deep(.el-dialog__header) {
  padding-bottom: 12px; margin-bottom: 14px; border-bottom: 1px solid var(--line-2);
}
.sec-title { margin: 2px 0 8px; font-size: 13px; font-weight: 600; color: var(--ink); }
.sec-title + .el-textarea { margin-bottom: 2px; }
.detail-table { margin-bottom: 16px; font-size: 11px; }
.detail-table :deep(.el-table__cell) { font-size: 11px; }
/* el-table 的 .cell 自带 12px 左右内边距，叠加单元格 padding 会把可用宽度吃掉一半 */
.detail-table :deep(.cell) { padding: 0; }
/* 两行表头：主标题 + 灰色规则说明 */
.th2 { display: flex; flex-direction: column; line-height: 1.35; }
.th2 em { font-style: normal; font-size: 9.5px; color: var(--ink-3); font-weight: 400; }
.pd-no { color: var(--brand); font-variant-numeric: tabular-nums; }
.qty-in { width: 100%; }
.qty-in :deep(.el-input__inner) { padding: 0 6px; text-align: right; }
</style>
