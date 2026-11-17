<template>
  <TablePage
    title="应付账款台账" sub="采购单应付 · 总金额与状态" card-title="应付账款台账" hint="储存所有采购订单与需财务支出的订单" note="总金额 = 采购金额 + 运费；运费由 WMS 按实际同步。"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'no', label: '采购单编号', width: 150, type: 'text' },
  { prop: 'warehouse', label: '收货仓', width: 110, type: 'text' },
  { prop: 'goods', label: '采购商品', width: 200, type: 'text' },
  { prop: 'date', label: '采购时间', width: 110, type: 'text' },
  { prop: 'amount', label: '采购金额', width: 110, type: 'money' },
  { prop: 'freight', label: '运费', width: 90, type: 'money' },
  { prop: 'total', label: '总金额', width: 120, type: 'money' },
  { prop: 'status', label: '采购单状态', width: 110, type: 'tag' }
]

const filters = [{ key:'status', label:'全部状态', options:['待审核','进行中','已完成','已驳回'] }]
const searchKeys = ['no', 'goods']

const rows = [
  { no:'CG202611160012', warehouse:'华东主仓', goods:'雅诗兰黛小棕瓶 ×200', date:'2026-11-16', amount:76000, freight:120, total:76120, status:'进行中' },
  { no:'CG202611140008', warehouse:'华南仓', goods:'星野纯棉四件套 ×600', date:'2026-11-14', amount:72000, freight:300, total:72300, status:'已完成' },
  { no:'CG202611120015', warehouse:'华东主仓', goods:'星野香薰礼盒 ×800', date:'2026-11-12', amount:24000, freight:80, total:24080, status:'待审核' },
  { no:'CG202611090003', warehouse:'华南仓', goods:'星野收纳箱 ×1200', date:'2026-11-09', amount:36000, freight:200, total:36200, status:'已完成' }
]
</script>
