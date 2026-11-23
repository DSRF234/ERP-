<template>
  <el-dialog :model-value="modelValue" title="编辑订单" width="900px" align-center
    @update:model-value="v => emit('update:modelValue', v)">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="104px" size="small">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="平台单号">
            <el-input :model-value="order?.no" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="平台类型" prop="platformKey">
            <el-select v-model="form.platformKey" filterable placeholder="请选择平台店铺" style="width: 100%">
              <el-option v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="货品明细" prop="goods">
            <div class="goods-box">
              <div v-if="!form.goods.length" class="goods-empty">尚未选择商品</div>
              <div v-for="(g, i) in form.goods" :key="g.sku + '-' + i" class="goods-row">
                <div class="g-main">
                  <div class="g-name">{{ g.name }}</div>
                  <div class="g-meta">{{ goodsMeta(g) }}</div>
                </div>
                <el-input-number v-model="g.qty" :min="1" :max="9999" size="small"
                  controls-position="right" style="width: 96px" />
                <el-button link type="danger" size="small" @click="removeGoods(i)">移除</el-button>
              </div>
            </div>
            <el-button link type="primary" class="pick-btn" @click="openPicker">
              + 选择商品（支持名称 / 编码搜索）
            </el-button>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="收件人姓名" prop="receiver">
            <el-input v-model="form.receiver" maxlength="30" placeholder="输入收件人姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="收件人手机号" prop="phone">
            <el-input v-model="form.phone" maxlength="11" placeholder="11 位手机号" @input="onPhone" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="收件人地址" prop="address">
            <el-input v-model="form.address" placeholder="输入收件地址" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="买家留言">
            <el-input v-model="form.note" placeholder="选填" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="快递公司" prop="carrier">
            <el-select v-model="form.carrier" placeholder="请选择快递公司" style="width: 100%">
              <el-option v-for="c in CARRIERS" :key="c.name" :label="c.name" :value="c.name" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发货仓库" prop="warehouse">
            <el-select v-model="form.warehouse" placeholder="请选择发货仓库" style="width: 100%">
              <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item label="订单金额" prop="amount">
            <el-input-number v-model="form.amount" :min="0" :precision="2" :step="1"
              controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="实际到账金额" prop="actual">
            <el-input-number v-model="form.actual" :min="0" :precision="2" :step="1"
              controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="平台结算金额" prop="settle">
            <el-input-number v-model="form.settle" :min="0" :precision="2" :step="1"
              controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="付款时间" prop="payTime">
            <el-date-picker v-model="form.payTime" type="datetime" format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm" :clearable="false" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最晚发货时间" prop="deadline">
            <el-date-picker v-model="form.deadline" type="datetime" format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm" :clearable="false" style="width: 100%" />
            <div class="field-hint">默认付款时间 + 48 小时，可手动修改</div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>

  <!-- 选择商品：叠加在编辑弹窗之上 -->
  <el-dialog v-model="pickerVisible" title="选择商品" width="720px" append-to-body>
    <el-input v-model="pickerKw" clearable placeholder="搜索商品名称 / 编码 / 品牌" />
    <div class="picker-list">
      <div v-for="g in pickerList" :key="g.sku" class="picker-item">
        <div class="pi-main">
          <div class="pi-name">{{ g.name }}</div>
          <div class="pi-meta">
            {{ goodsMeta(g) }}
            <span class="pi-stock">· 四仓可用 {{ stockStore.totalAvailable(g.sku) }}</span>
          </div>
        </div>
        <div class="pi-price">{{ g.price ? money(g.price) : '—' }}</div>
        <el-button size="small" :type="isPicked(g.sku) ? 'default' : 'primary'" @click="toggleGood(g)">
          {{ isPicked(g.sku) ? '已添加' : '选择' }}
        </el-button>
      </div>
      <div v-if="!pickerList.length" class="picker-empty">没有匹配的商品</div>
    </div>
    <div class="picker-note">商品来自订单商品库；库存为四仓可用数量合计，审核时会按发货仓库单独校验。</div>
    <template #footer>
      <el-button type="primary" @click="pickerVisible = false">完成</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, computed, watch, nextTick } from 'vue'
import { CARRIERS, useOrderStore } from '@/stores/order'
import { useStockStore, WAREHOUSES } from '@/stores/stock'
import { ORDER_GOODS } from '@/data/orderGoods'
import { money } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  order: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'submit'])

const store = useOrderStore()
const stockStore = useStockStore()
const warehouses = WAREHOUSES

const formRef = ref(null)
const form = reactive({
  platformKey: '',
  receiver: '',
  phone: '',
  address: '',
  note: '',
  carrier: '',
  warehouse: '',
  amount: 0,
  actual: 0,
  settle: 0,
  payTime: '',
  deadline: '',
  goods: []
})

