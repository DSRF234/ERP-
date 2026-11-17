<template>
  <TablePage
    title="库存记录" sub="货品批次库存与预警状态" card-title="库存明细" hint="库存状态：正常 / 预警 / 缺货" note="预警支持按年/月/日设置提醒周期，并多选商品批量设置最低库存值。"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'name', label: '货品名称', width: 180, type: 'text' },
  { prop: 'code', label: '货品编码', width: 130, type: 'text' },
  { prop: 'type', label: '货品类型', width: 100, type: 'text' },
  { prop: 'batch', label: '批次号', width: 120, type: 'text' },
  { prop: 'warehouse', label: '仓库', width: 110, type: 'text' },
  { prop: 'inNo', label: '入库单号', width: 140, type: 'text' },
  { prop: 'inQty', label: '入库数量', width: 90, type: 'num' },
  { prop: 'outNo', label: '出库单号', width: 140, type: 'text' },
  { prop: 'outQty', label: '出库数量', width: 90, type: 'num' },
  { prop: 'left', label: '剩余数量', width: 90, type: 'num' },
  { prop: 'warnValue', label: '预警值', width: 80, type: 'num' },
  { prop: 'status', label: '库存状态', width: 100, type: 'tag' }
]

const filters = [{ key:'warehouse', label:'全部仓库', options:['华东主仓','华南仓','平台仓1','平台仓2'] }, { key:'status', label:'全部状态', options:['正常','预警','缺货'] }]
const searchKeys = ['name', 'code', 'batch']

const rows = [
  { name:'雅诗兰黛小棕瓶 50ml', code:'SKU-100231', type:'美妆个护', batch:'B20261101', warehouse:'华东主仓', inNo:'RK20261101001', inQty:1860, outNo:'CK20261116009', outQty:620, left:1240, warnValue:200, status:'正常' },
  { name:'兰蔻小黑瓶 30ml', code:'SKU-100188', type:'美妆个护', batch:'B20261103', warehouse:'华东主仓', inNo:'RK20261103002', inQty:600, outNo:'CK20261116011', outQty:420, left:180, warnValue:200, status:'预警' },
  { name:'星野香薰礼盒', code:'SKU-300045', type:'家居日用', batch:'B20260930', warehouse:'华南仓', inNo:'RK20260930003', inQty:1240, outNo:'—', outQty:0, left:1240, warnValue:150, status:'正常' },
  { name:'星野纯棉四件套', code:'SKU-200118', type:'家居日用', batch:'B20261108', warehouse:'华东主仓', inNo:'RK20261108004', inQty:2400, outNo:'CK20261116021', outQty:220, left:2180, warnValue:300, status:'正常' },
  { name:'星野收纳箱 大号', code:'SKU-400011', type:'家居日用', batch:'B20261010', warehouse:'华南仓', inNo:'RK20261010005', inQty:1580, outNo:'—', outQty:0, left:1580, warnValue:200, status:'缺货' }
]
</script>
