<template>
  <div class="app-shell">
    <aside class="side">
      <div class="brand">
        <span class="logo">星</span>
        <span class="name">星野优选 ERP</span>
      </div>

      <el-menu :default-active="route.path" router class="nav">
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon><span>数据看板</span>
        </el-menu-item>

        <el-menu-item index="/goods">
          <el-icon><Goods /></el-icon><span>商品管理</span>
        </el-menu-item>

        <el-sub-menu index="order">
          <template #title><el-icon><Document /></el-icon><span>订单管理</span></template>
          <el-menu-item index="/order/review">订单审核</el-menu-item>
          <el-menu-item index="/order/pending">待发货</el-menu-item>
          <el-menu-item index="/order/shipped">已发货</el-menu-item>
          <el-menu-item index="/order/done">已完结</el-menu-item>
          <el-menu-item index="/order/exception">异常订单</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="purchase">
          <template #title><el-icon><ShoppingCart /></el-icon><span>采购管理</span></template>
          <el-menu-item index="/purchase">采购订单</el-menu-item>
          <el-menu-item index="/purchase/supplier">供应商管理</el-menu-item>
          <el-menu-item index="/purchase/suggest">补货建议</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="inventory">
          <template #title><el-icon><Box /></el-icon><span>库存管理</span></template>
          <el-menu-item index="/inventory/stock">库存记录</el-menu-item>
          <el-menu-item index="/inventory/stocktake">库存盘点</el-menu-item>
          <el-menu-item index="/inventory/transfer">库存调拨</el-menu-item>
          <el-menu-item index="/inventory/inbound">入库管理</el-menu-item>
          <el-menu-item index="/inventory/outbound">出库管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="aftersale">
          <template #title><el-icon><Service /></el-icon><span>售后管理</span></template>
          <el-menu-item index="/aftersale/wait">售后待处理</el-menu-item>
          <el-menu-item index="/aftersale/doing">售后处理中</el-menu-item>
          <el-menu-item index="/aftersale/done">售后处理完成</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="finance">
          <template #title><el-icon><Money /></el-icon><span>财务管理</span></template>
          <el-menu-item index="/finance/reconciliation">对账中心</el-menu-item>
          <el-menu-item index="/finance/shipment">发货数据</el-menu-item>
          <el-menu-item index="/finance/goods">商品信息</el-menu-item>
          <el-menu-item index="/finance/aging">库存积压</el-menu-item>
          <el-menu-item index="/finance/payable">应付账款台账</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="system">
          <template #title><el-icon><Setting /></el-icon><span>系统设置</span></template>
          <el-menu-item index="/system/warehouse">发货仓设置</el-menu-item>
          <el-menu-item index="/system/post">职位管理</el-menu-item>
          <el-menu-item index="/system/account">账号管理</el-menu-item>
          <el-menu-item index="/system/permission">权限管理</el-menu-item>
          <el-menu-item index="/system/api">API 对接</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>

    <div class="main">
      <header class="topbar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-if="route.meta.group">{{ route.meta.group }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
        </el-breadcrumb>

        <div class="top-right">
          <span class="updated">数据更新至 {{ today }} 24:00</span>
          <el-avatar :size="28" class="avatar">财</el-avatar>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const today = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`
})
</script>

<style scoped>
.app-shell { display: flex; height: 100vh; overflow: hidden; }

.side {
  width: 196px; flex: none; background: #fff;
  border-right: 1px solid var(--line);
  display: flex; flex-direction: column;
}
.brand {
  height: 56px; display: flex; align-items: center; gap: 9px;
  padding: 0 18px; border-bottom: 1px solid #f2f4f7;
}
.logo {
  width: 22px; height: 22px; border-radius: 6px; background: var(--blue);
  color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center;
}
.name { font-size: 14px; font-weight: 600; letter-spacing: .3px; }

.nav { border-right: none; padding: 8px 0; flex: 1; overflow-y: auto; }
.nav :deep(.el-menu-item),
.nav :deep(.el-sub-menu__title) { height: 40px; line-height: 40px; font-size: 13.5px; }
.nav :deep(.el-menu-item.is-active) { background: #ecf5ff; font-weight: 500; }

.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

.topbar {
  height: 56px; flex: none; background: #fff; border-bottom: 1px solid var(--line);
  display: flex; align-items: center; padding: 0 22px;
}
.top-right { margin-left: auto; display: flex; align-items: center; gap: 14px; }
.updated { font-size: 12px; color: var(--text3); }
.avatar { background: #dfeeff; color: var(--blue); font-size: 12px; }

.content { flex: 1; overflow-y: auto; padding: 18px 22px 40px; background: var(--bg); }

.fade-enter-active, .fade-leave-active { transition: opacity .15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
