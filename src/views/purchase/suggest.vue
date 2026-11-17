<template>
  <div>
    <PageHeader title="补货建议" sub="按销量与库存自动计算建议采购量">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>补货建议</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="sku" label="商品编码" min-width="140" />
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="avgSales" label="日均销量" min-width="100" />
        <el-table-column prop="available" label="可用库存" min-width="100" />
        <el-table-column prop="coverDays" label="可售天数" min-width="100" />
        <el-table-column prop="suggest" label="建议采购" min-width="100" />
        <el-table-column prop="supplier" label="建议供应商" min-width="180" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　建议采购量 = 日均销量 × 备货天数 − 可用库存 − 在途库存。可售天数低于安全线的才进建议列表。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { sku: "SKU-100231", name: "雅诗兰黛小棕瓶 50ml", avgSales: "46", available: "1,240", coverDays: "27", suggest: "0", supplier: "广州雅美" },
  { sku: "SKU-200118", name: "星野纯棉四件套", avgSales: "72", available: "2,180", coverDays: "30", suggest: "0", supplier: "南通家纺" },
  { sku: "SKU-100188", name: "兰蔻小黑瓶 30ml", avgSales: "38", available: "240", coverDays: "6", suggest: "900", supplier: "广州雅美" },
  { sku: "SKU-300045", name: "星野香薰礼盒", avgSales: "12", available: "1,240", coverDays: "103", suggest: "0", supplier: "深圳香氛" }
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
