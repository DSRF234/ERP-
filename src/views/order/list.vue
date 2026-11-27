<template>
  <div>
    <PageHeader :title="cfg.title" :sub="cfg.sub">
      <el-button v-can="pid.batch" v-if="status === 'review' && !batchMode" size="small" type="primary" @click="enterBatch">批量审核</el-button>
      <el-button v-can="pid.create" v-if="status === 'review'" size="small" @click="openCreate">新建订单</el-button>
      <el-button v-can="pid.exp" size="small" @click="exportOrders">导出</el-button>
    </PageHeader>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="单号 / 收件人 / 手机号" style="width: 210px" clearable />
      <el-select v-model="f.carrier" size="small" style="width: 130px" placeholder="快递公司">
        <el-option label="全部快递" value="" />
        <el-option v-for="c in ['顺丰', '圆通', '中通', '韵达', '邮政']" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="f.left" size="small" style="width: 140px" placeholder="剩余时间状态">
        <el-option label="全部状态" value="" />
        <el-option label="已超" value="danger" />
        <el-option label="快超" value="warning" />
        <el-option label="剩余" value="info" />
      </el-select>
      <el-select v-model="f.platform" size="small" style="width: 120px" placeholder="平台">
        <el-option label="全部平台" value="" />
        <el-option v-for="p in ['天猫', '抖音', '京东', '小程序']" :key="p" :label="p" :value="p" />
      </el-select>
      <el-select v-model="f.warehouse" size="small" style="width: 140px" placeholder="发货仓库">
        <el-option label="全部仓库" value="" />
        <el-option v-for="wh in warehouses" :key="wh" :label="wh" :value="wh" />
      </el-select>
      <el-button size="small" type="primary">查找</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>{{ cfg.title }}</h3>
        <span class="extra">{{ cfg.hint }}</span>
      </div>

      <div v-if="batchMode" class="batch-bar">
        <span class="sel">已选 <b>{{ selected.length }}</b> 条</span>
        <span class="batch-tip">勾选订单后统一选择快递公司，库存充足的直接通过进入待发货</span>
        <div class="batch-acts">
          <el-button size="small" type="primary" :disabled="!selected.length" @click="openBatch">确认批量审核</el-button>
          <el-button size="small" @click="exitBatch">退出批量</el-button>
        </div>
      </div>

      <el-table ref="tableRef" :data="view" size="small" max-height="600" row-key="no"
        :row-class-name="rowClass" :empty-text="emptyText" @selection-change="onSelectionChange">
        <el-table-column v-if="batchMode" type="selection" width="44" fixed="left" />
        <el-table-column prop="no" label="平台单号" width="150" fixed>
          <template #default="{ row }">
            <div class="mono">{{ row.no }}</div>
            <span v-if="row.deferredAt" class="defer-tag">待处理</span>
          </template>
        </el-table-column>
        <el-table-column v-if="status === 'done'" label="订单状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="afterTag(row.afterStatus)">{{ row.afterStatus || '已完结' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="status === 'done'" label="财务" width="118">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" :type="row.financePushed ? 'success' : 'info'">
              {{ row.financePushed ? '已推送对账' : '未推送' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="status === 'review' || status === 'pending'" label="剩余发货时间" width="140">
          <template #default="{ row }">
            <span :class="'tl ' + tl(row.deadline).type">{{ tl(row.deadline).text }}</span>
          </template>
        </el-table-column>
        <el-table-column label="货品明细" min-width="180">
          <template #default="{ row }">
            <div v-for="(g, i) in row.goods" :key="i" class="goods">{{ g.name }} · {{ g.spec }} ×{{ g.qty }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="receiver" label="收件人" width="86" />
        <el-table-column prop="phone" label="手机号" width="118" />
        <el-table-column prop="address" label="收件地址" min-width="170" show-overflow-tooltip />
        <el-table-column prop="note" label="买家留言" width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.note || '—' }}</template>
        </el-table-column>
        <el-table-column label="平台类型" min-width="140">
          <template #default="{ row }">{{ row.platform }} · {{ row.shop }}</template>
        </el-table-column>
        <el-table-column v-if="status === 'pending' || status === 'shipped' || status === 'done'" prop="carrier"
          label="快递公司" width="96" />
        <el-table-column v-if="status === 'shipped' || status === 'done'" prop="expressNo"
          label="快递单号" width="140">
          <template #default="{ row }"><span class="mono">{{ row.expressNo }}</span></template>
        </el-table-column>
        <el-table-column label="订单金额" width="108" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.amount) }}</span></template>
        </el-table-column>
        <el-table-column label="平台结算金额" width="118" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.settle) }}</span></template>
        </el-table-column>
        <el-table-column label="实际到账金额" width="118" align="right">
          <template #default="{ row }"><span class="mono">{{ money(row.actual) }}</span></template>
        </el-table-column>
        <el-table-column prop="warehouse" label="发货仓库" width="126" />
        <el-table-column prop="payTime" label="付款时间" width="136" />
        <el-table-column prop="deadline" label="最晚发货时间" width="136" />
        <el-table-column v-if="status === 'shipped' || status === 'done'" prop="shippedAt"
          label="发货时间" width="136" />
        <el-table-column prop="platformGoods" label="平台商品信息" min-width="170" show-overflow-tooltip />

        <el-table-column label="操作" :width="status === 'pending' ? 168 : 150" fixed="right">
          <template #default="{ row }">
            <template v-if="status === 'review'">
              <el-button v-can="pid.audit" link type="primary" size="small" @click="openReview(row)">审核</el-button>
              <el-button v-can="pid.reject" link type="danger" size="small" @click="openReject(row)">驳回</el-button>
            </template>
            <el-button v-can="pid.outbound" v-else-if="status === 'pending'" link type="primary" size="small"
              @click="shipOut(row)">模拟出库回传</el-button>
            <el-button v-can="pid.receive" v-else-if="status === 'shipped'" link type="primary" size="small"
              @click="receive(row)">确认收货</el-button>
            <el-button v-can="pid.aftersale" v-else-if="status === 'done'" link type="primary" size="small"
              @click="openAfter(row)">申请售后</el-button>
            <el-button v-can="pid.detail" link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 审核弹窗 -->
    <el-dialog v-model="reviewVisible" title="订单审核 · 库存校验" width="620px">
      <template v-if="cur">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="平台单号">{{ cur.no }}</el-descriptions-item>
          <el-descriptions-item label="收件人">{{ cur.receiver }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">{{ money(cur.amount) }}</el-descriptions-item>
          <el-descriptions-item label="发货仓库">{{ cur.warehouse }}</el-descriptions-item>
        </el-descriptions>

        <div class="check">
          <div class="check-t">库存校验结果</div>
          <div v-for="g in cur.goods" :key="g.sku" class="check-row">
            <span>{{ g.name }} ×{{ g.qty }}</span>
            <span :class="{ ok: stockOf(cur.warehouse, g.sku) >= g.qty, bad: stockOf(cur.warehouse, g.sku) < g.qty }">
              {{ cur.warehouse }} 可用 {{ stockOf(cur.warehouse, g.sku) }} 件
            </span>
          </div>
        </div>

        <el-alert v-if="enough" type="success" :closable="false" show-icon
          :title="`库存充足。审核通过后订单进入「待发货」，由 WMS 出库回传后转为「已发货」。`" />

        <template v-else-if="altWarehouse">
          <el-alert type="warning" :closable="false" show-icon
            :title="`当前仓库库存不足，${altWarehouse} 库存充足，是否改为从该仓发货？`" />
          <div class="alt">
            <el-radio-group v-model="useAlt" size="small">
              <el-radio :label="false">仍然驳回</el-radio>
              <el-radio :label="true">改为 {{ altWarehouse }} 发货</el-radio>
            </el-radio-group>
          </div>
        </template>

        <template v-else>
          <el-alert type="error" :closable="false" show-icon title="所有仓库库存均不足，无法通过审核，请驳回并说明原因。" />
          <div class="stock-list">
            <span v-for="(v, k) in stockStore.warehousesFor(cur.goods[0].sku, cur.goods[0].qty)"
              :key="k">{{ k }}：{{ v }} 件</span>
          </div>
        </template>
      </template>

      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button v-can="pid.reject" type="danger" plain @click="toReject">驳回</el-button>
        <el-button type="primary" :disabled="!canPass" @click="pass">确认审核通过</el-button>
      </template>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectVisible" title="驳回订单" width="480px">
      <el-form label-width="80px">
        <el-form-item label="平台单号">{{ cur && cur.no }}</el-form-item>
        <el-form-item label="驳回原因">
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请填写驳回原因，将同步至平台备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="doReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 批量审核 -->
    <el-dialog v-model="batchVisible" title="批量审核" width="840px">
      <div class="dlg-hint">
        已选 <b>{{ batchRows.length }}</b> 条订单：库存充足 <b>{{ batchCount.ok }}</b> 条，需变更发货仓
        <b>{{ batchCount.transfer }}</b> 条，库存不足 <b>{{ batchCount.lack }}</b> 条。
        <div style="margin-top:6px">
          确认后库存充足的订单直接通过进入「待发货」；
          <template v-if="batchCount.hold > 0">其余 <b>{{ batchCount.hold }}</b> 条将单独列出，按单条审核的规则逐条处理。</template>
          <template v-else>本批全部可正常通过。</template>
        </div>
      </div>

      <el-form label-width="96px" size="small" class="batch-form">
        <el-form-item label="统一快递公司" required>
          <el-select v-model="batchCarrier" placeholder="请选择本批订单的快递公司" style="width: 240px">
            <el-option v-for="c in CARRIERS" :key="c.name" :label="c.name" :value="c.name" />
          </el-select>
          <span class="form-tip">审核通过后按该快递公司生成运单号</span>
        </el-form-item>
      </el-form>

      <div class="sub-t">本批订单校验结果</div>
      <el-table :data="batchRows" size="small" max-height="320" border>
        <el-table-column type="index" label="序号" width="52" align="center" />
        <el-table-column label="平台单号" width="140">
          <template #default="{ row }"><span class="mono">{{ row.o.no }}</span></template>
        </el-table-column>
        <el-table-column label="商品" min-width="160">
          <template #default="{ row }">
            <div>{{ row.chk.good.name }}<span v-if="row.o.goods.length > 1" class="muted"> 等{{ row.o.goods.length }}件</span></div>
            <div class="muted sub">{{ row.chk.good.spec }}</div>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="60" align="right">
          <template #default="{ row }">{{ row.chk.needQty }}</template>
        </el-table-column>
        <el-table-column label="发货仓库" width="96">
          <template #default="{ row }">{{ row.o.warehouse }}</template>
        </el-table-column>
        <el-table-column label="本仓可用" width="86" align="right">
          <template #default="{ row }">{{ row.chk.curStock }}</template>
        </el-table-column>
        <el-table-column label="校验结果" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.chk.state === 'ok'" size="small" type="success">可发货</el-tag>
            <el-tag v-else-if="row.chk.state === 'transfer'" size="small" type="warning">
              需变更至{{ row.chk.altWh }}
            </el-tag>
            <el-tag v-else size="small" type="danger">库存不足</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="picker-note">库存按 WMS 实时数据校验；同一订单含多个商品时取最严格结果。</div>

      <template #footer>
        <el-button @click="batchLater">稍后处理</el-button>
        <el-button type="primary" @click="confirmBatch">确认审核</el-button>
      </template>
    </el-dialog>

    <!-- 库存不足订单 -->
    <el-dialog v-model="holdVisible" title="库存不足订单" width="940px">
      <div class="dlg-hint">
        <template v-if="lastPassed > 0">本次已通过 <b>{{ lastPassed }}</b> 条订单。</template>
        以下 <b>{{ holdList.length }}</b> 条订单库存不足，未完成审核。
        <div style="margin-top:6px">
          点「处理」按单条审核规则操作（可变更发货仓或驳回）；也可直接整体驳回，驳回原因统一为「商品数量不足」。
        </div>
      </div>

      <el-table :data="holdRows" size="small" max-height="340" border>
        <el-table-column type="index" label="序号" width="52" align="center" />
        <el-table-column label="平台单号" width="126">
          <template #default="{ row }"><span class="mono">{{ row.o.no }}</span></template>
        </el-table-column>
        <el-table-column label="商品" min-width="140">
          <template #default="{ row }">
            <div>{{ row.chk.good.name }}<span v-if="row.o.goods.length > 1" class="muted"> 等{{ row.o.goods.length }}件</span></div>
            <div class="muted sub">{{ row.chk.good.spec }}</div>
          </template>
        </el-table-column>
        <el-table-column label="需求" width="52" align="right">
          <template #default="{ row }">{{ row.chk.needQty }}</template>
        </el-table-column>
        <el-table-column label="本仓可用" width="72" align="right">
          <template #default="{ row }">{{ row.chk.curStock }}</template>
        </el-table-column>
        <el-table-column label="各仓可用" width="180">
          <template #default="{ row }">
            <div class="wh-stock">
              <span v-for="(v, w) in stockMap(row.o)" :key="w">
                {{ w }} <b :class="v >= row.chk.good.qty ? 'enough' : 'short'">{{ v }}</b>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="结论" width="160">
          <template #default="{ row }">
            <span v-if="row.chk.state === 'transfer'" class="bad">
              本仓不足，{{ row.chk.altWh }}可满足
            </span>
            <span v-else class="bad">各仓均不足</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="handleHold(row.o)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button v-can="pid.reject" type="danger" plain @click="rejectAllHold">全部驳回</el-button>
        <el-button @click="holdLater">稍后处理</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情 -->
    <el-drawer v-model="detailVisible" size="680px">
      <template #header>
        <div v-if="detailOrder" class="dr-h">
          <b>订单详情</b>
          <el-tag size="small" :type="statusTag(detailOrder.status)" effect="plain" style="margin-left:8px">
            {{ statusText(detailOrder.status) }}
          </el-tag>
          <span class="mono dr-no">{{ detailOrder.no }}</span>
        </div>
      </template>

      <template v-if="detailOrder">
        <div class="sec-t">处理进度</div>
        <div class="steps">
          <div v-for="(s, i) in ORDER_STEPS" :key="s" class="stp"
            :class="{ done: detailDone || i < stepIdx, cur: !detailDone && i === stepIdx, todo: !detailDone && i > stepIdx }">
            <div v-if="i > 0" class="line"></div>
            <div class="dot"><i v-if="detailDone || i < stepIdx">✓</i></div>
            <div class="lb">{{ s }}</div>
          </div>
        </div>

        <div class="sec-t">订单信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="平台单号"><span class="mono">{{ detailOrder.no }}</span></el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag size="small" :type="statusTag(detailOrder.status)" effect="plain">{{ statusText(detailOrder.status) }}</el-tag>
            <span v-if="detailOrder.deferredAt" class="defer-tag dl">待处理</span>
          </el-descriptions-item>
          <el-descriptions-item label="平台 / 店铺">{{ detailOrder.platform }} · {{ detailOrder.shop }}</el-descriptions-item>
          <el-descriptions-item label="发货仓库">{{ detailOrder.warehouse }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ detailOrder.orderTime || detailOrder.payTime }}</el-descriptions-item>
          <el-descriptions-item label="付款时间">{{ detailOrder.payTime }}</el-descriptions-item>
          <el-descriptions-item label="最晚发货时间">{{ detailOrder.deadline }}</el-descriptions-item>
          <el-descriptions-item label="买家留言">{{ detailOrder.note || '—' }}</el-descriptions-item>
        </el-descriptions>

        <div class="sec-t" style="margin-top:18px">收件信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="收件人">{{ detailOrder.receiver }}</el-descriptions-item>
          <el-descriptions-item label="手机号"><span class="mono">{{ detailOrder.phone }}</span></el-descriptions-item>
          <el-descriptions-item label="收件地址" :span="2">{{ detailOrder.address }}</el-descriptions-item>
        </el-descriptions>

        <div class="sec-t" style="margin-top:18px">
          商品明细<span class="sec-sub">共 {{ detailTotalQty }} 件</span>
        </div>
        <el-table :data="detailOrder.goods" size="small" border>
          <el-table-column prop="name" label="商品" min-width="180" />
          <el-table-column prop="spec" label="规格" width="120" />
          <el-table-column prop="sku" label="SKU" width="130">
            <template #default="{ row }"><span class="mono">{{ row.sku }}</span></template>
          </el-table-column>
          <el-table-column prop="qty" label="数量" width="70" align="right" />
        </el-table>

        <div class="sec-t" style="margin-top:18px">金额信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单金额"><span class="mono">{{ money(detailOrder.amount) }}</span></el-descriptions-item>
          <el-descriptions-item label="平台结算金额"><span class="mono">{{ money(detailOrder.settle) }}</span></el-descriptions-item>
          <el-descriptions-item label="实际到账金额" :span="2"><span class="mono">{{ money(detailOrder.actual) }}</span></el-descriptions-item>
        </el-descriptions>
        <div class="amt-note">订单金额 = Σ(单价×数量)；实际到账 = 订单金额 − 平台结算金额</div>

        <div class="sec-t" style="margin-top:18px">物流信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="发货状态">
            <el-tag size="small" :type="LOGI_TAG[detailOrder.status] || 'info'" effect="plain">
              {{ LOGI_TEXT[detailOrder.status] || '—' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="快递公司">{{ detailOrder.carrier || '—' }}</el-descriptions-item>
          <el-descriptions-item label="出库单号"><span class="mono">{{ detailOrder.outboundNo || '—' }}</span></el-descriptions-item>
          <el-descriptions-item label="运单号"><span class="mono">{{ detailOrder.expressNo || '—' }}</span></el-descriptions-item>
          <el-descriptions-item v-if="detailOrder.shippedAt" label="发货时间">{{ detailOrder.shippedAt }}</el-descriptions-item>
          <el-descriptions-item v-if="detailOrder.doneAt" label="确认收货时间">{{ detailOrder.doneAt }}</el-descriptions-item>
        </el-descriptions>

        <!-- 已发货 / 已完结：模拟物流轨迹；待审核 / 待发货只有单号，不生成轨迹 -->
        <div v-if="detailTrack" class="logi">
          <div class="logi-head">
            <span class="sub">物流轨迹 · 共 {{ detailTrack.events.length }} 条</span>
            <span class="mono sub cp-no">{{ detailOrder.carrier }} {{ detailOrder.expressNo }}</span>
          </div>
          <div class="logi-route">
            <span class="rp">{{ detailTrack.from }}</span>
            <span class="arw">→</span>
            <span class="rp">{{ detailTrack.to }}</span>
          </div>
          <el-timeline class="logi-tl">
            <el-timeline-item v-for="(e, i) in detailTrack.events" :key="e.time + e.state" :timestamp="e.time"
              placement="top" :color="i === 0 ? (e.state === '已签收' ? '#1E8E5A' : '#169BD5') : '#D5DAE0'"
              :hollow="i !== 0">
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
          <div class="lg-foot">轨迹按发货时间模拟生成，接入 WMS 后由承运商官网回传。</div>
        </div>
        <div v-else class="logi-tip">
          {{ detailOrder.status === 'review'
            ? '审核通过后生成出库单号；WMS 出库回传后生成运单号，届时可查看物流轨迹。'
            : '订单已生成出库单号，等待 WMS 出库回传后生成运单号，届时可查看物流轨迹。' }}
        </div>
      </template>

      <template #footer>
        <div class="dr-foot">
          <span v-if="detailOrder" class="dr-sum">
            共 <b>{{ detailTotalQty }}</b> 件 · 订单金额 <b class="mono">{{ money(detailOrder.amount) }}</b>
          </span>
          <el-button size="small" @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 申请售后 -->
    <el-dialog v-model="afterVisible" title="申请售后" width="480px">
      <el-form label-width="86px" size="small">
        <el-form-item label="订单编号">{{ cur && cur.no }}</el-form-item>
        <el-form-item label="处理方式">
          <el-select v-model="afterForm.type" style="width:100%">
            <el-option v-for="t in AFTER_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="afterForm.type === '更改地址'" label="更改后地址">
          <el-input v-model="afterForm.newAddr" placeholder="请输入客户要求改到的新收货地址" />
        </el-form-item>
        <el-form-item label="售后原因">
          <el-input v-model="afterForm.reason" type="textarea" :rows="3" placeholder="请填写售后原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="afterVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAfter">提交</el-button>
      </template>
    </el-dialog>

    <!-- 新建订单 -->
    <el-dialog v-model="createVisible" title="新建订单" width="840px">
      <el-form :model="form" label-width="96px" size="small">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="平台"><el-select v-model="form.platform" style="width:100%">
            <el-option v-for="p in ['天猫','抖音','京东','小程序']" :key="p" :label="p" :value="p" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="店铺"><el-input v-model="form.shop" placeholder="如：旗舰店" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收件人"><el-input v-model="form.receiver" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="手机号"><el-input v-model="form.phone" maxlength="11" placeholder="11 位手机号" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="收货省份">
              <el-select v-model="form.province" filterable placeholder="搜索 / 选择省份" style="width:100%">
                <el-option-group v-for="g in REGIONS" :key="g.key" :label="g.key">
                  <el-option v-for="a in g.areas" :key="a" :label="areaFull(a)" :value="a" />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发货仓库">
              <el-input :model-value="createWarehouse" readonly
                :placeholder="form.province ? '该省份未配置发货仓' : '选择省份后自动匹配'">
                <template v-if="createWarehouse" #append>
                  <el-tag size="small" type="primary" effect="plain">{{ warehouseType }}</el-tag>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细地址">
              <el-input v-model="form.addressDetail" placeholder="街道、门牌号等（不用重复填写省份）" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="goods-head">
          <span class="sec-t">商品明细</span>
          <span class="goods-sum">共 {{ createTotalQty }} 件</span>
          <el-button link type="primary" @click="addItem">+ 添加商品</el-button>
        </div>

        <div class="goods-box">
          <div v-for="(it, i) in form.items" :key="i" class="item">
            <div class="item-main">
              <el-select v-model="it.sku" filterable placeholder="输入名称 / 编码搜索商品" class="item-sel"
                @change="onPick(it)">
                <el-option v-for="p in productOptions" :key="p.sku" :label="`${p.name} · ${p.code}`"
                  :value="p.sku" :disabled="p.total <= 0 || pickedElsewhere(p.sku, i)">
                  <span class="opt-name">{{ p.name }}</span>
                  <span class="opt-meta">{{ p.code }} · 总可用 {{ p.total }}{{ p.unit }}</span>
                </el-option>
              </el-select>
              <el-input-number v-model="it.qty" :min="1" :max="99999" controls-position="right" class="item-qty" />
              <span class="item-avail" :class="availClass(it)">
                {{ !it.sku ? '—' : (createWarehouse ? `本仓可用 ${availOf(it)}` : '待选省份') }}
              </span>
              <el-button link type="danger" @click="removeItem(i)">移除</el-button>
            </div>
            <div v-if="it.sku" class="item-whs">
              <span class="wh-label">各仓可用</span>
              <span v-for="w in WAREHOUSES" :key="w" class="wh-item">
                {{ w }} <b :class="whAvail(it.sku, w) >= it.qty ? 'ok' : 'bad'">{{ whAvail(it.sku, w) }}</b>
              </span>
            </div>
          </div>
          <div v-if="!form.items.length" class="goods-empty">还没有商品，点「+ 添加商品」开始</div>
        </div>

        <el-alert v-if="stockIssues.length" type="error" :closable="false" show-icon class="goods-alert"
          :title="`${stockIssues.length} 个商品库存不足，无法保存`">
          <div v-for="x in stockIssues" :key="x.sku" class="issue">
            {{ x.name }}：需 {{ x.qty }} 件，{{ createWarehouse }}可用 {{ x.avail }} 件；各仓 {{ x.detail }}
          </div>
        </el-alert>

        <el-row :gutter="12" style="margin-top:12px">
          <el-col :span="8"><el-form-item label="订单金额"><el-input v-model.number="form.amount" placeholder="0.00" /></el-form-item></el-col>
          <el-col :span="16"><el-form-item label="买家留言"><el-input v-model="form.note" placeholder="选填" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="createOrder">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { money, timeLeft } from '@/utils/format'
import { useOrderStore, CARRIERS } from '@/stores/order'
import { useStockStore, WAREHOUSES } from '@/stores/stock'
import { tickets as afterTickets, nowStr } from '@/data/aftersale'
import { orderTrackOf } from '@/data/orderTrack'
import { REGIONS, ownerOfArea } from '@/data/system'
import { productCatalog } from '@/data/orderProducts'

const props = defineProps({ status: { type: String, default: 'review' } })

/* 四个状态页复用同一组件，操作权限 id 也随之切换 */
const PID = {
  review: { create: 'b-order-review-create', detail: 'b-order-review-detail', audit: 'b-order-review-audit', batch: 'b-order-review-batch', reject: 'b-order-review-reject', exp: 'b-order-review-export' },
  pending: { detail: 'b-order-pending-detail', outbound: 'b-order-pending-outbound', exp: 'b-order-pending-export' },
  shipped: { detail: 'b-order-shipped-detail', receive: 'b-order-shipped-receive', exp: 'b-order-shipped-export' },
  done: { detail: 'b-order-done-detail', aftersale: 'b-order-done-aftersale', exp: 'b-order-done-export' }
}
const pid = computed(() => PID[props.status] || {})
const store = useOrderStore()
const stockStore = useStockStore()
const warehouses = WAREHOUSES

const CONFIG = {
  review:  { title: '订单审核', sub: '对接平台与小程序的订单，审核通过后进入待发货，由 WMS 出库回传', hint: '需校验发货仓库存，不足时提示换仓或驳回' },
  pending: { title: '待发货', sub: '审核通过待出库，WMS 出库回传后进入「已发货」', hint: '当前无真实 WMS，可用每行「模拟出库回传」推进订单' },
  shipped: { title: '已发货', sub: '已生成快递公司与运单号，等待确认收货', hint: '确认收货后订单完结并自动推送财务管理' },
  done:    { title: '已完结', sub: '已确认收货，已推送财务管理', hint: '可在对账中心与发货数据中查看' }
}
// 同一个组件复用在四个状态路由上，标题/提示必须跟着 props.status 变，不能只取一次
const cfg = computed(() => CONFIG[props.status] || CONFIG.review)

const EMPTY_TEXT = {
  review: '暂无待审核订单',
  pending: '暂无待发货订单，审核通过后订单进入此处',
  shipped: '暂无已发货订单',
  done: '暂无已完结订单'
}
const emptyText = computed(() => EMPTY_TEXT[props.status] || '暂无数据')

const kw = ref('')
const f = reactive({ carrier: '', left: '', platform: '', warehouse: '' })
const rows = computed(() => store.byStatus(props.status))

const view = computed(() => rows.value.filter(r => {
  const k = kw.value.trim()
  const okKw = !k || [r.no, r.receiver, r.phone].some(v => String(v).includes(k))
  const okC = !f.carrier || r.carrier === f.carrier
  const okL = !f.left || timeLeft(r.deadline).type === f.left
  const okP = !f.platform || r.platform === f.platform
  const okW = !f.warehouse || r.warehouse === f.warehouse
  return okKw && okC && okL && okP && okW
}))

const reset = () => { kw.value = ''; Object.assign(f, { carrier: '', left: '', platform: '', warehouse: '' }) }
const tl = v => timeLeft(v)

/* 售后状态配色：已完结（绿）/ 售后中（橙）/ 已退款（红） */
const AFTER_TAG = { '已完结': 'success', '售后中': 'warning', '已退款': 'danger' }
const afterTag = v => AFTER_TAG[v] || 'info'

/* 审核 */
const reviewVisible = ref(false)
const rejectVisible = ref(false)
const createVisible = ref(false)
const cur = ref(null)
const useAlt = ref(true)
const rejectReason = ref('')
const form = reactive({
  platform: '天猫', shop: '', receiver: '', phone: '',
  province: '', addressDetail: '', note: '', amount: 0,
  items: [{ sku: '', qty: 1 }]
})

/* 详情抽屉：进度、状态与物流文案 */
const ORDER_STEPS = ['待审核', '待发货', '已发货', '已完结']
const STATUS_TEXT = { review: '待审核', pending: '待发货', shipped: '已发货', done: '已完结' }
const STATUS_TAG = { review: 'warning', pending: 'info', shipped: 'primary', done: 'success' }
const STATUS_STEP = { review: 0, pending: 1, shipped: 2, done: 3 }
const LOGI_TEXT = { review: '未发货', pending: '待出库', shipped: '运输中', done: '已签收' }
const LOGI_TAG = { review: 'info', pending: 'warning', shipped: 'primary', done: 'success' }
const detailVisible = ref(false)
const detailOrder = ref(null)
const statusText = s => STATUS_TEXT[s] || '—'
const statusTag = s => STATUS_TAG[s] || 'info'
const stepIdx = computed(() => STATUS_STEP[detailOrder.value?.status] ?? 0)
const detailDone = computed(() => detailOrder.value?.status === 'done')
const detailTotalQty = computed(() =>
  (detailOrder.value?.goods || []).reduce((s, g) => s + (Number(g.qty) || 0), 0))
// 待审核 / 待发货没有运单号，不生成轨迹；已发货 / 已完结才展示模拟轨迹
const detailTrack = computed(() => {
  const o = detailOrder.value
  if (!o || !o.expressNo || !['shipped', 'done'].includes(o.status)) return null
  return orderTrackOf(o)
})

/* 新建订单：商品目录、省份匹配发货仓、库存比对 */
const MUNICIPALITIES = ['北京', '天津', '上海', '重庆']
const AUTONOMOUS = ['内蒙古', '广西', '西藏', '宁夏', '新疆']

/** 省份简称补全为地址里的正式名称 */
function areaFull(area) {
  if (!area) return ''
  if (MUNICIPALITIES.includes(area)) return area + '市'
  if (AUTONOMOUS.includes(area)) return area + '自治区'
  if (area === '香港' || area === '澳门') return area + '特别行政区'
  return area + '省'
}

const productOptions = computed(() => productCatalog())
const createWarehouseObj = computed(() => (form.province ? ownerOfArea(form.province) : null))
const createWarehouse = computed(() => createWarehouseObj.value?.name || '')
const warehouseType = computed(() => createWarehouseObj.value?.type || '')

const createItems = computed(() => form.items.filter(i => i.sku))
const createTotalQty = computed(() =>
  createItems.value.reduce((s, i) => s + (Number(i.qty) || 0), 0))

const availOf = it => (it.sku && createWarehouse.value)
  ? stockStore.availableOf(it.sku, createWarehouse.value)
  : 0
const whAvail = (sku, w) => stockStore.availableOf(sku, w)
const availClass = it => (!it.sku || !createWarehouse.value) ? '' : (availOf(it) >= it.qty ? 'ok' : 'bad')

const stockIssues = computed(() => {
  if (!createWarehouse.value) return []
  return createItems.value
    .filter(i => i.qty > availOf(i))
    .map(i => ({
      sku: i.sku,
      name: productOptions.value.find(p => p.sku === i.sku)?.name || i.sku,
      qty: i.qty,
      avail: availOf(i),
      detail: WAREHOUSES.map(w => `${w} ${whAvail(i.sku, w)}`).join(' / ')
    }))
})

function pickedElsewhere(sku, i) {
  return form.items.some((it, idx) => idx !== i && it.sku === sku)
}
function addItem() { form.items.push({ sku: '', qty: 1 }) }
function removeItem(i) { form.items.splice(i, 1) }
function onPick(it) {
  const p = productOptions.value.find(x => x.sku === it.sku)
  if (p && p.total <= 0) ElMessage.warning(`「${p.name}」四个仓都没有可用库存`)
}

/* 库存校验（单条 / 批量共用） */
const stockOf = (wh, sku) => stockStore.availableOf(sku, wh)
const stockMap = order => {
  const g = order.goods[0]
  return stockStore.warehousesFor(g.sku, g.qty)
}

/** 找出能整单满足的换仓目标：同一订单所有商品都要够，不支持拆单 */
function altWarehouseOf(order) {
  return WAREHOUSES.find(w => w !== order.warehouse &&
    order.goods.every(g => stockOf(w, g.sku) >= g.qty)) || null
}

/** 单条库存校验：ok 本仓可发 / transfer 需换仓 / lack 各仓均不足 */
function stockCheck(order) {
  const details = order.goods.map(g => ({
    ...g,
    need: g.qty,
    cur: stockOf(order.warehouse, g.sku)
  }))
  const enoughAll = details.every(d => d.cur >= d.need)
  const altWh = enoughAll ? null : altWarehouseOf(order)
  return {
    state: enoughAll ? 'ok' : (altWh ? 'transfer' : 'lack'),
    details,
    altWh,
    needQty: details.reduce((s, d) => s + d.need, 0),
    curStock: details[0].cur,
    good: order.goods[0]
  }
}

const enough = computed(() =>
  !!cur.value && cur.value.goods.every(g => stockOf(cur.value.warehouse, g.sku) >= g.qty))
const altWarehouse = computed(() => (cur.value ? altWarehouseOf(cur.value) : null))
const canPass = computed(() => enough.value || (altWarehouse.value && useAlt.value))

/* 批量审核 */
const batchMode = ref(false)
const selected = ref([])
const tableRef = ref(null)
const batchVisible = ref(false)
const batchCarrier = ref('')
const batchRows = ref([])
const holdVisible = ref(false)
const holdList = ref([])
const lastPassed = ref(0)
const holdRows = computed(() => holdList.value.map(o => ({ o, chk: stockCheck(o) })))
const batchCount = computed(() => {
  const ok = batchRows.value.filter(r => r.chk.state === 'ok').length
  const transfer = batchRows.value.filter(r => r.chk.state === 'transfer').length
  const lack = batchRows.value.filter(r => r.chk.state === 'lack').length
  return { ok, transfer, lack, hold: transfer + lack }
})

const rowClass = ({ row }) => (row.deferredAt ? 'row-defer' : '')
const onSelectionChange = rows => { selected.value = rows }

// 筛选条件变化后行可能被隐藏，清空勾选，避免批量操作到看不见的订单
watch([kw, () => f.carrier, () => f.left, () => f.platform, () => f.warehouse], () => {
  if (batchMode.value) tableRef.value?.clearSelection()
})

function enterBatch() {
  batchMode.value = true
  selected.value = []
}
function exitBatch() {
  tableRef.value?.clearSelection()
  batchMode.value = false
  selected.value = []
}

// 四个状态页复用同一个组件，切页时退出批量模式并关闭弹窗 / 抽屉，避免残留
watch(() => props.status, () => {
  if (batchMode.value) exitBatch()
  batchVisible.value = false
  holdVisible.value = false
  detailVisible.value = false
})
function openBatch() {
  const list = [...selected.value]
  if (!list.length) return ElMessage.warning('请先勾选待审核的订单')
  batchRows.value = list.map(o => ({ o, chk: stockCheck(o) }))
  batchCarrier.value = ''
  batchVisible.value = true
}

/** 批量弹窗「稍后处理」：整批标红待处理 */
function batchLater() {
  const list = batchRows.value.map(r => r.o)
  store.defer(list)
  batchVisible.value = false
  exitBatch()
  ElMessage.success(`已将 ${list.length} 条订单标记为待处理，列表中整行标红`)
}

/** 确认审核：本仓充足的直接进待发货，其余进「库存不足订单」 */
function confirmBatch() {
  if (!batchCarrier.value) return ElMessage.warning('请先选择快递公司')
  const passRows = batchRows.value.filter(r => r.chk.state === 'ok')
  const hold = batchRows.value.filter(r => r.chk.state !== 'ok').map(r => r.o)
  const passed = []
  const failed = []
  passRows.forEach(r => {
    const res = store.approve(r.o, null, batchCarrier.value)
    if (res.ok) passed.push(r.o)
    else failed.push({ no: r.o.no, msg: res.msg })
  })
  lastPassed.value = passed.length
  batchVisible.value = false
  exitBatch()
  if (failed.length) {
    ElMessage.warning(`${failed.length} 条订单审核失败（${failed[0].no}）：${failed[0].msg}`)
  } else if (!hold.length) {
    ElMessage.success(`批量审核完成，${passed.length} 条订单已进入待发货`)
  }
  if (hold.length) {
    holdList.value = hold
    holdVisible.value = true
  }
}

/** 库存不足订单 → 按单条审核规则处理 */
function handleHold(o) {
  holdVisible.value = false
  setTimeout(() => openReview(o), 60)
}
function rejectAllHold() {
  const n = holdList.value.length
  holdList.value.forEach(o => store.reject(o))
  holdVisible.value = false
  ElMessage.success(`${n} 条订单已驳回：商品数量不足`)
}
function holdLater() {
  const n = holdList.value.length
  store.defer(holdList.value)
  holdVisible.value = false
  ElMessage.success(`已将 ${n} 条订单标记为待处理，列表中整行标红`)
}

function openReview(row) { cur.value = row; useAlt.value = true; reviewVisible.value = true }
function openReject(row) { cur.value = row; rejectReason.value = '商品数量不足'; rejectVisible.value = true }
function toReject() { reviewVisible.value = false; rejectVisible.value = true }

function pass() {
  const wh = !enough.value && altWarehouse.value ? altWarehouse.value : null
  const res = store.approve(cur.value, wh)
  if (!res.ok) { ElMessage.error(res.msg); return }
  reviewVisible.value = false
  ElMessage({
    type: 'success',
    duration: 4200,
    message: `审核通过，订单已进入「待发货」（承运：${res.carrier}）`
  })
}

function doReject() {
  store.reject(cur.value)
  rejectVisible.value = false
  reviewVisible.value = false
  ElMessage.success('已驳回：' + rejectReason.value)
}

/** 待发货 → 已发货：模拟 WMS 出库回传 */
function shipOut(row) {
  ElMessageBox.confirm(
    `模拟 WMS 出库回传：将为订单 ${row.no} 生成运单号并转入「已发货」，确认继续？`,
    '模拟出库回传', { type: 'info', confirmButtonText: '确认回传' }
  ).then(() => {
    const res = store.ship(row)
    if (res) ElMessage.success(`已回传：${res.carrier} ${res.expressNo}，订单进入「已发货」`)
  }).catch(() => {})
}

function receive(row) {
  ElMessageBox.confirm(
    `确认订单 ${row.no} 已由客户签收？确认后订单完结，并自动推送至财务管理（对账中心 / 发货数据）。`,
    '确认收货', { type: 'info', confirmButtonText: '确认收货' }
  ).then(() => {
    const res = store.confirmReceive(row)
    if (!res.ok) { ElMessage.error(res.msg); return }
    ElMessage.success('订单已完结，已推送财务管理')
  }).catch(() => {})
}

/** 订单详情：只读抽屉，四个状态页共用 */
function openDetail(row) {
  detailOrder.value = row
  detailVisible.value = true
}

/** 导出当前状态的订单列表（CSV，带 BOM 便于 Excel 打开） */
function exportOrders() {
  const list = rows.value
  if (!list.length) return ElMessage.warning('当前没有可导出的订单')
  const head = ['订单编号', '平台', '店铺', '收件人', '手机号', '收件地址', '订单金额', '平台结算金额',
    '实际到账金额', '发货仓库', '快递公司', '快递单号', '付款时间', '最晚发货时间', '发货时间', '状态']
  const body = list.map(o => [o.no, o.platform, o.shop, o.receiver, o.phone, o.address, o.amount,
    o.settle, o.actual, o.warehouse, o.carrier || '', o.expressNo || '', o.payTime || '',
    o.deadline || '', o.shippedAt || '', o.status])
  const csv = [head, ...body].map(r => r.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${cfg.value.title}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success(`已导出 ${list.length} 条订单`)
}

function openCreate() {
  Object.assign(form, {
    platform: '天猫', shop: '', receiver: '', phone: '',
    province: '', addressDetail: '', note: '', amount: 0,
    items: [{ sku: '', qty: 1 }]
  })
  createVisible.value = true
}

function createOrder() {
  if (!form.receiver) return ElMessage.error('请填写收件人')
  if (!form.province) return ElMessage.error('请选择收货省份')
  if (!form.addressDetail.trim()) return ElMessage.error('请填写详细地址')
  if (!createWarehouse.value) return ElMessage.error('该省份还没有配置发货仓库，请先在「发货仓设置」中分配')
  if (form.items.some(i => !i.sku)) return ElMessage.error('有商品行还没选择商品')
  if (!createItems.value.length) return ElMessage.error('请至少选择一个商品')

  const skus = createItems.value.map(i => i.sku)
  if (new Set(skus).size !== skus.length) return ElMessage.error('同一商品不能重复添加，请合并数量')

  // 库存比对：任一商品在当前发货仓不足就拦截，并列出四个仓的可用量
  if (stockIssues.value.length) {
    const x = stockIssues.value[0]
    return ElMessage({
      type: 'error', duration: 5600, showClose: true,
      message: `${x.name}：${createWarehouse.value}可用 ${x.avail} 件，不足 ${x.qty} 件；各仓可用 ${x.detail}`
    })
  }
  if (!form.amount || form.amount <= 0) return ElMessage.error('请填写订单金额')

  store.create({
    ...form,
    address: areaFull(form.province) + form.addressDetail.trim(),
    warehouse: createWarehouse.value,
    items: createItems.value.map(i => {
      const p = productOptions.value.find(x => x.sku === i.sku)
      return { sku: i.sku, name: p?.name || i.sku, spec: p?.spec || '—', qty: Number(i.qty) || 1 }
    })
  })
  createVisible.value = false
  ElMessage.success(`订单已创建，发货仓：${createWarehouse.value}，进入待审核`)
}

/* 申请售后 */
const afterVisible = ref(false)
const AFTER_TYPES = ['退货', '仅退款', '部分仅退款', '换货', '补发', '补差价', '更改地址']
const afterForm = reactive({ type: '退货', reason: '', newAddr: '' })
function openAfter(row) {
  cur.value = row
  afterForm.type = '退货'
  afterForm.reason = ''
  afterForm.newAddr = ''
  afterVisible.value = true
}
const pad = n => String(n).padStart(2, '0')
function plusHours(h) {
  const d = new Date(Date.now() + h * 3600000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function genTicketNo() {
  const d = new Date()
  return 'AS' + `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    String(afterTickets.length + 1).padStart(3, '0')
}

/** 申请售后：写入售后共享数据层（售后页读取的就是这份） */
function submitAfter() {
  if (!afterForm.reason) return ElMessage.error('请填写售后原因')
  if (afterForm.type === '更改地址' && !afterForm.newAddr.trim()) return ElMessage.error('更改地址需填写更改后的收货地址')
  const o = cur.value
  const g = o.goods[0] || {}
  /* 申请类型与处理方式用同一套词，避免详情里两处叫法不一致 */
  const APPLY_TYPE = Object.fromEntries(AFTER_TYPES.map(t => [t, t]))

  afterTickets.unshift({
    ticket: genTicketNo(),
    orderNo: o.no,
    channel: o.platform,
    applyType: APPLY_TYPE[afterForm.type] || afterForm.type,
    type: afterForm.type,
    reason: afterForm.reason,
    proofs: [],
    applyTime: nowStr(),
    sla: plusHours(24),
    logistics: '已签收',
    expressNo: o.expressNo || '—',
    goods: `${g.name || '商品'} ${g.spec || ''} ×${g.qty || 1}`,
    sku: g.sku || '—',
    qty: g.qty || 1,
    orderTime: o.orderTime || o.payTime,
    orderAmount: o.amount,
    amount: 0,
    customer: { name: o.receiver, phone: o.phone, addr: o.address },
    newAddr: afterForm.type === '更改地址' ? afterForm.newAddr.trim() : '',
    message: afterForm.reason,
    status: 'wait', queue: '', result: '—', duty: '', auditRemark: '', auditor: '', auditTime: '',
    who: '', finishedAt: '', workOrder: '', refundWay: '', addressSync: '', syncTime: '', repeat: false
  })

  store.setAfterStatus(o.no, '售后中')
  afterVisible.value = false
  const t = afterTickets[0].ticket
  ElMessage.success(`售后单 ${t} 已创建，已进入「售后待处理」，订单状态改为「售后中」`)
}
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.tl.danger { color: var(--danger); font-weight: 600; }
.tl.warning { color: var(--warn); font-weight: 600; }
.tl.info { color: var(--ink-2); }
.goods { font-size: 12px; line-height: 1.6; }
.check { margin: 14px 0; padding: 12px 14px; background: var(--brand-l); border: 1px solid #BFE3F2; border-radius: 6px; }
.check-t { font-size: 12.5px; font-weight: 600; color: var(--brand-d); margin-bottom: 8px; }
.check-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 3px 0; }
.check-row .ok { color: var(--ok); }
.check-row .bad { color: var(--danger); }
.alt { margin-top: 12px; }
.stock-list { margin-top: 10px; display: flex; gap: 16px; font-size: 12.5px; color: var(--ink-2); }

/* 批量审核工具条 */
.batch-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 14px; background: var(--brand-l); border-bottom: 1px solid #BFE3F2;
  font-size: 12.5px; color: var(--ink-2);
}
.batch-bar .sel b { color: var(--brand-d); font-size: 14px; }
.batch-bar .batch-tip { font-size: 11.5px; color: var(--ink-3); }
.batch-acts { margin-left: auto; display: flex; gap: 8px; }

/* 稍后处理：整行标红 + 待处理标签 */
.defer-tag {
  display: inline-block; margin-top: 3px; padding: 0 6px;
  height: 18px; line-height: 18px; border-radius: 3px;
  background: var(--danger-l); color: var(--danger); font-size: 11px; white-space: nowrap;
}
:deep(.el-table__row.row-defer > td.el-table__cell) { background: #fff2f0; }
:deep(.el-table__row.row-defer:hover > td.el-table__cell) { background: #ffe9e5 !important; }

/* 批量审核 / 库存不足订单弹窗 */
.batch-form { margin-top: 14px; }
.batch-form .form-tip { margin-left: 10px; font-size: 11.5px; color: var(--ink-3); }
.sub-t { margin: 16px 0 6px; font-size: 12px; color: var(--ink-2); }
.sub { font-size: 11px; line-height: 1.4; }
.picker-note { margin-top: 8px; font-size: 11.5px; color: var(--ink-3); }
.bad { color: var(--danger); }
.wh-stock {
  display: grid; grid-template-columns: 1fr 1fr; gap: 2px 10px;
  font-size: 11.5px; color: var(--ink-2);
}
.wh-stock .enough { color: var(--ok); font-weight: 600; }
.wh-stock .short { color: var(--danger); }

/* 订单详情抽屉 */
.dr-h { display: flex; align-items: center; width: 100%; }
.dr-h b { font-size: 15px; font-weight: 600; }
.dr-no { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.sec-t {
  font-size: 12.5px; font-weight: 600; margin-bottom: 9px;
  padding-left: 8px; border-left: 3px solid var(--brand);
}
.sec-sub { margin-left: 8px; font-size: 11.5px; font-weight: 400; color: var(--ink-3); }
.dl { margin-left: 6px; margin-top: 0; }
.dr-foot { display: flex; align-items: center; justify-content: flex-end; gap: 10px; width: 100%; }
.dr-sum { margin-right: auto; font-size: 12px; color: var(--ink-3); }
.dr-sum b { color: var(--ink); font-weight: 600; }
.amt-note { margin-top: 8px; font-size: 11.5px; color: var(--ink-3); line-height: 1.6; }

/* 进度条 */
.steps { display: flex; padding: 4px 0 18px; }
.stp { flex: 1; position: relative; text-align: center; }
.stp .line { position: absolute; top: 8px; right: 50%; width: 100%; height: 2px; background: var(--line); z-index: 0; }
.stp.done .line, .stp.cur .line { background: var(--brand); }
.stp .dot {
  position: relative; z-index: 1; width: 18px; height: 18px; line-height: 18px; border-radius: 50%;
  margin: 0 auto 6px; background: #fff; border: 2px solid var(--line); color: #fff; font-size: 10px;
}
.stp.done .dot, .stp.cur .dot { background: var(--brand); border-color: var(--brand); }
.stp.cur .dot { box-shadow: 0 0 0 3px var(--brand-l); }
.stp.todo .dot { background: #fff; border-color: #D5DAE0; }
.stp .lb { font-size: 11px; color: var(--ink-3); white-space: nowrap; }
.stp.done .lb { color: var(--ink-2); }
.stp.cur .lb { color: var(--brand-d); font-weight: 600; }

/* 物流轨迹 */
.logi { margin-top: 10px; border: 1px solid var(--line-2); border-radius: 8px; background: #FAFBFC; padding: 12px 14px 6px; }
.logi-head { display: flex; align-items: center; gap: 10px; }
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
.logi-tip {
  margin-top: 10px; font-size: 11.5px; line-height: 1.7; color: var(--ink-3);
  background: var(--fill); border: 1px dashed var(--line); border-radius: 6px; padding: 9px 11px;
}

/* 新建订单 · 商品明细 */
.goods-head { display: flex; align-items: center; gap: 10px; margin: 4px 0 10px; }
.goods-head .sec-t { margin: 0; }
.goods-sum { font-size: 11.5px; color: var(--ink-3); }
.goods-head .el-button { margin-left: auto; }
.goods-box { border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; background: #FAFBFC; }
.item + .item { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--line); }
.item-main { display: flex; align-items: center; gap: 10px; }
.item-sel { flex: 1; min-width: 0; }
.item-qty { width: 110px; flex: none; }
.item-avail { width: 96px; flex: none; font-size: 11.5px; color: var(--ink-3); }
.item-avail.ok { color: var(--ok); font-weight: 600; }
.item-avail.bad { color: var(--danger); font-weight: 600; }
.item-whs {
  margin-top: 6px; padding-left: 2px; display: flex; flex-wrap: wrap; gap: 4px 12px;
  font-size: 11.5px; color: var(--ink-3);
}
.item-whs .wh-label { color: var(--ink-2); }
.item-whs b { font-weight: 600; }
.item-whs .ok { color: var(--ok); }
.item-whs .bad { color: var(--danger); }
.goods-empty { padding: 12px 0; text-align: center; font-size: 12px; color: var(--ink-3); }
.goods-alert { margin-top: 12px; }
.goods-alert .issue { font-size: 11.5px; line-height: 1.7; }
.opt-meta { float: right; margin-left: 16px; color: var(--ink-3); font-size: 11.5px; }
</style>
