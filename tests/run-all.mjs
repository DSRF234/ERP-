/**
 * 全量执行入口
 *   node tests/run-all.mjs            # 跑全部
 *   node tests/run-all.mjs af         # 只跑售后
 *   node tests/run-all.mjs sys        # 只跑系统管理
 * 前置：dist 已构建；vite preview 8905；Edge 9223 调试端口
 */
import { writeFileSync } from 'node:fs'
import { open, runAll, results } from './lib.mjs'
import './cases/aftersale.mjs'
import './cases/system.mjs'

const arg = process.argv[2]
const only = arg === 'af' || arg === 'sys' ? [arg] : null
const api = await open()
const t0 = Date.now()
await runAll(api, { only })

const pass = results.filter(r => r.pass)
const fail = results.filter(r => !r.pass)
const byMod = {}
for (const r of results) {
  byMod[r.mod] = byMod[r.mod] || { total: 0, pass: 0 }
  byMod[r.mod].total++
  if (r.pass) byMod[r.mod].pass++
}

console.log('\n================ 汇总 ================')
for (const [m, v] of Object.entries(byMod)) {
  console.log(`${m === 'af' ? '售后管理' : '系统管理'}：${v.pass}/${v.total} 通过`)
}
console.log(`合计 ${results.length} 条，通过 ${pass.length}，失败 ${fail.length}，耗时 ${((Date.now() - t0) / 1000).toFixed(0)}s`)
if (fail.length) console.log('失败项：' + fail.map(f => f.id).join(', '))

writeFileSync(new URL('./report.json', import.meta.url), JSON.stringify({ at: new Date().toISOString(), results }, null, 2))
await api.c.close()
process.exit(fail.length ? 1 : 0)
