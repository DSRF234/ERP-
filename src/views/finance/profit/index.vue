<template>
  <div>
    <PageHeader title="成本利润" sub="商品毛利 · 渠道毛利 · 成本构成">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary">新增</el-button>
    </PageHeader>

    <div class="card">
      <div class="card-head">
        <h3>成本利润</h3>
        <span class="extra">示例数据 · 接入接口后替换</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="name" label="商品名称" min-width="220" />
        <el-table-column prop="qty" label="销量" min-width="80" />
        <el-table-column prop="revenue" label="收入" min-width="100" />
        <el-table-column prop="cost" label="成本" min-width="100" />
        <el-table-column prop="profit" label="毛利额" min-width="100" />
        <el-table-column prop="rate" label="毛利率" min-width="90" />
        <el-table-column prop="channel" label="主销渠道" min-width="110" />
      </el-table>
    </div>

    <div class="tip">
      <b>开发提示</b>　毛利率 = 毛利额 ÷ 收入。成本必须按发货仓批次成本计算，取全仓平均值会让渠道毛利失真。
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'

// TODO: 接入接口后改为 onMounted 请求数据
const rows = [
  { name: "雅诗兰黛 小蓝瓶 30ml", qty: "1,864", revenue: "30.9万", cost: "13.6万", profit: "17.3万", rate: "56.1%", channel: "天猫" },
  { name: "兰蔻 小黑瓶 30ml", qty: "986", revenue: "41.2万", cost: "20.7万", profit: "20.5万", rate: "49.8%", channel: "抖音" },
  { name: "星野 纯棉四件套", qty: "2,140", revenue: "38.6万", cost: "21.6万", profit: "17.0万", rate: "44.1%", channel: "天猫" },
  { name: "星野 香薰礼盒", qty: "3,120", revenue: "28.4万", cost: "14.9万", profit: "13.5万", rate: "47.6%", channel: "小程序" }
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
