/**
 * 全量测试用例基础设施
 * 在 cdp.mjs 之上提供：角色切换、整页重载/同文档换页、表格与弹窗读取、
 * 提示断言、权限树操作、导出文件内容抓取、用例注册与汇总。
 *
 * 注意几处真实 DOM 约定（易踩）：
 *   · 页面头部组件类名是 .page-head（不是 .ph / .page-header），按钮在 .page-head .actions 里
 *   · 详情抽屉内也有一张商品明细表，行数统计必须排除抽屉内的表
 *   · v-can 用 display:none 隐藏按钮，按钮仍在 DOM 里，读按钮必须过滤不可见
 */
import { connect } from './cdp.mjs'

export const ORIGIN = 'http://127.0.0.1:8905/index.html'
export const results = []

export const ROLES = {
  demo: { account: 'demo', name: '演示', post: '全局演示', dept: '演示' },
  sys: { account: 'sysadmin', name: '管理员', post: '系统管理员', dept: '信息部' },
  boss: { account: 'qitian', name: '齐田', post: '老板', dept: '管理层' },
  after: { account: 'zhangls', name: '张丽珊', post: '售后', dept: '售后部' },
  ops: { account: 'wangjl', name: '王佳丽', post: '运营', dept: '电商运营部' },
  fin: { account: 'genziyi', name: '耿子毅', post: '财务', dept: '财务部' },
  wh: { account: 'lilx', name: '李丽霞', post: '仓管', dept: '仓储部' }
}

/* 种子登录密码：src/stores/user.js ACCOUNTS 内为 Xy@2026 */
export const SEED_PWD = 'Xy@2026'
/* 账号管理页「重置密码」与新建账号默认使用的初始密码 */
export const ADMIN_INIT_PWD = 'Xy@2026'

export const VIS = `[...document.querySelectorAll('.el-dialog')].filter(d => d.offsetParent !== null).pop()`
/* 表格行：排除弹窗/抽屉里的内嵌表格 */
export const ROWS = `[...document.querySelectorAll('.el-table__body-wrapper .el-table__row')].filter(r => !r.closest('.el-drawer') && !r.closest('.el-overlay'))`
/* 可见抽屉（关闭后 DOM 仍在，只是不可见） */
export const DRAWER = `[...document.querySelectorAll('.el-drawer')].filter(d => d.offsetParent !== null).pop()`

