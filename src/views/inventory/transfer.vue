<template>
  <div>
    <PageHeader title="库存调拨" sub="仓间调拨单 · 在途跟踪 · 收货确认">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>库存调拨</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="no" label="调拨单号" min-width="160" />
        <el-table-column prop="from" label="调出仓" min-width="110" />
        <el-table-column prop="to" label="调入仓" min-width="110" />
        <el-table-column prop="qty" label="调拨数量" min-width="100" align="right" />
        <el-table-column prop="carrier" label="承运方式" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="110" />
        <el-table-column prop="createdAt" label="创建时间" min-width="140" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　调拨在途库存只能算一头：发出即从调出仓扣减、到达才计入调入仓。两头都算就会盘亏。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { no: "DB2026111500007", from: "华东主仓", to: "华南仓", qty: "200", carrier: "快递", status: "运输中", createdAt: "11-15 10:20" },
  { no: "DB2026111200003", from: "华南仓", to: "华东主仓", qty: "600", carrier: "物流", status: "已收货", createdAt: "11-12 14:05" },
  { no: "DB2026111600011", from: "华东主仓", to: "华南仓", qty: "80", carrier: "快递", status: "待审核", createdAt: "11-16 09:10" }
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
