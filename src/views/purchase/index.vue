<template>
  <div>
    <PageHeader title="采购单" sub="采购单 · 补货建议 · 供应商">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>采购单</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="po" label="采购单号" min-width="160" />
        <el-table-column prop="supplier" label="供应商" min-width="160" />
        <el-table-column prop="creator" label="制单人" min-width="90" />
        <el-table-column prop="warehouse" label="收货仓" min-width="120" />
        <el-table-column prop="qty" label="采购数量" min-width="90" />
        <el-table-column prop="amount" label="采购金额" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="100" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　补货建议是本模块的加分项：按「近 30 天日均销量 × 备货天数 − 可用库存 − 在途」计算建议采购量。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
      { po: "PO2026111500012", supplier: "广州雅美化妆品有限公司", creator: "李明", warehouse: "华东主仓", qty: "1,200", amount: "86,400", status: "待入库" },
      { po: "PO2026111400008", supplier: "南通家纺制造厂", creator: "王芳", warehouse: "华南仓", qty: "3,600", amount: "72,000", status: "已入库" },
      { po: "PO2026111200015", supplier: "深圳香氛实业", creator: "李明", warehouse: "华东主仓", qty: "800", amount: "24,000", status: "部分入库" }
]
</script>

<style scoped>
.tip {
  margin-top: 14px; padding: 12px 14px; background: #f0f7ff;
  border: 1px solid #d6e8ff; border-radius: 6px;
  font-size: 12.5px; line-height: 1.8; color: #4a6b8f;
}
.tip b { color: #2b6cb0; }
</style>
