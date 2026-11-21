<template>
  <TablePage
    title="库存积压" sub="库存剩余价值 · 按仓库查看" card-title="库存剩余价值" hint="可按仓库筛选查看积压货品"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'idx', label: '序号', width: 60, type: 'index' },
  { prop: 'name', label: '货品名称', width: 200, type: 'text' },
  { prop: 'code', label: '货品编号', width: 130, type: 'text' },
  { prop: 'warehouse', label: '仓库', width: 110, type: 'text' },
  { prop: 'cost', label: '成本', width: 100, type: 'money' },
  { prop: 'qty', label: '剩余货品数量', width: 110, type: 'num' },
  { prop: 'value', label: '剩余货品价值', width: 120, type: 'money' },
  { prop: 'days', label: '积压天数', width: 100, type: 'num' }
]

const filters = [{ key:'warehouse', label:'全部仓库', options:['华东主仓','华南仓','平台仓1','平台仓2'] }]
const searchKeys = ['name', 'code']

const rows = [
  { name:'星野香薰礼盒（旧版）', code:'SKU-300045', warehouse:'华南仓', cost:150, qty:1240, value:186000, days:154 },
  { name:'星野纯棉四件套（灰）', code:'SKU-200118', warehouse:'华东主仓', cost:150, qty:860, value:129000, days:121 },
  { name:'雅诗兰黛小蓝瓶 30ml', code:'SKU-100231', warehouse:'华南仓', cost:157, qty:420, value:66000, days:96 },
  { name:'星野收纳箱 大号', code:'SKU-400011', warehouse:'华东主仓', cost:30, qty:1580, value:47000, days:88 }
]
</script>
