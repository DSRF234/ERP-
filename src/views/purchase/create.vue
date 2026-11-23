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
                <div class="field-hint">系统自动生成，如 CG202607081223</div>
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
                <div class="field-hint">由系统根据登录账号直接生成</div>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="供应商名称">
                <el-select v-model="form.supplier" style="width: 100%" placeholder="请选择供应商">
                  <el-option v-for="s in suppliers" :key="s" :label="s" :value="s" />
                </el-select>
                <div class="field-hint">同一个采购单只能有一个供应商</div>
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
        <span class="extra">共 {{ form.items.length }} 个货品</span>
      </div>
      <el-table :data="form.items" size="small">
        <el-table-column type="index" label="序号" width="56" />
        <el-table-column type="selection" width="42" />
        <el-table-column prop="name" label="采购货品" min-width="170" />
        <el-table-column prop="spec" label="规格" width="110" />
        <el-table-column label="单位" width="96">
          <template #default="{ row }">
            <el-select v-model="row.unit" size="small">
              <el-option v-for="u in units" :key="u" :label="u" :value="u" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="单价（元）" width="118" align="right">
          <template #default="{ row }">
            <el-input v-model.number="row.price" size="small" style="width: 92px" />
          </template>
        </el-table-column>
        <el-table-column label="采购数量" width="118" align="right">
          <template #default="{ row }">
            <el-input v-model.number="row.qty" size="small" style="width: 92px" />
          </template>
        </el-table-column>
        <el-table-column label="总采购金额（元）" width="140" align="right">
          <template #default="{ row }">
            <span class="mono strong">{{ money(row.price * row.qty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="88" fixed="right">
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
    </div>

    <GoodsPicker v-model="picker" :supplier="form.supplier" @confirm="onPick" />
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import GoodsPicker from '@/components/purchase/GoodsPicker.vue'
import { money } from '@/utils/format'

const router = useRouter()
const buyers = ['张某某', '李某', '王某']
const suppliers = ['某林林公司', '美妆公司', '雅美化妆品']
const warehouses = ['华东主仓', '华南仓', '平台仓1', '平台仓2']
const units = ['个', '支', '件', '盒', '瓶']

function makeNo() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `CG${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}`
}

const form = reactive({
  no: makeNo(),
  buyer: '张某某',
  creator: '张某某',
  supplier: '某林林公司',
  warehouse: '华东主仓',
  category: '家居日用',
  logistics: '某邦物流公司',
  freight: 100,
  expressNo: 'DB1234567891234',
  date: '2026-07-22',
  items: [
    { name: '洗面奶', spec: '100g/支', unit: '支', price: 20, qty: 1000 },
    { name: '睫毛膏', spec: '8g/支', unit: '支', price: 8.2, qty: 200 }
  ]
})

const total = computed(() => form.items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0))
const picker = ref(false)

function onPick({ supplier, goods }) {
  if (supplier !== form.supplier) {
    form.supplier = supplier
    form.items = []
    ElMessage.info(`已切换供应商为【${supplier}】，原明细已清空`)
  }
  goods.forEach(g => {
    if (form.items.some(i => i.name === g.name)) return
    form.items.push({ name: g.name, spec: g.spec, unit: '支', price: g.price, qty: 1 })
  })
}

async function removeItem(row, index) {
  try {
    await ElMessageBox.confirm(`是否删除【${row.name}】的货品采购信息？`, '删除货品', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    form.items.splice(index, 1)
  } catch (e) { /* 取消 */ }
}

async function submit() {
  if (!form.supplier) return ElMessage.error('请选择供应商')
  if (!form.items.length) return ElMessage.error('请至少添加一个货品')
  try {
    await ElMessageBox.confirm('是否将货品采购信息提交？提交后进入待审核，不可直接修改。', '提交确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    ElMessage.success(`采购单 ${form.no} 已提交，状态：待审核`)
    router.push('/purchase')
  } catch (e) { /* 取消 */ }
}

async function cancel() {
  try {
    await ElMessageBox.confirm('是否放弃本次填写？已填写内容不会保存。', '取消新建', {
      confirmButtonText: '放弃', cancelButtonText: '继续填写', type: 'warning'
    })
    router.push('/purchase')
  } catch (e) { /* 继续 */ }
}
</script>

<style scoped>
.strong { font-weight: 600; }
:deep(.el-form-item) { margin-bottom: 16px; }
</style>
