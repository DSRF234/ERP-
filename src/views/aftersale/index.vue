<template>
  <div>
    <PageHeader title="售后工单" sub="退换货 · 审核 · 退回质检 · 残次品">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>售后工单</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="ticket" label="售后单号" min-width="160" />
        <el-table-column prop="orderNo" label="原订单号" min-width="160" />
        <el-table-column prop="type" label="类型" min-width="90" />
        <el-table-column prop="reason" label="原因" min-width="160" />
        <el-table-column prop="amount" label="退款金额" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="100" />
        <el-table-column prop="days" label="处理天数" min-width="100" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　售后状态独立于订单状态机。6 天里 5 天半是「等」，优化点在流转与提醒，不在处理动作本身。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { ticket: "AS2026111500031", orderNo: "TM2026111000221", type: "仅退款", reason: "商品破损", amount: "286.00", status: "待审核", days: "1" },
  { ticket: "AS2026111400018", orderNo: "DY2026110800134", type: "退货退款", reason: "尺码不符", amount: "459.00", status: "待收货", days: "3" },
  { ticket: "AS2026111200007", orderNo: "JD2026110300088", type: "换货", reason: "颜色不喜欢", amount: "0.00", status: "已完结", days: "5" }
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
