<template>
  <div>
    <PageHeader title="新建采购单" back="返回采购订单" back-to="/purchase"
      sub="提交后进入「待审核」，审核通过变为「进行中」">
      <el-button size="small" @click="cancel">取消</el-button>
      <el-button v-can="'b-purchase-create-submit'" size="small" type="primary" @click="submit">提交审核</el-button>
    </PageHeader>

    <div class="card" style="margin-bottom: 16px">
      <div class="card-head">
        <h3>基础信息</h3>
        <span class="extra">状态：待审核（不可更改）</span>
      </div>
      <div style="padding: 16px 16px 4px">
        <el-form :model="form" label-width="92px" size="small">
          <el-row :gutter="18">
            <el-col :span="8">
              <el-form-item label="采购编号">
                <el-input v-model="form.no" disabled />
                <div class="field-hint">系统自动生成，如 CG202607081223；同一分钟内多单自动加流水号</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="采购员">
                <el-select v-model="form.buyer" style="width: 100%">
                  <el-option v-for="b in buyers" :key="b" :label="b" :value="b" />
                </el-select>
                <div class="field-hint">按权限选择采购员角色的人员</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="制单人">
                <el-input v-model="form.creator" disabled />
                <div class="field-hint">取当前登录账号，不可修改</div>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="供应商名称">
                <el-select v-model="form.supplier" style="width: 100%" placeholder="请选择供应商"
                  @change="onSupplierChange">
                  <el-option v-for="s in supplierNames" :key="s" :label="s" :value="s" />
                </el-select>
                <div class="field-hint">只列出「合作中」的供应商</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="收货仓">
                <el-select v-model="form.warehouse" style="width: 100%">
                  <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
                </el-select>
                <div class="field-hint">接入 WMS，仓库同步后可选</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="货品类型">
                <el-select v-model="form.category" style="width: 100%">
                  <el-option v-for="c in ['美妆个护', '家居日用', '食品饮料']" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="物流公司">
                <el-select v-model="form.logistics" style="width: 100%">
                  <el-option v-for="l in ['某邦物流公司', '某东物流公司']" :key="l" :label="l" :value="l" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="运费">
                <el-input v-model.number="form.freight">
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="物流单号">
                <el-input v-model="form.expressNo" placeholder="同步 WMS 物流单号" />
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="状态">
                <el-input model-value="待审核" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="采购时间">
                <el-date-picker v-model="form.date" type="date" style="width: 100%"
                  value-format="YYYY-MM-DD" placeholder="选择采购日期" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>采购货品明细</h3>
        <span class="extra">共 {{ form.items.length }} 个货品 · 进货单价默认取供应商报价，可改</span>
      </div>
      <el-table :data="form.items" size="small" class="goods-table">
        <el-table-column type="index" label="序号" width="48" />
        <el-table-column type="selection" width="36" />
        <el-table-column label="图片" width="52" align="center">
          <template #default><span class="thumb">图</span></template>
        </el-table-column>
        <el-table-column prop="code" label="货码编号" width="108">
          <template #default="{ row }"><span class="mono">{{ row.code || '—' }}</span></template>
        </el-table-column>
        <el-table-column prop="name" label="货品名称" min-width="128" show-overflow-tooltip />
        <el-table-column prop="spec" label="规格" width="88" show-overflow-tooltip />
        <el-table-column label="单位" width="82">
          <template #default="{ row }">
            <el-select v-model="row.unit" size="small">
              <el-option v-for="u in units" :key="u" :label="u" :value="u" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="进货单价（元）" width="110" align="right">
          <template #default="{ row }">
            <el-input v-model.number="row.price" size="small" style="width: 84px" />
          </template>
        </el-table-column>
        <el-table-column label="采购数量" width="98" align="right">
          <template #default="{ row }">
            <el-input v-model.number="row.qty" size="small" style="width: 76px" />
          </template>
        </el-table-column>
        <el-table-column label="总采购金额（元）" width="120" align="right">
          <template #default="{ row }">
            <span class="mono strong">{{ money(row.price * row.qty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="68" fixed="right">
          <template #default="{ row, $index }">
            <el-button v-can="'b-purchase-create-del'" link type="danger" size="small" @click="removeItem(row, $index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-foot">
        <el-button v-can="'b-purchase-create-add'" size="small" :icon="Plus" @click="picker = true">添加货品</el-button>
        <span class="sum" style="margin-left: auto">
          总采购金额（元）　<b>{{ money(total) }}</b>
        </span>
      </div>
      <div class="limit-tip">进货单价上限 10,000 元／采购数量需为正整数（≤ 1,000,000），提交时逐行校验</div>
    </div>

    <GoodsPicker v-model="picker" :supplier="form.supplier" @confirm="onPick" />
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import GoodsPicker from '@/components/purchase/GoodsPicker.vue'
import { money } from '@/utils/format'
import { usePurchaseStore } from '@/stores/purchase'
import { useSupplierStore } from '@/stores/supplier'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const purchase = usePurchaseStore()
const supplierStore = useSupplierStore()
const user = useUserStore()

const DRAFT_KEY = 'xy_erp_purchase_draft'
const buyers = ['张某某', '李某', '王某']
const warehouses = ['华东主仓', '华南仓', '平台仓1', '平台仓2']
const units = ['个', '支', '件', '盒', '瓶']

const supplierNames = computed(() => supplierStore.activeNames)

const form = reactive({
  no: purchase.nextNo(),
  buyer: '张某某',
  creator: user.name || '演示',
  supplier: supplierNames.value[0] || '',
  warehouse: '华东主仓',
  category: '家居日用',
  logistics: '某邦物流公司',
  freight: 100,
  expressNo: 'DB1234567891234',
  date: '2026-11-24',
  items: [
    { code: 'SO-2026-001', name: '洗面奶', spec: '100g/支', unit: '支', price: 20, qty: 1000, category: '家居日用' },
    { code: 'SO-2026-002', name: '睫毛膏', spec: '8g/支', unit: '支', price: 8.2, qty: 200, category: '美妆个护' }
  ]
})

const total = computed(() => form.items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0))
const picker = ref(false)
const dirty = ref(false)
let submitted = false

/* ---------------- 草稿：刷新/误关页面内容不丢 ---------------- */
function saveDraft() {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form)) } catch (e) { /* 忽略 */ }
}
function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY) } catch (e) { /* 忽略 */ }
}
watch(form, () => { dirty.value = true; saveDraft() }, { deep: true })

