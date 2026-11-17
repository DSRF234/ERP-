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

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem(KEY) || 'null')
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
      if (hit.password !== password) throw new Error('密码错误')
      const { password: _, ...safe } = hit
      this.user = safe
      localStorage.setItem(KEY, JSON.stringify(safe))
      return safe
    },
    logout() {
      this.user = null
      localStorage.removeItem(KEY)
    }
  }
})
