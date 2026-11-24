import { defineStore } from 'pinia'

/**
 * 账号数据来自《erpPRD》2.6.2 账号管理
 * 初始密码统一为 Xy@2026，首次登录强制改密码（真实环境）
 * TODO: 接入后端后改为登录接口，这里仅作演示
 */
export const ACCOUNTS = [
  { account: 'demo',    password: 'Xy@2026', name: '演示',   post: '全局演示', dept: '演示' },
  { account: 'genziyi', password: 'Xy@2026', name: '耿子毅', post: '财务', dept: '财务部' },
  { account: 'wangjl',  password: 'Xy@2026', name: '王佳丽', post: '运营', dept: '电商运营部' },
  { account: 'lilx',    password: 'Xy@2026', name: '李丽霞', post: '仓管', dept: '仓储部' },
  { account: 'zhangls', password: 'Xy@2026', name: '张丽珊', post: '售后', dept: '售后部' },
  { account: 'sysadmin', password: 'Xy@2026', name: '管理员', post: '系统管理员', dept: '信息部' },
  { account: 'qitian',  password: 'Xy@2026', name: '齐田',   post: '老板', dept: '管理层', status: '启用' }
]

/**
 * 登录身份 ←→ 账号管理的桥接
 * ------------------------------------------------------------------
 * 账号管理页维护的是「人事台账」（data/system.js accounts），登录校验用的是本文件的
 * ACCOUNTS。两套数据若各自维护，会出现「新建了账号却登录不了」「台账里有的账号不存在」
 * 这类断链，因此账号页的新增 / 改名 / 改职位 / 停用 / 删除都通过下面的方法同步到登录侧。
 * 说明：仍为前端演示数据，刷新后回到种子状态（与全站其它 mock 数据一致）。
 */
export const accountBridge = {
  /** 新增登录身份；账号已存在则返回 false */
  add({ account, name, post, dept, password, status = '启用' }) {
    const acc = String(account || '').trim()
    if (!acc || ACCOUNTS.some(a => a.account === acc)) return false
    ACCOUNTS.push({ account: acc, password: password || 'Xy@2026', name, post, dept, status })
    return true
  },
  /** 按原账号更新；改名时同步账号与已改过的密码 */
  update(prevAccount, patch = {}) {
    const hit = ACCOUNTS.find(a => a.account === prevAccount)
    if (!hit) return false
    const next = String(patch.account || prevAccount).trim()
    if (next !== prevAccount && ACCOUNTS.some(a => a.account === next)) return false
    Object.assign(hit, patch, { account: next })
    return true
  },
  setStatus(account, status) {
    const hit = ACCOUNTS.find(a => a.account === account)
    if (hit) hit.status = status
  },
  remove(account) {
    const i = ACCOUNTS.findIndex(a => a.account === account)
    if (i > -1) ACCOUNTS.splice(i, 1)
  }
}

const KEY = 'xy_erp_user'
const PWD_KEY = 'xy_erp_pwd_map'

const readMap = () => {
  try { return JSON.parse(localStorage.getItem(PWD_KEY) || '{}') } catch (e) { return {} }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem(KEY) || 'null'),
    pwdMap: readMap()
  }),
  getters: {
    isLogin: s => !!s.user,
    name: s => s.user?.name || '',
    post: s => s.user?.post || ''
  },
  actions: {
    login(account, password) {
      const hit = ACCOUNTS.find(a => a.account === account.trim())
      if (!hit) throw new Error('账号不存在')
      if (hit.status === '停用') throw new Error('账号已停用，请联系系统管理员')
      const expected = this.pwdMap[hit.account] || hit.password
      if (expected !== password) throw new Error('密码错误')
      const { password: _, ...safe } = hit
      this.user = safe
      localStorage.setItem(KEY, JSON.stringify(safe))
      return safe
    },
    logout() {
      this.user = null
      localStorage.removeItem(KEY)
    },

    /** 修改当前登录账号的密码 */
    changePassword(oldPwd, newPwd) {
      const acc = this.user?.account
      if (!acc) throw new Error('未登录')
      const hit = ACCOUNTS.find(a => a.account === acc)
      const expected = this.pwdMap[acc] || hit?.password
      if (expected !== oldPwd) throw new Error('原密码不正确')
      if (newPwd === expected) throw new Error('新密码不能与原密码相同')
      this.pwdMap = { ...this.pwdMap, [acc]: newPwd }
      localStorage.setItem(PWD_KEY, JSON.stringify(this.pwdMap))
    },

    /**
     * 管理员重置密码：既要改 ACCOUNTS 里的密码，也要清掉本地「改过的密码」记录，
     * 否则 login 优先读 pwdMap，重置后旧密码依然能登录（BUG-01）。
     */
    resetPassword(account, newPwd) {
      const hit = ACCOUNTS.find(a => a.account === account)
      if (hit) hit.password = newPwd
      if (this.pwdMap && Object.prototype.hasOwnProperty.call(this.pwdMap, account)) {
        const next = { ...this.pwdMap }
        delete next[account]
        this.pwdMap = next
        localStorage.setItem(PWD_KEY, JSON.stringify(next))
      }
      return true
    }
  }
})
