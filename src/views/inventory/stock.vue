<template>
  <div>
    <PageHeader title="库存记录" sub="货品批次库存与预警状态">
      <el-button size="small" @click="warnVisible = true">设置预警</el-button>
      <el-button size="small">导出</el-button>
    </PageHeader>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="货品名称 / 编码 / 批次号" style="width: 220px" clearable />
      <el-select v-model="warehouse" size="small" style="width: 150px" placeholder="全部仓库">
        <el-option label="全部仓库" value="" />
        <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
      </el-select>
      <el-select v-model="status" size="small" style="width: 140px" placeholder="全部状态">
        <el-option label="全部状态" value="" />
        <el-option label="正常" value="正常" />
        <el-option label="预警" value="预警" />
        <el-option label="缺货" value="缺货" />
      </el-select>
      <el-button size="small" type="primary">查找</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 条 · 库存来源：WMS 同步（当前为本地模拟）</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>库存明细</h3>
        <span class="extra">可售 = 实物 − 锁定；最近同步 {{ store.lastSync }}</span>
      </div>
      <el-table :data="view" size="small" max-height="580">
        <el-table-column prop="name" label="货品名称" min-width="160" />
        <el-table-column prop="sku" label="货品编码" width="130" />
        <el-table-column prop="type" label="货品类型" width="110" />
        <el-table-column prop="batch" label="批次号" width="120" />
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="onHand" label="实物库存" width="100" align="right" />
        <el-table-column prop="locked" label="锁定" width="80" align="right" />
        <el-table-column label="可售" width="90" align="right">
          <template #default="{ row }"><b>{{ row.available }}</b></template>
        </el-table-column>
        <el-table-column prop="inTransit" label="在途" width="80" align="right" />
        <el-table-column prop="warnValue" label="预警值" width="90" align="right" />
        <el-table-column label="库存状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === '正常' ? 'success' : (row.status === '预警' ? 'warning' : 'danger')">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="tip">
      <b>说明</b>　库存本应从 WMS 同步，当前未接入，先由本地生成并模拟扣减：订单审核通过时会按发货仓扣减实物库存。
    </div>

    <el-dialog v-model="warnVisible" title="设置库存预警" width="480px">
      <el-form label-width="96px" size="small">
        <el-form-item label="选择商品">
          <el-select v-model="warnForm.sku" style="width:100%" placeholder="可多选，支持关键词搜索" multiple filterable>
            <el-option v-for="i in store.items" :key="i.sku + i.warehouse"
              :label="i.name + '（' + i.warehouse + '）'" :value="i.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="预警周期">
          <el-select v-model="warnForm.unit" style="width:130px">
            <el-option label="按年" value="年" /><el-option label="按月" value="月" /><el-option label="按日" value="日" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间"><el-input v-model="warnForm.time" placeholder="仅可填数字" /></el-form-item>
        <el-form-item label="库存最低值"><el-input v-model="warnForm.value" placeholder="仅可填数字" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="warnVisible = false">取消</el-button>
        <el-button type="primary" @click="saveWarn">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { useStockStore, WAREHOUSES } from '@/stores/stock'

const store = useStockStore()
const warehouses = WAREHOUSES

const kw = ref('')
const warehouse = ref('')
const status = ref('')
const warnVisible = ref(false)
const warnForm = reactive({ sku: [], unit: '日', time: '', value: '' })

const view = computed(() => store.rows.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.name, r.sku, r.batch].some(v => String(v).includes(k))
  const okW = !warehouse.value || r.warehouse === warehouse.value
  const okS = !status.value || r.status === status.value
  return okKw && okW && okS
}))

const reset = () => { kw.value = ''; warehouse.value = ''; status.value = '' }

function saveWarn() {
  if (!warnForm.value) return ElMessage.error('请填写库存最低值')
  warnVisible.value = false
  ElMessage.success('预警规则已保存，库存状态将按新阈值重新计算')
}
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.tip { margin-top: 14px; padding: 12px 14px; background: var(--brand-l); border: 1px solid #BFE3F2;
  border-radius: 6px; font-size: 12.5px; color: #0E7FB2; }
.tip b { font-weight: 600; }
</style>
