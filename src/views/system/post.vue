<template>
  <div>
    <PageHeader title="职位管理" sub="职位同时承担「人事岗位」与「权限载体」两个职责：一个职位可关联多个账号，账号的菜单与按钮权限完全继承所属职位。老板职位为系统内置，不可停用、不可删除。">
      <el-button v-can="'b-sys-post-export'" size="small" @click="exportPosts">导出</el-button>
      <el-button v-can="'b-sys-post-create'" size="small" type="primary" @click="openNew">新建职位</el-button>
    </PageHeader>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="搜索职位名称 / 关联人员" style="width: 240px" clearable />
      <el-button size="small" type="primary" @click="noop">查询</el-button>
      <el-button size="small" @click="kw = ''">重置</el-button>
      <span class="count">共 {{ view.length }} 个职位</span>
    </div>

    <div class="layout">
      <!-- 部门 / 职位树 -->
      <div class="card tree-card">
        <div class="card-head"><h3>部门</h3><span class="extra">{{ posts.length }} 个职位</span></div>
        <div class="dlist">
          <div class="ditem" :class="{ on: dept === '' }" @click="dept = ''">
            <span class="dn">全部职位</span>
            <span class="dc">{{ posts.length }}</span>
          </div>
          <div v-for="d in DEPTS" :key="d" class="ditem" :class="{ on: dept === d }" @click="dept = d">
            <span class="dn">{{ d }}</span>
            <span class="dc">{{ posts.filter(p => p.dept === d).length }}</span>
          </div>
        </div>
        <div class="tree-note">未配权限的职位，其账号登录后看不到任何菜单。</div>
      </div>

      <!-- 职位列表 -->
      <div class="card">
        <div class="card-head">
          <h3>{{ dept || '全部职位' }}</h3>
          <span class="extra">数据范围管可见条数，权限管可进入页面与可点按钮</span>
        </div>
        <el-table :data="view" size="small" max-height="560">
          <el-table-column prop="name" label="职位名称" min-width="160">
            <template #default="{ row }">
              <span>{{ row.name }}</span>
              <el-tag v-if="row.builtin" size="small" type="info" effect="plain" style="margin-left:6px">内置</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="dept" label="所属部门" min-width="140" />
          <el-table-column label="关联账号" min-width="110" align="right">
            <template #default="{ row }"><span class="mono">{{ countOf(row.id) }}</span></template>
          </el-table-column>
          <el-table-column prop="scope" label="数据范围" min-width="150" />
          <el-table-column label="状态" min-width="96">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status === '启用' ? 'success' : 'info'" effect="plain">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="已有权限" min-width="130">
            <template #default="{ row }">
              <span class="mono">{{ row.perms.length }} / {{ TOTAL_PERMS }} 项</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="216" fixed="right">
            <template #default="{ row }">
              <div class="ops">
                <el-button link type="primary" size="small" @click="openView(row)">查看</el-button>
                <el-button v-can="'b-sys-post-perm'" link type="primary" size="small" @click="goPerm(row)">编辑权限</el-button>
                <el-tooltip :disabled="!row.builtin" content="老板职位为系统内置，不可停用" placement="top">
                  <span class="op-wrap">
                    <el-button link :type="row.builtin ? 'info' : 'primary'" size="small" :disabled="row.builtin"
                      @click="toggleStatus(row)">{{ row.status === '启用' ? '停用' : '启用' }}</el-button>
                  </span>
                </el-tooltip>
                <el-button v-can="'b-sys-post-staff'" link type="primary" size="small" @click="openPeople(row)">人员</el-button>
                <el-tooltip :disabled="!row.builtin" content="老板职位不可删除" placement="top">
                  <span class="op-wrap">
                    <el-button v-can="'b-sys-post-delete'" link :type="row.builtin ? 'info' : 'danger'" size="small" :disabled="row.builtin"
                      @click="removePost(row)">删除</el-button>
                  </span>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 新建职位 -->
    <el-dialog v-model="newVisible" title="新建职位" width="560px">
      <div class="field"><label>职位名称</label>
        <el-input v-model="nf.name" size="small" placeholder="仅支持汉字和数字，同部门内不可重名" style="width:240px" />
      </div>
      <div class="field"><label>所属部门</label>
        <el-select v-model="nf.dept" size="small" style="width:240px">
          <el-option v-for="d in DEPTS" :key="d" :label="d" :value="d" />
        </el-select>
      </div>
      <div class="field"><label>数据范围</label>
        <el-select v-model="nf.scope" size="small" style="width:240px">
          <el-option v-for="s in SCOPES" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
      <div class="field"><label>权限模板</label>
        <el-select v-model="nf.template" size="small" style="width:240px">
          <el-option label="空白（稍后在权限管理分配）" value="blank" />
          <el-option v-for="p in posts" :key="p.id" :label="'复制自 ' + p.name" :value="p.id" />
        </el-select>
      </div>
      <div class="field" style="align-items:flex-start">
        <label style="padding-top:5px">职位说明</label>
        <el-input v-model="nf.note" type="textarea" :rows="2" size="small" placeholder="选填" />
      </div>
      <el-alert class="tipbox" type="info" :closable="false"
        title="提交后职位为启用状态、关联账号 0；请到「权限管理」分配权限，未配权限的职位其账号登录后看不到任何菜单。" />
      <template #footer>
        <el-button @click="newVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNew">确定</el-button>
      </template>
    </el-dialog>

    <!-- 职位详情 -->
    <el-drawer v-model="viewVisible" size="620px" :title="curPost ? curPost.name + ' · 职位详情' : ''">
      <template v-if="curPost">
        <div class="sec-t">基础信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="职位名称">{{ curPost.name }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ curPost.dept }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ curPost.status }}</el-descriptions-item>
          <el-descriptions-item label="数据范围">{{ curPost.scope }}</el-descriptions-item>
          <el-descriptions-item label="关联账号">{{ countOf(curPost.id) }} 个</el-descriptions-item>
          <el-descriptions-item label="已配权限">{{ curPost.perms.length }} 项 / 共 {{ TOTAL_PERMS }} 项</el-descriptions-item>
          <el-descriptions-item label="人员姓名" :span="2">{{ peopleNames(curPost.id) || '暂无关联人员' }}</el-descriptions-item>
          <el-descriptions-item label="职位说明" :span="2">{{ curPost.note || '—' }}</el-descriptions-item>
        </el-descriptions>

        <div class="sec-t" style="margin-top:18px">权限情况</div>
        <div v-for="m in PERM_TREE" :key="m.id" class="pm">
          <div class="pm-h">
            <b>{{ m.label }}</b>
            <span class="sub">{{ checkedIn(m) }} / {{ moduleTotal(m) }} 项</span>
          </div>
          <div v-for="pg in m.children" :key="pg.id" class="pm-row">
            <span class="pm-p">{{ pg.label }}</span>
            <span v-if="checkedBtns(pg).length" class="tags">
              <el-tag v-for="b in checkedBtns(pg)" :key="b.id" size="small" type="info" effect="plain">{{ b.label }}</el-tag>
            </span>
            <span v-else class="sub">未分配</span>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button size="small" @click="viewVisible = false">关闭</el-button>
        <el-button v-can="'b-sys-post-export'" size="small" @click="exportOne(curPost)">导出</el-button>
        <el-button v-can="'b-sys-post-perm'" size="small" type="primary" @click="goPerm(curPost)">编辑权限</el-button>
      </template>
    </el-drawer>

    <!-- 职位下人员 -->
    <el-dialog v-model="peopleVisible" :title="(curPost?.name || '') + ' · 职位下人员'" width="600px">
      <el-table :data="peopleRows" size="small" border>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="account" label="登录账号" width="120" />
        <el-table-column label="所属部门" width="110">
          <template #default="{ row }">{{ curPost?.dept }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === '启用' ? 'success' : 'info'" effect="plain">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-tooltip :disabled="!curPost?.builtin" content="老板职位不可移除人员" placement="top">
              <span class="op-wrap">
                <el-button link type="danger" size="small" :disabled="curPost?.builtin" @click="removePerson(row)">移除</el-button>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import {
  posts, accounts, DEPTS, SCOPES,
  accountsOfPost, setPostStatus
} from '@/data/system'
import { PERM_TREE, TOTAL_PERMS } from '@/data/perm'

