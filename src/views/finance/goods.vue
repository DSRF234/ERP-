<template>
  <TablePage
    title="商品信息" sub="商品毛利表 · 收入 / 成本 / 毛利率" card-title="商品毛利表" hint="毛利额 = 收入 − 成本；毛利率 = 毛利额 ÷ 收入" note="成本按发货仓批次成本计算，不能取全仓平均，否则渠道毛利会失真。"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'idx', label: '序号', width: 60, type: 'index' },
  { prop: 'name', label: '商品基础信息', width: 220, type: 'text' },
  { prop: 'qty', label: '销量', width: 80, type: 'num' },
  { prop: 'revenue', label: '收入', width: 100, type: 'money' },
  { prop: 'cost', label: '成本', width: 100, type: 'money' },
  { prop: 'profit', label: '毛利额', width: 100, type: 'money' },
  { prop: 'rate', label: '毛利率', width: 90, type: 'text' }
]

const filters = []
const searchKeys = ['name']

const rows = [
  { name:'雅诗兰黛 小蓝瓶 30ml', qty:1864, revenue:309000, cost:136000, profit:173000, rate:'56.1%' },
  { name:'兰蔻 小黑瓶 30ml', qty:986, revenue:412000, cost:207000, profit:205000, rate:'49.8%' },
  { name:'星野 纯棉四件套', qty:2140, revenue:386000, cost:216000, profit:170000, rate:'44.1%' },
  { name:'星野 香薰礼盒', qty:3120, revenue:284000, cost:149000, profit:135000, rate:'47.6%' }
]
</script>
