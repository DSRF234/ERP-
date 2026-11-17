<template>
  <TablePage
    title="仓库盘点" sub="盘点任务 · 盘点明细 · 盘点历史" card-title="盘点任务" hint="状态：待盘点 / 已完成 / 有差异" note="盘点单号规则：PD + 年月日 + 时间；实盘数与库存数不一致时状态为「有差异」，需生成库存调整单。"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'no', label: '盘点单号', width: 170, type: 'text' },
  { prop: 'name', label: '货品名称', width: 170, type: 'text' },
  { prop: 'code', label: '货品编码', width: 120, type: 'text' },
  { prop: 'batch', label: '批次号', width: 110, type: 'text' },
  { prop: 'type', label: '货品类型', width: 100, type: 'text' },
  { prop: 'inType', label: '入库类型', width: 100, type: 'text' },
  { prop: 'warehouse', label: '收货仓', width: 110, type: 'text' },
  { prop: 'poNo', label: '采购单号', width: 140, type: 'text' },
  { prop: 'stockQty', label: '库存数', width: 80, type: 'num' },
  { prop: 'realQty', label: '实盘数', width: 80, type: 'num' },
  { prop: 'owner', label: '负责人', width: 90, type: 'text' },
  { prop: 'status', label: '状态', width: 100, type: 'tag' }
]

const filters = [{ key:'warehouse', label:'全部仓库', options:['华东主仓','华南仓','平台仓1','平台仓2'] }, { key:'status', label:'全部状态', options:['待盘点','已完成','有差异'] }]
const searchKeys = ['no', 'name', 'code']

const rows = [
  { no:'PD202611150001', name:'雅诗兰黛小棕瓶 50ml', code:'SKU-100231', batch:'B20261101', type:'美妆个护', inType:'采购入库', warehouse:'华东主仓', poNo:'CG202611160012', stockQty:1240, realQty:1232, owner:'李丽霞', status:'有差异' },
  { no:'PD202611150001', name:'兰蔻小黑瓶 30ml', code:'SKU-100188', batch:'B20261103', type:'美妆个护', inType:'采购入库', warehouse:'华东主仓', poNo:'CG202611160012', stockQty:180, realQty:180, owner:'李丽霞', status:'已完成' },
  { no:'PD202611120003', name:'星野香薰礼盒', code:'SKU-300045', batch:'B20260930', type:'家居日用', inType:'调拨入库', warehouse:'华南仓', poNo:'—', stockQty:1240, realQty:0, owner:'王强', status:'待盘点' }
]
</script>