const router = useRouter()
const kw = ref('')
const dept = ref('')

const countOf = id => accountsOfPost(id).length
const peopleNames = id => accountsOfPost(id).map(a => a.name).join('、')

const view = computed(() => posts.filter(p => {
  const okD = !dept.value || p.dept === dept.value
  const k = kw.value.trim()
  const okK = !k || p.name.includes(k) || accountsOfPost(p.id).some(a => a.name.includes(k))
  return okD && okK
}))

const noop = () => {}

/* ---------- 新建职位 ---------- */
const newVisible = ref(false)
const nf = reactive({ name: '', dept: '售后部', scope: '本部门', template: '', note: '' })
function openNew() {
  nf.name = ''
  nf.dept = dept.value || '售后部'
  nf.scope = '本部门'
  nf.template = ''
  nf.note = ''
  newVisible.value = true
}
function submitNew() {
  const name = nf.name.trim()
  if (!name) return ElMessage.error('请填写职位名称')
  if (!/^[\u4e00-\u9fa5\d]+$/.test(name)) return ElMessage.error('职位名称仅支持汉字和数字')
  if (posts.some(p => p.dept === nf.dept && p.name === name)) return ElMessage.error('同一部门内职位名称不可重复')
  const tpl = posts.find(p => p.id === nf.template)
  posts.push({
    id: 'post-' + Date.now(),
    name,
    dept: nf.dept,
    scope: nf.scope,
    status: '启用',
    perms: tpl ? [...tpl.perms] : [],
    note: nf.note
  })
  newVisible.value = false
  ElMessage.success(tpl
    ? `已新建职位「${name}」，权限复制自「${tpl.name}」共 ${tpl.perms.length} 项`
    : `已新建职位「${name}」，关联账号 0；请到权限管理分配权限`)
}

