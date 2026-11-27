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
import { loadFromDb, setupAutoSave, API_BASE } from './api/db'

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

/** 后端连不上时的阻断页：按需求「直接报错」，不静默降级 */
function showDbError(err) {
  const el = document.getElementById('app')
  if (!el) return
  el.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F5F6F8;font-family:'Microsoft YaHei',sans-serif">
      <div style="max-width:560px;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:32px 36px;box-shadow:0 12px 32px -18px rgba(0,0,0,.2)">
        <div style="font-size:18px;font-weight:600;color:#B42318;margin-bottom:12px">数据库连接失败</div>
        <div style="font-size:13px;color:#475467;line-height:1.8;margin-bottom:16px">
          前端无法连接本地数据库服务，系统已停止加载。<br>
          错误信息：<code style="background:#FEF3F2;color:#B42318;padding:1px 6px;border-radius:4px">${String(err.message || err)}</code>
        </div>
        <div style="font-size:13px;color:#344054;background:#F9FAFB;border:1px solid #EAECF0;border-radius:8px;padding:14px 16px;line-height:1.9">
          <b>请先启动后端：</b><br>
          双击项目根目录的 <code>启动.bat</code>（会自动拉起数据库服务与前端）<br>
          或命令行执行 <code>cd server &amp;&amp; npm start</code><br>
          接口地址：<code>${API_BASE}</code>
        </div>
        <div style="margin-top:18px">
          <button onclick="location.reload()" style="background:#169BD5;color:#fff;border:0;border-radius:6px;padding:9px 20px;font-size:13px;cursor:pointer">重新连接</button>
        </div>
      </div>
    </div>`
}

async function boot() {
  try {
    /* 先实例化各 store（它们会读本地缓存），再由数据库覆盖，确保库是最终真源 */
    usePurchaseStore(pinia)
    useInventoryStore(pinia)
    useStocktakeStore(pinia)
    useSupplierStore(pinia)
    useMessageStore(pinia)

    const stat = await loadFromDb(pinia)
    console.info('[db] 已连接：', stat)
  } catch (e) {
    console.error('[db] 连接失败：', e)
    showDbError(e)
    return
  }

  setupAutoSave(pinia)
  await router.isReady()
  app.mount('#app')

  /**
   * 跨标签页同步：别的窗口改了单据/库存，这里立刻跟着变。
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
}

boot()
