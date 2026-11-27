import express from 'express'
import cors from 'cors'
import { getPool, initSchema, DB_CONFIG } from './db.js'
import { loadBootstrap, saveBootstrap, skuSummary, healthOf } from './repo.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '12mb' }))

const wrap = fn => (req, res) => fn(req, res).catch(err => {
  console.error('[api]', err.message)
  res.status(500).json({ ok: false, msg: err.message })
})

app.get('/api/health', wrap(async (req, res) => {
  const h = await healthOf()
  res.json({ ok: true, db: DB_CONFIG.database, ...h })
}))

/** 前端启动时拉全量数据 */
app.get('/api/bootstrap', wrap(async (req, res) => {
  res.json({ ok: true, data: await loadBootstrap() })
}))

/** 前端每次变更后推全量快照（原型阶段同步策略，见 README） */
app.put('/api/bootstrap', wrap(async (req, res) => {
  const stat = await saveBootstrap(req.body || {})
  res.json({ ok: true, ...stat })
}))

/** 跨表统计示例：按 SKU 汇总订单销量与采购入库量 */
app.get('/api/stats/sku', wrap(async (req, res) => {
  res.json({ ok: true, data: await skuSummary() })
}))

const PORT = Number(process.env.PORT || 3001)

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[erp-api] http://localhost:${PORT}  库=${DB_CONFIG.database}`)
    })
  })
  .catch(err => {
    console.error('[erp-api] 启动失败：', err.message)
    process.exit(1)
  })