/* ---------- 查看 ---------- */
const viewVisible = ref(false)
const curPost = ref(null)
function openView(row) { curPost.value = row; viewVisible.value = true }

const checkedIn = m => m.children.reduce((n, pg) => n + checkedBtns(pg).length, 0)
const moduleTotal = m => m.children.reduce((n, pg) => n + pg.children.length, 0)
const checkedBtns = pg => pg.children.filter(b => curPost.value?.perms.includes(b.id))

/* ---------- 跳转权限 ---------- */
function goPerm(row) {
  if (!row) return
  viewVisible.value = false
  router.push({ path: '/system/permission', query: { post: row.id } })
}

/* ---------- 停用 / 启用 ---------- */
async function toggleStatus(row) {
  if (row.builtin) return
  const next = row.status === '启用' ? '停用' : '启用'
  const n = countOf(row.id)
  try {
    if (next === '停用') {
      await ElMessageBox.confirm(
        n > 0
          ? `「${row.name}」下的 ${n} 个账号会同步停用、立即无法登录。重新启用职位后，账号需在「账号管理」中逐个启用。`
          : `停用后该职位不可再指派给新账号，已分配的历史记录保留。`,
        '停用职位', { confirmButtonText: '停用', cancelButtonText: '取消', type: 'warning' }
      )
    } else if (n > 0) {
      await ElMessageBox.confirm(
        `启用职位后，其下的 ${n} 个账号不会自动恢复，需在「账号管理」中单独启用。`,
        '启用职位', { confirmButtonText: '启用', cancelButtonText: '取消', type: 'info' }
      )
    }
    const { affected } = setPostStatus(row.id, next)
    const extra = next === '停用' && affected.length ? `，${affected.length} 个账号已同步停用` : ''
    ElMessage.success(`职位「${row.name}」已${next}${extra}`)
  } catch (e) { /* 取消 */ }
}

