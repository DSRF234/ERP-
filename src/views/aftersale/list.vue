<template>
  <div>
    <PageHeader :title="cfg.title" :sub="cfg.sub">
      <el-button v-if="status !== 'doing'" size="small" @click="exportData">导出数据</el-button>
      <el-button v-if="status === 'wait'" size="small" type="primary" @click="refresh">刷新</el-button>
    </PageHeader>

    <!-- 待处理：三个指标 -->
    <div v-if="status === 'wait'" class="kpis3">
      <div class="kpi"><span>待处理售后单</span><b>{{ list.length }}<i>单</i></b></div>
      <div class="kpi" :class="{ hot: overdue > 0 }"><span>超时未处理</span><b>{{ overdue }}<i>单</i></b></div>
      <div class="kpi"><span>今日新增</span><b>{{ todayNew }}<i>单</i></b></div>
    </div>

    <!-- 处理中：六队列看板 -->
    <div v-if="status === 'doing'" class="queues">
      <div class="q all"><b>{{ list.length }}</b><span>全部处理中</span></div>
      <div v-for="q in queueCards" :key="q.key" class="q"
        :class="{ on: activeQ === q.key, hot: q.key === 'back' && q.n > 0, zero: q.n === 0 }"
        @click="toggleQ(q.key)">
        <b>{{ q.n }}</b><span>{{ q.label }}</span>
      </div>
    </div>

    <!-- 完成页：四个指标 -->
    <div v-if="status === 'done'" class="kpis4">
      <div class="kpi"><span>今日处理完成</span><b>{{ kpiDone.today }}<i>单</i></b></div>
      <div class="kpi ok"><span>一次解决率</span><b>{{ kpiDone.once }}<i>%</i></b></div>
      <div class="kpi"><span>拒绝率</span><b>{{ kpiDone.reject }}<i>%</i></b></div>
      <div class="kpi"><span>本期退款金额</span><b>{{ kpiDone.refund }}<i>万元</i></b></div>
    </div>

    <div class="filters">
      <div class="fld">
        <label>订单号</label>
        <el-input v-model="kw" size="small" :placeholder="status === 'wait' ? '订单号 / 客户姓名' : '订单号 / 售后单号 / 客户'" style="width: 190px" clearable />
      </div>
      <div class="fld">
        <label>渠道</label>
        <el-select v-model="f.channel" size="small" style="width: 116px" placeholder="全部渠道">
          <el-option label="全部渠道" value="" />
          <el-option v-for="c in CHANNELS" :key="c" :label="c" :value="c" />
        </el-select>
      </div>
      <div class="fld">
        <label>处理方式</label>
        <el-select v-model="f.type" size="small" style="width: 128px" placeholder="全部方式">
          <el-option label="全部方式" value="" />
          <el-option v-for="t in types" :key="t" :label="t" :value="t" />
        </el-select>
      </div>
      <div v-if="status === 'wait'" class="fld">
        <label>售后申请时间</label>
        <el-date-picker v-model="f.range" type="daterange" size="small" style="width: 236px"
          value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" />
      </div>
      <div v-if="status === 'done'" class="fld">
        <label>处理人</label>
        <el-select v-model="f.who" size="small" style="width: 116px" placeholder="全部员工">
          <el-option label="全部员工" value="" />
          <el-option v-for="w in handlers" :key="w" :label="w" :value="w" />
        </el-select>
      </div>
      <div class="fbtns">
        <el-button size="small" type="primary" @click="noop">查询</el-button>
        <el-button size="small" @click="reset">重置</el-button>
      </div>
      <span class="count">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>{{ cfg.cardTitle }}</h3>
        <span class="extra">{{ cfg.hint }}</span>
      </div>
      <el-table :data="view" size="small" max-height="580">

        <!-- ===== 待处理 ===== -->
        <template v-if="status === 'wait'">
          <el-table-column prop="reason" label="售后原因" min-width="118" />
          <el-table-column label="申请售后类型" min-width="96">
            <template #default="{ row }">
              <el-tag size="small" :type="typeTag(row.applyType)" effect="plain">{{ row.applyType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="售后申请时间" min-width="100">
            <template #default="{ row }">
              <div class="ocell"><span>{{ dpart(row.applyTime)[0] }}</span><span class="sub">{{ dpart(row.applyTime)[1] }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="剩余处理时长" min-width="112">
            <template #default="{ row }"><span :class="'tl ' + sla(row.sla).type">{{ sla(row.sla).text }}</span></template>
          </el-table-column>
          <el-table-column prop="orderNo" label="下单订单编号" min-width="124">
            <template #default="{ row }"><span class="mono">{{ row.orderNo }}</span></template>
          </el-table-column>
          <el-table-column label="下单时间" min-width="100">
            <template #default="{ row }">
              <div class="ocell"><span>{{ dpart(row.orderTime)[0] }}</span><span class="sub">{{ dpart(row.orderTime)[1] }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="物流状态" min-width="88">
            <template #default="{ row }">
              <el-tag size="small" :type="lgTag(row.logistics)" effect="plain">{{ row.logistics }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="商品信息" min-width="180">
            <template #default="{ row }">
              <div class="ocell"><span>{{ row.goods }}</span><span class="sub">{{ row.sku }} · ×{{ row.qty }}</span></div>
            </template>
          </el-table-column>
        </template>

        <!-- ===== 处理中 ===== -->
        <template v-else-if="status === 'doing'">
          <el-table-column prop="ticket" label="售后单号" min-width="124">
            <template #default="{ row }"><span class="mono">{{ row.ticket }}</span></template>
          </el-table-column>
          <el-table-column prop="orderNo" label="下单订单编号" min-width="124">
            <template #default="{ row }"><span class="mono">{{ row.orderNo }}</span></template>
          </el-table-column>
          <el-table-column label="商品信息" min-width="210">
            <template #default="{ row }">
              <div class="ocell"><span>{{ row.goods }}</span><span class="sub">{{ row.sku }} · ×{{ row.qty }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="当前状态" min-width="132">
            <template #default="{ row }">
              <span class="pill" :class="'q-' + (row.queue || 'none')">{{ queueName(row.queue) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="处理方式" min-width="96">
            <template #default="{ row }">
              <el-tag size="small" :type="typeTag(row.type)" effect="plain">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="物流状态" min-width="96">
            <template #default="{ row }">
              <el-tag size="small" :type="lgTag(row.logistics)" effect="plain">{{ row.logistics }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="下单时间" min-width="100">
            <template #default="{ row }">
              <div class="ocell"><span>{{ dpart(row.orderTime)[0] }}</span><span class="sub">{{ dpart(row.orderTime)[1] }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="售后申请时间" min-width="100">
            <template #default="{ row }">
              <div class="ocell"><span>{{ dpart(row.applyTime)[0] }}</span><span class="sub">{{ dpart(row.applyTime)[1] }}</span></div>
            </template>
          </el-table-column>
        </template>

        <!-- ===== 处理完成 ===== -->
        <template v-else>
          <el-table-column prop="ticket" label="售后单号" min-width="124">
            <template #default="{ row }"><span class="mono">{{ row.ticket }}</span></template>
          </el-table-column>
          <el-table-column prop="orderNo" label="下单订单编号" min-width="124">
            <template #default="{ row }"><span class="mono">{{ row.orderNo }}</span></template>
          </el-table-column>
          <el-table-column label="商品信息" min-width="210">
            <template #default="{ row }">
              <div class="ocell"><span>{{ row.goods }}</span><span class="sub">{{ row.sku }}</span></div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="处理方式" min-width="96">
            <template #default="{ row }">
              <el-tag size="small" :type="typeTag(row.type)" effect="plain">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="售后原因" min-width="118" />
          <el-table-column prop="result" label="审核结果" min-width="84">
            <template #default="{ row }">
              <el-tag size="small" :type="row.result === '拒绝' ? 'danger' : 'success'" effect="plain">{{ row.result }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="who" label="处理人" min-width="76">
            <template #default="{ row }"><span class="sub">{{ row.who || '—' }}</span></template>
          </el-table-column>
          <el-table-column label="下单时间" min-width="100">
            <template #default="{ row }">
              <div class="ocell"><span>{{ dpart(row.orderTime)[0] }}</span><span class="sub">{{ dpart(row.orderTime)[1] }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="售后申请时间" min-width="100">
            <template #default="{ row }">
              <div class="ocell"><span>{{ dpart(row.applyTime)[0] }}</span><span class="sub">{{ dpart(row.applyTime)[1] }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="处理完成时间" min-width="108">
            <template #default="{ row }">
              <div class="ocell"><span>{{ dpart(row.finishedAt)[0] || '—' }}</span><span class="sub">{{ dpart(row.finishedAt)[1] || '' }}</span></div>
            </template>
          </el-table-column>
        </template>

        <el-table-column label="操作" :width="opWidth" fixed="right">
          <template #default="{ row }">
            <div v-if="status === 'doing'" class="ops">
              <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
              <el-tooltip v-for="a in OPS" :key="a.k" :content="opTip(row, a.k)" placement="top">
                <span class="op-wrap">
                  <el-button link size="small" :type="opOn(row, a.k) ? 'primary' : 'info'"
                    :disabled="!opOn(row, a.k)" @click="doAction(row, a.k)">{{ a.label }}</el-button>
                </span>
              </el-tooltip>
            </div>
            <div v-else class="ops">
              <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
              <el-button v-if="status === 'wait'" link type="primary" size="small" @click="openAudit(row)">审核</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ===== 审核弹窗 ===== -->
    <el-dialog v-model="auditVisible" :title="'售后审核 · ' + (cur ? cur.orderNo : '')" width="720px">
      <template v-if="cur">
        <div class="audit-hint">
          订单 <span class="mono">{{ cur.orderNo }}</span> · {{ cur.goods }} · 实付 <span class="mono">{{ money(cur.orderAmount) }}</span> ·
          客户申请 <b>{{ cur.applyType }}</b>（{{ cur.reason }}）
        </div>

        <div class="sec-t">处理方式</div>
        <div class="type-hint">漏发 / 少件选补发；错发、破损、尺码不符选换货；地址填错选更改地址</div>
        <el-radio-group v-model="form.type" class="types" @change="onTypeChange">
          <el-radio v-for="t in typeDefs" :key="t.k" :label="t.k" border>
            <div class="rt">{{ t.k }}</div>
            <div class="rs">{{ t.d }}</div>
          </el-radio>
        </el-radio-group>

        <!-- 补发 / 换货：审核前先看库存，避免同意后无货可发 -->
        <div v-if="needStock" class="stock-box">
          <div class="stock-h">
            <span class="stock-t">{{ form.type === '补发' ? '补发库存' : '换货库存' }}</span>
            <span class="stock-sum">
              需发 <b class="mono">{{ cur.qty }}</b> 件 ·
              <b v-if="shipWhs.length" class="ok-t">{{ shipWhs.length }} / {{ stockRows.length }} 个仓可发</b>
              <b v-else class="bad-t">四仓均无可用库存</b>
            </span>
          </div>
          <div class="stock-grid">
            <div v-for="w in stockRows" :key="w.name" class="st" :class="w.ok ? 'ok' : 'bad'">
              <span class="st-n">{{ w.name }}</span>
              <span class="st-s"><b class="mono">{{ w.stock }}</b> 件<i v-if="!w.ok">差 {{ cur.qty - w.stock }}</i></span>
            </div>
          </div>
          <div v-if="stockShort" class="stock-warn">
            <span>库存不足，审核同意后无法生成{{ form.type === '补发' ? '补发单' : '换货单' }}，客户会二次投诉。</span>
            <el-button link type="primary" size="small" @click="toRefundType">改为仅退款</el-button>
          </div>
          <div v-else class="stock-ok">
            建议从<b>{{ shipWhs[0].name }}</b>发货（可用 {{ shipWhs[0].stock }} 件）<template v-if="shipWhs.length > 1">，另 {{ shipWhs.length - 1 }} 个仓也可发</template>
          </div>
        </div>

        <div class="sec-t" style="margin-top:16px">审核结论</div>
        <el-radio-group v-model="form.result">
          <el-radio label="agree">同意</el-radio>
          <el-radio label="partial" :disabled="!canPartial">部分同意（调整退款金额）</el-radio>
          <el-radio label="reject">拒绝申请</el-radio>
        </el-radio-group>

        <el-row :gutter="12" style="margin-top:14px">
          <el-col :span="12">
            <div class="field"><label>责任归属</label>
              <el-select v-model="form.duty" size="small" style="width:100%">
                <el-option v-for="d in DUTIES" :key="d" :label="d" :value="d" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="12" v-if="form.type === '退货'">
            <div class="field"><label>是否要求寄回</label>
              <el-select v-model="form.back" size="small" style="width:100%">
                <el-option label="要求寄回（生成退回地址 + 退货单）" value="yes" />
                <el-option label="无需寄回（直接退款）" value="no" />
              </el-select>
            </div>
          </el-col>
        </el-row>

        <div class="field" style="margin-top:12px">
          <label>退款金额</label>
          <el-input v-model.number="form.amount" size="small" :disabled="noRefund || form.result === 'reject'" style="width:200px">
            <template #prepend>￥</template>
          </el-input>
          <span class="hint">{{ amountHint }}</span>
        </div>

        <div class="field" style="margin-top:12px">
          <label>审核备注</label>
          <el-input v-model="form.remark" type="textarea" :rows="2" size="small"
            placeholder="对客户的说明，会同步到售后沟通记录；拒绝时请写明理由" />
        </div>

        <el-alert class="tipbox" :closable="false" :title="flowHint" type="info" />
      </template>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" :disabled="stockShort && form.result !== 'reject'" @click="submitAudit">确认</el-button>
      </template>
    </el-dialog>

    <!-- ===== 确认退款 ===== -->
    <el-dialog v-model="refundVisible" title="确认退款" width="560px">
      <template v-if="cur">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单编号"><span class="mono">{{ cur.orderNo }}</span></el-descriptions-item>
          <el-descriptions-item label="客户">{{ cur.customer.name }}</el-descriptions-item>
          <el-descriptions-item label="实付金额"><span class="mono">{{ money(cur.orderAmount) }}</span></el-descriptions-item>
          <el-descriptions-item label="处理方式">{{ cur.type }}</el-descriptions-item>
        </el-descriptions>

        <div class="field" style="margin-top:14px">
          <label>退款金额</label>
          <el-input v-model.number="rf.amount" size="small" style="width:180px">
            <template #prepend>￥</template>
          </el-input>
          <span class="hint">上限 {{ money(cur.orderAmount) }}，超过需重新审核</span>
        </div>
        <div class="field" style="margin-top:12px">
          <label>退款方式</label>
          <el-radio-group v-model="rf.way" size="small">
            <el-radio label="原路退回">原路退回（推荐）</el-radio>
            <el-radio label="退至余额">退至余额</el-radio>
          </el-radio-group>
        </div>
        <div class="field" style="margin-top:12px; align-items:flex-start">
          <label style="padding-top:5px">备注</label>
          <el-input v-model="rf.remark" type="textarea" :rows="2" size="small" placeholder="选填，例如：客户要求分两笔退回" />
        </div>
        <el-alert class="tipbox" :closable="false" type="info"
          title="原路退回预计 1—3 个工作日到账；确认后单据进入「售后处理完成」，处理人记当前登录人。" />
      </template>
      <template #footer>
        <el-button @click="refundVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRefund">确认退款</el-button>
      </template>
    </el-dialog>

    <!-- ===== 创建换货单 / 补发单 ===== -->
    <el-dialog v-model="woVisible" :title="wo.kind === 'exchange' ? '创建换货单' : '创建补发单'" width="640px">
      <template v-if="cur">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="单号">{{ wo.no }}</el-descriptions-item>
          <el-descriptions-item label="订单编号"><span class="mono">{{ cur.orderNo }}</span></el-descriptions-item>
          <el-descriptions-item label="客户">{{ cur.customer.name }}</el-descriptions-item>
          <el-descriptions-item label="可选仓">{{ usableCount }} / {{ WAREHOUSE_OPTIONS.length }} 个</el-descriptions-item>
        </el-descriptions>

        <div class="sec-t" style="margin-top:16px">{{ wo.kind === 'exchange' ? '换货商品明细' : '补发商品明细' }}</div>
        <el-table :data="[cur]" size="small" border>
          <el-table-column prop="goods" label="商品" />
          <el-table-column prop="sku" label="SKU" width="120" />
          <el-table-column prop="qty" label="数量" width="70" align="right" />
          <el-table-column label="可用库存结论" width="150">
            <template #default="{ row }">
              <span :class="usableCount ? 'ok-t' : 'bad-t'">
                {{ usableCount ? `${usableCount} 个仓可发` : '四仓均不足' }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <div class="sec-t" style="margin-top:16px">发货仓库</div>
        <div class="whs">
          <div v-for="w in whOptions" :key="w.name" class="wh" :class="{ on: wo.wh === w.name, off: w.stock < cur.qty }"
            @click="pickWh(w)">
            <div class="wh-h"><b>{{ w.name }}</b><span class="sub">{{ w.desc }}</span></div>
            <div class="wh-s">
              可用 <b class="mono" :class="w.stock < cur.qty ? 'bad-t' : 'ok-t'">{{ w.stock }}</b> 件
              <span v-if="w.stock < cur.qty" class="sub"> · 不足 {{ cur.qty }}</span>
            </div>
          </div>
        </div>

        <el-alert v-if="!usableCount" class="tipbox" type="warning" :closable="false"
          title="四个仓都不够，无法直接建单" description="" />
        <div v-if="!usableCount" class="paths">
          <div class="path" @click="pathPick('purchase')">① 转采购单补货后再发</div>
          <div class="path" @click="pathPick('partial')">② 与客户协商部分补发</div>
          <div class="path" @click="pathPick('refund')">③ 改为仅退款</div>
        </div>
        <el-alert v-else class="tipbox" type="info" :closable="false"
          :title="`确认后生成${wo.kind === 'exchange' ? '换货单' : '补发单'}，待仓库出库`" />
      </template>
      <template #footer>
        <el-button @click="woVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!usableCount || !wo.wh" @click="submitWo">确认建单</el-button>
      </template>
    </el-dialog>

    <!-- ===== 详情抽屉 ===== -->
    <el-drawer v-model="detailVisible" size="680px">
      <template #header>
        <div v-if="cur" class="dr-h">
          <b>售后单详情</b>
          <el-tag size="small" :type="typeTag(cur.type)" effect="plain" style="margin-left:8px">{{ cur.type }}</el-tag>
          <span class="mono sub" style="margin-left:auto">{{ cur.ticket }}</span>
        </div>
      </template>
      <template v-if="cur">
        <!-- 进度条 -->
        <template v-if="status !== 'wait'">
          <div class="sec-t">处理进度</div>
          <div class="steps">
            <div v-for="(s, i) in pg.steps" :key="i" class="stp"
              :class="{ done: i < pg.idx, cur: i === pg.idx && !pg.rejected, rejected: pg.rejected && i === pg.idx, todo: i > pg.idx }">
              <div class="line" v-if="i > 0"></div>
              <div class="dot"><i v-if="i < pg.idx">✓</i></div>
              <div class="lb">{{ s }}</div>
            </div>
          </div>
          <div v-if="cur.queue === 'qc'" class="qc-tip">
            退回件已入仓（{{ cur.customer.addr }} 附近仓），等待仓储部质检。质检由 WMS 执行，结果回传后自动进入「待退款」；
            当前退款、换货、补货按钮均锁定。
          </div>
          <div v-else-if="status === 'doing'" class="qc-tip">仓储部尚未回传质检结论，退款、换货、补货动作暂不可用。</div>
        </template>

        <div class="sec-t" style="margin-top:16px">售后申请信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单编号"><span class="mono">{{ cur.orderNo }}</span></el-descriptions-item>
          <el-descriptions-item label="申请售后类型">{{ cur.applyType }}</el-descriptions-item>
          <el-descriptions-item label="处理方式">
            <el-tag size="small" :type="typeTag(cur.type)" effect="plain">{{ cur.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="售后原因">{{ cur.reason }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ cur.orderTime }}</el-descriptions-item>
          <el-descriptions-item label="售后申请时间">{{ cur.applyTime }}</el-descriptions-item>
          <el-descriptions-item label="订单金额"><span class="mono">{{ money(cur.orderAmount) }}</span></el-descriptions-item>
          <el-descriptions-item label="客户">{{ cur.customer.name }} · {{ cur.customer.phone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            {{ cur.customer.addr }} <span class="sub">已加密，仅客服可解密查看</span>
          </el-descriptions-item>
          <el-descriptions-item label="客户留言" :span="2">{{ cur.message || '—' }}</el-descriptions-item>
        </el-descriptions>

        <div class="sub-label">售后凭证（jpg / mp4）</div>
        <div class="thumbs">
          <div v-for="(p, i) in cur.proofs" :key="i" class="thumb">
            <b>{{ /\.mp4$/i.test(p) ? '▷' : '▣' }}</b>{{ p }}
          </div>
          <div v-if="!cur.proofs.length" class="sub">客户未上传凭证</div>
        </div>

        <div class="sec-t" style="margin-top:18px">商品明细</div>
        <el-table :data="[{ g: cur.goods, sku: cur.sku, qty: cur.qty, price: cur.orderAmount }]" size="small" border>
          <el-table-column prop="g" label="商品" />
          <el-table-column prop="sku" label="SKU" width="130" />
          <el-table-column prop="qty" label="下单数量" width="90" align="right" />
          <el-table-column label="单价" width="110" align="right">
            <template #default="{ row }"><span class="mono">{{ money(row.price) }}</span></template>
          </el-table-column>
        </el-table>

        <!-- 处理结果（完成页 / 处理中已审核） -->
        <template v-if="status === 'done'">
          <div class="sec-t" style="margin-top:18px">处理结果</div>
          <el-descriptions v-if="cur.type === '更改地址'" :column="2" border size="small">
            <el-descriptions-item label="审核结果">
              <el-tag size="small" :type="cur.result === '拒绝' ? 'danger' : 'success'" effect="plain">{{ cur.result }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="地址同步结果">{{ cur.addressSync || '未变更' }}</el-descriptions-item>
            <el-descriptions-item label="同步时间">{{ cur.syncTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="关联工单">—</el-descriptions-item>
            <el-descriptions-item label="审核意见" :span="2">{{ cur.auditRemark || '—' }}</el-descriptions-item>
            <el-descriptions-item label="处理人">{{ cur.who || '—' }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ cur.finishedAt || '—' }}</el-descriptions-item>
          </el-descriptions>
          <el-descriptions v-else :column="2" border size="small">
            <el-descriptions-item label="审核结果">
              <el-tag size="small" :type="cur.result === '拒绝' ? 'danger' : 'success'" effect="plain">{{ cur.result }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="退款金额">
              <span v-if="cur.amount > 0" class="mono">{{ money(cur.amount) }}</span>
              <span v-else class="sub">—</span>
            </el-descriptions-item>
            <el-descriptions-item label="退款方式">{{ cur.refundWay || '—' }}</el-descriptions-item>
            <el-descriptions-item label="对应衍生单号">
              {{ cur.workOrder && cur.workOrder.startsWith('TH') ? cur.workOrder : '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="关联工单">
              <span v-if="cur.workOrder && !cur.workOrder.startsWith('TH')" class="mono">
                {{ cur.workOrder.startsWith('HH') ? '换货单 ' : '补发单 ' }}{{ cur.workOrder }}
              </span>
              <span v-else class="sub">—</span>
            </el-descriptions-item>
            <el-descriptions-item label="审核意见">{{ cur.auditRemark || '—' }}</el-descriptions-item>
            <el-descriptions-item label="处理人">{{ cur.who || '—' }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ cur.finishedAt || '—' }}</el-descriptions-item>
          </el-descriptions>
        </template>

        <div class="sec-t" style="margin-top:18px">物流信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="当前状态">
            <el-tag size="small" :type="lgTag(cur.logistics)" effect="plain">{{ cur.logistics }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="物流单号"><span class="mono">{{ cur.expressNo || '—' }}</span></el-descriptions-item>
          <el-descriptions-item label="承运商">
            {{ companyOf(cur.expressNo) }} <span class="sub">官网轨迹，30 分钟同步一次</span>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ trackData.updated }}</el-descriptions-item>
        </el-descriptions>

        <div class="logi">
          <div class="logi-head">
            <span class="sub">物流轨迹 · 共 {{ trackData.events.length }} 条</span>
            <span class="sub mono cp-no">{{ companyOf(cur.expressNo) }} {{ cur.expressNo }}</span>
            <el-button link type="primary" size="small" class="cp" @click="copyNo">复制单号</el-button>
          </div>
          <div class="logi-route">
            <span class="rp">{{ trackData.from }}</span>
            <span class="arw">→</span>
            <span class="rp">{{ trackData.to }}</span>
          </div>
          <el-timeline class="logi-tl">
            <el-timeline-item v-for="(e, i) in trackData.eventsDesc" :key="i" :timestamp="e.time" placement="top"
              :color="i === 0 ? (e.state === '已签收' ? '#1E8E5A' : '#169BD5') : '#D5DAE0'" :hollow="i !== 0">
              <div class="ev" :class="[i === 0 ? 'hot' : '', e.state === '已签收' ? 'sign' : '']">
                <div class="ev-h">
                  <b>{{ e.state }}</b>
                  <span class="ev-p">{{ e.place }}</span>
                  <span v-if="i === 0" class="ev-now">最新</span>
                </div>
                <div class="ev-d">{{ e.desc }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <div class="lg-foot">轨迹数据来自承运商官网，30 分钟自动同步一次（演示数据）</div>
        </div>
      </template>

      <template #footer>
        <div class="dr-foot">
          <span v-if="status === 'doing' && cur" class="dr-sum">
            当前队列 <b>{{ queueName(cur.queue) }}</b>
            <template v-if="cur.amount > 0"> · 待退 <b class="mono">{{ money(cur.amount) }}</b></template>
          </span>
          <el-button size="small" @click="detailVisible = false">关闭</el-button>
          <el-button v-if="status === 'doing'" size="small" type="primary" :disabled="cur?.queue !== 'refund'"
            :title="cur?.queue !== 'refund' ? '仅「待退款」队列可发起退款' : ''" @click="startRefund">退款</el-button>
          <el-button v-if="status === 'done'" size="small" type="primary" @click="copyInfo">复制信息</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { money } from '@/utils/format'
import { useUserStore } from '@/stores/user'
import {
  tickets, STEPS, QUEUE_TEXT, QUEUE_ORDER, progressOf,
  companyOf, trackOf, auditTicket, confirmRefund, createWorkOrder, workOrderNo,
  stockOf, WAREHOUSE_OPTIONS, todayStr
} from '@/data/aftersale'

const props = defineProps({ status: { type: String, default: 'wait' } })
const store = useUserStore()
const who = computed(() => store.name || '张丽珊')

const CONFIG = {
  wait: {
    title: '售后待处理',
    sub: '客户已提交、客服尚未给出审核结论的售后单。超时未处理会在列表标红，处理时限由参数规则中的 SLA 决定。',
    cardTitle: '待处理售后单', hint: '超时单据标红，左侧菜单显示待处理角标'
  },
  doing: {
    title: '售后处理中',
    sub: '审核已通过、尚未完结的售后单。按 6 个处理节点分队列：待客户退回 → 退回在途 → 已收货待质检 → 待退款 / 换货待发货 / 待补发。质检由仓储部在 WMS 执行，售后端不设质检操作。',
    cardTitle: '处理中售后单', hint: '队列计数之和等于全部处理中'
  },
  done: {
    title: '售后处理完成',
    sub: '已给出终态（同意或拒绝）的售后单，用于复盘与对账；换货 / 补发 / 退货单号与审核意见在该页可追溯。',
    cardTitle: '已完成售后单', hint: '终态只读，可复制信息与导出'
  }
}
const cfg = computed(() => CONFIG[props.status])

const CHANNELS = ['天猫', '京东', '抖音', '小程序']
const types = ['退货', '仅退款', '部分仅退款', '换货', '补发', '补差价', '更改地址']
const DUTIES = ['物流破损', '仓库错发', '商品质量', '客户原因', '价格原因', '其他']
const typeDefs = [
  { k: '退货', d: '寄回后退款' },
  { k: '仅退款', d: '无需寄回' },
  { k: '部分仅退款', d: '部分金额' },
  { k: '换货', d: '错发 / 破损' },
  { k: '补发', d: '漏发 / 少件' },
  { k: '补差价', d: '不退不换退差额' },
  { k: '更改地址', d: '仅改收货地址' }
]

const list = computed(() => tickets.filter(t => t.status === props.status))

/* 待处理指标 */
const overdue = computed(() => list.value.filter(t => new Date(t.sla.replace(/-/g, '/')) < new Date()).length)
const todayNew = computed(() => list.value.filter(t => String(t.applyTime).startsWith(todayStr())).length)

/* 处理中队列看板 */
const activeQ = ref('')
const queueCards = computed(() => QUEUE_ORDER.map(k => ({
  key: k, label: QUEUE_TEXT[k], n: list.value.filter(t => t.queue === k).length
})))
const toggleQ = k => { activeQ.value = activeQ.value === k ? '' : k }

/* 完成页指标 */
const kpiDone = computed(() => {
  const arr = list.value
  const today = arr.filter(t => String(t.finishedAt).startsWith(todayStr())).length
  const reject = arr.filter(t => t.result === '拒绝').length
  const repeat = arr.filter(t => t.repeat).length
  const sum = arr.reduce((n, t) => n + (Number(t.amount) || 0), 0)
  const pct = (a, b) => b ? (a / b * 100).toFixed(1) : '0.0'
  return {
    today,
    once: pct(arr.length - repeat, arr.length),
    reject: pct(reject, arr.length),
    refund: (sum / 10000).toFixed(1)
  }
})
const handlers = computed(() => [...new Set(list.value.map(t => t.who).filter(Boolean))])

/* 筛选 */
const kw = ref('')
const f = reactive({ channel: '', type: '', range: [], who: '' })
const view = computed(() => list.value.filter(t => {
  const k = kw.value.trim()
  const okKw = !k || [t.ticket, t.orderNo, t.customer.name].some(v => String(v).includes(k))
  const okC = !f.channel || t.channel === f.channel
  const okT = !f.type || t.type === f.type
  const okQ = props.status !== 'doing' || !activeQ.value || t.queue === activeQ.value
  const okW = !f.who || t.who === f.who
  const okD = !(f.range && f.range.length === 2) || (() => {
    const d = String(t.applyTime).slice(0, 10)
    return d >= f.range[0] && d <= f.range[1]
  })()
  return okKw && okC && okT && okQ && okW && okD
}))
watch(() => props.status, () => { activeQ.value = ''; reset() })

const reset = () => { kw.value = ''; f.channel = ''; f.type = ''; f.range = []; f.who = ''; activeQ.value = '' }
const noop = () => {}
const dpart = v => String(v || '').split(' ')
const queueName = k => QUEUE_TEXT[k] || '—'
const typeTag = t => ({
  退货: 'primary', 仅退款: 'info', 部分仅退款: 'info', 换货: 'primary',
  补发: 'warning', 补差价: 'success', 更改地址: 'success', 退货退款: 'primary'
}[t] || 'info')
const lgTag = v => ({
  已签收: 'success', 运输中: 'primary', 派送中: 'warning', 待签收: 'info',
  退回在途: 'warning', 快递拦截: 'danger', 退回已到仓: 'success'
}[v] || 'info')

/* 剩余处理时长：小时向下取整，负值显示已超时 */
function sla(v) {
  if (!v) return { text: '—', type: 'info' }
  const diff = new Date(String(v).replace(/-/g, '/')).getTime() - Date.now()
  const h = Math.floor(Math.abs(diff) / 3600000)
  const txt = h >= 24 ? `${Math.floor(h / 24)}天${h % 24}h` : `${h}h`
  if (diff < 0) return { text: `已超时 ${txt}`, type: 'danger' }
  return { text: `剩余 ${txt}`, type: h <= 8 ? 'warning' : 'info' }
}

/* 操作列与队列强绑定 */
const OPS = [{ k: 'refund', label: '退款' }, { k: 'exchange', label: '换货' }, { k: 'resend', label: '补货' }]
const OP_UNLOCK = {
  back: [], transit: [], qc: [],
  refund: ['refund'],
  exchange: ['exchange'],
  resend: ['resend']
}
const OP_WHY = {
  back: '待客户寄回，收到货并完成质检后才能操作',
  transit: '退回件在途，签收入仓后才能操作',
  qc: '已收货待质检，需等 WMS 回传质检结论'
}
const OP_DO = { refund: '按审核确认金额原路退回', exchange: '生成换货单，待仓库换新发货', resend: '生成补发单，待仓库补发出库' }

/* 动作互斥：一张单只允许它处理方式对应的那一个动作，其余一律置灰 */
const TYPE_ACTION = {
  退货: 'refund', 仅退款: 'refund', 部分仅退款: 'refund', 补差价: 'refund',
  换货: 'exchange', 补发: 'resend'
}
const ACTION_TEXT = { refund: '退款', exchange: '换货', resend: '补发' }
const actionOf = row => TYPE_ACTION[row.type] || ''
const opOn = (row, k) => actionOf(row) === k && (OP_UNLOCK[row.queue] || []).includes(k)
const opTip = (row, k) => {
  if (opOn(row, k)) return OP_DO[k]
  const a = actionOf(row)
  if (a !== k) {
    return a
      ? `该单处理方式为「${row.type}」，只支持${ACTION_TEXT[a]}`
      : '该单为更改地址，不涉及退款／换货／补发'
  }
  return OP_WHY[row.queue] || '当前环节不支持该操作'
}
const opWidth = computed(() => props.status === 'wait' ? 108 : props.status === 'doing' ? 176 : 76)

/* ---------------- 审核 ---------------- */
const auditVisible = ref(false)
const detailVisible = ref(false)
const cur = ref(null)
const form = reactive({ type: '退货', result: 'agree', duty: '商品质量', back: 'yes', amount: 0, remark: '' })

const noRefund = computed(() => ['换货', '补发', '更改地址'].includes(form.type))

/* 补发 / 换货要先过库存：四仓可用量都小于申请数量时不允许同意 */
const needStock = computed(() => ['补发', '换货'].includes(form.type))
const stockRows = computed(() => {
  const t = cur.value
  if (!t) return []
  return WAREHOUSE_OPTIONS.map(w => {
    const stock = stockOf(t.sku, w.name)
    return { name: w.name, desc: w.desc, stock, ok: stock >= t.qty }
  })
})
const shipWhs = computed(() => stockRows.value.filter(w => w.ok))
const stockShort = computed(() => needStock.value && shipWhs.value.length === 0)
function toRefundType() {
  form.type = '仅退款'
  form.amount = cur.value?.orderAmount || 0
  if (form.result === 'partial') form.result = 'agree'
}
const canPartial = computed(() => !['换货', '补发', '更改地址'].includes(form.type))
const amountHint = computed(() => {
  if (form.result === 'reject') return '拒绝申请不涉及退款，金额记 0'
  if (noRefund.value) return '当前处理方式不涉及退款，固定 0 且不可修改'
  if (form.type === '补差价') return `填写应退差价，上限 ${money(cur.value?.orderAmount || 0)}，审核通过即原路退回`
  return `可退上限 ${money(cur.value?.orderAmount || 0)}，审核通过即原路退回`
})
const flowHint = computed(() => {
  if (form.result === 'reject') return '提交后：拒绝 → 直接进入「售后处理完成」，不进入处理中；退款金额记 0。'
  if (form.type === '更改地址') return '提交后：同意 → 订单收货地址直接更新为新地址，单据直接完结，不进入处理中。'
  if (form.type === '退货') return form.back === 'yes'
    ? '提交后：同意 → 进入「待客户退回」，同时生成退回地址与 TH 退货单；收货、质检由仓储部完成。'
    : '提交后：同意 → 无需寄回，进入「待退款」，可直接确认退款。'
  if (form.type === '换货') {
    if (stockShort.value) return '四仓均无可用库存：同意后无法生成换货单，建议改为「仅退款」，或先转采购补货后再审核。'
    return `提交后：同意 → 进入「换货待发货」，需创建换货单（HH），建议从${shipWhs.value[0].name}换新（可用 ${shipWhs.value[0].stock} 件）。`
  }
  if (['仅退款', '部分仅退款', '补差价'].includes(form.type)) {
    return '提交后：同意 → 按退款金额原路退回并直接进入「售后处理完成」，不进入售后处理中；拒绝 → 同样直接完结。'
  }
  if (form.type === '补发') {
    if (stockShort.value) return '四仓均无可用库存：同意后无法生成补发单，建议改为「仅退款」，或先转采购补货后再审核。'
    return `提交后：同意 → 进入「待补发」，需创建补发单（BF），建议从${shipWhs.value[0].name}补发（可用 ${shipWhs.value[0].stock} 件）。`
  }
  return '提交后：同意 → 进入「待退款」，可直接确认退款。'
})

function openAudit(row) {
  cur.value = row
  form.type = row.applyType === '退货退款' ? '退货' : (types.includes(row.applyType) ? row.applyType : '退货')
  form.result = 'agree'
  form.duty = '商品质量'
  form.back = 'yes'
  form.amount = noRefund.value ? 0 : row.orderAmount
  form.remark = ''
  auditVisible.value = true
}
function onTypeChange() {
  form.amount = noRefund.value ? 0 : (cur.value?.orderAmount || 0)
  if (!canPartial.value && form.result === 'partial') form.result = 'agree'
}

function submitAudit() {
  if (stockShort.value && form.result !== 'reject') {
    return ElMessage.error('四仓均无可用库存，不能同意补发／换货：请改为仅退款，或先转采购补货后再审核')
  }
  if (form.result !== 'reject' && !noRefund.value) {
    if (!(form.amount > 0)) return ElMessage.error('退款金额必须大于 0')
    if (form.amount > cur.value.orderAmount) return ElMessage.error('退款金额不能超过实付金额')
  }
  const to = auditTicket(cur.value, { ...form, result: form.result }, who.value)
  auditVisible.value = false
  const msg = {
    rejected: '已拒绝，单据进入「售后处理完成」',
    address: '审核通过，收货地址已同步至订单，单据已完结',
    refunded: `审核通过，已按 ${money(cur.value.amount)} 原路退款，单据已完结（未进入处理中）`
  }[to] || `审核通过，单据已进入「${QUEUE_TEXT[to]}」队列`
  ElMessage.success(msg)
}

function openDetail(row) { cur.value = row; detailVisible.value = true }

/* 进度 */
const pg = computed(() => cur.value ? progressOf(cur.value) : { steps: STEPS, idx: 0 })

/* 物流 */
const trackData = computed(() => {
  if (!cur.value) return { events: [], eventsDesc: [], from: '—', to: '—', updated: '—' }
  const t = trackOf(cur.value)
  return {
    ...t,
    eventsDesc: [...t.events].reverse().map(([time, state, place, desc]) => ({ time, state, place, desc }))
  }
})

function copyNo() {
  const no = cur.value?.expressNo || ''
  copyText(no, `物流单号 ${no} 已复制`)
}
function copyInfo() {
  const t = cur.value
  if (!t) return
  const txt = [
    `售后单号：${t.ticket}`,
    `订单编号：${t.orderNo}`,
    `客户：${t.customer.name}（${t.customer.phone}）`,
    `商品：${t.goods} / ${t.sku}`,
    `处理方式：${t.type}`,
    `审核结果：${t.result}`,
    `退款金额：${t.amount > 0 ? money(t.amount) : '—'}`,
    `退款方式：${t.refundWay || '—'}`,
    `关联工单：${t.workOrder || '—'}`,
    `审核意见：${t.auditRemark || '—'}`,
    `处理人：${t.who || '—'}`,
    `完成时间：${t.finishedAt || '—'}`
  ].join('\n')
  copyText(txt, '整单关键信息已复制，可直接回复客户')
}
function copyText(text, okMsg) {
  const done = () => ElMessage.success(okMsg)
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done))
  } else fallbackCopy(text, done)
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
  done()
}

/* ---------------- 退款 ---------------- */
const refundVisible = ref(false)
const rf = reactive({ amount: 0, way: '原路退回', remark: '' })
function startRefund() {
  if (cur.value?.queue !== 'refund') return
  rf.amount = cur.value.amount || cur.value.orderAmount
  rf.way = '原路退回'
  rf.remark = ''
  refundVisible.value = true
}
function submitRefund() {
  const t = cur.value
  if (!(rf.amount > 0)) return ElMessage.error('退款金额必须大于 0')
  if (rf.amount > t.orderAmount) return ElMessage.error('退款金额不能超过实付金额')
  confirmRefund(t, { ...rf }, who.value)
  refundVisible.value = false
  detailVisible.value = false
  ElMessage.success(`退款 ${money(rf.amount)} 已提交（${rf.way}），预计 1—3 个工作日到账`)
}

/* ---------------- 换货单 / 补发单 ---------------- */
const woVisible = ref(false)
const wo = reactive({ kind: 'exchange', no: '', wh: '' })
const whOptions = computed(() => {
  const t = cur.value
  if (!t) return []
  return WAREHOUSE_OPTIONS.map(w => ({ ...w, stock: stockOf(t.sku, w.name) }))
})
const usableCount = computed(() => {
  const t = cur.value
  if (!t) return 0
  return whOptions.value.filter(w => w.stock >= t.qty).length
})
function doAction(row, k) {
  if (!opOn(row, k)) return
  cur.value = row
  if (k === 'refund') { startRefund(); return }
  if (row.workOrder && !row.workOrder.startsWith('TH')) {
    return ElMessage.warning('该售后单已生成过换货单 / 补发单，不能重复建单')
  }
  wo.kind = k
  wo.no = workOrderNo(k)
  const first = WAREHOUSE_OPTIONS
    .map(w => ({ name: w.name, stock: stockOf(row.sku, w.name) }))
    .find(w => w.stock >= row.qty)
  wo.wh = first ? first.name : ''
  woVisible.value = true
}
function pickWh(w) {
  if (!cur.value || w.stock < cur.value.qty) {
    return ElMessage.warning(`该仓可用 ${w.stock}，不足 ${cur.value?.qty}，已置灰`)
  }
  wo.wh = w.name
}
function pathPick(k) {
  const map = {
    purchase: '已转采购单补货，到货后再创建补发单',
    partial: '已记录部分补发诉求，数量待与客户确认后调整',
    refund: '请改用「退款」动作，按仅退款处理'
  }
  ElMessage.success(map[k])
}
function submitWo() {
  const no = createWorkOrder(cur.value, wo.kind, wo.wh, who.value)
  woVisible.value = false
  detailVisible.value = false
  ElMessage.success(`${wo.kind === 'exchange' ? '换货单' : '补发单'} ${no} 已生成，待仓库出库`)
}

/* ---------------- 导出 ---------------- */
function exportData() {
  const isWait = props.status === 'wait'
  const head = isWait
    ? ['售后原因', '凭证数', '申请售后类型', '售后申请时间', '剩余处理时长', '下单订单编号', '下单时间', '物流状态', '商品', 'SKU', '客户', '电话', '地址']
    : ['售后单号', '下单订单编号', '商品', 'SKU', '处理方式', '售后原因', '关联工单', '审核结果', '退款金额', '退款方式', '处理人', '完成时间', '审核意见']
  const lines = [head.join(',')]
  view.value.forEach(t => {
    const row = isWait
      ? [t.reason, t.proofs.length, t.applyType, t.applyTime, sla(t.sla).text, t.orderNo, t.orderTime, t.logistics, t.goods, t.sku, t.customer.name, t.customer.phone, t.customer.addr]
      : [t.ticket, t.orderNo, t.goods, t.sku, t.type, t.reason, t.workOrder || '', t.result, t.amount || '', t.refundWay || '', t.who || '', t.finishedAt || '', t.auditRemark || '']
    lines.push(row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
  })
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${cfg.value.title}-${todayStr()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success(`已按当前筛选导出 ${view.value.length} 条`)
}

const refresh = () => ElMessage.success('已刷新待处理队列')
</script>

<style scoped>
.filters { display: flex; gap: 12px; align-items: flex-end; margin-bottom: 12px; flex-wrap: wrap; }
.fld { display: flex; flex-direction: column; gap: 5px; }
.fld label { font-size: 11.5px; color: var(--ink-2); }
.fbtns { display: flex; gap: 8px; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); padding-bottom: 6px; }

.tl.danger { color: var(--danger); font-weight: 600; }
.tl.warning { color: var(--warn); font-weight: 600; }
.tl.info { color: var(--ink-2); }

/* 指标 */
.kpis3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
.kpis4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
.kpi { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 11px 13px; }
.kpi span { display: block; font-size: 11.5px; color: var(--ink-3); margin-bottom: 6px; }
.kpi b { font-size: 20px; font-weight: 600; letter-spacing: -.4px; }
.kpi b i { font-style: normal; font-size: 11.5px; font-weight: 400; color: var(--ink-3); margin-left: 3px; }
.kpi.hot b { color: var(--danger); }
.kpi.ok b { color: var(--ok); }

/* 队列 */
.queues { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.q { flex: 1; min-width: 96px; background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; cursor: pointer; }
.q b { display: block; font-size: 18px; font-weight: 600; margin-bottom: 3px; }
.q span { font-size: 11.5px; color: var(--ink-3); }
.q:hover { border-color: var(--brand); }
.q.on { border-color: var(--brand); background: var(--brand-l); }
.q.on b, .q.on span { color: var(--brand-d); }
.q.hot b { color: var(--danger); }
.q.zero b { color: var(--ink-3); font-weight: 500; }
.q.all { cursor: default; background: var(--fill); }
.q.all:hover { border-color: var(--line); }

/* 表格单元 */
.ocell { display: flex; flex-direction: column; line-height: 1.45; }
.sub { font-size: 11px; color: var(--ink-3); }

/* 当前状态 pill */
.pill {
  display: inline-flex; align-items: center; justify-content: center;
  height: 20px; min-width: 58px; padding: 0 8px; border-radius: 4px;
  font-size: 11.5px; line-height: 1; white-space: nowrap;
  background: var(--fill); color: var(--ink-2);
}
.pill.q-transit { background: var(--warn-l); color: var(--warn); }
.pill.q-qc { background: var(--brand-l); color: var(--brand-d); }
.pill.q-refund { background: var(--danger-l); color: var(--danger); }
.pill.q-exchange { background: #EEF0FE; color: #4B54C6; }
.pill.q-resend { background: var(--ok-l); color: var(--ok); }
.pill.q-none { color: var(--ink-3); }

/* 操作列 */
.ops { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
.ops .el-button { height: auto; padding: 0; margin: 0; font-size: 12.5px; }
.ops .el-button.is-disabled { color: #B6BDC5; }
.op-wrap { display: inline-flex; }

/* 审核弹窗：补发 / 换货库存 */
.stock-box { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; background: var(--fill); }
.stock-h { display: flex; align-items: baseline; gap: 10px; }
.stock-t { font-size: 12.5px; font-weight: 600; }
.stock-sum { font-size: 12px; color: var(--ink-3); }
.stock-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
.st { display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; border: 1px solid var(--line); border-radius: 5px; background: #fff; }
.st-n { font-size: 11.5px; color: var(--ink-3); }
.st-s { font-size: 12px; color: var(--ink-2); }
.st-s b { font-size: 14px; }
.st.ok { border-color: #CBE7D3; }
.st.ok .st-s b { color: var(--ok); }
.st.bad { border-color: #F2D3D3; background: #FFF8F8; }
.st.bad .st-s b { color: var(--danger); }
.st-s i { margin-left: 4px; font-style: normal; font-size: 11px; color: var(--danger); }
.stock-warn { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; color: var(--danger); }
.stock-warn span { flex: 1; }
.stock-ok { margin-top: 8px; font-size: 12px; color: var(--ink-2); }
.stock-ok b { color: var(--ink); font-weight: 600; }

/* 抽屉底部 */
.dr-foot { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.dr-sum { margin-right: auto; font-size: 12px; color: var(--ink-3); }
.dr-sum b { color: var(--ink); font-weight: 600; }

.sec-t { font-size: 12.5px; font-weight: 600; margin-bottom: 9px; padding-left: 8px; border-left: 3px solid var(--brand); }
.sub-label { font-size: 11.5px; color: var(--ink-3); margin: 14px 0 7px; }
.types { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.types :deep(.el-radio) { margin-right: 0; height: auto; padding: 8px 10px; width: 100%; }
.types :deep(.el-radio__label) { line-height: 1.4; }
.rt { font-size: 12px; font-weight: 600; }
.rs { font-size: 10.5px; color: var(--ink-3); }
.field { display: flex; align-items: center; gap: 10px; }
.field label { width: 76px; font-size: 12.5px; color: var(--ink-2); flex: none; }
.hint { font-size: 11.5px; color: var(--ink-3); }
.tipbox { margin-top: 14px; }
.audit-hint { font-size: 12px; color: var(--ink-2); line-height: 1.8; margin-bottom: 14px; }
.type-hint { font-size: 11.5px; color: var(--ink-3); margin: -4px 0 8px; }

/* 进度条 */
.steps { display: flex; padding: 4px 0 18px; }
.stp { flex: 1; position: relative; text-align: center; }
.stp .line {
  position: absolute; top: 8px; right: 50%; width: 100%; height: 2px; background: var(--line); z-index: 0;
}
.stp.done .line, .stp.cur .line { background: var(--brand); }
.stp .dot {
  position: relative; z-index: 1; width: 18px; height: 18px; line-height: 18px; border-radius: 50%;
  margin: 0 auto 6px; background: #fff; border: 2px solid var(--line); color: #fff; font-size: 10px;
}
.stp.done .dot { background: var(--brand); border-color: var(--brand); }
.stp.cur .dot { background: var(--brand); border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-l); }
.stp.rejected .dot { background: var(--danger); border-color: var(--danger); box-shadow: 0 0 0 3px var(--danger-l); }
.stp.todo .dot { background: #fff; border-color: #D5DAE0; }
.stp .lb { font-size: 11px; color: var(--ink-3); white-space: nowrap; }
.stp.done .lb { color: var(--ink-2); }
.stp.cur .lb { color: var(--brand-d); font-weight: 600; }
.stp.rejected .lb { color: var(--danger); font-weight: 600; }
.qc-tip {
  font-size: 11.5px; line-height: 1.7; color: var(--warn); background: var(--warn-l);
  border: 1px solid #F5DCB8; border-radius: 6px; padding: 8px 11px; margin: -6px 0 14px;
}

.dr-h { display: flex; align-items: center; width: 100%; }
.dr-h b { font-size: 15px; font-weight: 600; }

.thumbs { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.thumb {
  width: 96px; height: 70px; border: 1px dashed var(--line); border-radius: 6px; padding: 0 4px;
  background: var(--fill); display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; font-size: 10px; color: var(--ink-3); text-align: center; line-height: 1.3;
}
.thumb b { font-size: 15px; color: var(--ink-3); font-weight: 400; }

/* 仓库选择 */
.whs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.wh { border: 1px solid var(--line); border-radius: 6px; padding: 9px 11px; cursor: pointer; }
.wh:hover { border-color: var(--brand); }
.wh.on { border-color: var(--brand); background: var(--brand-l); }
.wh.off { background: #FAFBFC; cursor: not-allowed; }
.wh.off:hover { border-color: var(--line); }
.wh-h { display: flex; align-items: baseline; gap: 6px; }
.wh-h .sub { color: var(--ink-3); }
.wh-h b { font-size: 12.5px; }
.wh-s { font-size: 11.5px; color: var(--ink-3); margin-top: 3px; }
.ok-t { color: var(--ok); font-weight: 600; }
.bad-t { color: var(--danger); font-weight: 600; }
.paths { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.path {
  font-size: 12px; color: var(--brand-d); background: var(--brand-l); border: 1px solid #BFE3F2;
  border-radius: 5px; padding: 7px 11px; cursor: pointer;
}
.path:hover { background: #D8EEF9; }

/* 物流轨迹 */
.logi { margin-top: 10px; border: 1px solid var(--line-2); border-radius: 8px; background: #FAFBFC; padding: 12px 14px 6px; }
.logi-head { display: flex; align-items: center; gap: 10px; }
.logi-head .cp { margin-left: auto; }
.logi-route { margin-top: 6px; font-size: 11.5px; color: var(--ink-3); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.logi-route .rp { color: var(--ink-2); }
.logi-route .arw { color: var(--brand); font-weight: 600; }
.logi-tl { margin-top: 12px; padding-left: 2px; }
.logi-tl :deep(.el-timeline-item) { padding-bottom: 13px; }
.logi-tl :deep(.el-timeline-item__tail) { border-left-color: var(--line); }
.logi-tl :deep(.el-timeline-item__timestamp) { font-size: 11px; color: var(--ink-3); font-variant-numeric: tabular-nums; margin-bottom: 3px; }
.logi-tl :deep(.el-timeline-item__node) { box-shadow: 0 0 0 3px #FAFBFC; }
.ev-h { display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap; }
.ev-h b { font-size: 12.5px; font-weight: 600; color: var(--ink-2); }
.ev-p { font-size: 11.5px; color: var(--ink-3); }
.ev-now { font-size: 10px; line-height: 15px; padding: 0 5px; border-radius: 3px; background: var(--brand-l); color: var(--brand-d); font-weight: 500; }
.ev-d { font-size: 11.5px; color: var(--ink-3); margin-top: 2px; line-height: 1.55; }
.ev.hot b { color: var(--brand); font-size: 13px; }
.ev.hot .ev-p { color: var(--ink-2); }
.ev.hot .ev-d { color: var(--ink-2); }
.ev.hot.sign b { color: var(--ok); }
.ev.hot.sign .ev-now { background: var(--ok-l); color: var(--ok); }
.lg-foot { font-size: 11px; color: var(--ink-3); border-top: 1px dashed var(--line); padding: 8px 0 6px; margin-top: 2px; }
</style>