const rules = {
  platformKey: [{ required: true, message: '请选择平台类型', trigger: 'change' }],
  receiver: [{ required: true, message: '请输入收件人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入收件人手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的 11 位手机号', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入收件人地址', trigger: 'blur' }],
  carrier: [{ required: true, message: '请选择快递公司', trigger: 'change' }],
  warehouse: [{ required: true, message: '请选择发货仓库', trigger: 'change' }],
  amount: [{ required: true, type: 'number', min: 0, message: '请输入订单金额', trigger: 'change' }],
  actual: [{ required: true, type: 'number', min: 0, message: '请输入实际到账金额', trigger: 'change' }],
  settle: [{ required: true, type: 'number', min: 0, message: '请输入平台结算金额', trigger: 'change' }],
  payTime: [{ required: true, message: '请选择付款时间', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择最晚发货时间', trigger: 'change' }],
  goods: [{ validator: (_rule, _value, cb) => (form.goods.length ? cb() : cb(new Error('请至少选择一个商品'))), trigger: 'change' }]
}

/* 平台店铺下拉：当前订单 + 系统里出现过的组合 */
const platformOptions = computed(() => {
  const map = new Map()
  if (props.order) {
    const key = `${props.order.platform}|${props.order.shop}`
    map.set(key, `${props.order.platform} · ${props.order.shop}`)
  }
  store.orders.forEach(o => {
    const key = `${o.platform}|${o.shop}`
    if (!map.has(key)) map.set(key, `${o.platform} · ${o.shop}`)
  })
  return [...map].map(([value, label]) => ({ value, label }))
})

/* 商品库：预置商品 + 订单里出现过的商品 */
const catalog = computed(() => {
  const map = new Map()
  ORDER_GOODS.forEach(g => map.set(g.sku, g))
  store.orders.forEach(o => (o.goods || []).forEach(g => {
    if (!map.has(g.sku)) {
      map.set(g.sku, { sku: g.sku, name: g.name, spec: g.spec, brand: g.brand || '', model: g.model || '', price: g.price || 0 })
    }
  }))
  return [...map.values()]
})

function goodsMeta(g) {
  return [g.brand, g.model, g.spec, g.sku].filter(v => v && v !== '—').join(' · ')
}

/* 打开时用订单数据填充表单 */
function reset() {
  const o = props.order
  if (!o) return
  form.platformKey = `${o.platform}|${o.shop}`
  form.receiver = o.receiver || ''
  form.phone = o.phone || ''
  form.address = o.address || ''
  form.note = o.note || ''
  form.carrier = o.carrier || ''
  form.warehouse = o.warehouse || ''
  form.amount = Number(o.amount) || 0
  form.actual = Number(o.actual) || 0
  form.settle = Number(o.settle) || 0
  form.payTime = o.payTime || ''
  form.deadline = o.deadline || ''
  form.goods = (o.goods || []).map(g => ({ ...g, qty: Number(g.qty) || 1 }))
  pickerVisible.value = false
  pickerKw.value = ''
  nextTick(() => formRef.value?.clearValidate())
}

watch(() => props.modelValue, v => { if (v) reset() })

function onPhone(v) {
  form.phone = String(v || '').replace(/\D/g, '').slice(0, 11)
}

function removeGoods(i) {
  form.goods.splice(i, 1)
  if (!form.goods.length) formRef.value?.validateField('goods').catch(() => {})
}

/* 选择商品 */
const pickerVisible = ref(false)
const pickerKw = ref('')
const pickerList = computed(() => {
  const k = pickerKw.value.trim().toLowerCase()
  if (!k) return catalog.value
  return catalog.value.filter(g =>
    [g.name, g.sku, g.brand, g.model, g.spec].filter(Boolean).join(' ').toLowerCase().includes(k)
  )
})
const isPicked = sku => form.goods.some(g => g.sku === sku)

function openPicker() {
  pickerKw.value = ''
  pickerVisible.value = true
}

function toggleGood(g) {
  const i = form.goods.findIndex(x => x.sku === g.sku)
  if (i >= 0) form.goods.splice(i, 1)
  else form.goods.push({ ...g, qty: 1 })
  if (!form.goods.length) formRef.value?.validateField('goods').catch(() => {})
  else formRef.value?.clearValidate('goods')
}

const round2 = v => Math.round((Number(v) || 0) * 100) / 100

async function save() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const [platform, shop] = form.platformKey.split('|')
  const first = form.goods[0]
  emit('submit', {
    platform,
    shop,
    receiver: form.receiver.trim(),
    phone: form.phone,
    address: form.address.trim(),
    note: form.note.trim(),
    carrier: form.carrier,
    warehouse: form.warehouse,
    amount: round2(form.amount),
    actual: round2(form.actual),
    settle: round2(form.settle),
    payTime: form.payTime,
    deadline: form.deadline,
    goods: form.goods.map(g => ({ ...g, qty: Number(g.qty) || 1 })),
    platformGoods: first
      ? `${first.name}${first.spec && first.spec !== '—' ? ' ' + first.spec : ''}`
      : props.order?.platformGoods || ''
  })
}
</script>

<style scoped>
.goods-box {
  width: 100%; border: 1px solid var(--line); border-radius: 6px;
  overflow: hidden; background: #fff;
}
.goods-empty {
  padding: 18px; text-align: center; background: #FAFBFC;
  font-size: 12.5px; color: var(--ink-3);
}
.goods-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border-top: 1px solid var(--line-2);
}
.goods-row:first-child { border-top: none; }
.g-main { flex: 1; min-width: 0; }
.g-name { font-size: 12.5px; color: var(--ink); }
.g-meta { margin-top: 2px; font-size: 11.5px; line-height: 1.5; color: var(--ink-3); }
.pick-btn { margin-top: 6px; }

.picker-list {
  margin-top: 10px; max-height: 320px; overflow-y: auto;
  border: 1px solid var(--line); border-radius: 6px;
}
.picker-item {
  display: flex; align-items: center; gap: 12px; padding: 9px 12px;
  border-top: 1px solid var(--line-2);
}
.picker-item:first-child { border-top: none; }
.pi-main { flex: 1; min-width: 0; }
.pi-name { font-size: 12.5px; color: var(--ink); }
.pi-meta { margin-top: 2px; font-size: 11.5px; line-height: 1.5; color: var(--ink-3); }
.pi-stock { color: var(--ink-3); }
.pi-price {
  width: 92px; text-align: right; font-size: 12.5px; color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}
.picker-empty { padding: 30px; text-align: center; font-size: 12px; color: var(--ink-3); }
.picker-note { margin-top: 8px; font-size: 11.5px; line-height: 1.6; color: var(--ink-3); }
</style>
