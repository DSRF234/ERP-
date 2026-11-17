<template>
  <TablePage
    title="供应商管理" sub="供应商基础资料与供应商货品" card-title="供应商基础资料" hint="合作状态：合作中 / 已暂停" note="同一个采购单只能有一个供应商；供应商货品的最低成交价用于采购比价。"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'idx', label: '序号', width: 60, type: 'index' },
  { prop: 'name', label: '供应商姓名', width: 220, type: 'text' },
  { prop: 'owner', label: '供应商负责人', width: 120, type: 'text' },
  { prop: 'phone', label: '联系电话', width: 130, type: 'text' },
  { prop: 'address', label: '地址', width: 240, type: 'text' },
  { prop: 'status', label: '合作状态', width: 100, type: 'tag' },
  { prop: 'goodsCount', label: '货品数', width: 90, type: 'num' }
]

const filters = [{ key:'status', label:'全部状态', options:['合作中','已暂停'] }]
const searchKeys = ['name', 'owner']

const rows = [
  { name:'广州雅美化妆品有限公司', owner:'陈志强', phone:'13800138001', address:'广州市白云区机场路 12 号', status:'合作中', goodsCount:46 },
  { name:'南通家纺制造厂', owner:'周敏', phone:'13900139002', address:'南通市通州区家纺城 8 号', status:'合作中', goodsCount:32 },
  { name:'深圳香氛实业', owner:'李伟', phone:'13700137003', address:'深圳市宝安区福永街道 66 号', status:'已暂停', goodsCount:18 },
  { name:'台州塑料制品', owner:'王强', phone:'13600136004', address:'台州市黄岩区北城工业区 3 号', status:'合作中', goodsCount:25 }
]
</script>
