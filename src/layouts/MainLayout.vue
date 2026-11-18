<template>
  <div class="shell">
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
          <el-menu-item index="/order/review">订单审核</el-menu-item>
          <el-menu-item index="/order/pending">待发货</el-menu-item>
          <el-menu-item index="/order/shipped">已发货</el-menu-item>
          <el-menu-item index="/order/done">已完结</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="purchase">
          <template #title><el-icon><ShoppingCart /></el-icon><span>采购管理</span></template>
          <el-menu-item index="/purchase">采购订单</el-menu-item>
          <el-menu-item index="/purchase/supplier">供应商管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="inventory">
          <template #title><el-icon><Box /></el-icon><span>库存管理</span></template>
          <el-menu-item index="/inventory/stock">库存记录</el-menu-item>
          <el-menu-item index="/inventory/stocktake">库存盘点</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="aftersale">
          <template #title><el-icon><Service /></el-icon><span>售后管理</span></template>
          <el-menu-item index="/aftersale/wait">
            售后待处理<span class="badge">3</span>
          </el-menu-item>
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
          <el-menu-item index="/system/post">职位管理</el-menu-item>
          <el-menu-item index="/system/account">账号管理</el-menu-item>
          <el-menu-item index="/system/permission">权限管理</el-menu-item>
          <el-menu-item index="/system/warehouse">发货仓设置</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>

    <div class="main">
      <header class="topbar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-if="route.meta.group">{{ route.meta.group }}</el-breadcrumb-item>
          <el-breadcrumb-item v-if="route.meta.parent">{{ route.meta.parent.title }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="right">
          <span class="time">数据更新至 {{ today }}</span>
          <el-dropdown trigger="click" @command="onCommand">
            <div class="user">
              <el-avatar :size="26" class="avatar">{{ initial }}</el-avatar>
              <span class="uname">{{ store.name }}</span>
              <span class="upost">{{ store.post }}</span>
              <el-icon class="arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>账号：{{ store.user?.account }}</el-dropdown-item>
                <el-dropdown-item disabled>部门：{{ store.user?.dept }}</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const initial = computed(() => (store.name || '星').slice(0, 1))

async function onCommand(cmd) {
  if (cmd !== 'logout') return
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      confirmButtonText: '退出', cancelButtonText: '取消', type: 'warning'
    })
    store.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  } catch (e) { /* 取消 */ }
}

const today = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`
})
</script>

<style scoped>
.shell { display: flex; height: 100vh; overflow: hidden; }
.side { width: 190px; flex: none; background: #fff; border-right: 1px solid var(--line); display: flex; flex-direction: column; }
.brand { height: 52px; display: flex; align-items: center; gap: 9px; padding: 0 16px; border-bottom: 1px solid var(--line-2); }
.logo { width: 22px; height: 22px; border: 1.5px solid var(--brand); border-radius: 5px; color: var(--brand); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.name { font-size: 13.5px; font-weight: 600; }
.nav { border-right: none; padding: 6px 0; flex: 1; overflow-y: auto; }
.nav :deep(.el-menu-item), .nav :deep(.el-sub-menu__title) { height: 38px; line-height: 38px; font-size: 13px; }
.nav :deep(.el-menu-item.is-active) { background: var(--brand-l); color: var(--brand-d); font-weight: 600; }
.badge { margin-left: 6px; background: var(--danger); color: #fff; font-size: 10.5px; border-radius: 9px; padding: 0 6px; line-height: 15px; display: inline-block; height: 15px; }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.topbar { height: 52px; flex: none; background: #fff; border-bottom: 1px solid var(--line); display: flex; align-items: center; padding: 0 20px; }
.right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.time { font-size: 12px; color: var(--ink-3); }
.user { display: flex; align-items: center; gap: 7px; cursor: pointer; padding: 3px 6px; border-radius: 5px; }
.user:hover { background: var(--fill); }
.avatar { background: var(--brand-l); color: var(--brand-d); font-size: 12px; }
.uname { font-size: 12.5px; color: var(--ink); }
.upost { font-size: 11px; color: var(--ink-3); background: var(--fill); border-radius: 3px; padding: 1px 5px; }
.arrow { font-size: 11px; color: var(--ink-3); }
.content { flex: 1; overflow-y: auto; padding: 18px 20px 40px; }
</style>
