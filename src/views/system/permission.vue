<template>
  <div>
    <PageHeader title="权限管理" :sub="`以「职位」为单位分配权限，粒度到 模块 → 页面 → 操作。每个页面第一项「查看页面」是只读权限：只勾它则该职位进得去但点不动；勾上后面的操作才算可操作。未勾选的页面与操作，该职位菜单里看不到、地址栏也进不去。全站共 ${PAGES.length} 个页面 / ${TOTAL_PERMS} 项权限点。`">
      <el-button v-can="'b-sys-perm-restore'" size="small" @click="restore">恢复默认</el-button>
      <el-button v-can="'b-sys-perm-save'" size="small" type="primary" :plain="!dirty" :disabled="!dirty" @click="save">
        {{ dirty ? '保存分配' : '已保存' }}
      </el-button>
    </PageHeader>

    <div class="layout">
      <div class="card posts">
        <div class="card-head"><h3>职位</h3><span class="extra">{{ posts.length }} 个</span></div>
        <div class="plist">
          <div v-for="p in posts" :key="p.id" class="pitem" :class="{ on: current === p.id }" @click="selectPost(p.id)">
            <div class="pi-l">
              <span class="pn">{{ p.name }}<em v-if="p.builtin" class="bi">内置</em><em v-if="p.status === '停用'" class="bi off">停用</em></span>
              <span class="pd">{{ p.dept }}</span>
            </div>
            <span class="pc">{{ pageCount(p) }} 页 · {{ p.perms.length }} 项</span>
          </div>
        </div>
        <div class="p-note">
          共 {{ PAGES.length }} 个页面、{{ TOTAL_PERMS }} 项权限点。只读职位只勾「查看页面」，操作一项不勾。
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>{{ curPost?.name }} · 权限树</h3>
          <el-tag v-if="curPost?.status === '停用'" size="small" type="warning" effect="plain" style="margin-left:6px">职位已停用，账号无法登录</el-tag>
          <span class="meta">{{ curPost?.dept }} · {{ curPost?.scope }}</span>
          <span class="extra">
            <el-button link type="primary" size="small" @click="checkAll">全选</el-button>
            <el-button link type="primary" size="small" @click="clearAll">清空</el-button>
            <el-button link type="primary" size="small" @click="toggleExpand">{{ expanded ? '收起' : '展开' }}</el-button>
          </span>
        </div>

        <div class="summary">
          <div class="sm">
            <span class="sm-n">{{ checkedCount }}</span>
            <span class="sm-l">已勾选 / {{ TOTAL_PERMS }} 项</span>
          </div>
          <div class="sm">
            <span class="sm-n">{{ viewPages }}</span>
            <span class="sm-l">可进入页面 / {{ PAGES.length }}</span>
          </div>
          <div class="sm">
            <span class="sm-n ok">{{ opPages }}</span>
            <span class="sm-l">可操作页面</span>
          </div>
          <div class="sm">
            <span class="sm-n warn">{{ viewPages - opPages }}</span>
            <span class="sm-l">仅查看页面</span>
          </div>
        </div>

        <div class="tree">
          <el-tree
            ref="treeRef"
            :data="MODULES"
            show-checkbox
            node-key="id"
            :default-expanded-keys="expandedKeys"
            :props="{ label: 'label', children: 'children' }"
            @check="onCheck">
            <template #default="{ data }">
              <span class="node" :class="{ mod: isModule(data), page: isPage(data) }">
                <span class="label">{{ data.label }}</span>
                <template v-if="isPage(data)">
                  <span class="path">{{ data.path }}</span>
                  <el-tag v-if="pageState(data) === 'readonly'" size="small" type="info" effect="plain">只读页</el-tag>
                  <el-tag v-else-if="pageState(data) === 'op'" size="small" type="success" effect="plain">可操作</el-tag>
                  <el-tag v-else-if="pageState(data) === 'read'" size="small" type="info" effect="plain">仅查看</el-tag>
                  <el-tag v-else size="small" type="warning" effect="plain">未授权</el-tag>
                  <el-button v-if="pageState(data) === 'op'" link type="info" size="small" class="ro" @click.stop="setReadOnly(data)">改为仅查看</el-button>
                </template>
                <span v-if="data.children" class="badge" :class="{ full: stat(data).c === stat(data).t }">
                  {{ stat(data).c }} / {{ stat(data).t }}
                </span>
              </span>
            </template>
          </el-tree>
        </div>

        <div class="t-foot">
          勾模块 = 其下全部页面与操作一并勾选；取消任一子项模块变半选。勾任一操作会自动补上该页「查看页面」；取消「查看页面」会清空该页所有操作。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { posts, accountsOfPost } from '@/data/system'
