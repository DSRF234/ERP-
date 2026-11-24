/**
 * 极简 CDP 驱动（无第三方依赖）
 * 用 Node 22 内置 WebSocket 连到 Edge 的 DevTools 端口，直接驱动真实页面：
 * 跳转、点击、读取 DOM 与提示消息。
 *
 * 用法：
 *   const c = await connect(9223)
 *   await c.goto('http://127.0.0.1:8905/index.html#/aftersale/wait')
 *   await c.eval('document.title')
 */
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function listTargets(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`)
  return res.json()
}

export async function connect(port = 9223) {
  let list = []
  for (let i = 0; i < 40; i++) {
    try {
      list = await listTargets(port)
      if (list.some(t => t.type === 'page' && t.webSocketDebuggerUrl)) break
    } catch (e) { /* 端口还没起来 */ }
    await sleep(250)
  }
  const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl)
  if (!page) throw new Error('未找到可调试的页面目标')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  const pending = new Map()
  const events = []
  let id = 0

  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true })
    ws.addEventListener('error', () => rej(new Error('WebSocket 连接失败')), { once: true })
  })

  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    } else if (msg.method) {
      events.push(msg)
    }
  })

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id
    pending.set(mid, { resolve, reject })
    ws.send(JSON.stringify({ id: mid, method, params }))
  })

  await send('Page.enable')
  await send('Runtime.enable')

  const api = {
    send,
    sleep,
    async eval(expr) {
      const r = await send('Runtime.evaluate', {
        expression: expr, returnByValue: true, awaitPromise: true, userGesture: true
      })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expr.slice(0, 80))
      return r.result.value
    },
    async goto(url) {
      await send('Page.navigate', { url })
      await api.waitFor('document.readyState === "complete"', 15000)
      await sleep(600) // 等 Vue 挂载
    },
    async reload() {
      await send('Page.reload', { ignoreCache: false })
      await sleep(1200)
    },
    /** 轮询直到表达式为真 */
    async waitFor(expr, timeout = 6000, step = 120) {
      const t0 = Date.now()
      while (Date.now() - t0 < timeout) {
        try { if (await api.eval(expr)) return true } catch (e) { /* 页面切换中 */ }
        await sleep(step)
      }
      return false
    },
    /** 按可见文字点按钮：优先精确匹配，其次包含 */
    async clickText(text, { selector = 'button, .el-button, .el-menu-item, .ditem, .pitem, .pm-p, .cell', nth = 0 } = {}) {
      const ok = await api.eval(`(() => {
        const t = ${JSON.stringify(text)}
        const nodes = [...document.querySelectorAll(${JSON.stringify(selector)})]
          .filter(n => (n.innerText || '').trim() === t && n.offsetParent !== null)
        const loose = [...document.querySelectorAll(${JSON.stringify(selector)})]
          .filter(n => (n.innerText || '').includes(t) && n.offsetParent !== null)
        const hit = nodes[${nth}] || (${nth} === 0 ? loose[0] : loose[${nth}])
        if (!hit) return false
        hit.click()
        return true
      })()`)
      await sleep(320)
      return ok
    },
    /** 读取当前所有 Element Plus 提示/通知的文本 */
    async msgs() {
      return api.eval(`[...document.querySelectorAll('.el-message, .el-message__content, .el-notification__content, .el-alert__title')]
        .map(n => (n.innerText || '').trim()).filter(Boolean)`)
    },
    /** 清理页面上的提示，避免干扰下一条断言 */
    async clearMsgs() {
      await api.eval(`document.querySelectorAll('.el-message, .el-notification').forEach(n => n.remove()); true`)
    },
    async close() { try { ws.close() } catch (e) {} }
  }
  return api
}
