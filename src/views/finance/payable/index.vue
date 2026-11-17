<template>
  <div>
    <PageHeader title="应付账款" sub="供应商应付 · 账期跟踪 · 逾期提醒">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>应付账款</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="partner" label="往来单位" min-width="220" />
        <el-table-column prop="type" label="类型" min-width="90" />
        <el-table-column prop="amount" label="应付金额" min-width="120" />
        <el-table-column prop="dueDate" label="到期日" min-width="110" />
        <el-table-column prop="aging" label="账龄（天）" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="100" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　平台仓服务费、物流费也走应付；账龄与逾期两列是财务每天要看的。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { partner: "广州雅美化妆品有限公司", type: "供应商", amount: "86,400.00", dueDate: "12-15", aging: "8", status: "未到期" },
  { partner: "南通家纺制造厂", type: "供应商", amount: "72,000.00", dueDate: "11-20", aging: "12", status: "即将到期" },
  { partner: "菜鸟供应链（华东仓）", type: "服务商", amount: "18,600.00", dueDate: "11-10", aging: "6", status: "已逾期" },
  { partner: "深圳香氛实业", type: "供应商", amount: "24,000.00", dueDate: "11-25", aging: "10", status: "未到期" }
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
