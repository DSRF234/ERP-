<template>
  <div>
    <PageHeader title="采购订单" sub="新建采购单 · 到货后完成入库并同步库存">
      <el-button size="small">保存草稿</el-button>
      <el-button size="small" type="primary" @click="save">提交采购单</el-button>
    </PageHeader>

    <div class="card" style="margin-bottom: 12px">
      <div class="card-head"><h3>基础信息</h3>
        <span class="extra">采购单编号：{{ form.no }}</span></div>
      <div style="padding: 16px">
        <el-form :model="form" label-width="100px" size="small">
          <el-row :gutter="16">
            <el-col :span="8"><el-form-item label="采购单编号"><el-input v-model="form.no" disabled /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="采购员">
              <el-select v-model="form.buyer" style="width:100%">
                <el-option v-for="b in ['李明','王芳','张伟']" :key="b" :label="b" :value="b" /></el-select>
            </el-form-item></el-col>
            <el-col :span="8"><el-form-item label="制单人"><el-input v-model="form.creator" disabled /></el-form-item></el-col>

            <el-col :span="8"><el-form-item label="供应商">
              <el-select v-model="form.supplier" style="width:100%" placeholder="一单只能选一个供应商">
                <el-option v-for="s in suppliers" :key="s" :label="s" :value="s" /></el-select>
            </el-form-item></el-col>
            <el-col :span="8"><el-form-item label="收货仓">
              <el-select v-model="form.warehouse" style="width:100%">
                <el-option v-for="wh in warehouses" :key="wh" :label="wh" :value="wh" /></el-select>
            </el-form-item></el-col>
            <el-col :span="8"><el-form-item label="采购时间">
              <el-date-picker v-model="form.date" type="date" style="width:100%" value-format="YYYY-MM-DD" /></el-form-item></el-col>

            <el-col :span="8"><el-form-item label="物流公司">
              <el-select v-model="form.logistics" style="width:100%">
                <el-option v-for="l in ['顺丰','中通','德邦','专线物流']" :key="l" :label="l" :value="l" /></el-select>
            </el-form-item></el-col>
            <el-col :span="8"><el-form-item label="采购货品类型">
              <el-select v-model="form.category" style="width:100%">
                <el-option label="家居日用" value="家居日用" />
                <el-option label="美妆个护" value="美妆个护" /></el-select>
            </el-form-item></el-col>
            <el-col :span="8"><el-form-item label="运费">
              <el-input v-model.number="form.freight"><template #prepend>￥</template></el-input></el-form-item></el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>采购货品明细</h3>
        <span class="extra">合计 {{ money(total) }}</span></div>
      <el-table :data="form.items" size="small">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="采购货品" min-width="180" />
        <el-table-column prop="supplier" label="供应商" min-width="180">
          <template #default="{ row }">{{ row.supplier }}<span class="lock">不可更改</span></template>
        </el-table-column>
        <el-table-column prop="spec" label="规格" width="110" />
        <el-table-column label="单位" width="100">
          <template #default="{ row }">
            <el-select v-model="row.unit" size="small">
              <el-option v-for="u in units" :key="u" :label="u" :value="u" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="单价" width="120" align="right">
          <template #default="{ row }"><el-input v-model.number="row.price" size="small" style="width:96px" /></template>
        </el-table-column>
        <el-table-column label="采购数量" width="110" align="right">
          <template #default="{ row }"><el-input v-model.number="row.qty" size="small" style="width:80px" /></template>
        </el-table-column>
        <el-table-column label="总采购金额" width="130" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.price * row.qty) }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="form.items.splice($index, 1)">删除货品</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="padding: 12px 16px">
        <el-button size="small" @click="addItem">+ 添加货品</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { money } from '@/utils/format'

const suppliers = ['广州雅美化妆品有限公司', '南通家纺制造厂', '深圳香氛实业']
const warehouses = ['华东主仓', '华南仓', '平台仓1', '平台仓2']
const units = ['个', '件', '套', '盒', '只', '瓶', '支', '片', '罐']

const form = reactive({
  no: 'CG' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '1632',
  buyer: '李明', creator: '李明', supplier: '广州雅美化妆品有限公司',
  warehouse: '华东主仓', date: '2026-11-17', logistics: '中通',
  category: '美妆个护', freight: 120,
  items: [
    { name: '雅诗兰黛小棕瓶', supplier: '广州雅美化妆品有限公司', spec: '50ml', unit: '瓶', price: 380, qty: 200 },
    { name: '兰蔻小黑瓶', supplier: '广州雅美化妆品有限公司', spec: '30ml', unit: '瓶', price: 420, qty: 150 }
  ]
})

const total = computed(() => form.items.reduce((s, i) => s + i.price * i.qty, 0))

function addItem() {
  form.items.push({ name: '', supplier: form.supplier, spec: '', unit: '件', price: 0, qty: 1 })
}
function save() {
  if (!form.supplier) return ElMessage.error('请选择供应商')
  ElMessage.success(`采购单已提交，合计 ${money(total.value)}，状态：待审核`)
}
</script>

<style scoped>
.lock { font-size: 11px; color: var(--ink-3); margin-left: 6px; }
</style>
