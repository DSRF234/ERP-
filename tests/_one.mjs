/** 单条/多条用例运行器：node tests/_one.mjs SYS-042 SYS-070 */
import { open, cases, results } from './lib.mjs'
import './cases/aftersale.mjs'
import './cases/system.mjs'

const ids = process.argv.slice(2)
const api = await open()
const list = cases().filter(c => ids.includes(c.id))
for (const r of list) {
  try {
    const res = await r.fn(api)
    results.push({ ...r, ...res })
    console.log(`${res?.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${res?.detail || ''}`)
  } catch (e) {
    console.log(`FAIL  ${r.id}  执行异常：${String(e.message || e).split('\n')[0]}`)
  }
}
process.exit(0)
