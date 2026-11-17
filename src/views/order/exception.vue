<template>
  <div>
    <PageHeader title="异常订单" sub="缺货 · 地址异常 · 超时未发货">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>异常订单</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="orderNo" label="订单号" min-width="160" />
        <el-table-column prop="channel" label="渠道" min-width="100" />
        <el-table-column prop="type" label="异常类型" min-width="140" />
        <el-table-column prop="reason" label="异常原因" min-width="220" />
        <el-table-column prop="amount" label="金额" min-width="100" />
        <el-table-column prop="hours" label="挂起时长" min-width="100" />
        <el-table-column prop="owner" label="处理人" min-width="100" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　异常订单必须独立成入口，不能靠筛选状态找。缺货、地址异常、超时未发三类各有不同的处理动作。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { orderNo: "TM2026111600002", channel: "天猫", type: "缺货", reason: "华东仓 SKU-100231 可售为 0", amount: "1,286.00", hours: "6h", owner: "待分配" },
  { orderNo: "DY2026111600041", channel: "抖音", type: "超时未发", reason: "已超 48h 平台发货时限", amount: "459.00", hours: "12h", owner: "运营-王佳丽" },
  { orderNo: "XC2026111500033", channel: "自营小程序", type: "地址异常", reason: "收件地址库中不存在", amount: "168.00", hours: "3h", owner: "客服-张丽珊" }
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
