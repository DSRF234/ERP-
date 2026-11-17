<template>
  <div>
    <PageHeader title="入库管理" sub="采购入库 · 退货入库 · 调拨入库">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>入库管理</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="no" label="入库单号" min-width="160" />
        <el-table-column prop="type" label="入库类型" min-width="110" />
        <el-table-column prop="sourceNo" label="来源单号" min-width="160" />
        <el-table-column prop="warehouse" label="收货仓" min-width="110" />
        <el-table-column prop="qty" label="入库数量" min-width="90" />
        <el-table-column prop="status" label="状态" min-width="100" />
        <el-table-column prop="arrivedAt" label="实际到货" min-width="140" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　入库必须挂来源单号（采购单 / 售后单 / 调拨单），否则库存来源无法追溯，月度复盘做不了。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { no: "RK2026111600012", type: "采购入库", sourceNo: "PO2026111500012", warehouse: "华东主仓", qty: "1,200", status: "待质检", arrivedAt: "11-16 09:30" },
  { no: "RK2026111500031", type: "退货入库", sourceNo: "AS2026111400018", warehouse: "华南仓", qty: "1", status: "已上架", arrivedAt: "11-15 16:20" },
  { no: "RK2026111400008", type: "调拨入库", sourceNo: "DB2026111200003", warehouse: "华南仓", qty: "600", status: "已上架", arrivedAt: "11-14 11:05" }
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
