<template>
  <TablePage
    title="历史采购单" sub="全部采购单的状态与明细" card-title="采购单明细" hint="状态：待审核 / 进行中 / 已完成 / 已驳回" note="采购单状态机：待审核 → 进行中（已下单）→ 已完成（入库并同步库存）；审核不通过进已驳回。"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'no', label: '采购单编号', width: 150, type: 'text' },
  { prop: 'buyer', label: '采购员', width: 90, type: 'text' },
  { prop: 'creator', label: '制单人', width: 90, type: 'text' },
  { prop: 'supplier', label: '供应商', width: 200, type: 'text' },
  { prop: 'warehouse', label: '收货仓', width: 110, type: 'text' },
  { prop: 'qty', label: '采购数量', width: 90, type: 'num' },
  { prop: 'amount', label: '采购金额', width: 110, type: 'money' },
  { prop: 'freight', label: '运费', width: 90, type: 'money' },
  { prop: 'logistics', label: '物流公司', width: 100, type: 'text' },
  { prop: 'expressNo', label: '物流单号', width: 130, type: 'text' },
  { prop: 'date', label: '采购时间', width: 110, type: 'text' },
  { prop: 'status', label: '状态', width: 100, type: 'tag' }
]

const filters = [{ key:'status', label:'全部状态', options:['待审核','进行中','已完成','已驳回'] }]
const searchKeys = ['no', 'supplier']

const rows = [
  { no:'CG202611160012', buyer:'李明', creator:'李明', supplier:'广州雅美化妆品有限公司', warehouse:'华东主仓', qty:200, amount:76000, freight:120, logistics:'中通', expressNo:'ZT7788001122', date:'2026-11-16', status:'进行中' },
  { no:'CG202611140008', buyer:'王芳', creator:'王芳', supplier:'南通家纺制造厂', warehouse:'华南仓', qty:600, amount:72000, freight:300, logistics:'德邦', expressNo:'DB11223344', date:'2026-11-14', status:'已完成' },
  { no:'CG202611120015', buyer:'李明', creator:'李明', supplier:'深圳香氛实业', warehouse:'华东主仓', qty:800, amount:24000, freight:80, logistics:'顺丰', expressNo:'SF5566778899', date:'2026-11-12', status:'待审核' },
  { no:'CG202611090003', buyer:'张伟', creator:'张伟', supplier:'台州塑料制品', warehouse:'华南仓', qty:1200, amount:36000, freight:200, logistics:'专线物流', expressNo:'ZX99887766', date:'2026-11-09', status:'已驳回' }
]
</script>
