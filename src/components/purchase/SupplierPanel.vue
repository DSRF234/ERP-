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
      <el-button size="small" type="primary" @click="openAdd">添加供应商</el-button>
    </div>

    <el-table :data="view" size="small" highlight-current-row :max-height="260"
      empty-text="没有匹配的供应商" @current-change="onSelect">
      <el-table-column prop="name" label="供应商名称" min-width="150" />
      <el-table-column prop="owner" label="负责人" width="88" />
      <el-table-column prop="phone" label="联系电话" width="122" />
      <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column label="货品数" width="72" align="right">
        <template #default="{ row }">
          <span class="mono">{{ (row.goods || []).length }}</span>
        </template>
      </el-table-column>
      <el-table-column label="合作状态" width="92">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === '合作中' ? 'success' : 'info'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="92">
        <template #default="{ row }">
          <el-button v-if="row.status === '合作中'" link type="danger" size="small"
            @click.stop="toggle(row)">停用</el-button>
          <el-button v-else link type="primary" size="small" @click.stop="toggle(row)">复用</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="goods-block" v-if="active">
      <div class="goods-head">
        <h4>供应商货品 · {{ active.name }}</h4>
        <span class="extra">进货单价为供应商报价，最低成交价为历史最低成交记录，用于采购比价</span>
        <el-button size="small" @click="openGoods">添加货品</el-button>
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
          <template #default="{ row }"><span class="mono">{{ money(row.minPrice) }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="active.goods.splice($index, 1)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="empty-tip" v-else>选择上方任意供应商，下方展示该供应商关联的货品</div>

    <!-- 添加供应商 -->
    <el-dialog v-model="add.visible" title="添加供应商" width="560px" align-center>
      <p class="dlg-hint">供应商名称与联系电话不可重复；停用后，采购单的供应商选项与货品选择中都不再出现该供应商。</p>
      <el-form :model="add.form" :rules="rules" ref="formRef" label-width="92px" size="small">
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="add.form.name" maxlength="50" show-word-limit placeholder="手动输入，最多 50 个字符" />
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
    <el-dialog v-model="goods.visible" :title="`添加货品 · ${active?.name || ''}`" width="520px" align-center>
      <p class="dlg-hint">同步 WMS 货品档案；同一供应商下货码编号不可重复。</p>
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
        <el-form-item label="规格" prop="spec">
          <el-input v-model="goods.form.spec" placeholder="如 100g/支" />
        </el-form-item>
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
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { money } from '@/utils/format'

const suppliers = ref([
  {
    name: '某林林公司', owner: '某林公', phone: '12345678901',
    address: '河北省石家庄市正定县新龙科技2211号', status: '合作中',
    goods: [
      { code: 'SO-2026-001', name: '洗面奶', type: '家居日用', spec: '100g/支', price: 9.99, minPrice: 12.02 },
      { code: 'SO-2026-002', name: '睫毛膏', type: '美妆个护', spec: '8g/支', price: 8.20, minPrice: 9.80 },
      { code: 'SO-2026-003', name: '牙膏', type: '家居日用', spec: '30g/个', price: 12.00, minPrice: 19.50 }
    ]
  },
  {
    name: '美妆公司', owner: '张经理', phone: '12333445678',
    address: '河北省石家庄市正定县新龙科技222号', status: '合作中',
    goods: [
      { code: 'SO-2026-011', name: '眼睫毛', type: '美妆个护', spec: '5ml/支', price: 6.60, minPrice: 8.40 },
      { code: 'SO-2026-012', name: '抽纸', type: '家居日用', spec: '3层/包', price: 3.50, minPrice: 4.20 }
    ]
  },
  {
    name: '和正日化', owner: '王主管', phone: '13800138001',
    address: '广州市白云区机场路 12 号', status: '已停用',
    goods: [{ code: 'SO-2026-021', name: '护手霜', type: '美妆个护', spec: '50g/支', price: 7.80, minPrice: 9.90 }]
  },
  {
    name: '雅美化妆品', owner: '陈志强', phone: '13900139002',
    address: '深圳市宝安区福永街道 66 号', status: '已停用',
    goods: [{ code: 'SO-2026-031', name: '精华液', type: '美妆个护', spec: '30ml/瓶', price: 68.00, minPrice: 79.00 }]
  }
])