export async function open() {
  const c = await connect(9223)

  const api = {
    c,
    sleep: c.sleep,

    /* ---------------- 登录态 ---------------- */
    async setUser(role) {
      const u = ROLES[role] || role
      await c.eval(`localStorage.setItem('xy_erp_user', ${JSON.stringify(JSON.stringify(u))}); true`)
    },
    async clearAll() {
      await c.eval(`['xy_erp_user','xy_erp_pwd_map','xy_erp_saved_account'].forEach(k => localStorage.removeItem(k));
        Object.keys(localStorage).filter(k => k.indexOf('xy_erp_post_perms') === 0).forEach(k => localStorage.removeItem(k)); true`)
    },
    /** 清掉（任意版本号的）职位权限快照，回到按职位推导的默认值 */
    clearPerms: () => c.eval(`Object.keys(localStorage).filter(k => k.indexOf('xy_erp_post_perms') === 0).forEach(k => localStorage.removeItem(k)); true`),
    /** 读当前权限快照（键名带版本号，取最后一个匹配键） */
    readPerms: () => c.eval(`(() => {
      const k = Object.keys(localStorage).filter(x => x.indexOf('xy_erp_post_perms') === 0).pop()
      if (!k) return {}
      try { return JSON.parse(localStorage.getItem(k) || '{}') } catch (e) { return {} }
    })()`),
    /** 整页重载进入：数据层（内存态）回到种子 */
    async navFresh(path, { keepPerms = false, keepPwd = false } = {}) {
      if (!keepPerms) await api.clearPerms()
      if (!keepPwd) await c.eval(`localStorage.removeItem('xy_erp_pwd_map'); true`)
      await c.goto(`${ORIGIN}?t=${Date.now()}#${path}`)
      await c.waitFor(`document.querySelector('.el-main, .content, .el-table, .el-tree, .login, .box')`, 12000)
      await c.sleep(700)
    },
    /** 同文档换页：保留本用例已产生的数据变更 */
    async go(path) {
      await c.eval(`location.hash = ${JSON.stringify(path)}; true`)
      await c.waitFor(`document.querySelector('.el-main, .content, .el-table, .el-tree')`, 8000)
      await c.sleep(450)
    },
    async reset(role = 'demo', path = '/aftersale/wait', opts = {}) {
      await c.eval(`localStorage.removeItem('xy_erp_pwd_map'); true`)
      await api.setUser(role)
      await api.navFresh(path, opts)
      await c.clearMsgs()
    },

    /* ---------------- 还原真实登录（走到登录页输入账号密码） ---------------- */
    async realLogout() {
      await c.eval(`(() => {
        const u = document.querySelector('.user')
        if (!u) return 'no-user'
        u.click(); return 'ok'
      })()`)
      await c.sleep(400)
      const okClick = await c.eval(`(() => {
        const it = [...document.querySelectorAll('.el-dropdown-menu__item')].find(x => (x.innerText||'').includes('退出登录'))
        if (!it) return 'no-item'
        it.click(); return 'ok'
      })()`)
      if (okClick !== 'ok') return okClick
      await c.sleep(400)
      const btn = await c.eval(`(() => {
        const b = [...document.querySelectorAll('.el-message-box__btns button')].find(x => (x.innerText||'').trim() === '退出')
        if (!b) return 'no-btn'
        b.click(); return 'ok'
      })()`)
      await c.sleep(600)
      return btn
    },
    async realLogin(account, password) {
      /* 先清掉登录态：否则访问 #/login 会被守卫直接重定向到看板，取不到输入框 */
      await c.eval(`localStorage.removeItem('xy_erp_user'); true`)
      await c.goto(`${ORIGIN}?t=${Date.now()}#/login`)
      const ok = await c.waitFor(`document.querySelectorAll('.login input').length >= 2`, 10000)
      if (!ok) return 'no-login-form'
      await c.sleep(300)
      const filled = await c.eval(`(() => {
        const inp = [...document.querySelectorAll('.login input')]
        if (inp.length < 2) return 'no-input'
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(inp[0], ${JSON.stringify(account)}); inp[0].dispatchEvent(new Event('input', { bubbles: true }))
        setter.call(inp[1], ${JSON.stringify(password)}); inp[1].dispatchEvent(new Event('input', { bubbles: true }))
        return 'ok'
      })()`)
      if (filled !== 'ok') return filled
      await c.sleep(200)
      await c.eval(`(() => {
        const b = [...document.querySelectorAll('.login button')].find(x => (x.innerText||'').replace(/\\s/g,'').includes('登录'))
        if (!b) return 'no-btn'
        b.click(); return 'ok'
      })()`)
      await c.sleep(900)
      return true
    },
    /** 同一会话内切换账号（不整页重载）：新建的账号只在内存里，重载就没了 */
    /**
     * 在同一会话内登录（不整页重载 → 保住内存态的新建职位 / 账号 / 改密）。
     * 已在登录页时直接填表；在业务页时先点退出登录。
     * 只有在页面没有退出入口、无法同会话切换时才退回整页登录（会丢内存态）。
     */
    async fillLogin(account, password) {
      const onLogin = await c.eval(`document.querySelectorAll('.login input').length >= 2`)
      if (!onLogin) {
        const out = await api.realLogout()
        if (out !== 'ok') return api.realLogin(account, password)
        await c.sleep(700)
        const ready = await c.waitFor(`document.querySelectorAll('.login input').length >= 2`, 8000)
        if (!ready) return api.realLogin(account, password)
      }
      await c.sleep(250)
      const filled = await c.eval(`(() => {
        const inp = [...document.querySelectorAll('.login input')]
        if (inp.length < 2) return 'no-input'
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(inp[0], ${JSON.stringify(account)}); inp[0].dispatchEvent(new Event('input', { bubbles: true }))
        setter.call(inp[1], ${JSON.stringify(password)}); inp[1].dispatchEvent(new Event('input', { bubbles: true }))
        return 'ok'
      })()`)
      if (filled !== 'ok') return filled
      await c.sleep(200)
      await c.eval(`(() => {
        const b = [...document.querySelectorAll('.login button')].find(x => (x.innerText||'').replace(/\\s/g,'').includes('登录'))
        if (!b) return 'no-btn'
        b.click(); return 'ok'
      })()`)
      await c.sleep(1000)
      return true
    },
    async loginViaUI(account, password) {
      return api.fillLogin(account, password)
    },

    /* ---------------- 页面读数 ---------------- */
    rows: () => c.eval(`${ROWS}.map(r => r.innerText.replace(/\\s+/g,' ').trim())`),
    rowCount: () => c.eval(`${ROWS}.length`),
    headers: () => c.eval(`[...document.querySelectorAll('.el-table__header-wrapper th .cell')].map(n => (n.innerText||'').trim()).filter(Boolean)`),
    countText: () => c.eval(`(document.querySelector('.count')?.innerText || '').replace(/\\s+/g,' ').trim()`),
    title: () => c.eval(`(document.querySelector('.page-head h1, .ph h1, .page-header h1, h1')?.innerText || '').trim()`),
    sub: () => c.eval(`(document.querySelector('.page-head .sub, .ph .sub, .page-header .sub')?.innerText || '').trim()`),
    emptyText: () => c.eval(`(document.querySelector('.el-table__empty-text')?.innerText || '').trim()`),
    /** 页头按钮文案（仅可见） */
    headBtns: () => c.eval(`[...document.querySelectorAll('.page-head .actions button, .page-head button')].filter(b => b.offsetParent !== null).map(b => (b.innerText||'').trim()).filter(Boolean)`),
    clickHeadBtn: text => c.eval(`(() => {
      const b = [...document.querySelectorAll('.page-head button')].filter(x => x.offsetParent !== null).find(x => (x.innerText||'').trim() === ${JSON.stringify(text)})
      if (!b) return 'no-btn'
      if (b.disabled) return 'disabled'
      b.click(); return 'ok'
    })()`),
    /** KPI 卡片：[{label, value}] */
    kpis: () => c.eval(`[...document.querySelectorAll('.kpi')].map(k => {
      const l = (k.querySelector('span')?.innerText || '').trim()
      const v = (k.querySelector('b')?.innerText || '').replace(/\\s+/g,'').trim()
      return { label: l, value: v, hot: k.classList.contains('hot'), ok: k.classList.contains('ok') }
    })`),
    /** 队列卡：[{label, n, on, zero, hot}] */
    queues: () => c.eval(`[...document.querySelectorAll('.queues .q')].map(q => ({
      label: (q.querySelector('span')?.innerText || '').trim(),
      n: (q.querySelector('b')?.innerText || '').trim(),
      on: q.classList.contains('on'), zero: q.classList.contains('zero'), hot: q.classList.contains('hot')
    }))`),
    clickQueue: label => c.eval(`(() => {
      const q = [...document.querySelectorAll('.queues .q')].find(x => (x.innerText||'').includes(${JSON.stringify(label)}))
      if (!q) return 'no-queue'
      q.click(); return 'ok'
    })()`),
    /** 侧边栏菜单：[{title, items:[]}] */
    menu: () => c.eval(`(() => {
      const out = []
      ;[...document.querySelectorAll('.nav > li, .nav > .el-sub-menu, .nav > .el-menu-item')].forEach(li => {
        const t = li.querySelector('.el-sub-menu__title')
        if (t) out.push({ title: (t.innerText||'').replace(/\\s+/g,' ').trim(),
          items: [...li.querySelectorAll('.el-menu-item')].map(x => (x.innerText||'').replace(/\\s+/g,' ').trim()) })
        else out.push({ title: (li.innerText||'').replace(/\\s+/g,' ').trim(), items: [] })
      })
      return out
    })()`),
    menuTitles: () => c.eval(`[...document.querySelectorAll('.nav .el-sub-menu__title, .nav > .el-menu-item')].map(n => (n.innerText||'').replace(/\\s+/g,' ').trim())`),
    badgeText: () => c.eval(`(document.querySelector('.nav .badge')?.innerText || '').trim()`),

    /* ---------------- 表格行操作 ---------------- */
    rowBy: text => c.eval(`(() => {
      const row = ${ROWS}.find(r => r.innerText.includes(${JSON.stringify(text)}))
      return row ? row.innerText.replace(/\\s+/g,' ').trim() : null
    })()`),
    rowCell: (rowText, colIndex) => c.eval(`(() => {
      const row = ${ROWS}.find(r => r.innerText.includes(${JSON.stringify(rowText)}))
      if (!row) return null
      const tds = [...row.querySelectorAll('td')]
      return tds[${colIndex}] ? tds[${colIndex}].innerText.replace(/\\s+/g,' ').trim() : null
    })()`),
    clickRowBtn: (rowText, btnText) => c.eval(`(() => {
      const row = ${ROWS}.find(r => r.innerText.includes(${JSON.stringify(rowText)}))
      if (!row) return 'no-row'
      const b = [...row.querySelectorAll('button')].filter(x => x.offsetParent !== null).find(x => (x.innerText || '').trim() === ${JSON.stringify(btnText)})
      if (!b) return 'no-btn'
      if (b.disabled) return 'disabled'
      b.click(); return 'ok'
    })()`),
    rowBtnState: (rowText, btnText) => c.eval(`(() => {
      const row = ${ROWS}.find(r => r.innerText.includes(${JSON.stringify(rowText)}))
      if (!row) return 'no-row'
      const b = [...row.querySelectorAll('button')].filter(x => x.offsetParent !== null).find(x => (x.innerText || '').trim() === ${JSON.stringify(btnText)})
      if (!b) return 'no-btn'
      return b.disabled ? 'disabled' : 'enabled'
    })()`),
    /** 行内可见按钮（v-can 隐藏的不计入） */
    rowBtns: rowText => c.eval(`(() => {
      const row = ${ROWS}.find(r => r.innerText.includes(${JSON.stringify(rowText)}))
      if (!row) return null
      return [...row.querySelectorAll('button')]
        .filter(b => b.offsetParent !== null && (b.innerText||'').trim())
        .map(b => ({ label: (b.innerText||'').trim(), disabled: b.disabled }))
    })()`),

    /* ---------------- 弹窗 ----------------
     * 字段定位：优先按 <label> 精确匹配，再退回整块包含匹配。
     * （退回是必须有兜底的，但精确优先很重要：『所属职位』的占位文案里含「姓名的拼音」，
     *   只按整块 includes 会把「姓名」定位到职位下拉上）
     */
    dlgOpen: () => c.eval(`!!(${VIS})`),
    dlgText: () => c.eval(`((${VIS})?.innerText || '').replace(/\\s+/g,' ').trim()`),
    dlgTitle: () => c.eval(`((${VIS})?.querySelector('.el-dialog__title')?.innerText || '').trim()`),
    dlgClose: () => c.eval(`(() => { const d = ${VIS}; if (!d) return 'no-dialog'; const b = [...d.querySelectorAll('.el-dialog__footer button')].find(x => (x.innerText||'').trim() === '取消'); if (!b) return 'no-btn'; b.click(); return 'ok' })()`),
    dlgField: (label, val) => c.eval(`(() => {
      const dlg = ${VIS}
      if (!dlg) return 'no-dialog'
      const fs = [...dlg.querySelectorAll('.field')]
      const f = fs.find(x => (x.querySelector('label')?.innerText || '').trim() === ${JSON.stringify(label)})
        || fs.find(x => (x.innerText || '').includes(${JSON.stringify(label)}))
      if (!f) return 'no-field'
      const input = f.querySelector('input, textarea')
      if (!input) return 'no-input'
      const proto = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, ${JSON.stringify(String(val))})
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      return 'ok'
    })()`),
    dlgFieldValue: label => c.eval(`(() => {
      const dlg = ${VIS}
      if (!dlg) return null
      const fs = [...dlg.querySelectorAll('.field')]
      const f = fs.find(x => (x.querySelector('label')?.innerText || '').trim() === ${JSON.stringify(label)})
        || fs.find(x => (x.innerText || '').includes(${JSON.stringify(label)}))
      const i = f?.querySelector('input, textarea')
      return i ? i.value : null
    })()`),
    dlgFieldDisabled: label => c.eval(`(() => {
      const dlg = ${VIS}
      if (!dlg) return 'no-dialog'
      const fs = [...dlg.querySelectorAll('.field')]
      const f = fs.find(x => (x.querySelector('label')?.innerText || '').trim() === ${JSON.stringify(label)})
        || fs.find(x => (x.innerText || '').includes(${JSON.stringify(label)}))
      const i = f?.querySelector('input')
      if (!i) return 'no-input'
      return !!(i.disabled || i.closest('.is-disabled'))
    })()`),
    /** 弹窗某个字段里的文本（如「状态」显示为 el-tag） */
    dlgFieldText: label => c.eval(`(() => {
      const dlg = ${VIS}
      if (!dlg) return null
      const fs = [...dlg.querySelectorAll('.field')]
      const f = fs.find(x => (x.querySelector('label')?.innerText || '').trim() === ${JSON.stringify(label)})
        || fs.find(x => (x.innerText || '').includes(${JSON.stringify(label)}))
      if (!f) return null
      const tag = f.querySelector('.el-tag')
      return tag ? (tag.innerText || '').trim() : (f.innerText || '').replace(/\\s+/g,' ').trim()
    })()`),

    dlgRadio: label => c.eval(`(() => {
      const dlg = ${VIS}
      if (!dlg) return 'no-dialog'
      const r = [...dlg.querySelectorAll('.el-radio')].find(x => (x.innerText || '').includes(${JSON.stringify(label)}))
      if (!r) return 'no-radio'
      if (r.classList.contains('is-disabled')) return 'disabled'
      r.click(); return 'ok'
    })()`),
    dlgRadioDisabled: label => c.eval(`(() => {
      const dlg = ${VIS}
      if (!dlg) return 'no-dialog'
      const r = [...dlg.querySelectorAll('.el-radio')].find(x => (x.innerText || '').includes(${JSON.stringify(label)}))
      if (!r) return 'no-radio'
      return r.classList.contains('is-disabled') ? 'disabled' : 'enabled'
    })()`),
    dlgRadioChecked: label => c.eval(`(() => {
      const dlg = ${VIS}
      if (!dlg) return 'no-dialog'
      const r = [...dlg.querySelectorAll('.el-radio')].find(x => (x.innerText || '').includes(${JSON.stringify(label)}))
      if (!r) return 'no-radio'
      return r.classList.contains('is-checked') ? 'checked' : 'unchecked'
    })()`),
    /** 弹窗内下拉：先点开 .field 内的 select，再点选项（带重试与包含匹配） */
    dlgPick: async (label, optionText) => {
      const openIt = () => c.eval(`(() => {
        const dlg = ${VIS}
        if (!dlg) return 'no-dialog'
        const fs = [...dlg.querySelectorAll('.field')]
        const f = fs.find(x => (x.querySelector('label')?.innerText || '').trim() === ${JSON.stringify(label)})
          || fs.find(x => (x.innerText || '').includes(${JSON.stringify(label)}))
        if (!f) return 'no-field'
        const sel = f.querySelector('.el-select')
        if (!sel) return 'no-select'
        sel.querySelector('.el-select__wrapper, .el-input__wrapper')?.click()
        return 'opened'
      })()`)
      const items = () => c.eval(`[...document.querySelectorAll('.el-select-dropdown__item')].filter(x => x.offsetParent !== null).map(x => (x.innerText||'').trim())`)
      const clickOpt = () => c.eval(`(() => {
        const list = [...document.querySelectorAll('.el-select-dropdown__item')].filter(x => x.offsetParent !== null)
        const it = list.find(x => (x.innerText||'').trim() === ${JSON.stringify(optionText)})
          || list.find(x => (x.innerText||'').includes(${JSON.stringify(optionText)}))
        if (!it) return 'no-option'
        it.click(); return 'ok'
      })()`)
      let r = await openIt()
      if (r !== 'opened') return r
      await c.sleep(350)
      let list = await items()
      if (!list.length) {
        r = await openIt()
        if (r !== 'opened') return r
        await c.sleep(450)
        list = await items()
      }
      if (!list.length) return 'no-option'
      const picked = await clickOpt()
      await c.sleep(280)
      return picked
    },
    dlgHint: () => c.eval(`((${VIS})?.querySelector('.hint')?.innerText || '').trim()`),
    dlgAlert: () => c.eval(`[...((${VIS})?.querySelectorAll('.el-alert__title') || [])].map(n => (n.innerText||'').trim()).join(' | ')`),
    dlgFooter: (text = '确定') => c.eval(`(() => {
      const dlg = ${VIS}
      if (!dlg) return 'no-dialog'
      const b = [...dlg.querySelectorAll('.el-dialog__footer button')].find(x => (x.innerText || '').trim() === ${JSON.stringify(text)})
      if (!b) return 'no-btn'
      if (b.disabled) return 'disabled'
      b.click(); return 'ok'
    })()`),
    dlgFooterState: (text = '确定') => c.eval(`(() => {
      const dlg = ${VIS}
      if (!dlg) return 'no-dialog'
      const b = [...dlg.querySelectorAll('.el-dialog__footer button')].find(x => (x.innerText || '').trim() === ${JSON.stringify(text)})
      if (!b) return 'no-btn'
      return b.disabled ? 'disabled' : 'enabled'
    })()`),
    /** 库存区文本（补发/换货） */
    dlgStock: () => c.eval(`(() => {
      const dlg = ${VIS}
      if (!dlg) return null
      const box = dlg.querySelector('.stock-box')
      if (!box) return null
      return {
        text: box.innerText.replace(/\\s+/g,' ').trim(),
        cards: [...box.querySelectorAll('.st')].map(x => ({ text: x.innerText.replace(/\\s+/g,' ').trim(), ok: x.classList.contains('ok') }))
      }
    })()`),

    /* ---------------- 筛选栏下拉（页面级，非弹窗） ---------------- */
    /** 选页面筛选栏里某个 label 的下拉；自动处理「已经打开」的状态 */
    pickSelect: async (label, optionText) => {
      const items = () => c.eval(`[...document.querySelectorAll('.el-select-dropdown__item')].filter(x => x.offsetParent !== null).map(x => (x.innerText||'').trim())`)
      const openIt = () => c.eval(`(() => {
        const f = [...document.querySelectorAll('.fld')].find(x => (x.querySelector('label')?.innerText||'').trim() === ${JSON.stringify(label)})
        if (!f) return 'no-field'
        const w = f.querySelector('.el-select__wrapper, .el-input__wrapper')
        if (!w) return 'no-select'
        w.click(); return 'opened'
      })()`)
      const clickOpt = () => c.eval(`(() => {
        const list = [...document.querySelectorAll('.el-select-dropdown__item')].filter(x => x.offsetParent !== null)
        const it = list.find(x => (x.innerText||'').trim() === ${JSON.stringify(optionText)})
          || list.find(x => (x.innerText||'').includes(${JSON.stringify(optionText)}))
        if (!it) return 'no-option'
        it.click(); return 'ok'
      })()`)
      /* 先关掉可能已打开的其它下拉 */
      if ((await items()).length) {
        await c.eval(`document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); document.body.click(); true`)
        await c.sleep(300)
      }
      let r = await openIt()
      if (r !== 'opened') return r
      await c.sleep(400)
      if (!(await items()).length) {
        r = await openIt()
        if (r !== 'opened') return r
        await c.sleep(450)
      }
      if (!(await items()).length) return 'no-option'
      const picked = await clickOpt()
      await c.sleep(380)
      return picked
    },
    /** 读页面筛选栏某下拉的当前显示文案 */
    selectText: label => c.eval(`(() => {
      const f = [...document.querySelectorAll('.fld')].find(x => (x.querySelector('label')?.innerText||'').trim() === ${JSON.stringify(label)})
      if (!f) return 'no-field'
      return (f.querySelector('.el-select__wrapper, .el-input__wrapper')?.innerText || '').trim()
    })()`),
    /** 读页面筛选栏某下拉的选项列表（会短暂打开再关闭） */
    selectOptions: async label => {
      const items = () => c.eval(`[...document.querySelectorAll('.el-select-dropdown__item')].filter(x => x.offsetParent !== null).map(x => (x.innerText||'').trim())`)
      const openIt = () => c.eval(`(() => {
        const f = [...document.querySelectorAll('.fld')].find(x => (x.querySelector('label')?.innerText||'').trim() === ${JSON.stringify(label)})
        if (!f) return 'no-field'
        const w = f.querySelector('.el-select__wrapper, .el-input__wrapper')
        if (!w) return 'no-select'
        w.click(); return 'opened'
      })()`)
      if ((await items()).length) {
        await c.eval(`document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); document.body.click(); true`)
        await c.sleep(300)
      }
      await openIt()
      await c.sleep(420)
      let list = await items()
      if (!list.length) { await openIt(); await c.sleep(420); list = await items() }
      await c.eval(`document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); document.body.click(); true`)
      await c.sleep(250)
      return list
    },
    /** 筛选栏没有 label 的页面（如账号管理）：按下拉在 .filters 里的序号选值 */
    pickSelectAt: async (idx, optionText) => {
      const items = () => c.eval(`[...document.querySelectorAll('.el-select-dropdown__item')].filter(x => x.offsetParent !== null).map(x => (x.innerText||'').trim())`)
      const openIt = () => c.eval(`(() => {
        const sels = [...document.querySelectorAll('.filters .el-select')]
        const s = sels[${idx}]
        if (!s) return 'no-select'
        s.querySelector('.el-select__wrapper, .el-input__wrapper').click(); return 'opened'
      })()`)
      const clickOpt = () => c.eval(`(() => {
        const list = [...document.querySelectorAll('.el-select-dropdown__item')].filter(x => x.offsetParent !== null)
        const it = list.find(x => (x.innerText||'').trim() === ${JSON.stringify(optionText)})
          || list.find(x => (x.innerText||'').includes(${JSON.stringify(optionText)}))
        if (!it) return 'no-option'
        it.click(); return 'ok'
      })()`)
      if ((await items()).length) {
        await c.eval(`document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); document.body.click(); true`)
        await c.sleep(300)
      }
      let r = await openIt()
      if (r !== 'opened') return r
      await c.sleep(400)
      if (!(await items()).length) { await openIt(); await c.sleep(450) }
      if (!(await items()).length) return 'no-option'
      const picked = await clickOpt()
      await c.sleep(380)
      return picked
    },
    selectOptionsAt: async idx => {
      const items = () => c.eval(`[...document.querySelectorAll('.el-select-dropdown__item')].filter(x => x.offsetParent !== null).map(x => (x.innerText||'').trim())`)
      const openIt = () => c.eval(`(() => {
        const sels = [...document.querySelectorAll('.filters .el-select')]
        const s = sels[${idx}]
        if (!s) return 'no-select'
        s.querySelector('.el-select__wrapper, .el-input__wrapper').click(); return 'opened'
      })()`)
      if ((await items()).length) {
        await c.eval(`document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); document.body.click(); true`)
        await c.sleep(300)
      }
      await openIt()
      await c.sleep(420)
      let list = await items()
      if (!list.length) { await openIt(); await c.sleep(420); list = await items() }
      await c.eval(`document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); document.body.click(); true`)
      await c.sleep(250)
      return list
    },

    /* ---------------- 抽屉 ---------------- */
    drawerOpen: () => c.eval(`!!(${DRAWER})`),
    drawerText: () => c.eval(`((${DRAWER})?.innerText || '').replace(/\\s+/g,' ').trim()`),
    drawerSteps: () => c.eval(`[...((${DRAWER})?.querySelectorAll('.steps .stp') || [])].map(s => ({
      label: (s.querySelector('.lb')?.innerText || '').trim(),
      done: s.classList.contains('done'), cur: s.classList.contains('cur'),
      rejected: s.classList.contains('rejected'), todo: s.classList.contains('todo')
    }))`),
    drawerFootBtns: () => c.eval(`[...((${DRAWER})?.querySelectorAll('.dr-foot button, .el-drawer__footer button') || [])]
      .filter(b => b.offsetParent !== null).map(b => ({ label: (b.innerText||'').trim(), disabled: b.disabled })).filter(b => b.label)`),
    drawerClose: () => c.eval(`(() => {
      const d = ${DRAWER}
      if (!d) return 'no-drawer'
      const b = [...d.querySelectorAll('.dr-foot button, .el-drawer__footer button')].find(x => (x.innerText||'').trim() === '关闭')
      if (!b) return 'no-btn'; b.click(); return 'ok'
    })()`),
    /** 打开某行详情抽屉并等动画稳定 */
    openDetail: async rowText => {
      const r = await api.clickRowBtn(rowText, '详情')
      await c.sleep(650)
      return r
    },

    /* ---------------- 提示 ---------------- */
    msgs: c.msgs,
    clearMsgs: c.clearMsgs,
    msgHas: async (kw, timeout = 4000) => {
      const t0 = Date.now()
      while (Date.now() - t0 < timeout) {
        const m = await c.msgs()
        if (m.some(x => x.includes(kw))) return true
        await c.sleep(100)
      }
      return false
    },
    msgAny: async (kws, timeout = 4000) => {
      const t0 = Date.now()
      while (Date.now() - t0 < timeout) {
        const m = await c.msgs()
        if (m.some(x => kws.some(k => x.includes(k)))) return true
        await c.sleep(100)
      }
      return false
    },
    msgText: () => c.eval(`[...document.querySelectorAll('.el-message, .el-notification')].map(n => (n.innerText||'').trim()).join(' | ')`),

    /* ---------------- MessageBox ---------------- */
    boxText: () => c.eval(`(document.querySelector('.el-message-box')?.innerText || '').replace(/\\s+/g,' ').trim()`),
    boxOpen: () => c.eval(`!!document.querySelector('.el-message-box')`),
    boxBtn: label => c.eval(`(() => {
      const b = [...document.querySelectorAll('.el-message-box__btns button')].find(x => (x.innerText||'').trim() === ${JSON.stringify(label)})
      if (!b) return 'no-btn'
      b.click(); return 'ok'
    })()`),
    boxAnyBtn: () => c.eval(`[...document.querySelectorAll('.el-message-box__btns button')].map(b => (b.innerText||'').trim())`),

    /* ---------------- 权限树 ---------------- */
    treeNode: label => c.eval(`(() => {
      const nodes = [...document.querySelectorAll('.el-tree .el-tree-node')]
      for (const n of nodes) {
        const lb = n.querySelector(':scope > .el-tree-node__content .label')
        if (lb && (lb.innerText || '').trim() === ${JSON.stringify(label)}) {
          const cb = n.querySelector(':scope > .el-tree-node__content .el-checkbox')
          return {
            text: (n.querySelector(':scope > .el-tree-node__content')?.innerText || '').replace(/\\s+/g,' ').trim(),
            checked: !!cb?.querySelector('.is-checked'),
            indeterminate: !!cb?.querySelector('.is-indeterminate')
          }
        }
      }
      return null
    })()`),
    treeToggle: label => c.eval(`(() => {
      const nodes = [...document.querySelectorAll('.el-tree .el-tree-node')]
      for (const n of nodes) {
        const lb = n.querySelector(':scope > .el-tree-node__content .label')
        if (lb && (lb.innerText || '').trim() === ${JSON.stringify(label)}) {
          const cb = n.querySelector(':scope > .el-tree-node__content .el-checkbox')
          if (!cb) return 'no-checkbox'
          cb.click(); return 'ok'
        }
      }
      return 'no-node'
    })()`),
    treePageTag: label => c.eval(`(() => {
      const nodes = [...document.querySelectorAll('.el-tree .el-tree-node')]
        .filter(n => n.querySelector(':scope > .el-tree-node__content .path'))
      for (const n of nodes) {
        const lb = n.querySelector(':scope > .el-tree-node__content .label')
        if (lb && (lb.innerText || '').trim() === ${JSON.stringify(label)}) {
          const tag = n.querySelector(':scope > .el-tree-node__content .el-tag')
          return tag ? (tag.innerText||'').trim() : 'no-tag'
        }
      }
      return 'no-node'
    })()`),
    /** 页面节点（带 .path 的那层，避免与同名模块混淆） */
    treePage: label => c.eval(`(() => {
      const n = [...document.querySelectorAll('.el-tree .el-tree-node')]
        .filter(x => x.querySelector(':scope > .el-tree-node__content .path'))
        .find(x => (x.querySelector(':scope > .el-tree-node__content .label')?.innerText || '').trim() === ${JSON.stringify(label)})
      if (!n) return null
      const cb = n.querySelector(':scope > .el-tree-node__content .el-checkbox')
      return {
        text: (n.querySelector(':scope > .el-tree-node__content')?.innerText || '').replace(/\\s+/g,' ').trim(),
        checked: !!cb?.querySelector('.is-checked'),
        indeterminate: !!cb?.querySelector('.is-indeterminate')
      }
    })()`),
    treePageBadge: label => c.eval(`(() => {
      const nodes = [...document.querySelectorAll('.el-tree .el-tree-node')]
      for (const n of nodes) {
        const lb = n.querySelector(':scope > .el-tree-node__content .label')
        if (lb && (lb.innerText || '').trim() === ${JSON.stringify(label)}) {
          const b = n.querySelector(':scope > .el-tree-node__content .badge')
          return b ? (b.innerText||'').replace(/\\s+/g,' ').trim() : 'no-badge'
        }
      }
      return 'no-node'
    })()`),
    treeReadOnlyVisible: label => c.eval(`(() => {
      const nodes = [...document.querySelectorAll('.el-tree .el-tree-node')]
      for (const n of nodes) {
        const lb = n.querySelector(':scope > .el-tree-node__content .label')
        if (lb && (lb.innerText || '').trim() === ${JSON.stringify(label)}) {
          const b = n.querySelector(':scope > .el-tree-node__content .ro')
          return b ? (b.offsetParent !== null ? 'visible' : 'hidden') : 'no-btn'
        }
      }
      return 'no-node'
    })()`),
    treeClickReadOnly: label => c.eval(`(() => {
      const nodes = [...document.querySelectorAll('.el-tree .el-tree-node')]
      for (const n of nodes) {
        const lb = n.querySelector(':scope > .el-tree-node__content .label')
        if (lb && (lb.innerText || '').trim() === ${JSON.stringify(label)}) {
          const b = n.querySelector(':scope > .el-tree-node__content .ro')
          if (!b) return 'no-btn'
          b.click(); return 'ok'
        }
      }
      return 'no-node'
    })()`),
    summary: () => c.eval(`[...document.querySelectorAll('.summary .sm')].map(s => ({
      n: (s.querySelector('.sm-n')?.innerText || '').trim(),
      label: (s.querySelector('.sm-l')?.innerText || '').replace(/\\s+/g,' ').trim()
    }))`),
    postList: () => c.eval(`[...document.querySelectorAll('.plist .pitem')].map(p => ({
      name: (p.querySelector('.pn')?.innerText || '').replace(/\\s+/g,' ').trim(),
      dept: (p.querySelector('.pd')?.innerText || '').trim(),
      count: (p.querySelector('.pc')?.innerText || '').replace(/\\s+/g,' ').trim(),
      on: p.classList.contains('on')
    }))`),
    pickPost: label => c.eval(`(() => {
      const p = [...document.querySelectorAll('.plist .pitem')].find(x => (x.querySelector('.pn')?.innerText||'').includes(${JSON.stringify(label)}))
      if (!p) return 'no-post'
      p.click(); return 'ok'
    })()`),
    /** 选中职位并等右栏渲染完成（标题里出现该职位名） */
    selectPost: async label => {
      const r = await api.pickPost(label)
      if (r !== 'ok') return r
      const t0 = Date.now()
      while (Date.now() - t0 < 6000) {
        const t = await c.eval(`(document.querySelector('.card-head h3')?.innerText || '').trim()`)
        if (t.includes(label)) { await c.sleep(250); return 'ok' }
        await c.sleep(120)
      }
      return 'timeout'
    },
    /** 权限树右栏标题（.card-head h3 里带「权限树」的那个，避开左栏「职位」） */
    permHeaderTitle: () => c.eval(`([...document.querySelectorAll('.card-head h3')].map(h => (h.innerText||'').trim()).find(t => t.includes('权限树')) || '')`),
    permPageSub: () => c.eval(`(document.querySelector('.page-head .sub')?.innerText || '').trim()`),
    /** 等页头标题包含某段文字（切页/切职位后避免读到旧 DOM） */
    waitTitle: async (kw, timeout = 6000) => {
      const t0 = Date.now()
      while (Date.now() - t0 < timeout) {
        const t = await api.title()
        if (t.includes(kw)) return true
        await c.sleep(150)
      }
      return false
    },

    /* ---------------- 导出抓取 ---------------- */
    /** 安装下载拦截：记录文件名 + Blob 文本 + 前 3 个字节（判断 BOM 用，blob.text() 会吞掉 BOM） */
    hookDownload: async () => {
      await c.eval(`(() => {
        window.__dl = { name: '', text: '', bytes: [] }
        const orig = URL.createObjectURL.bind(URL)
        URL.createObjectURL = b => {
          try {
            b.arrayBuffer().then(ab => {
              window.__dl.bytes = [...new Uint8Array(ab).slice(0, 3)]
              window.__dl.text = new TextDecoder('utf-8').decode(ab)
            })
          } catch (e) {}
          return orig(b)
        }
        const oc = HTMLAnchorElement.prototype.click
        HTMLAnchorElement.prototype.click = function () { window.__dl.name = this.download || '' }
        return true
      })()`)
    },
    getDownload: async () => {
      await c.sleep(600)
      return c.eval(`({ name: window.__dl?.name || '', text: window.__dl?.text || '', bytes: window.__dl?.bytes || [] })`)
    },
    unhookDownload: () => c.eval(`(() => { delete window.__dl; return true })()`)
  }

  return api
}

