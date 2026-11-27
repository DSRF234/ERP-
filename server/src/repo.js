import { getPool } from './db.js'

const s = v => (v === null || v === undefined ? '' : String(v))
const n = v => (Number.isFinite(Number(v)) ? Number(v) : 0)
const b = v => (v ? 1 : 0)

/* ---------------- 读取 ---------------- */

export async function loadBootstrap() {
  const pool = getPool()
  const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC, no DESC')
  const [goods] = await pool.query('SELECT * FROM order_goods ORDER BY id')
  const [purchase] = await pool.query('SELECT * FROM purchase_orders ORDER BY created_at DESC, no DESC')
  const [items] = await pool.query('SELECT * FROM purchase_items ORDER BY id')
  const [stock] = await pool.query('SELECT * FROM stock_items ORDER BY code, warehouse')
  const [aftersales] = await pool.query('SELECT * FROM aftersales ORDER BY apply_time DESC')
  const [users] = await pool.query('SELECT * FROM users ORDER BY account')

  const goodsBy = {}
  goods.forEach(g => { (goodsBy[g.order_no] ||= []).push({ name: g.name, spec: g.spec, qty: g.qty, sku: g.sku, price: g.price }) })
  const itemsBy = {}
  items.forEach(i => { (itemsBy[i.purchase_no] ||= []).push({ code: i.code, name: i.name, spec: i.spec, unit: i.unit, price: i.price, qty: i.qty }) })

  return {
    orders: orders.map(o => ({
      no: o.no, platform: o.platform, shop: o.shop, receiver: o.receiver, phone: o.phone,
      address: o.address, note: o.note, carrier: o.carrier, expressNo: o.express_no,
      outboundNo: o.outbound_no, amount: o.amount, settle: o.settle, actual: o.actual,
      warehouse: o.warehouse, payTime: o.pay_time, orderTime: o.order_time, deadline: o.deadline,
      shippedAt: o.shipped_at, doneAt: o.done_at, approvedAt: o.approved_at,
      platformGoods: o.platform_goods, status: o.status,
      afterStatus: o.after_status || undefined,
      financePushed: !!o.finance_pushed,
      goods: goodsBy[o.no] || []
    })),
    purchase: purchase.map(p => ({
      no: p.no, buyer: p.buyer, creator: p.creator, supplier: p.supplier, warehouse: p.warehouse,
      date: p.date, expressNo: p.express_no, logistics: p.logistics, category: p.category,
      freight: p.freight, amount: p.amount, status: p.status,
      approvedAt: p.approved_at, stockedAt: p.stocked_at, payableChecked: !!p.payable_checked,
      items: itemsBy[p.no] || []
    })),
    stock: stock.map(r => ({
      code: r.code, warehouse: r.warehouse, name: r.name, spec: r.spec, category: r.category,
      supplier: r.supplier, batch: r.batch, unit: r.unit,
      inNo: r.in_no, inQty: r.in_qty, outQty: r.out_qty, left: r.left_qty,
      costPrice: r.cost_price,
      warnValue: r.warn_value, warnDays: r.warn_days, warnUnit: r.warn_unit, expiry: r.expiry,
      lastRef: r.last_ref, lastRefQty: r.last_ref_qty, lastRefAt: r.last_ref_at,
      inDate: r.in_date, outNo: r.out_no, outDate: r.out_date
    })),
    aftersales: aftersales.map(t => ({
      ticket: t.ticket, orderNo: t.order_no, channel: t.channel,
      applyType: t.apply_type, type: t.type, reason: t.reason,
      applyTime: t.apply_time, sla: t.sla, logistics: t.logistics, expressNo: t.express_no,
      goods: t.goods_text, sku: t.sku, qty: t.qty,
      orderTime: t.order_time, orderAmount: t.order_amount, amount: t.amount,
      customer: { name: t.customer_name, phone: t.customer_phone, addr: t.customer_addr },
      message: t.message,
      proofs: (() => { try { return t.proofs ? JSON.parse(t.proofs) : [] } catch (e) { return [] } })(),
      newAddr: t.new_addr || '',
      status: t.status, queue: t.queue, result: t.result, duty: t.duty,
      auditRemark: t.audit_remark, auditor: t.auditor, auditTime: t.audit_time,
      who: t.who, finishedAt: t.finished_at, workOrder: t.work_order,
      refundWay: t.refund_way, addressSync: t.address_sync
    })),
    users: users.map(u => ({
      account: u.account, password: u.password, name: u.name, post: u.post, dept: u.dept,
      phone: u.phone, status: u.status, lastLogin: u.last_login
    }))
  }
}

