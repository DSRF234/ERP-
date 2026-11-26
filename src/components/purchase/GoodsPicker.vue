<template>
  <el-dialog :model-value="modelValue" title="添加货品" width="900px" align-center
    @update:model-value="v => emit('update:modelValue', v)">
    <p class="dlg-hint">货品来自「供应商管理」，只列合作中供应商的货品；切换供应商时已选货品会清空（同一采购单只能有一个供应商）。</p>

    <div class="picker">
      <div class="sup-col">
        <div class="col-head">供应商</div>
        <ul class="sup-list">
          <li v-for="s in pool" :key="s.name" :class="{ on: s.name === activeName }" @click="pickSupplier(s.name)">
            <span class="sname">{{ s.name }}</span>
            <em>{{ s.goods.length }}</em>
          </li>
          <li v-if="!pool.length" class="empty">暂无可用的合作中供应商</li>
        </ul>
      </div>

      <div class="goods-col">
        <div class="col-head">
          <span>供应商货品 · {{ activeName || '—' }}</span>
          <el-input v-model="kw" size="small" style="width: 180px" clearable placeholder="搜索货品名称/货码" />
        </div>
        <el-table ref="tableRef" :data="goodsView" size="small" height="286" row-key="code"
          empty-text="该供应商暂无货品" @selection-change="onSelect">
          <el-table-column type="selection" width="42" />
          <el-table-column label="图片" width="52" align="center">
            <template #default="{ row }">
              <img v-if="row.image" class="thumb-img" :src="row.image" alt="" />
              <span v-else class="thumb">图</span>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="货码编号" width="118" />
          <el-table-column prop="name" label="货品名称" min-width="110" />
          <el-table-column prop="spec" label="规格" width="88" />
          <el-table-column label="进货单价" width="92" align="right">
            <template #default="{ row }"><span class="mono">{{ money(row.price) }}</span></template>
          </el-table-column>
          <el-table-column label="最低成交价" width="96" align="right">
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
import { useSupplierStore } from '@/stores/supplier'

const props = defineProps({
  modelValue: Boolean,
  /** 新建采购单已选定的供应商，弹窗默认定位到该供应商 */
  supplier: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'confirm'])

const supplierStore = useSupplierStore()
/** 只列「合作中」供应商，停用的不会出现在这里 */
const pool = computed(() => supplierStore.activeSuppliers)

const activeName = ref('')
const kw = ref('')
const selected = ref([])
const tableRef = ref()

const goodsView = computed(() => {
  const s = pool.value.find(p => p.name === activeName.value)
  if (!s) return []
  const k = kw.value.trim()
  return k ? s.goods.filter(g => g.name.includes(k) || g.code.includes(k)) : s.goods
})

function initActive() {
  const list = pool.value
  if (!list.length) { activeName.value = ''; return }
  activeName.value = list.some(p => p.name === props.supplier) ? props.supplier : list[0].name
}

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
  initActive()
  kw.value = ''
  selected.value = []
})
watch(pool, () => { if (props.modelValue) initActive() })

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
.sup-list li.empty { justify-content: center; color: var(--ink-3); font-size: 12px; cursor: default; }
.sup-list .sname { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sup-list em { font-style: normal; font-size: 11px; color: var(--ink-3); }
.picker-foot {
  margin-top: 10px; padding: 8px 10px; background: #FAFBFC; border: 1px solid var(--line-2);
  border-radius: 6px; font-size: 12.5px; color: var(--ink-2);
}
.picker-foot b { color: var(--brand-d); }
.picker-foot .muted { margin-left: 8px; font-size: 11.5px; }
.thumb {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 4px;
  background: var(--fill); color: var(--ink-3); font-size: 11px;
}
.thumb-img {
  width: 30px; height: 30px; border-radius: 4px; object-fit: cover;
  border: 1px solid var(--line-2); background: #fff; display: block;
}
</style>