function onBeforeUnload(e) {
  if (submitted || !dirty.value) return
  e.preventDefault()
  e.returnValue = ''
}
onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      Object.keys(form).forEach(k => { if (d[k] !== undefined) form[k] = d[k] })
      form.no = purchase.nextNo()
      ElMessage.info('已恢复上次未提交的草稿')
      dirty.value = true
    }
  } catch (e) { /* 忽略损坏的草稿 */ }
})
onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))

onBeforeRouteLeave(() => {
  if (submitted || !dirty.value) return true
  submitted = true
  clearDraft()
  return true
})

/* ---------------- 明细 ---------------- */
function onSupplierChange(name) {
  form.items = []
  ElMessage.info(`已切换供应商为【${name}】，原明细已清空`)
}

function onPick({ supplier, goods }) {
  if (supplier !== form.supplier) {
    form.supplier = supplier
    form.items = []
    ElMessage.info(`已切换供应商为【${supplier}】，原明细已清空`)
  }
  let added = 0
  goods.forEach(g => {
    if (form.items.some(i => i.name === g.name)) return
    form.items.push({
      code: g.code, name: g.name, spec: g.spec, unit: '支',
      price: g.price, qty: 1, category: g.type || form.category
    })
    added++
  })
  if (goods.length && !added) ElMessage.warning('所选货品已在明细中，未重复添加')
}

async function removeItem(row, index) {
  try {
    await ElMessageBox.confirm(`是否删除【${row.name}】的货品采购信息？`, '删除货品', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    form.items.splice(index, 1)
  } catch (e) { /* 取消 */ }
}

/* ---------------- 校验与提交 ---------------- */
function validate() {
  if (!form.supplier) return '请选择供应商'
  if (!form.items.length) return '请至少添加一个货品'
  for (let i = 0; i < form.items.length; i++) {
    const r = form.items[i]
    const price = Number(r.price)
    if (!Number.isFinite(price) || price <= 0) return `第 ${i + 1} 行【${r.name}】进货单价需大于 0`
    if (price > 10000) return `第 ${i + 1} 行【${r.name}】进货单价 ${price} 元超过上限 10000 元`
    const qty = Number(r.qty)
    if (!Number.isInteger(qty) || qty <= 0) return `第 ${i + 1} 行【${r.name}】采购数量需为正整数，当前为「${r.qty}」`
    if (qty > 1000000) return `第 ${i + 1} 行【${r.name}】采购数量 ${qty} 超过上限 1,000,000`
  }
  if (form.freight !== '' && (!Number.isFinite(Number(form.freight)) || Number(form.freight) < 0)) {
    return '运费需为不小于 0 的数字'
  }
  return ''
}

async function submit() {
  const err = validate()
  if (err) return ElMessage.error(err)
  try {
    await ElMessageBox.confirm('是否将货品采购信息提交？提交后进入待审核，不可直接修改。', '提交确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    purchase.add({
      no: form.no,
      buyer: form.buyer,
      creator: form.creator,
      supplier: form.supplier,
      warehouse: form.warehouse,
      category: form.category,
      logistics: form.logistics,
      freight: Number(form.freight || 0),
      expressNo: form.expressNo,
      date: `${form.date} ${new Date().toTimeString().slice(0, 5)}`,
      items: form.items.map(i => ({ ...i, price: Number(i.price), qty: Number(i.qty) }))
    })
    submitted = true
    clearDraft()
    ElMessage.success(`采购单 ${form.no} 已提交，状态：待审核`)
    router.push('/purchase')
  } catch (e) { /* 取消 */ }
}

async function cancel() {
  try {
    await ElMessageBox.confirm('是否放弃本次填写？已填写内容不会保存。', '取消新建', {
      confirmButtonText: '放弃', cancelButtonText: '继续填写', type: 'warning'
    })
    submitted = true
    clearDraft()
    router.push('/purchase')
  } catch (e) { /* 继续 */ }
}
</script>

<style scoped>
.strong { font-weight: 600; }
:deep(.el-form-item) { margin-bottom: 16px; }
.limit-tip { padding: 8px 16px 12px; font-size: 11.5px; color: var(--ink-3); }

/* 明细表：字段与「供应商货品」对齐（图片 / 货码编号 / 货品名称 / 规格 / 进货单价） */
.goods-table :deep(.el-table__cell) { padding: 6px 0; }
.goods-table :deep(.cell) { padding: 0 8px; }
.thumb {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 4px;
  background: var(--fill); color: var(--ink-3); font-size: 11px;
}
</style>
