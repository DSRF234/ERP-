<template>
  <div>
    <PageHeader title="出库管理" sub="销售出库 · 调拨出库 · 拣货复核">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>出库管理</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="no" label="出库单号" min-width="160" />
        <el-table-column prop="type" label="出库类型" min-width="110" />
        <el-table-column prop="orderNo" label="关联订单" min-width="160" />
        <el-table-column prop="warehouse" label="发货仓" min-width="110" />
        <el-table-column prop="qty" label="出库数量" min-width="90" />
        <el-table-column prop="carrier" label="承运商" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="100" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　出库状态建议：待拣货 → 已拣货 → 已复核 → 已打包 → 已发货。「已发货」的时点按承运商揽收扫描计。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { no: "CK2026111600091", type: "销售出库", orderNo: "TM2026111600001", warehouse: "华东主仓", qty: "3", carrier: "中通", status: "待拣货" },
  { no: "CK2026111600088", type: "销售出库", orderNo: "DY2026111600033", warehouse: "华南仓", qty: "1", carrier: "圆通", status: "已发货" },
  { no: "CK2026111500021", type: "调拨出库", orderNo: "DB2026111500007", warehouse: "华东主仓", qty: "200", carrier: "—", status: "运输中" }
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
