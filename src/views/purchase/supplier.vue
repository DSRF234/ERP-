<template>
  <div>
    <PageHeader title="供应商" sub="主数据 · 资质有效期 · 履约评级">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>供应商</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="code" label="供应商编码" min-width="130" />
        <el-table-column prop="name" label="供应商名称" min-width="220" />
        <el-table-column prop="contact" label="联系人" min-width="100" />
        <el-table-column prop="category" label="供货品类" min-width="120" />
        <el-table-column prop="credit" label="账期" min-width="90" />
        <el-table-column prop="certExpire" label="资质到期" min-width="120" />
        <el-table-column prop="rating" label="评级" min-width="80" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　供应商资质要有有效期并做临期预警——化妆品备案过期未换，平台抽检直接下架。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { code: "SUP-0001", name: "广州雅美化妆品有限公司", contact: "陈志强", category: "美妆个护", credit: "月结 30", certExpire: "2027-03-15", rating: "A" },
  { code: "SUP-0002", name: "南通家纺制造厂", contact: "周敏", category: "家居日用", credit: "月结 45", certExpire: "2026-12-20", rating: "A" },
  { code: "SUP-0003", name: "深圳香氛实业", contact: "李伟", category: "香氛礼盒", credit: "预付 30%", certExpire: "2026-11-30", rating: "B" },
  { code: "SUP-0004", name: "台州塑料制品", contact: "王强", category: "收纳用品", credit: "月结 30", certExpire: "2027-06-08", rating: "B" }
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
