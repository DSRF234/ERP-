<template>
  <div>
    <PageHeader title="库存盘点" sub="创建盘点任务 · 录入实盘数 · 差异留痕">
      <el-button size="small" @click="adjVisible = true">库存调整单（{{ take.adjustments.length }}）</el-button>
      <el-button v-can="'b-stocktake-create'" size="small" type="primary" :icon="Plus" @click="openCreate">创建盘点任务</el-button>
    </PageHeader>

    <StatCards :items="stats" />

    <div class="toolbar">
      <el-input v-model="kw" size="small" style="width: 240px" clearable :prefix-icon="Search"
        placeholder="输入盘点号/货品名称/负责人" />
      <el-button size="small" type="primary" @click="page = 1">搜索</el-button>
      <el-select v-model="category" size="small" style="width: 132px">
        <el-option label="全部货品类型" value="all" />
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="state" size="small" style="width: 120px">
        <el-option label="全部状态" value="all" />
        <el-option v-for="t in STATUS" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="warehouse" size="small" style="width: 140px">
        <el-option label="全部收货仓" value="all" />
        <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
      </el-select>
      <span class="grow">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <el-table :data="paged" size="small">
        <el-table-column prop="no" label="盘点单号" width="136" />
        <el-table-column label="采购单号" width="136">
          <template #default="{ row }">
            <a v-if="row.poNo && row.poNo !== '—'" class="po-link mono" @click="gotoPurchase(row.poNo)">{{ row.poNo }}</a>
            <span v-else class="mono muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="货品名称" min-width="126" />
        <el-table-column prop="warehouse" label="仓库" width="90" />
        <el-table-column prop="inType" label="入库类型" width="92" />
        <el-table-column prop="produceDate" label="货品生产日期" width="112" />
        <el-table-column prop="expireDate" label="货品有效期" width="112" />
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
        <el-pagination v-model:current-page="page" :page-size="PAGE_SIZE"
          :total="view.length" layout="total, prev, pager, next" small background />
      </div>
    </div>

    <!-- 创建盘点任务 -->
    <el-dialog v-model="dg.visible" title="创建盘点任务" width="680px" align-center>
      <el-form label-position="top" size="small" class="take-form">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="供货仓库" required>
              <el-select v-model="dg.warehouse" style="width: 100%">
                <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="供应商名称" required>
              <el-select v-model="dg.supplier" style="width: 100%" clearable placeholder="请选择供应商">
                <el-option v-for="s in suppliers" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="货品类型" required>
              <el-select v-model="dg.category" style="width: 100%" clearable placeholder="请选择类型">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="负责人" required>
              <el-select v-model="dg.owner" style="width: 100%">
                <el-option v-for="o in owners" :key="o" :label="o" :value="o" />
              </el-select>
              <div class="field-hint">按入库类型选择负责人</div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="detail-head">
        <h4>盘点明细</h4>
        <el-button v-can="'b-stocktake-add'" size="small" :icon="Plus" @click="openPicker">添加货品</el-button>
      </div>
      <el-table :data="pickedGoods" size="small" :max-height="200"
        empty-text="还没有添加商品，点右上角「添加货品」">
        <el-table-column prop="name" label="货品名称" min-width="150" />
        <el-table-column prop="code" label="货品编码" width="130" />
        <el-table-column prop="batch" label="批次号" width="120" />
        <el-table-column label="库存数" width="86" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.stockQty) }}</span></template>
        </el-table-column>
      </el-table>

      <div class="remark-label">备注</div>
      <el-input v-model="dg.remark" type="textarea" :rows="3" maxlength="200" show-word-limit
        placeholder="选填，如：月末全仓盘点" />

      <div class="dlg-act">
        <el-button size="small" @click="dg.visible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveCreate">确定</el-button>
      </div>
    </el-dialog>

    <!-- 添加货品 -->
    <el-dialog v-model="pk.visible" title="添加货品" width="800px" align-center>
      <div class="pk-row">
        <div class="pk-thumb"><el-icon><Picture /></el-icon></div>
        <div class="pk-field">
          <label>供应商名称</label>
          <el-select v-model="pk.supplier" size="small" style="width: 100%" clearable placeholder="全部供应商">
            <el-option v-for="s in suppliers" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="pk-field">
          <label>货品类型</label>
          <el-select v-model="pk.category" size="small" style="width: 100%" clearable placeholder="全部类型">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <div class="pk-field pk-goods">
          <label>货品名称</label>
          <el-select v-model="pk.codes" size="small" style="width: 100%" multiple filterable
            collapse-tags collapse-tags-tooltip placeholder="同步库存管理已入库货品">
            <el-option v-for="g in pkOptions" :key="g.code + g.batch" :label="g.name" :value="g.code" />
          </el-select>
        </div>
      </div>
      <p class="field-hint" style="margin-top: 10px">
        支持多选该供应商已连接的货品，按货品类型和货品名称筛选；已在盘点明细中的货品不再出现。
        取消后本次勾选清空，点「确定」才加入明细。
      </p>
      <div class="dlg-act">
        <el-button size="small" @click="cancelPicker">取消</el-button>
        <el-button size="small" type="primary" @click="savePicker">确定</el-button>
      </div>
    </el-dialog>

    <!-- 盘点 / 查看：带出整单明细 -->
    <el-dialog v-model="chk.visible" :title="chk.readonly ? '查看' : '盘点'" width="1060px"
      align-center class="take-dlg">
      <div class="sec-title">盘点明细（单号 {{ chk.no }}，共 {{ chkItems.length }} 行）</div>
      <el-table :data="chkItems" size="small" border class="detail-table"
        :header-cell-style="{ background: '#F7F8FA', color: 'var(--ink-2)', whiteSpace: 'normal', padding: '6px' }"
        :cell-style="{ padding: '7px 6px' }">
        <el-table-column label="盘点单号" width="110">
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
        <el-table-column prop="poNo" label="采购单号" width="110">
          <template #header>
            <div class="th2"><span>采购单号</span><em>同步采购管理</em></div>
          </template>
        </el-table-column>
        <el-table-column prop="produceDate" label="货品生产日期" width="80" />
        <el-table-column prop="expireDate" label="货品有效期" width="78" />
        <el-table-column label="库存数" width="56" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.stockQty) }}</span></template>
        </el-table-column>
        <el-table-column label="实盘数" width="94" align="center">
          <template #default="{ row }">
            <el-input v-if="!chk.readonly" v-model="chk.vals[keyOf(row)]" size="small" class="qty-in"
              maxlength="6" placeholder="0-100000" />
            <span v-else class="mono qty-txt">{{ num(row.realQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="58" />
      </el-table>

      <div class="sec-title">备注</div>
      <el-input v-model="chk.remark" type="textarea" :rows="4" maxlength="200"
        :readonly="chk.readonly" placeholder="选填，如：破损、货架位置异常等说明" />

      <div class="dlg-act">
        <el-button size="small" @click="chk.visible = false">{{ chk.readonly ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!chk.readonly" v-can="'b-stocktake-submit'" size="small" type="primary" @click="saveCheck">确定</el-button>
      </div>
    </el-dialog>

    <!-- 库存调整单 -->
    <el-drawer v-model="adjVisible" title="库存调整单" size="720px">
      <el-table :data="take.adjustments" size="small" empty-text="暂无调整单（盘点有差异时自动生成）">
        <el-table-column prop="no" label="调整单号" width="120" />
        <el-table-column prop="taskNo" label="来源盘点单" width="120" />
        <el-table-column prop="name" label="货品" min-width="110" />
        <el-table-column prop="batch" label="批次号" width="100" />
        <el-table-column label="差异" width="72" align="right">
          <template #default="{ row }">
            <span class="mono" :class="row.diff < 0 ? 'neg' : 'pos'">{{ row.diff > 0 ? '+' : '' }}{{ row.diff }}</span>
          </template>
        </el-table-column>
        <el-table-column label="调整前 / 后" width="120" align="right">
          <template #default="{ row }"><span class="mono">{{ row.before }} → {{ row.after }}</span></template>
        </el-table-column>
        <el-table-column prop="time" label="生成时间" width="130" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Search, Picture } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCards from '@/components/StatCards.vue'
import { useStocktakeStore } from '@/stores/stocktake'
import { useSupplierStore } from '@/stores/supplier'

const router = useRouter()
const take = useStocktakeStore()
const supplierStore = useSupplierStore()

const STATUS = ['待盘点', '已完结', '有差异']
const TAG = { 待盘点: 'info', 已完结: 'success', 有差异: 'danger' }
const warehouses = ['华东主仓', '华南仓', '平台仓1', '平台仓2']
const owners = ['杨主管', '李丽霞', '王强']
const PAGE_SIZE = 20

const kw = ref('')
const category = ref('all')
const state = ref('all')
const warehouse = ref('all')
const page = ref(1)
const adjVisible = ref(false)

/** 货品池：库存里的批次 + 供应商名，供添加货品筛选 */
const pool = computed(() => take.pool)
const suppliers = computed(() => [...new Set(pool.value.map(g => g.supplier).filter(Boolean))])
const categories = computed(() => [...new Set(pool.value.map(g => g.category).filter(Boolean))])

const view = computed(() => take.rows.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.no, r.name, r.owner, r.code].some(v => String(v).includes(k))
  const okCat = category.value === 'all' || r.category === category.value
  const okSt = state.value === 'all' || r.status === state.value
  const okWh = warehouse.value === 'all' || r.warehouse === warehouse.value
  return okKw && okCat && okSt && okWh
}))
const paged = computed(() => view.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

const num = v => (v === null || v === undefined ? '—' : Number(v).toLocaleString('zh-CN'))

/** 盘点记录 = 盘点明细行数（PRD 4.1 口径） */
const stats = computed(() => {
  const all = view.value
  return [
    { label: '盘点记录', value: all.length, unit: '条' },
    { label: '待盘点', value: all.filter(r => r.status === '待盘点').length, unit: '条', tone: 'warn' },
    { label: '有差异', value: all.filter(r => r.status === '有差异').length, unit: '条', tone: 'danger' },
    { label: '本月盘点货品', value: num(all.reduce((s, r) => s + Number(r.stockQty || 0), 0)), unit: '件' }
  ]
})

watch(() => view.value.length, n => {
  const max = Math.max(1, Math.ceil(n / PAGE_SIZE))
  if (page.value > max) page.value = max
})

function gotoPurchase(poNo) {
  router.push({ path: '/purchase', query: { kw: poNo } })
}

/* ------- 创建盘点任务 ------- */
const dg = reactive({ visible: false, warehouse: '华东主仓', supplier: '', category: '', owner: '杨主管', remark: '', goods: [] })
const pickedGoods = computed(() => pool.value.filter(g => dg.goods.includes(g.code + '|' + g.batch)))

function openCreate() {
  Object.assign(dg, { warehouse: '华东主仓', supplier: suppliers.value[0] || '', category: categories.value[0] || '', owner: '杨主管', remark: '', goods: [] })
  dg.visible = true
}

/* ------- 添加货品 ------- */
const pk = reactive({ visible: false, supplier: '', category: '', codes: [] })
const pkOptions = computed(() => pool.value.filter(g => {
  const okS = !pk.supplier || g.supplier === pk.supplier
  const okC = !pk.category || g.category === pk.category
  return okS && okC && !dg.goods.includes(g.code + '|' + g.batch)
}))

function openPicker() {
  Object.assign(pk, { supplier: dg.supplier || '', category: dg.category || '', codes: [], visible: true })
}
function cancelPicker() {
  pk.visible = false
  pk.codes = []
}
function savePicker() {
  const add = pk.codes.map(code => {
    const hit = pkOptions.value.find(g => g.code === code)
    return hit ? { key: `${hit.code}|${hit.batch}`, hit } : null
  }).filter(Boolean).filter(x => !dg.goods.includes(x.key))
  if (!add.length) return ElMessage.error('请先勾选要添加的货品')
  dg.goods.push(...add.map(x => x.key))
  pk.visible = false
  pk.codes = []
  ElMessage.success(`已添加 ${add.length} 个货品到盘点明细`)
}

function saveCreate() {
  if (!dg.supplier) return ElMessage.error('请选择供应商名称')
  if (!dg.category) return ElMessage.error('请选择货品类型')
  const goods = pickedGoods.value
  const res = take.createTask({ warehouse: dg.warehouse, owner: dg.owner, remark: dg.remark, goods })
  if (!res.ok) return ElMessage.error(res.msg)
  dg.visible = false
  page.value = 1
  ElMessage.success(`盘点任务 ${res.no} 已创建，共 ${res.count} 个货品，负责人 ${dg.owner}`)
}

/* ------- 盘点 / 查看 ------- */
const chk = reactive({ visible: false, no: '', readonly: false, vals: {}, remark: '' })
const chkItems = computed(() => (chk.no ? take.groupsOf(chk.no) : []))
const keyOf = r => `${r.no}|${r.name}|${r.batch}`

function openCheck(row) {
  chk.no = row.no
  chk.readonly = row.status !== '待盘点'
  chk.vals = {}
  chkItems.value.forEach(r => { chk.vals[keyOf(r)] = chk.readonly ? String(r.realQty ?? '') : '' })
  chk.remark = row.remark || ''
  chk.visible = true
}

function saveCheck() {
  const items = chkItems.value
  for (const r of items) {
    const raw = String(chk.vals[keyOf(r)] ?? '').trim()
    if (raw === '') return ElMessage.error(`【${r.name}】请填写实盘数后才能保存`)
    if (!/^\d+$/.test(raw)) return ElMessage.error(`【${r.name}】实盘数只能是非负整数，当前为「${raw}」`)
    if (Number(raw) > 100000) return ElMessage.error(`【${r.name}】实盘数需在 0~100000 之间`)
  }
  let diffCount = 0
  let lastAdj = ''
  for (const r of items) {
    const res = take.saveCheck({ no: r.no, name: r.name, batch: r.batch, realQty: Number(chk.vals[keyOf(r)]), remark: chk.remark })
    if (!res.ok) return ElMessage.error(res.msg)
    if (res.status === '有差异') { diffCount++; lastAdj = res.adjNo }
  }
  chk.visible = false
  if (diffCount) {
    ElMessage.success(`盘点已保存，${diffCount} 个货品有差异，已生成库存调整单 ${lastAdj} 并回写库存`)
  } else {
    ElMessage.success('盘点已保存，实盘数与库存数一致')
  }
}
</script>

<style scoped>
.detail-head {
  display: flex; align-items: center; gap: 10px; margin: 4px 0 8px;
  padding-top: 10px; border-top: 1px dashed var(--line);
}
.detail-head h4 { margin: 0; font-size: 13px; font-weight: 600; }
.detail-head .el-button { margin-left: auto; }
.po-link { color: var(--brand); cursor: pointer; text-decoration: none; }
.po-link:hover { text-decoration: underline; }
.muted { color: var(--ink-3); }
.neg { color: var(--danger); }
.pos { color: var(--ok); }

/* 创建盘点任务：标签在输入框上方 */
.take-form :deep(.el-form-item) { margin-bottom: 14px; }
.take-form :deep(.el-form-item__label) {
  padding-bottom: 4px; font-size: 12px; line-height: 1.4; color: var(--ink-2);
}
.remark-label { margin: 14px 0 6px; font-size: 12px; color: var(--ink-2); }

/* 添加货品：图片 + 三项筛选横排 */
.pk-row { display: flex; gap: 14px; align-items: flex-start; }
.pk-thumb {
  width: 96px; height: 84px; flex: none; border-radius: 6px;
  background: var(--brand-l); color: var(--brand);
  display: flex; align-items: center; justify-content: center; font-size: 30px;
}
.pk-field { flex: 1; min-width: 0; }
.pk-goods { flex: 1.4; }
.pk-field label {
  display: block; margin-bottom: 6px; font-size: 12px; color: var(--ink-2);
}
.pk-field label::before { content: '*'; color: #E4573D; margin-right: 2px; }

/* 盘点 / 查看弹窗 */
.take-dlg { max-width: 96vw; }
.take-dlg :deep(.el-dialog__header) {
  padding-bottom: 12px; margin-bottom: 14px; border-bottom: 1px solid var(--line-2);
}
.sec-title { margin: 2px 0 8px; font-size: 13px; font-weight: 600; color: var(--ink); }
.sec-title + .el-textarea { margin-bottom: 2px; }
.detail-table { margin-bottom: 16px; font-size: 11px; }
.detail-table :deep(.el-table__cell) { font-size: 11px; }
.detail-table :deep(.cell) { padding: 0; }
.th2 { display: flex; flex-direction: column; line-height: 1.35; }
.th2 em { font-style: normal; font-size: 9.5px; color: var(--ink-3); font-weight: 400; }
.pd-no { color: var(--brand); font-variant-numeric: tabular-nums; }
.qty-in { width: 100%; }
.qty-in :deep(.el-input__wrapper) {
  padding: 0 7px; min-height: 28px;
  background: var(--brand-l); box-shadow: 0 0 0 1px var(--brand) inset;
}
.qty-in :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px var(--brand-d) inset; }
.qty-in :deep(.el-input__wrapper.is-focus) {
  background: #fff; box-shadow: 0 0 0 1px var(--brand), 0 0 0 3px rgba(22, 155, 213, .16);
}
.qty-in :deep(.el-input__inner) {
  height: 28px; text-align: center; font-size: 13px; font-weight: 600; color: var(--brand-d);
}
.qty-in :deep(.el-input__inner::placeholder) { font-weight: 400; color: #6EAED2; }
.qty-txt { font-weight: 600; color: var(--ink); }
</style>
