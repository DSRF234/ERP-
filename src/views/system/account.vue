<template>
  <TablePage
    title="账号管理" sub="员工登录账号，权限继承自所属职位" card-title="账号列表" hint="初始密码 Xy@2026，首次登录强制修改" note="职位停用不会自动停用账号，需要在账号管理里单独停用。"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'name', label: '姓名', width: 110, type: 'text' },
  { prop: 'account', label: '登录账号', width: 130, type: 'text' },
  { prop: 'phone', label: '手机号', width: 130, type: 'text' },
  { prop: 'post', label: '所属职位', width: 130, type: 'text' },
  { prop: 'status', label: '状态', width: 90, type: 'tag' },
  { prop: 'lastLogin', label: '最近登录', width: 160, type: 'text' }
]

const filters = [{ key:'post', label:'全部职位', options:['老板','运营','采购','仓管','售后','财务'] }, { key:'status', label:'全部状态', options:['启用','停用'] }]
const searchKeys = ['name', 'account', 'phone']

const rows = [
  { name:'耿子毅', account:'genziyi', phone:'13800138001', post:'财务', status:'启用', lastLogin:'2026-11-16 18:22' },
  { name:'王佳丽', account:'wangjl', phone:'13900139002', post:'运营', status:'启用', lastLogin:'2026-11-16 09:12' },
  { name:'李丽霞', account:'lilx', phone:'13700137003', post:'仓管', status:'启用', lastLogin:'2026-11-16 08:40' },
  { name:'张丽珊', account:'zhangls', phone:'13600136004', post:'售后', status:'停用', lastLogin:'2026-10-30 16:05' }
]
</script>