/* ---------------- 写入（整表快照） ---------------- */

export async function saveBootstrap(payload) {
  const pool = getPool()
  const { orders = [], purchase = [], stock = [], aftersales = [], users = [] } = payload
  const conn = await pool.getConnection()
  try {
    /* 串行化整表快照：两个标签页同时保存时，后一个会等前一个提交完再删表重写，
       否则「先删后插」交错执行会把明细行写重（订单 46 单、明细 191 行那种） */
    await conn.query("SELECT GET_LOCK('erp_bootstrap_save', 15)")
    await conn.beginTransaction()

    await conn.query('DELETE FROM orders')
    await conn.query('DELETE FROM purchase_orders')
    await conn.query('DELETE FROM stock_items')
    await conn.query('DELETE FROM aftersales')

    for (const o of orders) {
      await conn.query(
        `INSERT INTO orders (no, platform, shop, receiver, phone, address, note, carrier, express_no,
          outbound_no, amount, settle, actual, warehouse, pay_time, order_time, deadline, shipped_at,
          done_at, approved_at, platform_goods, status, after_status, finance_pushed)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [s(o.no), s(o.platform), s(o.shop), s(o.receiver), s(o.phone), s(o.address), s(o.note),
         s(o.carrier), s(o.expressNo), s(o.outboundNo), n(o.amount), n(o.settle), n(o.actual),
         s(o.warehouse), s(o.payTime), s(o.orderTime), s(o.deadline), s(o.shippedAt),
         s(o.doneAt), s(o.approvedAt), s(o.platformGoods), s(o.status),
         o.afterStatus ? s(o.afterStatus) : null, b(o.financePushed)]
      )
      const totalQty = (o.goods || []).reduce((sum, g) => sum + (n(g.qty) || 1), 0) || 1
      const unitPrice = n(o.amount) / totalQty
      for (const g of (o.goods || [])) {
        await conn.query(
          'INSERT INTO order_goods (order_no, name, spec, qty, sku, price) VALUES (?,?,?,?,?,?)',
          [s(o.no), s(g.name), s(g.spec), n(g.qty) || 1, s(g.sku), Number(unitPrice.toFixed(2))]
        )
      }
    }

    for (const p of purchase) {
      await conn.query(
        `INSERT INTO purchase_orders (no, buyer, creator, supplier, warehouse, date, express_no, logistics,
          category, freight, amount, status, approved_at, stocked_at, payable_checked)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [s(p.no), s(p.buyer), s(p.creator), s(p.supplier), s(p.warehouse), s(p.date), s(p.expressNo),
         s(p.logistics), s(p.category), n(p.freight), n(p.amount), s(p.status),
         s(p.approvedAt), s(p.stockedAt), b(p.payableChecked)]
      )
      for (const i of (p.items || [])) {
        await conn.query(
          'INSERT INTO purchase_items (purchase_no, code, name, spec, unit, price, qty) VALUES (?,?,?,?,?,?,?)',
          [s(p.no), s(i.code), s(i.name), s(i.spec), s(i.unit), n(i.price), n(i.qty)]
        )
      }
    }

    for (const r of stock) {
      await conn.query(
        `INSERT INTO stock_items (code, warehouse, name, spec, category, supplier, batch, unit,
          in_no, in_qty, out_qty, left_qty, cost_price, warn_value, warn_days, warn_unit, expiry,
          last_ref, last_ref_qty, last_ref_at, in_date, out_no, out_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [s(r.code), s(r.warehouse), s(r.name), s(r.spec), s(r.category), s(r.supplier), s(r.batch),
         s(r.unit) || '件', s(r.inNo), n(r.inQty), n(r.outQty), n(r.left), n(r.costPrice), n(r.warnValue),
         n(r.warnDays), s(r.warnUnit) || '月', s(r.expiry), s(r.lastRef), n(r.lastRefQty),
         s(r.lastRefAt), s(r.inDate), s(r.outNo), s(r.outDate)]
      )
    }

    for (const t of aftersales) {
      await conn.query(
        `INSERT INTO aftersales (ticket, order_no, channel, apply_type, type, reason, apply_time, sla,
          logistics, express_no, goods_text, sku, qty, order_time, order_amount, amount,
          customer_name, customer_phone, customer_addr, message, proofs, new_addr, status, queue, result, duty,
          audit_remark, auditor, audit_time, who, finished_at, work_order, refund_way, address_sync)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [s(t.ticket), s(t.orderNo), s(t.channel), s(t.applyType), s(t.type), s(t.reason),
         s(t.applyTime), s(t.sla), s(t.logistics), s(t.expressNo), s(t.goods), s(t.sku), n(t.qty) || 1,
         s(t.orderTime), n(t.orderAmount), n(t.amount),
         s(t.customer?.name), s(t.customer?.phone), s(t.customer?.addr), s(t.message),
         JSON.stringify(Array.isArray(t.proofs) ? t.proofs : []), s(t.newAddr),
         s(t.status) || 'wait', s(t.queue), s(t.result), s(t.duty), s(t.auditRemark),
         s(t.auditor), s(t.auditTime), s(t.who), s(t.finishedAt), s(t.workOrder),
         s(t.refundWay), s(t.addressSync)]
      )
    }

    if (users.length) {
      await conn.query('DELETE FROM users')
      for (const u of users) {
        await conn.query(
          `INSERT INTO users (account, password, name, post, dept, phone, status, last_login)
           VALUES (?,?,?,?,?,?,?,?)`,
          [s(u.account), s(u.password), s(u.name), s(u.post), s(u.dept), s(u.phone),
           s(u.status) || '启用', s(u.lastLogin)]
        )
      }
    }

    /* 兜底去重：并发保存时「先删后插」仍可能残留重复明细，提交前按单据+货品收敛为一行（保留最新一条） */
    await conn.query(`DELETE a FROM order_goods a JOIN order_goods b
      ON a.order_no = b.order_no AND a.sku = b.sku AND a.id < b.id`)
    await conn.query(`DELETE a FROM purchase_items a JOIN purchase_items b
      ON a.purchase_no = b.purchase_no AND a.code = b.code AND a.id < b.id`)
    await conn.commit()
    return { orders: orders.length, purchase: purchase.length, stock: stock.length, aftersales: aftersales.length }
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    try { await conn.query("SELECT RELEASE_LOCK('erp_bootstrap_save')") } catch (e) { /* ignore */ }
    conn.release()
  }
}

/* ---------------- 统计（示范跨表查询） ---------------- */

export async function skuSummary() {
  const pool = getPool()
  const [orderSide] = await pool.query(`
    SELECT g.sku, g.name, SUM(g.qty) AS sold, COUNT(DISTINCT o.no) AS orders
    FROM order_goods g JOIN orders o ON o.no = g.order_no
    WHERE o.status IN ('shipped','done')
    GROUP BY g.sku, g.name ORDER BY sold DESC`)
  const [purchaseSide] = await pool.query(`
    SELECT i.code, i.name, SUM(i.qty) AS inbound
    FROM purchase_items i JOIN purchase_orders p ON p.no = i.purchase_no
    WHERE p.status = '已完成'
    GROUP BY i.code, i.name ORDER BY inbound DESC`)
  return { orderSide, purchaseSide }
}

export async function healthOf() {
  const pool = getPool()
  const [[row]] = await pool.query('SELECT COUNT(*) AS n FROM orders')
  return { orders: row.n }
}
