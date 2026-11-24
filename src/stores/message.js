import { defineStore } from 'pinia'
import { reactive, computed, watch } from 'vue'
import { KEY, read, write, replaceAll } from './persist'

/** 站内通知：驳回采购单时发给制单人，顶栏铃铛能看到 */
export const useMessageStore = defineStore('message', () => {
  const list = reactive(read(KEY.message, []))
  watch(list, v => write(KEY.message, v), { deep: true })

  const unread = computed(() => list.filter(m => !m.read).length)

  function push({ to, title, body }) {
    const d = new Date()
    const p = n => String(n).padStart(2, '0')
    list.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      to, title, body,
      time: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`,
      read: false
    })
  }

  function markAllRead() { list.forEach(m => { m.read = true }) }
  function clear() { list.splice(0, list.length) }
  function reload() { replaceAll(list, read(KEY.message, [])) }

  return { list, unread, push, markAllRead, clear, reload }
})
