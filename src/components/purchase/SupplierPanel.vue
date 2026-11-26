<template>
  <div class="sup-panel">
    <div class="toolbar">
      <el-input v-model="kwInput" size="small" style="width: 240px" clearable
        placeholder="输入供应商姓名/负责人/联系电话/地址" :prefix-icon="Search"
        @keyup.enter="doSearch" @clear="doSearch" />
      <el-button size="small" type="primary" @click="doSearch">搜索</el-button>
      <el-select v-model="typeFilter" size="small" style="width: 124px">
        <el-option label="全部货品类型" value="all" />
        <el-option v-for="t in TYPES" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="coState" size="small" style="width: 124px">
        <el-option label="全部合作状态" value="all" />
        <el-option v-for="s in CO_STATES" :key="s" :label="s" :value="s" />
      </el-select>
      <span class="grow">共 {{ view.length }} 家 · 合作中 {{ activeCount }} 家</span>
      <el-button v-can="'b-supplier-add'" size="small" type="primary" @click="openAdd">添加供应商</el-button>
    </div>

    <el-table ref="tableRef" :data="view" size="small" highlight-current-row :max-height="260"
      empty-text="没有匹配的供应商" @current-change="onSelect">
      <el-table-column prop="name" label="供应商名称" min-width="146" />
      <el-table-column prop="owner" label="负责人" width="84" />
      <el-table-column label="联系电话" width="122">
        <template #default="{ row }"><span class="mono">{{ fmtPhone(row.phone) }}</span></template>
      </el-table-column>
      <el-table-column prop="address" label="地址" min-width="196" show-overflow-tooltip />
      <el-table-column label="货品数" width="70" align="right">
        <template #default="{ row }">
          <span class="mono">{{ (row.goods || []).length }}</span>
        </template>
      </el-table-column>
      <el-table-column label="合作状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === '合作中' ? 'success' : 'info'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="126">
        <template #default="{ row }">
          <el-button v-can="'b-supplier-status'" v-if="row.status === '合作中'" link type="danger" size="small"
            @click.stop="toggle(row)">停用</el-button>
          <el-button v-can="'b-supplier-status'" v-else link type="primary" size="small" @click.stop="toggle(row)">复用</el-button>
          <el-tooltip :disabled="!refCount(row.name)" placement="top"
            :content="`该供应商已存在 ${refCount(row.name)} 张采购单，只能停用`">
            <span class="del-wrap">
              <el-button v-can="'b-supplier-delete'" link type="danger" size="small" :disabled="!!refCount(row.name)"
                @click.stop="removeSupplier(row)">删除</el-button>
            </span>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <div class="goods-block" v-if="active">
      <div class="goods-head">
        <h4>供应商货品 · {{ active.name }}</h4>
        <span class="extra">进货单价为供应商报价，最低成交价为历史最低成交记录（无记录显示 —）</span>
        <el-button v-can="'b-supplier-goods'" size="small" @click="openGoods">添加货品</el-button>
        <el-button link size="small" @click="clearActive">取消选中</el-button>
      </div>
      <el-table :data="active.goods" size="small" empty-text="该供应商暂未关联货品" :max-height="240">
        <el-table-column label="图片" width="66">
          <template #default><span class="thumb">图</span></template>
        </el-table-column>
        <el-table-column prop="code" label="货码编号" width="130" />
        <el-table-column prop="name" label="货品名称" min-width="150" />
        <el-table-column prop="spec" label="规格" width="100" />
        <el-table-column label="供应商货品进货单价" width="150" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.price) }}</span></template>
        </el-table-column>
        <el-table-column label="最低成交价" width="120" align="right">
          <template #default="{ row }"><span class="mono">{{ row.minPrice === null || row.minPrice === undefined ? '—' : money(row.minPrice) }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button v-can="'b-supplier-goods'" link type="danger" size="small" @click="removeGoods(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="empty-tip" v-else>选择上方任意供应商，下方展示该供应商关联的货品</div>

    <!-- 添加供应商 -->
    <el-dialog v-model="add.visible" title="添加供应商" width="560px" align-center>
      <p class="dlg-hint">供应商名称与联系电话不可重复（名称比较忽略首尾空格）；名称最多 100 个汉字。停用后，采购单的供应商选项与货品选择中都不再出现该供应商。</p>
      <el-form :model="add.form" :rules="rules" ref="formRef" label-width="92px" size="small">
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="add.form.name" maxlength="100" show-word-limit placeholder="手动输入，最多 100 个字符" />
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-input v-model="add.form.owner" maxlength="50" placeholder="手动输入，最多 50 个字符" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="add.form.phone" maxlength="11" placeholder="1XXXXXXXXXX"
            @input="add.form.phone = onlyDigits(add.form.phone)" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="add.form.address" type="textarea" :rows="2" maxlength="300" show-word-limit
            placeholder="手动输入，最多 300 个字符" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="add.form.remark" type="textarea" :rows="2" maxlength="300" placeholder="选填" />
        </el-form-item>
      </el-form>
      <div class="dlg-act">
        <el-button size="small" @click="add.visible = false">取消</el-button>
        <el-button size="small" type="primary" @click="submitAdd">确定</el-button>
      </div>
    </el-dialog>

    <!-- 添加货品到供应商 -->
    <el-dialog v-model="goods.visible" :title="`添加货品 · ${active?.name || ''}`" width="560px" align-center>
      <p class="dlg-hint">同一供应商下货码编号不可重复；规格与单位均为必填；进货单价 0~10000 元。</p>
      <el-form :model="goods.form" :rules="goodsRules" ref="goodsRef" label-width="92px" size="small">
        <el-form-item label="采购货品类型" prop="type">
          <el-select v-model="goods.form.type" style="width: 100%">
            <el-option label="美妆个护" value="美妆个护" />
            <el-option label="家居日用" value="家居日用" />
            <el-option label="食品饮料" value="食品饮料" />
          </el-select>
        </el-form-item>
        <el-form-item label="货品名称" prop="name">
          <el-input v-model="goods.form.name" placeholder="如：洗面奶" />
        </el-form-item>
        <el-form-item label="货品编码" prop="code">
          <el-input v-model="goods.form.code" placeholder="字母大写-年-001，如 SO-2026-001" />
        </el-form-item>
        <el-row :gutter="8">
          <el-col :span="16">
            <el-form-item label="规格" prop="spec">
              <el-input v-model="goods.form.spec" placeholder="如 100g" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位" prop="unit" label-width="48px">
              <el-select v-model="goods.form.unit" placeholder="请选择" style="width: 100%">
                <el-option v-for="u in UNITS" :key="u" :label="u" :value="u" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="进货单价" prop="price">
          <el-input v-model.number="goods.form.price" placeholder="0.00，最高 10000" />
        </el-form-item>
      </el-form>
      <div class="dlg-act">
        <el-button size="small" @click="goods.visible = false">取消</el-button>
        <el-button size="small" type="primary" @click="submitGoods">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { money } from '@/utils/format'
