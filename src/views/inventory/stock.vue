<template>
  <div>
    <PageHeader title="库存记录" sub="货品批次库存 · 剩余容量 · 库存预警">
      <el-button size="small" type="primary" :icon="Bell" @click="openWarn">设置预警</el-button>
    </PageHeader>

    <StatCards :items="stats" />

    <div class="toolbar">
      <el-input v-model="kw" size="small" style="width: 260px" clearable :prefix-icon="Search"
        placeholder="输入商品名称/编码/批次号" />
      <el-select v-model="warehouse" size="small" style="width: 130px">
        <el-option label="全部仓库" value="" />
        <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
      </el-select>
      <el-button size="small" type="primary" @click="page = 1">搜索</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="grow">共 {{ view.length }} 条 · 已选 {{ selected.length }} 个商品</span>
    </div>

    <div class="card">
      <el-table :data="paged" size="small" @selection-change="rows => selected = rows">
        <el-table-column type="selection" width="42" />
        <el-table-column prop="name" label="货品名称" min-width="160" />
        <el-table-column prop="code" label="货码" width="130" />
        <el-table-column prop="batch" label="批次号" width="120" />
        <el-table-column prop="warehouse" label="仓库" width="100" />
        <el-table-column prop="inNo" label="入库单号" width="140" />
        <el-table-column label="入库数量" width="94" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.inQty) }}</span></template>
        </el-table-column>
        <el-table-column label="出库数量" width="94" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.outQty) }}</span></template>
        </el-table-column>
        <el-table-column label="剩余数量" width="94" align="right">
          <template #default="{ row }"><span class="mono strong">{{ num(row.left) }}</span></template>
        </el-table-column>
        <el-table-column label="剩余容量" width="124">
          <template #default="{ row }">
            <div class="cap" :class="row.status === '缺货' ? 'is-out' : row.status === '预警' ? 'is-low' : ''">
              <span class="cap-bar"><i :style="{ width: row.cap + '%' }" /></span>
              <span class="cap-txt">{{ row.cap }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="预警值" width="88" align="right">
          <template #default="{ row }"><span class="mono">{{ num(row.warnValue) }}</span></template>
        </el-table-column>
        <el-table-column label="库存状态" width="96">
          <template #default="{ row }">
            <el-tag size="small" :type="TAG[row.status]">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :page-sizes="[5, 10, 20]"
          :total="view.length" layout="total, sizes, prev, pager, next" small background />
      </div>
    </div>

    <!-- 设置预警 -->
    <el-dialog v-model="warn.visible" title="设置预警" width="440px" align-center>
      <p class="dlg-hint">
        已选 <b>{{ selected.length }}</b> 个商品。库存最低值支持按单位设置，
        剩余数量 ≤ 预警值 时状态为「预警」，剩余数量为 0 时为「缺货」。
      </p>
      <el-form label-width="92px" size="small">
        <el-form-item label="选择单位">
          <el-select v-model="warn.unit" style="width: 100%">
            <el-option v-for="u in units" :key="u" :label="u" :value="u" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存最低值">
          <el-input v-model.number="warn.value" placeholder="只写数字，如 200">
            <template #append>{{ warn.unit }}</template>
          </el-input>
        </el-form-item>
      </el-form>
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
import { Bell, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCards from '@/components/StatCards.vue'

const TAG = { 正常: 'success', 预警: 'warning', 缺货: 'danger' }
const warehouses = ['华东主仓', '华南仓', '平台仓1', '平台仓2']
const units = ['件', '个', '支']

const rows = ref([
  { name: '洗面奶 100g', code: 'SE-2026-001', batch: 'B20260101', warehouse: '华东主仓', inNo: 'BQ20260101111', inQty: 1200, outQty: 520, left: 680, cap: 86, warnValue: 200, unit: '支' },
  { name: '睫毛膏 8g', code: 'SE-2026-819', batch: 'B20261021', warehouse: '华南仓', inNo: 'BQ20260101113', inQty: 300, outQty: 198, left: 102, cap: 34, warnValue: 150, unit: '支' },
  { name: '抽纸 3层', code: 'AS-2026-021', batch: 'B20260819', warehouse: '平台仓1', inNo: 'BQ20260819002', inQty: 2400, outQty: 2400, left: 0, cap: 0, warnValue: 100, unit: '件' },
  { name: '眼睫毛 5ml', code: 'SE-2026-002', batch: 'B20260912', warehouse: '华东主仓', inNo: 'BQ20260912003', inQty: 860, outQty: 630, left: 230, cap: 27, warnValue: 300, unit: '支' },
  { name: '牙膏 30g', code: 'SE-2026-003', batch: 'B20260714', warehouse: '平台仓2', inNo: 'BQ20260714004', inQty: 1500, outQty: 700, left: 800, cap: 53, warnValue: 200, unit: '个' },
  { name: '精华液 30ml', code: 'AS-2026-022', batch: 'B20260114', warehouse: '华南仓', inNo: 'BQ20260114005', inQty: 640, outQty: 610, left: 30, cap: 5, warnValue: 60, unit: '瓶' }
])

const kw = ref('')
const warehouse = ref('')
const page = ref(1)
const size = ref(5)
const selected = ref([])

const statusOf = r => (r.left <= 0 ? '缺货' : r.left <= r.warnValue ? '预警' : '正常')

const view = computed(() => rows.value.map(r => ({ ...r, status: statusOf(r) })).filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.name, r.code, r.batch].some(v => String(v).includes(k))
  const okWh = !warehouse.value || r.warehouse === warehouse.value
  return okKw && okWh
}))
const paged = computed(() => view.value.slice((page.value - 1) * size.value, page.value * size.value))

const sum = (arr, key) => arr.reduce((s, r) => s + Number(r[key] || 0), 0)
const num = v => (v === null || v === undefined ? '—' : v.toLocaleString('zh-CN'))
const stats = computed(() => {
  const all = view.value
  return [
    { label: '库存SKU总数', value: num(all.length), unit: '个' },
    { label: '在库总数量', value: num(sum(all, 'left')), unit: '件' },
    { label: '低于预警值', value: num(all.filter(r => r.status === '预警').length), unit: '个', tone: 'warn' },
    { label: '已缺货', value: num(all.filter(r => r.status === '缺货').length), unit: '个', tone: 'danger' },
    { label: '本月入库', value: num(sum(all, 'inQty')), unit: '件' },
    { label: '本月出库', value: num(sum(all, 'outQty')), unit: '件' }
  ]
})

function reset() { kw.value = ''; warehouse.value = ''; page.value = 1 }

watch(() => view.value.length, n => {
  const max = Math.max(1, Math.ceil(n / size.value))
  if (page.value > max) page.value = max
})

/* ------- 设置预警 ------- */
const warn = reactive({ visible: false, unit: '件', value: null })
function openWarn() {
  if (!selected.value.length) return ElMessage.warning('请先勾选需要设置预警的货品')
  warn.unit = selected.value[0].unit || '件'
  warn.value = selected.value[0].warnValue
  warn.visible = true
}
function saveWarn() {
  if (warn.value === null || warn.value === '' || Number(warn.value) < 0) {
    return ElMessage.error('请填写库存最低值（只写数字）')
  }
  selected.value.forEach(r => {
    const target = rows.value.find(x => x.code === r.code && x.batch === r.batch)
    if (target) { target.warnValue = Number(warn.value); target.unit = warn.unit }
  })
  warn.visible = false
  ElMessage.success(`已为 ${selected.value.length} 个商品设置预警值 ${warn.value} ${warn.unit}`)
}
</script>

<style scoped>
.strong { font-weight: 600; }
</style>