/* ---------- 删除 ---------- */
async function removePost(row) {
  if (row.builtin) return
  const n = countOf(row.id)
  if (n > 0) {
    return ElMessageBox.alert(`该职位下还有 ${n} 个账号，请先调整账号所属职位。`, '无法删除', { type: 'warning' })
      .catch(() => {})
  }
  try {
    await ElMessageBox.confirm('删除后不可恢复，历史操作日志仍会保留。确定删除该职位？', '删除职位',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    const i = posts.findIndex(p => p.id === row.id)
    if (i > -1) posts.splice(i, 1)
    ElMessage.success('职位已删除')
  } catch (e) { /* 取消 */ }
}

/* ---------- 人员 ---------- */
const peopleVisible = ref(false)
const peopleRows = computed(() => curPost.value ? accountsOfPost(curPost.value.id) : [])
function openPeople(row) { curPost.value = row; peopleVisible.value = true }
async function removePerson(acc) {
  try {
    await ElMessageBox.confirm(`移除后「${acc.name}」将失去「${curPost.value.name}」的全部权限，确定移除？`, '移除人员',
      { confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning' })
    acc.postId = ''
    ElMessage.success('已移除，请在账号管理中重新指派职位')
  } catch (e) { /* 取消 */ }
}

/* ---------- 导出 ---------- */
function download(name, text) {
  const blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
function exportPosts() {
  const head = ['职位名称', '所属部门', '关联账号', '数据范围', '状态', '已有权限', '职位说明']
  const rows = view.value.map(p => [p.name, p.dept, countOf(p.id), p.scope, p.status, `${p.perms.length}/${TOTAL_PERMS}`, p.note || ''])
  download(`职位列表-${new Date().toISOString().slice(0, 10)}.csv`,
    [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'))
  ElMessage.success(`已导出 ${view.value.length} 个职位`)
}
function exportOne(p) {
  if (!p) return
  const lines = [`职位：${p.name}`, `部门：${p.dept}`, `数据范围：${p.scope}`, `权限：${p.perms.length}/${TOTAL_PERMS}`, '']
  PERM_TREE.forEach(m => {
    lines.push(`【${m.label}】`)
    m.children.forEach(pg => {
      const c = pg.children.filter(b => p.perms.includes(b.id)).map(b => b.label)
      lines.push(`  ${pg.label}：${c.length ? c.join('、') : '未分配'}`)
    })
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${p.name}-权限清单.txt`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('权限清单已导出')
}
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.layout { display: grid; grid-template-columns: 208px 1fr; gap: 12px; align-items: start; }
.tree-card { position: sticky; top: 0; }
.dlist { padding: 6px 0; }
.ditem { display: flex; align-items: center; padding: 9px 16px; cursor: pointer; font-size: 13px; }
.ditem:hover { background: var(--fill); }
.ditem.on { background: var(--brand-l); color: var(--brand-d); font-weight: 600; border-right: 3px solid var(--brand); }
.ditem .dc { margin-left: auto; font-size: 11.5px; color: var(--ink-3); }
.ditem.on .dc { color: var(--brand-d); }
.tree-note { font-size: 11.5px; line-height: 1.7; color: var(--ink-3); padding: 10px 16px 14px; border-top: 1px dashed var(--line-2); margin-top: 6px; }

.ops { display: flex; align-items: center; gap: 9px; white-space: nowrap; }
.ops .el-button { height: auto; padding: 0; margin: 0; font-size: 12.5px; }
.ops .el-button.is-disabled { color: #B6BDC5; }
.op-wrap { display: inline-flex; }

.sec-t { font-size: 12.5px; font-weight: 600; margin-bottom: 9px; padding-left: 8px; border-left: 3px solid var(--brand); }
.field { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.field label { width: 80px; font-size: 12.5px; color: var(--ink-2); flex: none; }
.tipbox { margin-top: 6px; }
.sub { font-size: 11px; color: var(--ink-3); }
.tip { font-size: 11.5px; color: var(--ink-3); line-height: 1.7; }

.pm { border: 1px solid var(--line-2); border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; }
.pm-h { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.pm-h b { font-size: 12.5px; }
.pm-row { display: flex; align-items: flex-start; gap: 10px; padding: 4px 0; }
.pm-p { width: 110px; flex: none; font-size: 12px; color: var(--ink-2); }
.tags { display: flex; gap: 5px; flex-wrap: wrap; }
</style>
