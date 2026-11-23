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

/* 修正历史遗留的权限 id（页面改版后按钮清单变化），保证各职位权限可用 */
ensurePostPerms()

const app = createApp(App)
app.directive('can', vCan)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
