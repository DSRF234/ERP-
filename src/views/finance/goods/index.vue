<template>
  <div>
    <PageHeader title="商品信息（商品毛利）" sub="收入 · 成本 · 毛利率">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>商品信息（商品毛利）</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="sku" label="商品编码" min-width="130" />
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="supplier" label="供应商" min-width="160" />
        <el-table-column prop="qty" label="销量" min-width="80" align="right" />
        <el-table-column prop="revenue" label="收入" min-width="100" align="right" />
        <el-table-column prop="cost" label="成本" min-width="100" align="right" />
        <el-table-column prop="profit" label="毛利额" min-width="100" align="right" />
        <el-table-column prop="rate" label="毛利率" min-width="90" align="right" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　毛利率 = 毛利额 ÷ 收入。成本要按发货仓批次成本计算，取全仓平均会让渠道毛利失真。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { sku: "SKU-100231", name: "雅诗兰黛 小蓝瓶 30ml", supplier: "广州雅美", qty: "1,864", revenue: "30.9万", cost: "13.6万", profit: "17.3万", rate: "56.1%" },
  { sku: "SKU-100188", name: "兰蔻 小黑瓶 30ml", supplier: "广州雅美", qty: "986", revenue: "41.2万", cost: "20.7万", profit: "20.5万", rate: "49.8%" },
  { sku: "SKU-200118", name: "星野 纯棉四件套", supplier: "南通家纺", qty: "2,140", revenue: "38.6万", cost: "21.6万", profit: "17.0万", rate: "44.1%" }
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
