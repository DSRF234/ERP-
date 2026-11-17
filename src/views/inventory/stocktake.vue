<template>
  <div>
    <PageHeader title="库存盘点" sub="盘点任务 · 差异处理 · 盘点历史">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>库存盘点</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="no" label="盘点单号" min-width="160" />
        <el-table-column prop="warehouse" label="仓库" min-width="110" />
        <el-table-column prop="scope" label="盘点范围" min-width="140" />
        <el-table-column prop="bookQty" label="账面数量" min-width="100" />
        <el-table-column prop="realQty" label="实盘数量" min-width="100" />
        <el-table-column prop="diff" label="差异" min-width="90" />
        <el-table-column prop="status" label="状态" min-width="100" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　盘点差异要生成「库存调整单」而不是直接改库存数；调整单进财务成本核算，差异率是仓库考核指标。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { no: "PD2026111500003", warehouse: "华东主仓", scope: "A 区 全品类", bookQty: "3,860", realQty: "3,852", diff: "-8", status: "待审核" },
  { no: "PD2026111000001", warehouse: "华南仓", scope: "SKU-100231 抽盘", bookQty: "620", realQty: "618", diff: "-2", status: "已调整" },
  { no: "PD2026110500002", warehouse: "华东主仓", scope: "全仓", bookQty: "12,400", realQty: "12,415", diff: "+15", status: "已调整" }
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
