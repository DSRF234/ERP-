<template>
  <div>
    <PageHeader title="权限管理" :sub="`以「职位」为单位分配权限，粒度到模块 → 页面 → 按钮三级。勾选或取消任意一项后点「保存分配」即生效，职位下所有账号自动继承；系统共 ${TOTAL_PERMS} 项按钮级权限。`">
      <el-button size="small" @click="restore">恢复默认</el-button>
      <el-button size="small" type="primary" :plain="!dirty" :disabled="!dirty" @click="save">
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
            <span class="pc">{{ p.perms.length }} 项</span>
          </div>
        </div>
        <div class="p-note">共 {{ TOTAL_PERMS }} 项按钮级权限，未勾选的页面与按钮该职位不可见。</div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>{{ curPost?.name }} · 权限树</h3>
          <el-tag v-if="curPost?.status === '停用'" size="small" type="warning" effect="plain" style="margin-left:6px">职位已停用，账号无法登录</el-tag>
          <span class="meta">{{ curPost?.dept }} · {{ curPost?.scope }}</span>
          <span class="extra">
            已勾选 <b>{{ checkedCount }}</b> / {{ TOTAL_PERMS }} 项
            <el-button link type="primary" size="small" @click="checkAll">全选</el-button>
            <el-button link type="primary" size="small" @click="clearAll">清空</el-button>
          </span>
        </div>
        <div class="tree">
          <el-tree
            ref="treeRef"
            :data="PERM_TREE"
            show-checkbox
            node-key="id"
            default-expand-all
            :props="{ label: 'label', children: 'children' }"
            @check="onCheck">
            <template #default="{ data }">
              <span class="node">
                <span class="label" :class="{ mod: isModule(data), page: isPage(data) }">{{ data.label }}</span>
                <span v-if="data.children" class="badge" :class="{ full: stat(data).c === stat(data).t }">
                  {{ stat(data).c }} / {{ stat(data).t }}
                </span>
              </span>
            </template>
          </el-tree>
        </div>
        <div class="t-foot">
          勾模块则其下全部页面与按钮一并勾选；取消任一子项模块变半选。按钮级权限同时管「看不看得见」与「点不点得动」。老板职位默认拥有全部 {{ TOTAL_PERMS }} 项，同样可勾选或取消。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { posts, accountsOfPost, PERM_TREE, TOTAL_PERMS, ALL_BUTTON_IDS, DEFAULT_PERMS } from '@/data/system'

const route = useRoute()
const treeRef = ref(null)
const current = ref(posts.find(p => !p.builtin)?.id || posts[0].id)
const checkedKeys = ref([])

const curPost = computed(() => posts.find(p => p.id === current.value) || posts[0])
const isBoss = computed(() => curPost.value?.builtin === true)
const checkedCount = computed(() => checkedKeys.value.filter(k => k.startsWith('b-')).length)
/* 与已保存的职位权限是否一致 */
const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x))
const dirty = computed(() => !sameSet(checkedKeys.value, curPost.value.perms || []))

/* 叶子节点集合，用于统计模块 / 页面已选数 */
const leafIdsOf = node => node.children
  ? node.children.flatMap(c => c.children ? leafIdsOf(c) : [c.id])
  : [node.id]
const isModule = d => !!d.children && d.children.some(c => c.children)
const isPage = d => !!d.children && !d.children.some(c => c.children)
const stat = d => {
  const ids = leafIdsOf(d)
  return { c: ids.filter(i => checkedKeys.value.includes(i)).length, t: ids.length }
}

/* 切换职位：把该职位已存的权限回填到树；老板职位默认全集，但同样可编辑 */
function syncFromPost() {
  const keys = (curPost.value.perms || []).filter(k => k.startsWith('b-'))
  checkedKeys.value = keys
  nextTick(() => {
    treeRef.value?.setCheckedKeys(checkedKeys.value)
    checkedKeys.value = (treeRef.value?.getCheckedKeys(true) || checkedKeys.value).filter(k => k.startsWith('b-'))
  })
}
watch(current, syncFromPost, { immediate: true })

function selectPost(id) {
  if (id === current.value) return
  if (dirty.value) ElMessage.warning('已放弃「' + curPost.value.name + '」未保存的修改')
  current.value = id
}

/* 任一复选框勾选 / 取消后同步计数 */
function onCheck() {
  checkedKeys.value = (treeRef.value?.getCheckedKeys(true) || []).filter(k => k.startsWith('b-'))
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
  const def = DEFAULT_PERMS[current.value] || []
  checkedKeys.value = [...def]
  treeRef.value?.setCheckedKeys(def)
  ElMessage.success(`已恢复「${curPost.value.name}」的默认权限（${def.length} 项），点「保存分配」后生效`)
}

function save() {
  if (!dirty.value) return
  curPost.value.perms = [...checkedKeys.value]
  const n = accountsOfPost(current.value).length
  const tail = isBoss.value ? '，未勾选的菜单与按钮老板账号也将不可见' : ''
  ElMessage.success(`权限已保存（${checkedKeys.value.length} 项），${curPost.value.name} 职位下 ${n} 个账号已同步${tail}`)
}

onMounted(() => {
  const id = route.query.post
  if (id && posts.some(p => p.id === id)) current.value = id
})
</script>

<style scoped>
.layout { display: grid; grid-template-columns: 232px 1fr; gap: 12px; align-items: start; }
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
.pc { margin-left: auto; font-size: 11.5px; color: var(--ink-3); }
.p-note { font-size: 11.5px; line-height: 1.7; color: var(--ink-3); padding: 10px 16px 14px; border-top: 1px dashed var(--line-2); margin-top: 6px; }
.meta { margin-left: 10px; font-size: 11.5px; color: var(--ink-3); }
.card-head .extra { display: inline-flex; align-items: center; gap: 8px; }
.card-head .extra b { color: var(--brand-d); font-weight: 600; }
.tree { padding: 12px 16px 6px; max-height: 600px; overflow: auto; }
.node { display: flex; align-items: center; gap: 8px; }
.label { font-size: 13px; }
.label.mod { font-size: 13px; font-weight: 600; }
.label.page { color: var(--ink-2); }
.badge {
  font-size: 10.5px; line-height: 16px; padding: 0 6px; border-radius: 8px;
  background: var(--fill); color: var(--ink-3); font-variant-numeric: tabular-nums;
}
.badge.full { background: var(--ok-l); color: var(--ok); }
.t-foot { font-size: 11.5px; color: var(--ink-3); line-height: 1.7; padding: 10px 16px 14px; border-top: 1px dashed var(--line-2); }
:deep(.el-tree-node__content) { height: 30px; }
</style>
