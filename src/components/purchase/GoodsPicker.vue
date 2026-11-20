<template>
  <el-dialog :model-value="modelValue" title="添加货品" width="860px" align-center
    @update:model-value="v => emit('update:modelValue', v)">
    <p class="dlg-hint">同步供应商管理的供应商所连接的货品，根据供应商和货品类型进行筛选，勾选后加入采购明细。</p>

    <div class="picker">
      <div class="sup-col">
        <div class="col-head">供应商</div>
        <ul class="sup-list">
          <li v-for="s in pool" :key="s.name" :class="{ on: s.name === activeName }" @click="pickSupplier(s.name)">
            <span class="sname">{{ s.name }}</span>
            <em>{{ s.goods.length }}</em>
          </li>
        </ul>
      </div>

      <div class="goods-col">
        <div class="col-head">
          <span>供应商货品 · {{ activeName }}</span>
          <el-input v-model="kw" size="small" style="width: 180px" clearable placeholder="搜索货品名称/货码" />
        </div>
        <el-table ref="tableRef" :data="goodsView" size="small" height="286" row-key="code"
          @selection-change="onSelect">
          <el-table-column type="selection" width="42" />
          <el-table-column prop="code" label="货码编号" width="130" />
          <el-table-column prop="name" label="货品名称" min-width="120" />
          <el-table-column prop="spec" label="规格" width="96" />
          <el-table-column label="进货单价" width="100" align="right">
            <template #default="{ row }"><span class="mono">{{ money(row.price) }}</span></template>
          </el-table-column>
          <el-table-column label="最低成交价" width="104" align="right">
            <template #default="{ row }"><span class="mono">{{ money(row.minPrice) }}</span></template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="picker-foot">
      已选 <b>{{ selected.length }}</b> 个商品
      <span class="muted">（同一采购单只能选择一个供应商，切换供应商会清空已选）</span>
    </div>

    <div class="dlg-act">
      <el-button size="small" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button size="small" type="primary" :disabled="!selected.length" @click="confirm">确定</el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { money } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  /** 新建采购单已选定的供应商，弹窗默认定位到该供应商 */
  supplier: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'confirm'])

const pool = [
  {
    name: '某林林公司',
    goods: [
      { code: 'SO-2026-001', name: '洗面奶', spec: '100g/支', price: 9.99, minPrice: 12.02 },
      { code: 'SO-2026-002', name: '睫毛膏', spec: '8g/支', price: 8.20, minPrice: 9.80 },
      { code: 'SO-2026-003', name: '牙膏', spec: '30g/个', price: 12.00, minPrice: 19.50 }
    ]
  },
  {
    name: '美妆公司',
    goods: [
      { code: 'SO-2026-011', name: '眼睫毛', spec: '5ml/支', price: 6.60, minPrice: 8.40 },
      { code: 'SO-2026-012', name: '抽纸', spec: '3层/包', price: 3.50, minPrice: 4.20 }
    ]
  },
  {
    name: '雅美化妆品',
    goods: [
      { code: 'SO-2026-031', name: '精华液', spec: '30ml/瓶', price: 68.00, minPrice: 79.00 },
      { code: 'SO-2026-032', name: '小棕瓶', spec: '50ml/瓶', price: 380.00, minPrice: 420.00 }
    ]
  }
]

const activeName = ref(props.supplier && pool.some(p => p.name === props.supplier) ? props.supplier : pool[0].name)
const kw = ref('')
const selected = ref([])
const tableRef = ref()

const goodsView = computed(() => {
  const s = pool.find(p => p.name === activeName.value)
  if (!s) return []
  const k = kw.value.trim()
  return k ? s.goods.filter(g => g.name.includes(k) || g.code.includes(k)) : s.goods
})

function onSelect(rows) { selected.value = rows }
function pickSupplier(name) {
  if (name === activeName.value) return
  activeName.value = name
  kw.value = ''
  tableRef.value?.clearSelection()
  if (selected.value.length) ElMessage.info('已切换供应商，已选货品已清空')
  selected.value = []
}

watch(() => props.modelValue, v => {
  if (!v) return
  activeName.value = props.supplier && pool.some(p => p.name === props.supplier) ? props.supplier : pool[0].name
  kw.value = ''
  selected.value = []
})

function confirm() {
  emit('confirm', { supplier: activeName.value, goods: selected.value })
  emit('update:modelValue', false)
}
</script>

<style scoped>
.picker { display: flex; gap: 12px; }
.sup-col { width: 220px; flex: none; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
.goods-col { flex: 1; min-width: 0; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
.col-head {
  height: 38px; padding: 0 10px; background: #FAFBFC; border-bottom: 1px solid var(--line-2);
  display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--ink-2); font-weight: 600;
}
.col-head .el-input { margin-left: auto; font-weight: 400; }
.sup-list { margin: 0; padding: 4px; list-style: none; max-height: 286px; overflow-y: auto; }
.sup-list li {
  display: flex; align-items: center; gap: 8px; padding: 0 9px; height: 34px;
  border-radius: 5px; font-size: 12.5px; color: var(--ink-2); cursor: pointer;
}
.sup-list li:hover { background: var(--fill); }
.sup-list li.on { background: var(--brand-l); color: var(--brand-d); font-weight: 600; }
.sup-list .sname { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sup-list em { font-style: normal; font-size: 11px; color: var(--ink-3); }
.picker-foot {
  margin-top: 10px; padding: 8px 10px; background: #FAFBFC; border: 1px solid var(--line-2);
  border-radius: 6px; font-size: 12.5px; color: var(--ink-2);
}
.picker-foot b { color: var(--brand-d); }
.picker-foot .muted { margin-left: 8px; font-size: 11.5px; }
</style>
