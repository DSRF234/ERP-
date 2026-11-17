<template>
  <TablePage
    title="发货仓设置" sub="仓库与负责地区一一对应" card-title="发货仓地区管理" hint="当前 4 个仓、覆盖 28 个地区" note="负责地区决定订单的默认发货仓；一个地区只能归一个仓，未分配地区不做兜底。"
    :columns="columns" :rows="rows" :filters="filters" :search-keys="searchKeys"
    search-placeholder="输入关键字查找" />
</template>

<script setup>
import TablePage from '@/components/TablePage.vue'

const columns = [
  { prop: 'name', label: '发货仓', width: 140, type: 'text' },
  { prop: 'type', label: '仓储类型', width: 110, type: 'text' },
  { prop: 'city', label: '所在城市', width: 130, type: 'text' },
  { prop: 'areas', label: '负责地区', width: 320, type: 'text' },
  { prop: 'count', label: '地区数', width: 90, type: 'num' }
]

const filters = []
const searchKeys = ['name', 'areas']

const rows = [
  { name:'华东主仓', type:'自营仓', city:'苏州', areas:'江苏、浙江、上海、安徽、江西、山东、福建、湖北、湖南、河南', count:10 },
  { name:'华南仓', type:'自营仓', city:'广州', areas:'广东、广西、海南、云南、贵州', count:5 },
  { name:'平台仓1', type:'平台仓', city:'杭州', areas:'北京、天津、河北、山西、陕西、甘肃、宁夏、内蒙古', count:8 },
  { name:'平台仓2', type:'平台仓', city:'北京', areas:'辽宁、吉林、黑龙江、四川、重庆', count:5 }
]
</script>