/* ---------------- 断言收集器 ---------------- */
export function checker() {
  const items = []
  const is = (cond, label) => { items.push({ ok: !!cond, label }); return !!cond }
  const eq = (actual, expect, label) => is(String(actual) === String(expect), `${label}（期望 ${expect}，实际 ${actual}）`)
  const done = () => {
    const bad = items.filter(i => !i.ok)
    return {
      pass: bad.length === 0,
      detail: bad.length ? bad.map(b => b.label).join('；') : items.map(i => i.label).slice(0, 3).join('；')
    }
  }
  return { is, eq, done, items }
}

/* ---------------- 注册与执行 ---------------- */
const registry = []
export function T(id, name, mod, fn) {
  registry.push({ id, name, mod, fn })
}
export function cases() { return registry }

export async function runAll(api, { only = null } = {}) {
  const list = registry.filter(r => !only || only.includes(r.mod))
  for (const r of list) {
    const t0 = Date.now()
    let pass = false, detail = ''
    try {
      const res = await r.fn(api)
      pass = !!res?.pass
      detail = res?.detail || ''
    } catch (e) {
      detail = '执行异常：' + String(e.message || e).split('\n')[0]
    }
    results.push({ id: r.id, name: r.name, mod: r.mod, pass, detail, ms: Date.now() - t0 })
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.name}${detail ? '  → ' + detail : ''}`)
  }
  return results
}
