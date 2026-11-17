<template>
  <div>
    <PageHeader title="销售订单" sub="多渠道订单池 · 统一状态 · 分仓拆单">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>销售订单</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="orderNo" label="订单号" min-width="160" />
        <el-table-column prop="channel" label="渠道" min-width="100" />
        <el-table-column prop="shop" label="店铺" min-width="140" />
        <el-table-column prop="amount" label="订单金额" min-width="100" />
        <el-table-column prop="warehouse" label="发货仓" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="100" />
        <el-table-column prop="createdAt" label="下单时间" min-width="140" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　订单状态机建议采用「6 个主干状态 + 渠道原始状态并存」，分仓拆单规则写在 api 层之外的 service 中。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
      { orderNo: "TM2026111600001", channel: "天猫", shop: "星野优选旗舰店", amount: "1,286.00", warehouse: "华东主仓", status: "待发货", createdAt: "11-16 10:22" },
      { orderNo: "DY2026111600033", channel: "抖音", shop: "官方旗舰店", amount: "459.00", warehouse: "华南仓", status: "已发货", createdAt: "11-16 09:41" },
      { orderNo: "JD2026111600011", channel: "京东自营", shop: "京东自营旗舰店", amount: "899.00", warehouse: "平台仓", status: "已签收", createdAt: "11-16 08:05" },
      { orderNo: "XC2026111600007", channel: "自营小程序", shop: "小程序商城", amount: "168.00", warehouse: "华南仓", status: "待审核", createdAt: "11-16 11:12" }
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
