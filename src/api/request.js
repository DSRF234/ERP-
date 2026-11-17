/**
 * 统一请求入口
 * 目前后端尚未接入，api/index.js 直接返回模拟数据。
 * 后端就绪后，把各接口实现改为 request.get / request.post 即可，页面无需改动。
 */
const BASE_URL = import.meta.env.VITE_API_BASE || '/api'

export async function request(path, options = {}) {
  const res = await fetch(BASE_URL + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })
  if (!res.ok) throw new Error(`请求失败：${res.status}`)
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || '业务异常')
  return json.data
}

export const get = (path, params) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(path + qs)
}

export const post = (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) })
