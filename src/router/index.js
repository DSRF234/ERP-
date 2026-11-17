import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

/**
 * 路由严格对应《ERP 功能架构》（Map1.pdf）
 *   数据看板 / 订单管理 / 采购管理 / 库存管理 / 售后管理 / 财务管理 / 系统设置
 *
 * 状态型页面复用同一组件，用 props 传状态：
 *   订单：/order/review|pending|shipped|done
 *   售后：/aftersale/wait|doing|done
 */
export const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据看板', group: '' } },

      { path: 'order', redirect: '/order/review' },
      { path: 'order/review', name: 'OrderReview', component: () => import('@/views/order/list.vue'),
        props: { status: 'review' }, meta: { title: '订单审核', group: '订单管理' } },
      { path: 'order/pending', name: 'OrderPending', component: () => import('@/views/order/list.vue'),
        props: { status: 'pending' }, meta: { title: '待发货', group: '订单管理' } },
      { path: 'order/shipped', name: 'OrderShipped', component: () => import('@/views/order/list.vue'),
        props: { status: 'shipped' }, meta: { title: '已发货', group: '订单管理' } },
      { path: 'order/done', name: 'OrderDone', component: () => import('@/views/order/list.vue'),
        props: { status: 'done' }, meta: { title: '已完结', group: '订单管理' } },

      { path: 'purchase', name: 'Purchase', component: () => import('@/views/purchase/order.vue'),
        meta: { title: '采购订单', group: '采购管理' } },
      { path: 'purchase/history', name: 'PurchaseHistory', component: () => import('@/views/purchase/history.vue'),
        meta: { title: '历史采购单', group: '采购管理' } },
      { path: 'purchase/supplier', name: 'Supplier', component: () => import('@/views/purchase/supplier.vue'),
        meta: { title: '供应商管理', group: '采购管理' } },

      { path: 'inventory', redirect: '/inventory/stock' },
      { path: 'inventory/stock', name: 'Stock', component: () => import('@/views/inventory/stock.vue'),
        meta: { title: '库存记录', group: '库存管理' } },
      { path: 'inventory/stocktake', name: 'Stocktake', component: () => import('@/views/inventory/stocktake.vue'),
        meta: { title: '仓库盘点', group: '库存管理' } },

      { path: 'aftersale', redirect: '/aftersale/wait' },
      { path: 'aftersale/wait', name: 'AfterWait', component: () => import('@/views/aftersale/list.vue'),
        props: { status: 'wait' }, meta: { title: '售后待处理', group: '售后管理' } },
      { path: 'aftersale/doing', name: 'AfterDoing', component: () => import('@/views/aftersale/list.vue'),
        props: { status: 'doing' }, meta: { title: '售后处理中', group: '售后管理' } },
      { path: 'aftersale/done', name: 'AfterDone', component: () => import('@/views/aftersale/list.vue'),
        props: { status: 'done' }, meta: { title: '售后处理完成', group: '售后管理' } },

      { path: 'finance', redirect: '/finance/reconciliation' },
      { path: 'finance/reconciliation', name: 'Reconciliation',
        component: () => import('@/views/finance/reconciliation.vue'),
        meta: { title: '对账中心', group: '财务管理' } },
      { path: 'finance/shipment', name: 'Shipment',
        component: () => import('@/views/finance/shipment.vue'),
        meta: { title: '发货数据', group: '财务管理' } },
      { path: 'finance/goods', name: 'GoodsProfit',
        component: () => import('@/views/finance/goods.vue'),
        meta: { title: '商品信息', group: '财务管理' } },
      { path: 'finance/aging', name: 'StockAging',
        component: () => import('@/views/finance/aging.vue'),
        meta: { title: '库存积压', group: '财务管理' } },
      { path: 'finance/payable', name: 'Payable',
        component: () => import('@/views/finance/payable.vue'),
        meta: { title: '应付账款台账', group: '财务管理' } },

      { path: 'system', redirect: '/system/post' },
      { path: 'system/post', name: 'SysPost', component: () => import('@/views/system/post.vue'),
        meta: { title: '职位管理', group: '系统设置' } },
      { path: 'system/account', name: 'SysAccount', component: () => import('@/views/system/account.vue'),
        meta: { title: '账号管理', group: '系统设置' } },
      { path: 'system/permission', name: 'SysPermission', component: () => import('@/views/system/permission.vue'),
        meta: { title: '权限管理', group: '系统设置' } },
      { path: 'system/warehouse', name: 'SysWarehouse', component: () => import('@/views/system/warehouse.vue'),
        meta: { title: '发货仓设置', group: '系统设置' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

export default createRouter({ history: createWebHashHistory(), routes })
