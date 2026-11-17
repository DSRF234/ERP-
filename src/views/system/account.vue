<template>
  <div>
    <PageHeader title="角色账号" sub="账号创建 · 角色分配 · 密码与状态">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>角色账号</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="user" label="账号" min-width="120" />
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="role" label="角色" min-width="140" />
        <el-table-column prop="scope" label="数据范围" min-width="180" />
        <el-table-column prop="status" label="状态" min-width="90" />
        <el-table-column prop="lastLogin" label="最后登录" min-width="160" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　账号不物理删除，只停用；停用后历史操作记录仍要可查。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { user: "wangjl", name: "王佳丽", role: "运营", scope: "天猫 / 抖音 / 小程序", status: "启用", lastLogin: "2026-11-16 09:12" },
  { user: "lilx", name: "李丽霞", role: "仓库管理员", scope: "华东主仓 / 华南仓", status: "启用", lastLogin: "2026-11-16 08:40" },
  { user: "genziyi", name: "耿子毅", role: "财务", scope: "全部渠道（财务模块）", status: "启用", lastLogin: "2026-11-15 18:22" },
  { user: "zhangls", name: "张丽珊", role: "客服", scope: "全部渠道（售后模块）", status: "停用", lastLogin: "2026-10-30 16:05" }
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
