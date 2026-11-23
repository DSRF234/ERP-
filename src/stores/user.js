import { defineStore } from 'pinia'

/**
 * 账号数据来自《erpPRD》2.6.2 账号管理
 * 初始密码统一为 Xy@2026，首次登录强制改密码（真实环境）
 * TODO: 接入后端后改为登录接口，这里仅作演示
 */
export const ACCOUNTS = [
  { account: 'genziyi', password: 'Xy@2026', name: '耿子毅', post: '财务', dept: '财务部' },
  { account: 'wangjl',  password: 'Xy@2026', name: '王佳丽', post: '运营', dept: '电商运营部' },
  { account: 'lilx',    password: 'Xy@2026', name: '李丽霞', post: '仓管', dept: '仓储部' },
  { account: 'zhangls', password: 'Xy@2026', name: '张丽珊', post: '售后', dept: '售后部' },
  { account: 'admin',   password: 'Xy@2026', name: '老板',   post: '老板', dept: '管理层' }
]

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
    }
  }
})
