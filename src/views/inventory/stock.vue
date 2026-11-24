<template>
  <div>
    <PageHeader title="库存记录" sub="货品批次库存 · 剩余容量 · 库存预警">
      <el-button v-can="'b-stock-warn'" size="small" type="primary" :icon="Bell" @click="openWarn">设置预警</el-button>
    </PageHeader>

    <StatCards :items="stats" />

    <div class="toolbar">
      <el-input v-model="kw" size="small" style="width: 240px" clearable :prefix-icon="Search"
        placeholder="输入商品名称/编码/批次号" />
      <el-button size="small" type="primary" @click="page = 1">搜索</el-button>
      <el-select v-model="category" size="small" style="width: 124px">
        <el-option label="全部货品类型" value="all" />
        <el-option v-for="c in inv.categories" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="stockState" size="small" style="width: 118px">
        <el-option label="全部库存状态" value="all" />
        <el-option v-for="t in STATES" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="warehouse" size="small" style="width: 140px">
        <el-option label="全部收货仓" value="all" />
        <el-option v-for="w in inv.warehouses" :key="w" :label="w" :value="w" />
      </el-select>
      <span class="grow">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <el-table :data="paged" size="small" class="stock-table">
        <el-table-column prop="name" label="货品名称" min-width="128" show-overflow-tooltip />
        <el-table-column prop="code" label="货码" width="100" />
        <el-table-column prop="category" label="货品类型" width="68" />
        <el-table-column prop="batch" label="批次号" width="96" />
        <el-table-column prop="warehouse" label="仓库" width="72" />
        <el-table-column label="入库单号" width="110">
          <template #default="{ row }"><span class="mono">{{ row.inNo || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="入库数量" width="66" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.inQty) }}</span></template>
        </el-table-column>
        <el-table-column label="出库单号" width="110">
          <template #default="{ row }"><span class="mono">{{ row.outNo || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="出库数量" width="66" align="right">
          <template #default="{ row }">
            <span class="mono">{{ row.outQty ? num(row.outQty) : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余数量" width="72" align="right">
          <template #default="{ row }"><span class="mono strong">{{ num(row.left) }}</span></template>
        </el-table-column>
        <el-table-column label="剩余容量" width="88">
          <template #default="{ row }">
            <div class="cap" :class="row.status === '缺货' ? 'is-out' : row.status === '预警' ? 'is-low' : ''">
              <span class="cap-bar"><i :style="{ width: row.cap + '%' }" /></span>
              <span class="cap-txt">{{ row.cap }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="预警值" width="64" align="right">
          <template #default="{ row }">
            <el-tooltip v-if="row.warnDays" placement="top"
              :content="`临期阈值：距到期不足 ${row.warnDays} ${row.warnUnit} 时预警`">
              <span class="mono warn-val">{{ num(row.warnValue) }}</span>
            </el-tooltip>
            <span v-else class="mono">{{ num(row.warnValue) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存状态" width="74">
          <template #default="{ row }">
            <el-tooltip :content="statusTip(row)" placement="top">
              <el-tag size="small" :type="TAG[row.status]">{{ row.status }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" :page-size="PAGE_SIZE"
          :total="view.length" layout="total, prev, pager, next" small background />
      </div>
    </div>

    <!-- 设置预警 -->
    <el-dialog v-model="warn.visible" title="设置预警" width="620px" align-center>
      <div class="warn-filter">
        <el-select v-model="warn.supplier" size="small" style="width: 132px" placeholder="全部供应商">
          <el-option label="全部供应商" value="" />
          <el-option v-for="s in inv.suppliers" :key="s" :label="s" :value="s" />
        </el-select>
        <el-input v-model="warn.kw" size="small" class="warn-kw" clearable :prefix-icon="Search"
          placeholder="输入商品名称/编码/批次号" @keyup.enter="doSearch" />
        <el-button size="small" type="primary" @click="doSearch">查找</el-button>
      </div>

      <div class="warn-allbar">
        <label class="warn-all">
          <el-checkbox :model-value="allChecked" :indeterminate="partChecked" @change="toggleAll" />
          <span>全选</span>
        </label>
        <span class="all-tip">勾选当前筛选的 {{ warnResults.length }} 个商品</span>
      </div>

      <div class="warn-list">
        <label v-for="g in warnResults" :key="g.code" class="warn-row"
          :class="{ on: warn.checked.includes(g.code) }">
          <el-checkbox :model-value="warn.checked.includes(g.code)"
            @change="v => setGoods(g.code, v)" />
          <span class="g-name">{{ g.name }}</span>
          <span class="g-code">{{ g.code }}</span>
        </label>
        <div v-if="!warnResults.length" class="warn-empty">没有匹配的货品，换个供应商或关键字试试</div>
      </div>

      <div class="warn-count">
        <span>已选 <b>{{ warn.checked.length }}</b> 个商品</span>
        <span>已匹配 <b>{{ warnResults.length }}</b> 个结果</span>
      </div>

      <div class="warn-fields">
        <div class="fld">
          <label class="req">
            填写时间
            <el-tooltip placement="top"
              content="批次距到期日期不足该时间时，库存状态置为「预警」；仅支持 0~100 的整数">
              <el-icon class="ask"><QuestionFilled /></el-icon>
            </el-tooltip>
          </label>
          <el-input v-model="warn.days" size="small" placeholder="0~100" />
        </div>
        <div class="fld">
          <label class="req">选择单位</label>
          <el-radio-group v-model="warn.unit" class="unit">
            <el-radio value="年">年</el-radio>
            <el-radio value="月">月</el-radio>
            <el-radio value="日">日</el-radio>
          </el-radio-group>
        </div>
        <div class="fld">
          <label class="req">库存最低值</label>
          <el-input v-model="warn.value" size="small" placeholder="0~100000">
            <template #append>件</template>
          </el-input>
        </div>
      </div>

      <div class="dlg-act">
        <el-button size="small" @click="warn.visible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveWarn">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Search, QuestionFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCards from '@/components/StatCards.vue'
import { useInventoryStore } from '@/stores/inventory'

const TAG = { 正常: 'success', 预警: 'warning', 缺货: 'danger' }
const STATES = ['正常', '预警', '缺货']
const PAGE_SIZE = 20

const inv = useInventoryStore()

const kw = ref('')
const category = ref('all')
const stockState = ref('all')
const warehouse = ref('all')
const page = ref(1)

const view = computed(() => inv.rows.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.name, r.code, r.batch].some(v => String(v).includes(k))
  const okWh = warehouse.value === 'all' || r.warehouse === warehouse.value
  const okCat = category.value === 'all' || r.category === category.value
  const okSt = stockState.value === 'all' || r.status === stockState.value
  return okKw && okWh && okCat && okSt
}))
const paged = computed(() => view.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

const num = v => (v === null || v === undefined ? '—' : Number(v).toLocaleString('zh-CN'))
const monthKey = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})()
const inThisMonth = d => String(d || '').startsWith(monthKey)

const stats = computed(() => {
  const all = view.value
  return [
    { label: '库存SKU总数', value: num(all.length), unit: '个' },
    { label: '在库总数量', value: num(all.reduce((s, r) => s + Number(r.left || 0), 0)), unit: '件' },
    { label: '预警商品', value: num(all.filter(r => r.status === '预警').length), unit: '个', tone: 'warn' },
    { label: '已缺货', value: num(all.filter(r => r.status === '缺货').length), unit: '个', tone: 'danger' },
    // 本月入库/出库按自然月统计（只看本月日期的那部分数量）
    { label: '本月入库', value: num(all.filter(r => inThisMonth(r.inDate)).reduce((s, r) => s + Number(r.inQty || 0), 0)), unit: '件' },
    { label: '本月出库', value: num(all.filter(r => inThisMonth(r.outDate)).reduce((s, r) => s + Number(r.outQty || 0), 0)), unit: '件' }
  ]
})

watch(() => view.value.length, n => {
  const max = Math.max(1, Math.ceil(n / PAGE_SIZE))
  if (page.value > max) page.value = max
})

function statusTip(r) {
  if (r.left <= 0) return '剩余数量为 0，已缺货'
  const parts = []
  if (r.left <= r.warnValue) parts.push(`剩余 ${num(r.left)} ≤ 预警值 ${num(r.warnValue)}`)
  if (r.leftDays !== null && Number(r.warnDays)) {
    const limit = Number(r.warnDays) * ({ 年: 365, 月: 30, 日: 1 }[r.warnUnit] || 30)
    if (r.leftDays <= limit) parts.push(`距到期 ${r.leftDays} 天，低于临期阈值 ${r.warnDays} ${r.warnUnit}`)
  }
  return parts.length ? parts.join('；') : `剩余 ${num(r.left)}，高于预警值且未到临期阈值`
}

/* ------- 设置预警 ------- */
const warn = reactive({
  visible: false, supplier: '', kw: '', appliedSupplier: '', appliedKw: '',
  checked: [], days: '', unit: '月', value: ''
})

const warnResults = computed(() => inv.goodsPool.filter(g => {
  const okS = !warn.appliedSupplier || g.supplier === warn.appliedSupplier
  const k = warn.appliedKw
  const okK = !k || g.name.includes(k) || g.code.toLowerCase().includes(k.toLowerCase())
    || g.batches.some(b => b.includes(k))
  return okS && okK
}))

function doSearch() {
  warn.appliedSupplier = warn.supplier
  warn.appliedKw = warn.kw.trim()
}

const allChecked = computed(() =>
  warnResults.value.length > 0 && warnResults.value.every(g => warn.checked.includes(g.code)))
const partChecked = computed(() =>
  !allChecked.value && warnResults.value.some(g => warn.checked.includes(g.code)))

function toggleAll(on) { warnResults.value.forEach(g => setGoods(g.code, on)) }
function setGoods(code, on) {
  const i = warn.checked.indexOf(code)
  if (on && i < 0) warn.checked.push(code)
  if (!on && i > -1) warn.checked.splice(i, 1)
}

function openWarn() {
  Object.assign(warn, { supplier: '', kw: '', checked: [], days: '', unit: '月', value: '' })
  doSearch()
  warn.visible = true
}

/** 只接受整数：-5 / abc / 1.5 一律报错，不再悄悄改数 */
function saveWarn() {
  if (!warn.checked.length) return ElMessage.error('请至少勾选一个商品')
  const daysStr = String(warn.days).trim()
  if (!/^\d+$/.test(daysStr)) return ElMessage.error('填写时间只能是非负整数（0~100）')
  const days = Number(daysStr)
  if (days < 0 || days > 100) return ElMessage.error('填写时间需在 0~100 之间')
  const valStr = String(warn.value).trim()
  if (!valStr) return ElMessage.error('请填写库存最低值')
  if (!/^\d+$/.test(valStr)) return ElMessage.error('库存最低值只能是非负整数')
  const value = Number(valStr)
  if (value > 100000) return ElMessage.error('库存最低值不能超过 100000')

  inv.setWarn({ codes: warn.checked, days, unit: warn.unit, value })
  ElMessage.success(`已为 ${warn.checked.length} 个商品设置预警：距到期不足 ${days} ${warn.unit} 或 剩余 ≤ ${num(value)} 件`)
  warn.visible = false
}
</script>

<style scoped>
.strong { font-weight: 600; }
.stock-table :deep(.el-table__cell) { font-size: 11.5px; }
.warn-val { border-bottom: 1px dashed var(--line); cursor: help; }

/* 弹窗：供应商 + 关键字筛选 */
.warn-filter { display: flex; align-items: center; gap: 8px; }
.warn-kw { flex: 1; min-width: 0; }

/* 弹窗：全选条 */
.warn-allbar { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.warn-all { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12.5px; color: var(--ink-2); }
.warn-all :deep(.el-checkbox) { margin-right: 0; height: auto; }
.warn-all :deep(.el-checkbox__label) { display: none; }
.warn-allbar .all-tip { font-size: 11.5px; color: var(--ink-3); }

/* 弹窗：货品勾选列表 */
.warn-list {
  margin-top: 6px; max-height: 182px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 5px;
}
.warn-row {
  display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 10px;
  background: var(--fill); border-radius: 4px; cursor: pointer;
}
.warn-row:hover { background: #ECEEF1; }
.warn-row.on { background: var(--brand-l); }
.warn-row :deep(.el-checkbox) { margin-right: 0; height: auto; }
.warn-row :deep(.el-checkbox__label) { display: none; }
.warn-row .g-name {
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 12.5px; color: var(--ink);
}
.warn-row .g-code { font-size: 12.5px; color: var(--brand); font-variant-numeric: tabular-nums; }
.warn-empty {
  padding: 16px 0; text-align: center; font-size: 12px; color: var(--ink-3);
  background: var(--fill); border-radius: 4px;
}

/* 弹窗：已选 / 已匹配 */
.warn-count {
  display: flex; justify-content: space-between; margin-top: 10px;
  font-size: 12.5px; color: var(--ink-2);
}
.warn-count b { margin: 0 2px; color: var(--brand-d); font-weight: 600; }

/* 弹窗：三项字段 */
.warn-fields {
  display: grid; grid-template-columns: 1.15fr 1.15fr 1fr; gap: 16px; margin-top: 18px;
}
.warn-fields .fld { min-width: 0; }
.warn-fields label {
  display: flex; align-items: center; gap: 2px; margin-bottom: 6px;
  font-size: 12px; color: var(--ink-2);
}
.warn-fields label.req::before { content: '*'; color: #E4573D; margin-right: 2px; }
.warn-fields .ask { font-size: 12px; color: var(--ink-3); cursor: help; }
.warn-fields .unit { display: flex; height: 28px; align-items: center; }
.warn-fields .unit :deep(.el-radio) { margin-right: 10px; height: auto; }
.warn-fields .unit :deep(.el-radio__label) { padding-left: 4px; font-size: 12.5px; }
</style>
