<template>
  <TablePage
    title="发货数据" sub="已发货未结算 · 在途资金" card-title="已发货未结算表" hint="财务查看尚未到账的订单" note="这张表就是财务的现金流视图：已发货但钱还没回来的部分。"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'idx', label: '序号', width: 60, type: 'index' },
  { prop: 'no', label: '订单号', width: 150, type: 'text' },
  { prop: 'date', label: '发货日期', width: 110, type: 'text' },
  { prop: 'amount', label: '订单金额', width: 110, type: 'money' },
  { prop: 'settle', label: '平台结算金额', width: 120, type: 'money' },
  { prop: 'actual', label: '实际到账金额', width: 120, type: 'money' },
  { prop: 'expect', label: '预计结算日期', width: 120, type: 'text' }
]

const filters = []
const searchKeys = ['no']

const rows = [
  { no:'TM2026110100221', date:'2026-11-01', amount:1286, settle:64.30, actual:1221.70, expect:'2026-11-08' },
  { no:'DY2026110500134', date:'2026-11-05', amount:459, settle:0, actual:459, expect:'2026-11-07' },
  { no:'JD2026102800088', date:'2026-10-28', amount:2199, settle:65.97, actual:2133.03, expect:'2026-11-05' },
  { no:'XC2026111000012', date:'2026-11-10', amount:168, settle:0, actual:168, expect:'2026-11-13' }
]
</script>
