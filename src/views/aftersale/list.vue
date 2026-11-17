<template>
  <div>
    <PageHeader :title="cfg.title" :sub="cfg.sub" />

    <div class="filters">
      <el-select v-model="type" size="small" style="width: 140px" placeholder="全部类型">
        <el-option label="全部类型" value="" />
        <el-option label="仅退款" value="仅退款" />
        <el-option label="退货退款" value="退货退款" />
        <el-option label="换货" value="换货" />
        <el-option label="补发" value="补发" />
      </el-select>
      <el-input v-model="keyword" size="small" placeholder="售后单号 / 原订单号" style="width: 200px" clearable />
      <span class="tip-inline">共 {{ rows.length }} 条</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>{{ cfg.title }}</h3>
        <span class="extra">{{ cfg.hint }}</span>
      </div>
      <el-table :data="rows" size="small">
        <el-table-column prop="ticket" label="售后单号" min-width="160" />
        <el-table-column prop="orderNo" label="原订单号" min-width="160" />
        <el-table-column prop="type" label="类型" min-width="100" />
        <el-table-column prop="reason" label="原因" min-width="160" />
        <el-table-column label="退款金额" align="right" min-width="100">
          <template #default="{ row }">{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="状态" min-width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.tag">{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="days" label="已处理" min-width="90" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

const props = defineProps({ status: { type: String, default: 'wait' } })

const CONFIG = {
  wait:  { title: '售后待处理', sub: '客户已提交 · 待审核与判定责任', hint: '超过 24 小时未响应进超时池' },
  doing: { title: '售后处理中', sub: '已审核通过 · 等待退回、质检或退款', hint: '退回件须入库后才可退款' },
  done:  { title: '售后处理完成', sub: '退款或换货已完成 · 归档', hint: '仅可查看与导出' }
}
const cfg = CONFIG[props.status] || CONFIG.wait

const type = ref('')
const keyword = ref('')

const ALL = [
  { ticket: 'AS2026111500031', orderNo: 'TM2026111000221', type: '仅退款', reason: '商品破损',
    amount: '286.00', statusText: '待审核', tag: 'warning', days: '1 天', s: 'wait' },
  { ticket: 'AS2026111400018', orderNo: 'DY2026110800134', type: '退货退款', reason: '规格不符',
    amount: '459.00', statusText: '待收货', tag: 'warning', days: '3 天', s: 'doing' },
  { ticket: 'AS2026111200007', orderNo: 'JD2026110300088', type: '换货', reason: '颜色不喜欢',
    amount: '0.00', statusText: '已完成', tag: 'success', days: '5 天', s: 'done' },
  { ticket: 'AS2026111600002', orderNo: 'XC2026111500033', type: '补发', reason: '少件',
    amount: '0.00', statusText: '待审核', tag: 'warning', days: '0 天', s: 'wait' }
]

const rows = ALL.filter(r => r.s === props.status)
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.tip-inline { margin-left: auto; font-size: 12px; color: var(--text3); }
</style>
