<template>
  <div>
    <PageHeader title="库存查询" sub="四层库存账 · 多仓视图">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>库存查询</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="sku" label="商品编码" min-width="140" />
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="warehouse" label="仓库" min-width="120" />
        <el-table-column prop="onHand" label="实物库存" min-width="90" />
        <el-table-column prop="available" label="可售库存" min-width="90" />
        <el-table-column prop="locked" label="锁定" min-width="80" />
        <el-table-column prop="inTransit" label="在途" min-width="80" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　库存分四层：实物、可售、锁定、在途。下单先占可售、分仓再占仓位——两段式预占是防超卖的关键。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { sku: "SKU-100231", name: "雅诗兰黛小棕瓶 50ml", warehouse: "华东主仓", onHand: "1,860", available: "1,240", locked: "420", inTransit: "0" },
  { sku: "SKU-100231", name: "雅诗兰黛小棕瓶 50ml", warehouse: "华南仓", onHand: "620", available: "380", locked: "140", inTransit: "200" },
  { sku: "SKU-200118", name: "星野纯棉四件套", warehouse: "华东主仓", onHand: "2,400", available: "2,180", locked: "160", inTransit: "0" },
  { sku: "SKU-300045", name: "星野香薰礼盒", warehouse: "华南仓", onHand: "1,240", available: "1,240", locked: "0", inTransit: "0" }
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