import { useSupplierStore } from '@/stores/supplier'
import { usePurchaseStore } from '@/stores/purchase'

const supplierStore = useSupplierStore()
const purchase = usePurchaseStore()

const TYPES = ['家居日用', '美妆个护']
const CO_STATES = ['合作中', '已停用']
/** 货品单位：与规格联合使用，规格列展示为「100g/支」 */
const UNITS = ['个', '支', '件', '盒', '瓶', '包', '套']

const kwInput = ref('')
const kw = ref('')
const typeFilter = ref('all')
const coState = ref('all')
const activeName = ref('')
const tableRef = ref()

const suppliers = computed(() => supplierStore.suppliers)
const fmtPhone = p => {
  const d = String(p || '').replace(/\D/g, '')
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : (p || '—')
}

function doSearch() { kw.value = kwInput.value.trim() }

const view = computed(() => suppliers.value.filter(s => {
  const k = kw.value
  if (k && ![s.name, s.owner, s.phone, s.address].some(v => String(v).includes(k))) return false
  if (typeFilter.value !== 'all' && !(s.goods || []).some(g => g.type === typeFilter.value)) return false
  if (coState.value !== 'all' && s.status !== coState.value) return false
  return true
}))
const active = computed(() => suppliers.value.find(s => s.name === activeName.value) || null)
const activeCount = computed(() => view.value.filter(s => s.status === '合作中').length)

/** 该供应商被多少张采购单引用（有引用则不允许删除） */
const refCount = name => purchase.list.filter(o => o.supplier === name).length

function onSelect(row) { if (row) activeName.value = row.name }
function clearActive() {
  activeName.value = ''
  tableRef.value?.setCurrentRow()
}

function toggle(row) {
  const status = supplierStore.toggleStatus(row.name)
  ElMessage.success(status === '合作中' ? `【${row.name}】已恢复合作` : `【${row.name}】已停用，采购单中不再可选`)
}

