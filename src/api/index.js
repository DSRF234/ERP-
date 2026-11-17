import { kpis, trend, channels, todos } from '@/mock/dashboard'
import { reconciliations } from '@/mock/finance'

const delay = (data, ms = 260) => new Promise(resolve => setTimeout(() => resolve(data), ms))

/**
 * 接口清单
 * 约定：函数名 = 业务动作，返回值 = data（已脱去 code/message 外层）
 * TODO: 后端接入后替换为 get('/dashboard/kpi') 等真实调用
 */
export const getDashboard = () =>
  delay({ kpis, trend, channels, todos })

export const getReconciliations = (params = {}) =>
  delay(
    reconciliations.filter(r => !params.status || params.status === 'all' || r.status === params.status)
  )

export const getReconciliationDetail = id =>
  delay(reconciliations.find(r => r.id === id) || null)