import {
  MODULES, PAGES, ALL_BUTTON_IDS, TOTAL_PERMS, PAGE_BY_ID, PAGE_OF_OP, defaultsFor, savePermsToStorage
} from '@/data/perm'

const route = useRoute()
const treeRef = ref(null)
const current = ref(posts.find(p => !p.builtin)?.id || posts[0].id)
const checkedKeys = ref([])
const expanded = ref(true)

const curPost = computed(() => posts.find(p => p.id === current.value) || posts[0])
const isBoss = computed(() => curPost.value?.builtin === true)

/* 全展开：模块 + 页面 */
const expandedKeys = computed(() => expanded.value
  ? [...MODULES.map(m => m.id), ...PAGES.map(p => p.id)]
  : [])

const checkedCount = computed(() => checkedKeys.value.length)
const viewPages = computed(() => PAGES.filter(p => checkedKeys.value.includes(p.children[0].id)).length)
const opPages = computed(() => PAGES.filter(p => p.children.slice(1).some(o => checkedKeys.value.includes(o.id))).length)

const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x))
const dirty = computed(() => !sameSet(checkedKeys.value, curPost.value.perms || []))

const pageCount = p => PAGES.filter(x => (p.perms || []).includes(x.children[0].id)).length

const isModule = d => !!d.children && d.children.some(c => c.children)
const isPage = d => !!d.children && !d.children.some(c => c.children)

/** 页面状态：readonly 本身无操作的只读页 / op 可操作 / read 仅查看 / none 未授权 */
function pageState(page) {
  const viewId = page.children[0].id
  if (page.children.length === 1) return checkedKeys.value.includes(viewId) ? 'readonly' : 'none'
  if (page.children.slice(1).some(o => checkedKeys.value.includes(o.id))) return 'op'
  if (checkedKeys.value.includes(viewId)) return 'read'
  return 'none'
}

const leafIdsOf = node => node.children
  ? node.children.flatMap(c => c.children ? leafIdsOf(c) : [c.id])
  : [node.id]
const stat = d => {
  const ids = leafIdsOf(d)
  return { c: ids.filter(i => checkedKeys.value.includes(i)).length, t: ids.length }
}

/* 切换职位：回填已保存权限 */
function syncFromPost() {
  checkedKeys.value = [...(curPost.value.perms || [])]
  nextTick(() => {
    treeRef.value?.setCheckedKeys(checkedKeys.value)
    checkedKeys.value = treeRef.value?.getCheckedKeys(true) || checkedKeys.value
  })
}
watch(current, syncFromPost, { immediate: true })

/** 切换职位：有未保存的修改时先二次确认，避免误点丢掉刚勾的权限 */
async function selectPost(id) {
  if (id === current.value) return
  if (dirty.value) {
    try {
      await ElMessageBox.confirm(
        `切换职位将放弃对「${curPost.value.name}」未保存的权限修改，是否继续？`,
        '未保存的修改',
        { confirmButtonText: '放弃修改', cancelButtonText: '取消', type: 'warning' }
      )
    } catch (e) {
      return
    }
  }
  current.value = id
}

/**
 * 勾选后维持两条不变式：
 *   1. 勾了任一操作 → 自动补上该页「查看页面」
 *   2. 取消了「查看页面」→ 该页所有操作一并清掉
 */
let fixing = false
function onCheck(data) {
  if (fixing) return
  const keys = new Set(treeRef.value?.getCheckedKeys(true) || [])
  const before = keys.size

  const pageOfNode = PAGE_BY_ID[data?.id] || PAGE_OF_OP[data?.id]
  const isViewNode = !!pageOfNode && pageOfNode.children[0].id === data?.id

  if (isViewNode && !keys.has(data.id)) {
    /* 用户主动取消「查看页面」：该页所有操作一并清掉，且不要再被下面的规则补回查看权 */
    pageOfNode.children.slice(1).forEach(o => keys.delete(o.id))
  } else {
    /* 补齐：勾了任一操作就必须带上该页「查看页面」 */
    keys.forEach(id => {
      const page = PAGE_OF_OP[id]
      if (page && id !== page.children[0].id) keys.add(page.children[0].id)
    })
    /* 兜底：没有查看权的页面，残留操作一律清掉 */
    PAGES.forEach(page => {
      const viewId = page.children[0].id
      if (!keys.has(viewId)) page.children.slice(1).forEach(o => keys.delete(o.id))
    })
  }

  const next = [...keys]
  checkedKeys.value = next
  if (next.length !== before) {
    fixing = true
    nextTick(() => {
      treeRef.value?.setCheckedKeys(next)
      fixing = false
    })
  }
}

