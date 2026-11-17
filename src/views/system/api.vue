<template>
  <div>
    <PageHeader title="API 对接" sub="平台授权 · 同步日志 · 失败重试">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>API 对接</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="name" label="对接对象" min-width="140" />
        <el-table-column prop="type" label="类型" min-width="100" />
        <el-table-column prop="endpoint" label="接口地址" min-width="240" />
        <el-table-column prop="lastSync" label="最后同步" min-width="150" />
        <el-table-column prop="status" label="状态" min-width="100" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　五个对接对象各要有独立的同步日志与失败重试。注意：WMS 与用友为既有系统，本项目只做集成不替换。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { name: "天猫开放平台", type: "电商平台", endpoint: "https://eco.taobao.com/router/rest", lastSync: "11-16 09:30", status: "正常" },
  { name: "抖音开放平台", type: "电商平台", endpoint: "https://openapi-fxg.jinritemai.com", lastSync: "11-16 09:28", status: "正常" },
  { name: "京东自营", type: "电商平台", endpoint: "https://api.jd.com/routerjson", lastSync: "11-16 08:00", status: "正常" },
  { name: "老旧 WMS", type: "仓储系统", endpoint: "http://192.168.1.20:8080/api", lastSync: "11-16 07:00", status: "异常" },
  { name: "用友财务", type: "财务系统", endpoint: "http://192.168.1.30/api/voucher", lastSync: "11-16 02:00", status: "正常" }
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
