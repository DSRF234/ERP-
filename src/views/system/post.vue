<template>
  <TablePage
    title="职位管理" sub="职位是权限的载体，账号权限继承自职位" card-title="职位列表" hint="老板职位为系统内置，不可停用与删除" note="数据范围管能看到多少条数据，权限管能进哪个页面、能点哪个按钮，两者正交。"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'idx', label: '序号', width: 60, type: 'index' },
  { prop: 'name', label: '角色名称', width: 140, type: 'text' },
  { prop: 'dept', label: '所属部门', width: 140, type: 'text' },
  { prop: 'accounts', label: '关联账号', width: 100, type: 'num' },
  { prop: 'scope', label: '数据范围', width: 140, type: 'text' },
  { prop: 'status', label: '状态', width: 90, type: 'tag' },
  { prop: 'perm', label: '已配权限', width: 110, type: 'text' }
]

const filters = [{ key:'dept', label:'全部部门', options:['管理层','电商运营部','采购部','仓储部','售后部','财务部'] }, { key:'status', label:'全部状态', options:['启用','停用'] }]
const searchKeys = ['name']

const rows = [
  { name:'老板', dept:'管理层', accounts:1, scope:'全部数据', status:'启用', perm:'71 / 71 项' },
  { name:'运营', dept:'电商运营部', accounts:3, scope:'本部门', status:'启用', perm:'24 / 71 项' },
  { name:'采购', dept:'采购部', accounts:2, scope:'本部门', status:'启用', perm:'15 / 71 项' },
  { name:'仓管', dept:'仓储部', accounts:4, scope:'本部门', status:'启用', perm:'18 / 71 项' },
  { name:'售后', dept:'售后部', accounts:3, scope:'本部门', status:'启用', perm:'12 / 71 项' },
  { name:'财务', dept:'财务部', accounts:2, scope:'本部门', status:'停用', perm:'14 / 71 项' }
]
</script>