/* 一键把某页改成「仅查看」 */
function setReadOnly(page) {
  const keys = new Set(checkedKeys.value)
  page.children.slice(1).forEach(o => keys.delete(o.id))
  keys.add(page.children[0].id)
  checkedKeys.value = [...keys]
  treeRef.value?.setCheckedKeys([...keys])
}

function checkAll() {
  checkedKeys.value = [...ALL_BUTTON_IDS]
  treeRef.value?.setCheckedKeys([...ALL_BUTTON_IDS])
}

function clearAll() {
  checkedKeys.value = []
  treeRef.value?.setCheckedKeys([])
}

function restore() {
  const def = defaultsFor(curPost.value)
  checkedKeys.value = [...def]
  treeRef.value?.setCheckedKeys(def)
  ElMessage.success(`已恢复「${curPost.value.name}」的默认权限（${def.length} 项），点「保存分配」后生效`)
}

function save() {
  if (!dirty.value) return
  if (!checkedKeys.value.length) {
    return ElMessage.error('至少勾选一个页面权限，否则该职位下的账号登录后没有任何页面可访问')
  }
  curPost.value.perms = [...checkedKeys.value]
  savePermsToStorage()
  const n = accountsOfPost(current.value).length
  const tail = isBoss.value ? '，老板账号也按新勾选生效' : ''
  ElMessage.success(`权限已保存：${viewPages.value} 个页面（其中 ${opPages.value} 个可操作）、${checkedKeys.value.length} 项权限点，${curPost.value.name} 职位下 ${n} 个账号已同步${tail}`)
}

function toggleExpand() {
  expanded.value = !expanded.value
  nextTick(() => {
    if (!expanded.value) {
      treeRef.value?.store._getAllNodes().forEach(n => { n.expanded = false })
    } else {
      treeRef.value?.store._getAllNodes().forEach(n => { n.expanded = true })
    }
  })
}

onMounted(() => {
  const id = route.query.post
  if (id && posts.some(p => p.id === id)) current.value = id
})
</script>

<style scoped>
.layout { display: grid; grid-template-columns: 248px 1fr; gap: 12px; align-items: start; }
.posts { position: sticky; top: 0; }
.plist { padding: 6px 0; }
.pitem { display: flex; align-items: center; padding: 8px 16px; cursor: pointer; }
.pitem:hover { background: var(--fill); }
.pitem.on { background: var(--brand-l); border-right: 3px solid var(--brand); }
.pitem.on .pn, .pitem.on .pc { color: var(--brand-d); font-weight: 600; }
.pi-l { display: flex; flex-direction: column; line-height: 1.35; }
.pn { font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }
.bi { font-style: normal; font-size: 10px; line-height: 14px; padding: 0 4px; border-radius: 3px; background: var(--fill); color: var(--ink-3); font-weight: 400; }
.bi.off { background: #FFF3E6; color: #B26B00; }
.pd { font-size: 10.5px; color: var(--ink-3); }
.pc { margin-left: auto; font-size: 11px; color: var(--ink-3); white-space: nowrap; }
.p-note { font-size: 11.5px; line-height: 1.7; color: var(--ink-3); padding: 10px 16px 14px; border-top: 1px dashed var(--line-2); margin-top: 6px; }
.meta { margin-left: 10px; font-size: 11.5px; color: var(--ink-3); }
.card-head .extra { display: inline-flex; align-items: center; gap: 8px; }

.summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 12px 16px 0; }
.sm { background: var(--fill); border-radius: 8px; padding: 8px 12px; display: flex; flex-direction: column; gap: 2px; }
.sm-n { font-size: 18px; font-weight: 600; letter-spacing: -.3px; color: var(--brand-d); }
.sm-n.ok { color: var(--ok); }
.sm-n.warn { color: #B26B00; }
.sm-l { font-size: 11px; color: var(--ink-3); }

.tree { padding: 10px 16px 6px; max-height: 560px; overflow: auto; }
.node { display: flex; align-items: center; gap: 8px; min-width: 0; }
.label { font-size: 13px; }
.node.mod .label { font-size: 13px; font-weight: 600; }
.node.page .label { color: var(--ink-2); }
.path { font-size: 10.5px; color: var(--ink-3); font-family: var(--font-mono, monospace); }
.ro { opacity: 0; transition: opacity .15s; font-size: 11px; }
.node.page:hover .ro { opacity: 1; }
.badge {
  font-size: 10.5px; line-height: 16px; padding: 0 6px; border-radius: 8px;
  background: var(--fill); color: var(--ink-3); font-variant-numeric: tabular-nums;
}
.badge.full { background: var(--ok-l); color: var(--ok); }
.t-foot { font-size: 11.5px; color: var(--ink-3); line-height: 1.7; padding: 10px 16px 14px; border-top: 1px dashed var(--line-2); }
:deep(.el-tree-node__content) { height: 30px; }
</style>
