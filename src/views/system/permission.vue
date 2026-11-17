<template>
  <div>
    <PageHeader title="权限管理" sub="角色权限矩阵 · 菜单/按钮/数据范围">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>权限管理</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="role" label="角色" min-width="120" />
        <el-table-column prop="menu" label="菜单权限" min-width="200" />
        <el-table-column prop="action" label="按钮权限" min-width="180" />
        <el-table-column prop="scope" label="数据范围" min-width="160" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　权限矩阵是任务五的交付物：菜单 + 按钮 + 数据范围三层，缺一层都不完整。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { role: "老板", menu: "全部模块", action: "全部", scope: "全部渠道 · 全部仓" },
  { role: "运营", menu: "订单 / 库存 / 看板", action: "查看、编辑", scope: "所属渠道" },
  { role: "采购", menu: "采购 / 供应商 / 库存", action: "查看、编辑", scope: "全部仓" },
  { role: "仓库管理员", menu: "仓储 / 库存", action: "查看、编辑", scope: "所属仓" },
  { role: "客服", menu: "订单 / 售后", action: "查看、编辑", scope: "全部渠道" },
  { role: "财务", menu: "财务 / 看板", action: "查看、导出", scope: "全部渠道" }
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
