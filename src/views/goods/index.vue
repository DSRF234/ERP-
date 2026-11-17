<template>
  <div>
    <PageHeader title="商品库" sub="SKU 主数据 · 渠道映射 · 上下架">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>商品库</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="sku" label="商品编码" min-width="130" />
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="spec" label="规格" min-width="120" />
        <el-table-column prop="supplier" label="供应商" min-width="160" />
        <el-table-column prop="price" label="售价" min-width="90" align="right" />
        <el-table-column prop="channels" label="在售渠道" min-width="200" />
        <el-table-column prop="status" label="状态" min-width="90" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　商品主数据是全系统的根：采购、库存、订单、财务都引用它。平台商品编码单独存映射表，不要把编码混进主表。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { sku: "SKU-100231", name: "雅诗兰黛 小棕瓶 50ml", spec: "50ml", supplier: "广州雅美化妆品", price: "1,080.00", channels: "天猫 / 抖音 / 小程序", status: "在售" },
  { sku: "SKU-100188", name: "兰蔻 小黑瓶 30ml", spec: "30ml", supplier: "广州雅美化妆品", price: "1,280.00", channels: "天猫 / 抖音", status: "在售" },
  { sku: "SKU-200118", name: "星野 纯棉四件套", spec: "1.8m 灰", supplier: "南通家纺制造厂", price: "359.00", channels: "天猫 / 小程序", status: "在售" },
  { sku: "SKU-300045", name: "星野 香薰礼盒", spec: "3 件装", supplier: "深圳香氛实业", price: "199.00", channels: "小程序", status: "下架" }
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
