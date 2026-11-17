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

        <el-sub-menu index="order">
          <template #title><el-icon><Document /></el-icon><span>订单管理</span></template>
          <el-menu-item index="/order">销售订单</el-menu-item>
          <el-menu-item index="/order/exception">异常订单</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="inventory">
          <template #title><el-icon><Box /></el-icon><span>仓储管理</span></template>
          <el-menu-item index="/inventory/stock">库存查询</el-menu-item>
          <el-menu-item index="/inventory/inbound">入库管理</el-menu-item>
          <el-menu-item index="/inventory/outbound">出库管理</el-menu-item>
          <el-menu-item index="/inventory/stocktake">库存盘点</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="purchase">
          <template #title><el-icon><ShoppingCart /></el-icon><span>采购管理</span></template>
          <el-menu-item index="/purchase">采购单</el-menu-item>
          <el-menu-item index="/purchase/suggest">补货建议</el-menu-item>
          <el-menu-item index="/purchase/supplier">供应商</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/aftersale">
          <el-icon><Service /></el-icon><span>售后管理</span>
        </el-menu-item>

        <el-sub-menu index="finance">
          <template #title><el-icon><Money /></el-icon><span>财务管理</span></template>
          <el-menu-item index="/finance/reconciliation">对账中心</el-menu-item>
          <el-menu-item index="/finance/bill">平台账单</el-menu-item>
          <el-menu-item index="/finance/profit">成本利润</el-menu-item>
          <el-menu-item index="/finance/payable">应付账款</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="system">
          <template #title><el-icon><Setting /></el-icon><span>系统设置</span></template>
          <el-menu-item index="/system/api">API 对接</el-menu-item>
          <el-menu-item index="/system/account">角色账号</el-menu-item>
          <el-menu-item index="/system/permission">权限管理</el-menu-item>
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
.nav :deep(.el-sub-menu__title) { height: 42px; line-height: 42px; font-size: 13.5px; }
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
