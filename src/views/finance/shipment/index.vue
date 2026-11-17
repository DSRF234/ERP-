<template>
  <div>
    <PageHeader title="发货数据（已发货未结算）" sub="在途资金 · 账龄分析">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>发货数据（已发货未结算）</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="orderNo" label="订单号" min-width="160" />
        <el-table-column prop="channel" label="渠道" min-width="100" />
        <el-table-column prop="shipDate" label="发货日期" min-width="110" />
        <el-table-column prop="amount" label="应结金额" min-width="100" align="right" />
        <el-table-column prop="expectDate" label="预计结算日" min-width="120" />
        <el-table-column prop="aging" label="账龄（天）" min-width="90" align="right" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　这张表是现金流视图：财务关心的不是发了多少货，而是「已发货但钱还没回来」有多少。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { orderNo: "TM2026110100221", channel: "天猫", shipDate: "11-01", amount: "1,286.00", expectDate: "11-08", aging: "16" },
  { orderNo: "DY2026110500134", channel: "抖音", shipDate: "11-05", amount: "459.00", expectDate: "11-07", aging: "12" },
  { orderNo: "JD2026102800088", channel: "京东自营", shipDate: "10-28", amount: "2,199.00", expectDate: "11-05", aging: "20" }
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
