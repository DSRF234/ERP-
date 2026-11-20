<template>
  <div>
    <PageHeader title="权限管理" sub="按职位分配，粒度到模块 / 页面 / 按钮三级">
      <el-button size="small" @click="restore">恢复默认</el-button>
      <el-button size="small" type="primary" @click="save">保存分配</el-button>
    </PageHeader>

    <div class="layout">
      <div class="card posts">
        <div class="card-head"><h3>职位</h3><span class="extra">{{ posts.length }} 个</span></div>
        <div class="plist">
          <div v-for="p in posts" :key="p.name" class="pitem" :class="{ on: current === p.name }" @click="current = p.name">
            <span class="pn">{{ p.name }}</span>
            <span class="pc">{{ p.count }} 项</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>{{ current }} · 权限树</h3>
          <span class="extra">已勾选 {{ checkedCount }} / {{ totalCount }} 项</span>
        </div>
        <div class="tree">
          <el-tree
            ref="treeRef"
            :data="tree"
            show-checkbox
            node-key="id"
            default-expand-all
            :default-checked-keys="defaultKeys"
            @check="onCheck">
            <template #default="{ data }">
              <span class="node">
                <span class="label">{{ data.label }}</span>
                <span v-if="data.children" class="badge">{{ data.label.includes('管理') || data.label.includes('看板') || data.label.includes('设置') ? '' : '' }}</span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'

const posts = [
  { name: '老板', count: 71 },
  { name: '运营', count: 24 },
  { name: '采购', count: 15 },
  { name: '仓管', count: 18 },
  { name: '售后', count: 12 },
  { name: '财务', count: 14 }
]
const current = ref('运营')
const treeRef = ref(null)

const P = (label, id) => ({ id, label })
const M = (label, id, children) => ({ id, label, children })

const tree = [
  M('订单管理', 'm-order', [
    M('订单审核', 'p-review', [P('查看', 'b-review-view'), P('审核', 'b-review-pass'), P('驳回', 'b-review-reject'), P('导出', 'b-review-export'), P('编辑', 'b-review-edit'), P('新建订单', 'b-review-add')]),
    M('待发货', 'p-pending', [P('查看', 'b-pending-view'), P('编辑', 'b-pending-edit'), P('撤回订单', 'b-pending-back'), P('导出', 'b-pending-export')]),
    M('已发货', 'p-shipped', [P('查看', 'b-shipped-view'), P('编辑', 'b-shipped-edit'), P('导出', 'b-shipped-export'), P('打印面单', 'b-shipped-print')]),
    M('已完结', 'p-done', [P('查看', 'b-done-view'), P('导出', 'b-done-export'), P('申请售后', 'b-done-aftersale')])
  ]),
  M('采购管理', 'm-purchase', [
    M('采购订单', 'p-po', [P('查看', 'b-po-view'), P('新建', 'b-po-add'), P('提交', 'b-po-submit'), P('删除货品', 'b-po-del')]),
    M('历史采购单', 'p-poh', [P('查看', 'b-poh-view'), P('导出', 'b-poh-export'), P('打印', 'b-poh-print')]),
    M('供应商管理', 'p-sup', [P('查看', 'b-sup-view'), P('新增', 'b-sup-add'), P('删除', 'b-sup-del'), P('编辑', 'b-sup-edit'), P('供应商货品', 'b-sup-goods')])
  ]),
  M('库存管理', 'm-inv', [
    M('库存记录', 'p-stock', [P('查看', 'b-stock-view'), P('设置预警', 'b-stock-warn'), P('编辑', 'b-stock-edit'), P('导出', 'b-stock-export')]),
    M('仓库盘点', 'p-take', [P('查看', 'b-take-view'), P('创建任务', 'b-take-add'), P('盘点', 'b-take-do'), P('导出', 'b-take-export'), P('删除任务', 'b-take-del')])
  ]),
  M('售后管理', 'm-after', [
    M('售后待处理', 'p-wait', [P('查看', 'b-wait-view'), P('审核', 'b-wait-audit'), P('导出', 'b-wait-export'), P('查看详情', 'b-wait-detail')]),
    M('售后处理中', 'p-doing', [P('查看', 'b-doing-view'), P('退款', 'b-doing-refund'), P('换货', 'b-doing-exchange'), P('补发', 'b-doing-resend'), P('查看详情', 'b-doing-detail'), P('导出', 'b-doing-export')]),
    M('售后处理完成', 'p-adone', [P('查看', 'b-adone-view'), P('导出', 'b-adone-export'), P('复制信息', 'b-adone-copy')])
  ]),
  M('财务管理', 'm-fin', [
    M('对账中心', 'p-rec', [P('查看', 'b-rec-view'), P('核对', 'b-rec-check'), P('导出', 'b-rec-export')]),
    M('发货数据', 'p-ship', [P('查看', 'b-ship-view')]),
    M('商品信息', 'p-goods', [P('查看', 'b-goods-view')]),
    M('库存积压', 'p-aging', [P('查看', 'b-aging-view')]),
    M('应付账款台账', 'p-pay', [P('查看', 'b-pay-view'), P('审核', 'b-pay-audit')])
  ]),
  M('数据看板', 'm-dash', [M('经营数据看板', 'p-dash', [P('查看', 'b-dash-view'), P('导出', 'b-dash-export')])]),
  M('系统设置', 'm-sys', [
    M('职位管理', 'p-post', [P('查看', 'b-post-view'), P('新建', 'b-post-add'), P('编辑', 'b-post-edit')]),
    M('账号管理', 'p-acc', [P('查看', 'b-acc-view'), P('新建', 'b-acc-add'), P('重置密码', 'b-acc-pwd')]),
    M('权限管理', 'p-perm', [P('查看', 'b-perm-view'), P('保存分配', 'b-perm-save')]),
    M('发货仓设置', 'p-wh', [P('查看', 'b-wh-view'), P('更改地区', 'b-wh-edit')])
  ])
]

const defaultKeys = [
  'b-review-view', 'b-review-pass', 'b-review-reject', 'b-pending-view', 'b-pending-edit',
  'b-shipped-view', 'b-done-view', 'b-stock-view', 'b-stock-warn', 'b-dash-view'
]

const flatButtons = nodes => nodes.flatMap(n => (n.children ? flatButtons(n.children) : [n]))
const totalCount = computed(() => flatButtons(tree).length)
const checkedCount = ref(defaultKeys.length)

function onCheck() {
  const checked = treeRef.value.getCheckedKeys(true)
  checkedCount.value = checked.filter(k => k.startsWith('b-')).length
}
function restore() {
  treeRef.value.setCheckedKeys(defaultKeys)
  checkedCount.value = defaultKeys.length
  ElMessage.success('已恢复该职位的默认权限')
}
function save() {
  ElMessage.success(`权限已保存，${current.value} 职位下 3 个账号已同步`)
}
</script>

<style scoped>
.layout { display: grid; grid-template-columns: 220px 1fr; gap: 12px; }
.plist { padding: 6px 0; }
.pitem { display: flex; align-items: center; padding: 9px 16px; cursor: pointer; font-size: 13px; }
.pitem:hover { background: var(--fill); }
.pitem.on { background: var(--brand-l); color: var(--brand-d); font-weight: 600; border-right: 3px solid var(--brand); }
.pitem .pc { margin-left: auto; font-size: 11.5px; color: var(--ink-3); }
.pitem.on .pc { color: var(--brand-d); }
.tree { padding: 12px 16px 18px; max-height: 640px; overflow: auto; }
.node .label { font-size: 13px; }
:deep(.el-tree-node__content) { height: 30px; }
</style>
