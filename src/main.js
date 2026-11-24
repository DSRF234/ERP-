import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './styles/theme.css'
import { vCan } from './directives/can'
import { ensurePostPerms } from './data/perm'
import { KEY } from './stores/persist'
import { useSupplierStore } from './stores/supplier'
import { usePurchaseStore } from './stores/purchase'
import { useInventoryStore } from './stores/inventory'
import { useStocktakeStore } from './stores/stocktake'
import { useMessageStore } from './stores/message'

/* 修正历史遗留的权限 id（页面改版后按钮清单变化），保证各职位权限可用 */
ensurePostPerms()

const app = createApp(App)
app.directive('can', vCan)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')

/**
 * 跨标签页同步：别的窗口改了单据/库存，这里立刻跟着变。
 * 有了它，「两个标签页同时审同一张单」时后点的那次会被状态校验拦住。
 */
const purchase = usePurchaseStore(pinia)
const stocktake = useStocktakeStore(pinia)
const stores = {
  [KEY.supplier]: useSupplierStore(pinia),
  [KEY.purchase]: purchase,
  [KEY.inventory]: useInventoryStore(pinia),
  [KEY.stocktake]: stocktake,
  [`${KEY.stocktake}_adj`]: stocktake,
  [KEY.message]: useMessageStore(pinia)
}
window.addEventListener('storage', e => {
  if (!e.key) return
  const s = stores[e.key]
  if (s) s.reload()
})
