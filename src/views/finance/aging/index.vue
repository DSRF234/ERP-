<template>
  <div>
    <PageHeader title="库存积压（库存资金占用）" sub="按库龄分档统计占用资金">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>库存积压（库存资金占用）</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="warehouse" label="仓库" min-width="110" />
        <el-table-column prop="name" label="商品名称" min-width="220" />
        <el-table-column prop="supplier" label="供应商" min-width="160" />
        <el-table-column prop="qty" label="剩余数量" min-width="100" align="right" />
        <el-table-column prop="amount" label="占用资金" min-width="110" align="right" />
        <el-table-column prop="days" label="积压天数" min-width="100" align="right" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　财务看的是「压了多少钱、压了多久」，按 0-30 / 31-90 / 91-180 / 180+ 四档统计金额，而不是件数。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { warehouse: "华南仓", name: "星野 香薰礼盒（旧版）", supplier: "深圳香氛实业", qty: "1,240", amount: "18.6万", days: "154" },
  { warehouse: "华东主仓", name: "星野 纯棉四件套（灰）", supplier: "南通家纺制造厂", qty: "860", amount: "12.9万", days: "121" },
  { warehouse: "华南仓", name: "雅诗兰黛 小蓝瓶 30ml", supplier: "广州雅美化妆品", qty: "420", amount: "6.6万", days: "96" },
  { warehouse: "华东主仓", name: "星野 收纳箱 大号", supplier: "台州塑料制品", qty: "1,580", amount: "4.7万", days: "88" }
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
