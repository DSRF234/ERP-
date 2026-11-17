<template>
  <div>
    <PageHeader title="平台账单" sub="账单导入 · 字段映射 · 校验结果">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>平台账单</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="batch" label="导入批次" min-width="160" />
        <el-table-column prop="channel" label="平台" min-width="100" />
        <el-table-column prop="period" label="账期" min-width="140" />
        <el-table-column prop="fileName" label="文件名" min-width="200" />
        <el-table-column prop="rows" label="记录数" min-width="90" />
        <el-table-column prop="amount" label="账单金额" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="100" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　导入要留「批次 + 映射模板 + 失败行明细」，否则财务只能整份重来。字段映射做成可配置，平台改格式不用改代码。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { batch: "IMP202611160001", channel: "天猫", period: "2026-10", fileName: "天猫账单_202610.xlsx", rows: "5,820", amount: "591.7万", status: "已导入" },
  { batch: "IMP202611160002", channel: "抖音", period: "2026-10", fileName: "抖音结算_202610.csv", rows: "4,102", amount: "398.8万", status: "已导入" },
  { batch: "IMP202611150003", channel: "京东自营", period: "2026-10", fileName: "京东自营_202610.xlsx", rows: "1,486", amount: "180.1万", status: "校验失败" }
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
