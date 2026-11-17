import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

/**
 * 路由约定
 * - meta.title  面包屑与页面标题
 * - meta.group  所属一级模块（面包屑前缀）
 * 新增页面：在对应分组下追加一条，并在 MainLayout 菜单里补一项
 */
export const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据看板', group: '' } },

      { path: 'order', name: 'Order', component: () => import('@/views/order/index.vue'),
        meta: { title: '销售订单', group: '订单管理' } },
      { path: 'order/exception', name: 'OrderException', component: () => import('@/views/order/exception.vue'),
        meta: { title: '异常订单', group: '订单管理' } },

      { path: 'inventory/inbound', name: 'Inbound', component: () => import('@/views/inventory/inbound.vue'),
        meta: { title: '入库管理', group: '仓储管理' } },
      { path: 'inventory/outbound', name: 'Outbound', component: () => import('@/views/inventory/outbound.vue'),
        meta: { title: '出库管理', group: '仓储管理' } },
      { path: 'inventory/stocktake', name: 'Stocktake', component: () => import('@/views/inventory/stocktake.vue'),
        meta: { title: '库存盘点', group: '仓储管理' } },
      { path: 'inventory/stock', name: 'Stock', component: () => import('@/views/inventory/stock.vue'),
        meta: { title: '库存查询', group: '仓储管理' } },

      { path: 'purchase', name: 'Purchase', component: () => import('@/views/purchase/index.vue'),
        meta: { title: '采购单', group: '采购管理' } },
      { path: 'purchase/suggest', name: 'PurchaseSuggest', component: () => import('@/views/purchase/suggest.vue'),
        meta: { title: '补货建议', group: '采购管理' } },
      { path: 'purchase/supplier', name: 'Supplier', component: () => import('@/views/purchase/supplier.vue'),
        meta: { title: '供应商', group: '采购管理' } },

      { path: 'aftersale', name: 'Aftersale', component: () => import('@/views/aftersale/index.vue'),
        meta: { title: '售后工单', group: '售后管理' } },

      { path: 'finance/reconciliation', name: 'Reconciliation',
        component: () => import('@/views/finance/reconciliation/index.vue'),
        meta: { title: '对账中心', group: '财务管理' } },
      { path: 'finance/bill', name: 'PlatformBill',
        component: () => import('@/views/finance/bill/index.vue'),
        meta: { title: '平台账单', group: '财务管理' } },
      { path: 'finance/profit', name: 'Profit',
        component: () => import('@/views/finance/profit/index.vue'),
        meta: { title: '成本利润', group: '财务管理' } },
      { path: 'finance/payable', name: 'Payable',
        component: () => import('@/views/finance/payable/index.vue'),
        meta: { title: '应付账款', group: '财务管理' } },

      { path: 'system/api', name: 'SystemApi', component: () => import('@/views/system/api.vue'),
        meta: { title: 'API 对接', group: '系统设置' } },
      { path: 'system/account', name: 'SystemAccount', component: () => import('@/views/system/account.vue'),
        meta: { title: '角色账号', group: '系统设置' } },
      { path: 'system/permission', name: 'SystemPermission', component: () => import('@/views/system/permission.vue'),
        meta: { title: '权限管理', group: '系统设置' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