const TYPES = ['家居日用', '美妆个护']
const CO_STATES = ['合作中', '已停用']

const kwInput = ref('')
const kw = ref('')
const typeFilter = ref('all')
const coState = ref('all')
const activeName = ref('')

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

function onSelect(row) { if (row) activeName.value = row.name }

function toggle(row) {
  row.status = row.status === '合作中' ? '已停用' : '合作中'
  ElMessage.success(row.status === '合作中' ? `【${row.name}】已恢复合作` : `【${row.name}】已停用，采购单中不再可选`)
}

/* ------- 添加供应商 ------- */
const onlyDigits = v => String(v ?? '').replace(/\D/g, '')
const formRef = ref()
const add = reactive({
  visible: false,
  form: { name: '', owner: '', phone: '', address: '', remark: '' }
})
const rules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' },
    { validator: (r, v, cb) => suppliers.value.some(s => s.name === v) ? cb(new Error('该供应商名称已存在')) : cb(), trigger: 'blur' }],
  owner: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '只能输入数字，共 11 位且首位为 1', trigger: 'blur' },
    {
      validator: (r, v, cb) => {
        // 11 位全相同（11111111111、33333333333…）视为无效号码
        if (/^(\d)\1{10}$/.test(String(v || ''))) return cb(new Error('联系电话不能全部为同一个数字'))
        cb()
      },
      trigger: 'blur'
    },
    {
      validator: (r, v, cb) => {
        const digits = String(v || '')
        const dup = suppliers.value.some(s => String(s.phone || '').replace(/\D/g, '') === digits)
        return dup ? cb(new Error('该联系电话已被使用')) : cb()
      },
      trigger: 'blur'
    }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }]
}

function openAdd() {
  add.form = { name: '', owner: '', phone: '', address: '', remark: '' }
  add.visible = true
}
async function submitAdd() {
  try { await formRef.value.validate() } catch (e) { return }
  suppliers.value.unshift({ ...add.form, status: '合作中', goods: [] })
  add.visible = false
  ElMessage.success('供应商已添加')
}

/* ------- 添加货品 ------- */
const goodsRef = ref()
const goods = reactive({
  visible: false,
  form: { type: '美妆个护', name: '', code: '', spec: '', price: null }
})
const goodsRules = {
  name: [{ required: true, message: '请输入货品名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入货品编码', trigger: 'blur' }],
  price: [{ required: true, message: '请输入进货单价', trigger: 'blur' }]
}

function openGoods() {
  if (!active.value) return ElMessage.warning('请先选择供应商')
  goods.form = { type: '美妆个护', name: '', code: '', spec: '', price: null }
  goods.visible = true
}
async function submitGoods() {
  try { await goodsRef.value.validate() } catch (e) { return }
  active.value.goods.push({
    code: goods.form.code, name: goods.form.name, type: goods.form.type,
    spec: goods.form.spec, price: Number(goods.form.price), minPrice: Number(goods.form.price)
  })
  goods.visible = false
  ElMessage.success('货品已关联到该供应商')
}
</script>

<style scoped>
.sup-panel { display: flex; flex-direction: column; }
.goods-block { margin-top: 14px; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.goods-head {
  display: flex; align-items: center; gap: 12px;
  padding: 0 12px; height: 42px; background: #FAFBFC; border-bottom: 1px solid var(--line-2);
}
.goods-head h4 { margin: 0; font-size: 13px; font-weight: 600; }
.goods-head .extra { font-size: 11.5px; color: var(--ink-3); }
.goods-head .el-button { margin-left: auto; }
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
