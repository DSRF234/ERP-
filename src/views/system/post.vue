<template>
  <div>
    <PageHeader title="职位管理" sub="职位定义 · 角色关联 · 人员归属">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>职位管理</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="code" label="职位编码" min-width="120" />
        <el-table-column prop="name" label="职位名称" min-width="140" />
        <el-table-column prop="role" label="关联角色" min-width="140" />
        <el-table-column prop="duty" label="职责说明" min-width="240" />
        <el-table-column prop="count" label="人数" min-width="80" align="right" />
        <el-table-column prop="status" label="状态" min-width="90" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　职位是「岗」，角色是「权」。一个人一个职位，职位绑定角色，账号再绑人——不要再把权限直接挂到账号上。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { code: "POST-01", name: "老板", role: "超级管理员", duty: "查看与编辑全部业务数据", count: "1", status: "启用" },
  { code: "POST-02", name: "电商运营", role: "运营", duty: "店铺、商品、订单、活动管理", count: "3", status: "启用" },
  { code: "POST-03", name: "采购员", role: "采购", duty: "采购计划、供应商、采购单", count: "2", status: "启用" },
  { code: "POST-04", name: "仓库管理员", role: "仓管", duty: "入库、出库、盘点、调拨", count: "4", status: "启用" },
  { code: "POST-05", name: "客服", role: "客服", duty: "售后工单、退换货处理", count: "3", status: "启用" },
  { code: "POST-06", name: "财务", role: "财务", duty: "对账、结算、成本核算", count: "2", status: "启用" }
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
