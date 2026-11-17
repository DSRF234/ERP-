<template>
  <div>
    <PageHeader title="发货仓设置" sub="仓库主数据 · 渠道授权 · 承运商绑定">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>发货仓设置</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="code" label="仓库编码" min-width="120" />
        <el-table-column prop="name" label="仓库名称" min-width="140" />
        <el-table-column prop="type" label="类型" min-width="100" />
        <el-table-column prop="address" label="地址" min-width="220" />
        <el-table-column prop="channels" label="可发渠道" min-width="200" />
        <el-table-column prop="status" label="状态" min-width="90" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　「可发渠道」这一列是分仓规则的第一道过滤条件，没有它分仓引擎跑不起来。平台仓只同步不创建。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { code: "WH-01", name: "华东主仓", type: "自营", address: "江苏省苏州市工业园区…", channels: "天猫 / 抖音 / 小程序", status: "启用" },
  { code: "WH-02", name: "华南仓", type: "自营", address: "广东省广州市白云区…", channels: "天猫 / 抖音 / 小程序", status: "启用" },
  { code: "WH-03", name: "菜鸟仓（华东）", type: "平台仓", address: "—", channels: "天猫", status: "启用" },
  { code: "WH-04", name: "京东仓（华北）", type: "平台仓", address: "—", channels: "京东自营", status: "启用" }
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
