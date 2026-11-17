<template>
  <div>
    <PageHeader :title="cfg.title" :sub="cfg.sub">
      <el-button size="small">导出</el-button>
      <el-button size="small" type="primary" v-if="status === 'review'">批量审核</el-button>
      <el-button size="small" type="primary" v-if="status === 'pending'">批量发货</el-button>
    </PageHeader>

    <div class="filters">
      <el-select v-model="channel" size="small" style="width: 130px" placeholder="全部渠道">
        <el-option label="全部渠道" value="" />
        <el-option label="天猫" value="天猫" />
        <el-option label="抖音" value="抖音" />
        <el-option label="京东自营" value="京东自营" />
        <el-option label="自营小程序" value="自营小程序" />
      </el-select>
      <el-input v-model="keyword" size="small" placeholder="订单号 / 收货人" style="width: 200px" clearable />
      <span class="tip-inline">共 {{ rows.length }} 条</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>{{ cfg.title }}</h3>
        <span class="extra">{{ cfg.hint }}</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="orderNo" label="订单号" min-width="160" />
        <el-table-column prop="channel" label="渠道" min-width="100" />
        <el-table-column prop="shop" label="店铺" min-width="140" />
        <el-table-column prop="receiver" label="收货人" min-width="100" />
        <el-table-column label="订单金额" align="right" min-width="100">
          <template #default="{ row }">{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="warehouse" label="发货仓" min-width="120" />
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.tag">{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" min-width="140" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

const props = defineProps({ status: { type: String, default: 'review' } })

const CONFIG = {
  review:  { title: '订单审核', sub: '库存校验 · 地址校验 · 审核通过后转待发货', hint: '待审核订单超过 2 小时标黄提醒' },
  pending: { title: '待发货',   sub: '已审核待出库 · 支持批量打单发货',            hint: '超过 48 小时未发货将被平台计罚' },
  shipped: { title: '已发货',   sub: '已出库已回传运单 · 跟踪物流签收',            hint: '签收后 7 天自动转已完结' },
  done:    { title: '已完结',   sub: '已签收且过售后期 · 归档不可编辑',            hint: '仅可查看与导出' }
}
const cfg = CONFIG[props.status] || CONFIG.review

const channel = ref('')
const keyword = ref('')

const ALL = [
  { orderNo: 'TM2026111600001', channel: '天猫', shop: '星野优选旗舰店', receiver: '陈**',
    amount: '1,286.00', warehouse: '华东主仓', statusText: '待审核', tag: 'warning', createdAt: '11-16 10:22', s: 'review' },
  { orderNo: 'DY2026111600033', channel: '抖音', shop: '官方旗舰店', receiver: '李**',
    amount: '459.00', warehouse: '华南仓', statusText: '待发货', tag: 'warning', createdAt: '11-16 09:41', s: 'pending' },
  { orderNo: 'JD2026111600011', channel: '京东自营', shop: '京东自营旗舰店', receiver: '王**',
    amount: '899.00', warehouse: '平台仓（京东）', statusText: '已发货', tag: 'info', createdAt: '11-16 08:05', s: 'shipped' },
  { orderNo: 'XC2026111600007', channel: '自营小程序', shop: '小程序商城', receiver: '赵**',
    amount: '168.00', warehouse: '华南仓', statusText: '已完结', tag: 'success', createdAt: '11-15 16:12', s: 'done' },
  { orderNo: 'TM2026111500218', channel: '天猫', shop: '星野优选旗舰店', receiver: '周**',
    amount: '2,340.00', warehouse: '华东主仓', statusText: '待审核', tag: 'warning', createdAt: '11-15 21:40', s: 'review' }
]

const rows = ALL.filter(r => r.s === props.status)
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.tip-inline { margin-left: auto; font-size: 12px; color: var(--text3); }
</style>