async function removeSupplier(row) {
  if (refCount(row.name)) return ElMessage.warning('该供应商已存在采购单，只能停用')
  try {
    await ElMessageBox.confirm(`是否删除供应商【${row.name}】？删除后不可恢复。`, '删除供应商', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    supplierStore.remove(row.name)
    if (activeName.value === row.name) activeName.value = ''
    ElMessage.success('已删除')
  } catch (e) { /* 取消 */ }
}

/* ------- 添加供应商 ------- */
const onlyDigits = v => String(v ?? '').replace(/\D/g, '')
const formRef = ref()
const add = reactive({ visible: false, form: { name: '', owner: '', phone: '', address: '', remark: '' } })
const rules = {
  name: [
    { required: true, message: '请输入供应商名称', trigger: 'blur' },
    {
      validator: (r, v, cb) => {
        if (String(v || '').trim().length > 100) return cb(new Error('名称最多 100 个汉字'))
        return supplierStore.nameExists(v) ? cb(new Error('该供应商名称已存在')) : cb()
      },
      trigger: 'blur'
    }
  ],
  owner: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '只能输入数字，共 11 位且首位为 1', trigger: 'blur' },
    {
      validator: (r, v, cb) => {
        if (/^(\d)\1{10}$/.test(String(v || ''))) return cb(new Error('联系电话不能全部为同一个数字'))
        cb()
      },
      trigger: 'blur'
    },
    {
      validator: (r, v, cb) => (supplierStore.phoneExists(v) ? cb(new Error('该联系电话已被使用')) : cb()),
      trigger: 'blur'
    }
  ],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }]
}

function openAdd() {
  add.form = { name: '', owner: '', phone: '', address: '', remark: '' }
  add.visible = true
}
async function submitAdd() {
  try { await formRef.value.validate() } catch (e) { return }
  supplierStore.add(add.form)
  add.visible = false
  ElMessage.success('供应商已添加')
}

/* ------- 添加货品 ------- */
const goodsRef = ref()
const goods = reactive({ visible: false, form: { type: '美妆个护', name: '', code: '', spec: '', unit: '', price: null } })
const goodsRules = {
  name: [{ required: true, message: '请输入货品名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }],
  spec: [{ required: true, message: '请输入规格', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入货品编码', trigger: 'blur' },
    {
      validator: (r, v, cb) => {
        if (!active.value) return cb()
        return supplierStore.codeExists(active.value.name, v) ? cb(new Error('该货品编码在本供应商下已存在')) : cb()
      },
      trigger: 'blur'
    }
  ],
  price: [
    { required: true, message: '请输入进货单价', trigger: 'blur' },
    {
      validator: (r, v, cb) => {
        const n = Number(v)
        if (!Number.isFinite(n) || n < 0) return cb(new Error('进货单价不能为负数'))
        if (n > 10000) return cb(new Error('进货单价上限为 10000 元'))
        cb()
      },
      trigger: 'blur'
    }
  ]
}

function openGoods() {
  if (!active.value) return ElMessage.warning('请先选择供应商')
  goods.form = { type: '美妆个护', name: '', code: '', spec: '', unit: '', price: null }
  goods.visible = true
}
async function submitGoods() {
  try { await goodsRef.value.validate() } catch (e) { return }
  supplierStore.addGoods(active.value.name, goods.form)
  goods.visible = false
  ElMessage.success('货品已关联到该供应商')
}

async function removeGoods(row) {
  try {
    await ElMessageBox.confirm(`是否移除货品【${row.name}】与【${active.value.name}】的供货关系？`, '移除货品', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    supplierStore.removeGoods(active.value.name, row.code)
    ElMessage.success('已移除')
  } catch (e) { /* 取消 */ }
}
</script>

<style scoped>
.sup-panel { display: flex; flex-direction: column; }
.del-wrap { display: inline-block; }
.goods-block { margin-top: 14px; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.goods-head {
  display: flex; align-items: center; gap: 12px;
  padding: 0 12px; height: 42px; background: #FAFBFC; border-bottom: 1px solid var(--line-2);
}
.goods-head h4 { margin: 0; font-size: 13px; font-weight: 600; }
.goods-head .extra { font-size: 11.5px; color: var(--ink-3); }
.goods-head .el-button { margin-left: auto; }
.goods-head .el-button + .el-button { margin-left: 0; }
.thumb {
  width: 34px; height: 34px; border-radius: 4px; background: var(--fill);
  color: var(--ink-3); font-size: 11px; display: flex; align-items: center; justify-content: center;
}
.empty-tip {
  margin-top: 14px; padding: 26px; text-align: center;
  border: 1px dashed var(--line); border-radius: 8px;
  font-size: 12.5px; color: var(--ink-3);
}
</style>
