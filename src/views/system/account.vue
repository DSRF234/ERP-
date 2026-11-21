<template>
  <div>
    <PageHeader title="账号管理" sub="员工登录账号，权限完全继承所属职位，不在账号层单独授权。一位员工仅允许一个登录账号，登录账号全局唯一。">
      <el-button size="small" @click="exportAccounts">导出</el-button>
      <el-button size="small" type="primary" @click="openNew">新建账号</el-button>
    </PageHeader>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="姓名 / 账号 / 手机号" style="width: 220px" clearable />
      <el-select v-model="f.post" size="small" style="width: 140px" placeholder="全部职位">
        <el-option label="全部职位" value="" />
        <el-option v-for="p in posts" :key="p.id" :label="p.name" :value="p.id" />
      </el-select>
      <el-select v-model="f.status" size="small" style="width: 120px" placeholder="全部状态">
        <el-option label="全部状态" value="" />
        <el-option label="启用" value="启用" />
        <el-option label="停用" value="停用" />
      </el-select>
      <el-button size="small" type="primary" @click="noop">查询</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 个账号</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>账号列表</h3>
        <span class="extra">初始密码 {{ INIT_PASSWORD }}，首次登录强制修改</span>
      </div>
      <el-table :data="view" size="small" max-height="580">
        <el-table-column prop="name" label="姓名" width="96" />
        <el-table-column prop="account" label="登录账号" width="116">
          <template #default="{ row }"><span class="mono">{{ row.account }}</span></template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="118">
          <template #default="{ row }"><span class="mono">{{ row.phone || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="所属职位" width="136">
          <template #default="{ row }">
            <span v-if="row.postId">{{ postName(row.postId) }}</span>
            <span v-else class="muted">未分配</span>
            <el-tooltip v-if="isPostDisabled(row)" content="该职位已停用，其下账号已同步停用、无法登录" placement="top">
              <el-tag size="small" type="warning" effect="plain" style="margin-left:5px">职位停用</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="所属部门" width="110">
          <template #default="{ row }">{{ deptOfAccount(row) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="76">
          <template #default="{ row }">
            <el-tooltip :disabled="!isPostDisabled(row)" content="所属职位已停用，账号同步停用；职位启用后需在本页单独启用" placement="top">
              <el-tag size="small" :type="row.status === '启用' ? 'success' : 'info'" effect="plain">{{ row.status }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" label="最近登录" width="134">
          <template #default="{ row }"><span class="sub">{{ row.lastLogin || '从未登录' }}</span></template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="110">
          <template #default="{ row }"><span class="sub">{{ row.remark || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="212" fixed="right">
          <template #default="{ row }">
            <div class="ops">
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="primary" size="small" @click="resetPwd(row)">重置密码</el-button>
              <el-tooltip :disabled="!statusTip(row)" :content="statusTip(row)" placement="top">
                <span class="op-wrap">
                  <el-button link :type="statusLocked(row) ? 'info' : 'primary'" size="small" :disabled="statusLocked(row)"
                    @click="toggleStatus(row)">{{ row.status === '启用' ? '停用' : '启用' }}</el-button>
                </span>
              </el-tooltip>
              <el-tooltip :disabled="!isBoss(row)" content="老板账号不可删除" placement="top">
                <span class="op-wrap">
                  <el-button link :type="isBoss(row) ? 'info' : 'danger'" size="small" :disabled="isBoss(row)"
                    @click="removeAcc(row)">删除</el-button>
                </span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新建 / 编辑 -->
    <el-dialog v-model="dlgVisible" :title="editing ? '编辑账号' : '新建账号'" width="520px">
      <div class="field"><label>姓名</label>
        <el-input v-model="af.name" size="small" placeholder="仅支持汉字和「·」" style="width:240px" />
      </div>
      <div class="field"><label>登录账号</label>
        <el-input v-model="af.account" size="small" placeholder="姓名的拼音，全局唯一" style="width:240px" />
      </div>
      <div class="field"><label>手机号</label>
        <el-input v-model="af.phone" size="small" placeholder="选填，11 位数字，用于找回密码" style="width:240px" />
      </div>
      <div class="field"><label>所属职位</label>
        <el-select v-model="af.postId" size="small" style="width:240px" placeholder="仅可指派启用状态的职位">
          <el-option v-for="p in postOptions" :key="p.id" :value="p.id" :disabled="p.status === '停用'"
            :label="`${p.name} · ${p.dept}${p.status === '停用' ? '（已停用）' : ''}`" />
        </el-select>
      </div>
      <div v-if="!editing" class="field"><label>初始密码</label>
        <el-input v-model="af.password" size="small" style="width:240px" disabled />
        <span class="hint">首次登录强制改密</span>
      </div>
      <div class="field"><label>状态</label>
        <el-radio-group v-model="af.status" size="small">
          <el-radio label="启用" :disabled="formPostDisabled">启用</el-radio>
          <el-radio label="停用">停用</el-radio>
        </el-radio-group>
        <span v-if="formPostDisabled" class="hint">所属职位已停用，账号只能保持停用</span>
      </div>
      <div class="field" style="align-items:flex-start">
        <label style="padding-top:5px">备注</label>
        <el-input v-model="af.remark" type="textarea" :rows="2" size="small" placeholder="选填" />
      </div>
      <el-alert class="tipbox" type="info" :closable="false"
        :title="editing ? '职位变更后权限随之变更，最近登录记录保留。' : '提交后账号立即继承职位权限，首次登录强制修改密码。'" />
      <template #footer>
        <el-button @click="dlgVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAcc">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import {
  accounts, posts, INIT_PASSWORD, postById, postName,
  deptOfAccount, accountsOfPost
} from '@/data/system'

const kw = ref('')
const f = reactive({ post: '', status: '' })

const view = computed(() => accounts.filter(a => {
  const k = kw.value.trim()
  const okK = !k || [a.name, a.account, a.phone].some(v => String(v).includes(k))
  const okP = !f.post || a.postId === f.post
  const okS = !f.status || a.status === f.status
  return okK && okP && okS
}))

const reset = () => { kw.value = ''; f.post = ''; f.status = '' }
const noop = () => {}
const isBoss = a => postById(a.postId)?.builtin === true
const isPostDisabled = a => !!a.postId && postById(a.postId)?.status === '停用'

/* 启停按钮：老板内置不可动；职位停用期间不允许单独启用账号（否则又出现「职位停用 + 账号启用」的矛盾） */
const statusLocked = row => isBoss(row) || (row.status !== '启用' && isPostDisabled(row))
const statusTip = row => {
  if (isBoss(row)) return '老板账号为系统内置，不可停用'
  if (row.status !== '启用' && isPostDisabled(row)) return `所属职位「${postName(row.postId)}」已停用，请先在职位管理中启用职位`
  return ''
}

/* ---------- 新建 / 编辑 ---------- */
const dlgVisible = ref(false)
const editing = ref(null)
const af = reactive({ name: '', account: '', phone: '', postId: '', password: INIT_PASSWORD, status: '启用', remark: '' })

/* 下拉里保留当前账号已绑定的停用职位，避免编辑时职位被悄悄清空 */
const postOptions = computed(() => posts.filter(p => p.status === '启用' || p.id === af.postId))
const formPostDisabled = computed(() => !!af.postId && postById(af.postId)?.status === '停用')

function openNew() {
  editing.value = null
  Object.assign(af, { name: '', account: '', phone: '', postId: '', password: INIT_PASSWORD, status: '启用', remark: '' })
  dlgVisible.value = true
}
function openEdit(row) {
  editing.value = row
  Object.assign(af, { name: row.name, account: row.account, phone: row.phone, postId: row.postId, password: INIT_PASSWORD, status: row.status, remark: row.remark })
  dlgVisible.value = true
}
function submitAcc() {
  if (!af.name.trim()) return ElMessage.error('请填写姓名')
  if (!/^[\u4e00-\u9fa5·]+$/.test(af.name.trim())) return ElMessage.error('姓名仅支持汉字和「·」')
  if (!af.account.trim()) return ElMessage.error('请填写登录账号')
  if (!/^[a-z][a-z0-9]*$/i.test(af.account.trim())) return ElMessage.error('登录账号使用姓名拼音，只能包含字母和数字')
  if (accounts.some(a => a.account === af.account.trim() && a !== editing.value)) return ElMessage.error('登录账号已存在，请更换')
  if (af.phone && !/^\d{11}$/.test(af.phone)) return ElMessage.error('手机号须为 11 位数字')
  if (!af.postId) return ElMessage.error('账号必须挂在职位上')

  /* 兜底：给已停用职位配「启用」账号，会立刻制造矛盾态 */
  const status = formPostDisabled.value ? '停用' : af.status

  if (editing.value) {
    Object.assign(editing.value, {
      name: af.name.trim(), account: af.account.trim(), phone: af.phone,
      postId: af.postId, status, remark: af.remark
    })
    ElMessage.success('已保存，权限按新职位即时生效')
  } else {
    accounts.push({
      id: 'acc-' + Date.now(), name: af.name.trim(), account: af.account.trim(), phone: af.phone,
      postId: af.postId, status, lastLogin: '', remark: af.remark
    })
    ElMessage.success(`已创建账号 ${af.account.trim()}，初始密码 ${INIT_PASSWORD}`)
  }
  dlgVisible.value = false
}

/* ---------- 重置密码 ---------- */
async function resetPwd(row) {
  try {
    await ElMessageBox.confirm(
      `将「${row.name}」的密码重置为 ${INIT_PASSWORD}，下次登录强制修改，当前登录状态立即失效。`,
      '重置密码', { confirmButtonText: '重置', cancelButtonText: '取消', type: 'warning' }
    )
    ElMessage.success(`密码已重置为 ${INIT_PASSWORD}`)
  } catch (e) { /* 取消 */ }
}

/* ---------- 停用 / 启用 ---------- */
async function toggleStatus(row) {
  if (statusLocked(row)) return ElMessage.warning(statusTip(row))
  const next = row.status === '启用' ? '停用' : '启用'
  try {
    if (next === '停用') {
      await ElMessageBox.confirm('停用后该账号无法登录，历史单据中的处理人姓名仍可追溯。', '停用账号',
        { confirmButtonText: '停用', cancelButtonText: '取消', type: 'warning' })
    }
    row.status = next
    ElMessage.success(`账号已${next}`)
  } catch (e) { /* 取消 */ }
}

/* ---------- 删除 ---------- */
async function removeAcc(row) {
  if (isBoss(row)) return
  try {
    await ElMessageBox.confirm('删除后不可恢复，历史操作日志保留。确定删除该账号？', '删除账号',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    const i = accounts.indexOf(row)
    if (i > -1) accounts.splice(i, 1)
    ElMessage.success('账号已删除')
  } catch (e) { /* 取消 */ }
}

/* ---------- 导出 ---------- */
function exportAccounts() {
  const head = ['姓名', '登录账号', '手机号', '所属职位', '所属部门', '状态', '最近登录', '备注']
  const rows = view.value.map(a => [a.name, a.account, a.phone || '', postName(a.postId), deptOfAccount(a), a.status, a.lastLogin || '', a.remark || ''])
  const csv = [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `账号列表-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success(`已导出 ${view.value.length} 个账号`)
}
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.sub { font-size: 11px; color: var(--ink-3); }
.muted { color: var(--ink-3); }
.ops { display: flex; align-items: center; gap: 9px; white-space: nowrap; }
.ops .el-button { height: auto; padding: 0; margin: 0; font-size: 12.5px; }
.ops .el-button.is-disabled { color: #B6BDC5; }
.op-wrap { display: inline-flex; }
.field { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.field label { width: 74px; font-size: 12.5px; color: var(--ink-2); flex: none; }
.hint { font-size: 11.5px; color: var(--ink-3); }
.tipbox { margin-top: 6px; }
.tip {
  margin-top: 14px; padding: 12px 14px; background: var(--brand-l);
  border: 1px solid #BFE3F2; border-radius: 6px;
  font-size: 12.5px; line-height: 1.8; color: #0E7FB2;
}
.tip b { font-weight: 600; }
</style>
