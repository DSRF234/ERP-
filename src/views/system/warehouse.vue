<template>
  <div>
    <PageHeader title="发货仓设置" sub="按收货地址所在省 / 直辖市 / 自治区匹配唯一负责仓，作为订单默认发货仓，同时是售后换货、补发的可选仓来源。本页只维护仓库基础属性与地区归属，不涉及库存数量、仓库地址与人员。">
      <el-button v-can="'b-sys-wh-export'" size="small" @click="exportCsv">导出</el-button>
    </PageHeader>

    <div class="filters">
      <el-input v-model="kw" size="small" placeholder="搜索仓库名称 / 地区全称或简称" style="width: 260px" clearable />
      <el-button size="small" type="primary" @click="noop">查询</el-button>
      <el-button size="small" @click="kw = ''">重置</el-button>
      <span class="count">共 {{ view.length }} 个仓</span>
      <div class="stat">
        <el-tooltip v-if="unassigned.length" placement="bottom">
          <template #content>
            <div class="tt">未分配地区（{{ unassigned.length }}）：{{ unassigned.join('、') }}</div>
          </template>
          <span class="tag-warn">未分配 {{ unassigned.length }} 个地区</span>
        </el-tooltip>
        <span v-else class="tag-ok">全部地区已分配</span>
        <span class="cov">已覆盖 {{ coveredCount }} / {{ ALL_AREAS.length }} 个省级行政区</span>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>发货仓地区管理</h3>
        <span class="extra">当前 {{ warehouses.length }} 个仓、覆盖 {{ coveredCount }} 个地区</span>
      </div>
      <el-table :data="view" size="small">
        <el-table-column prop="name" label="发货仓" width="104" />
        <el-table-column prop="type" label="仓储类型" width="94">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === '自营仓' ? 'primary' : 'info'" effect="plain">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="city" label="所在城市" width="88" />
        <el-table-column label="负责地区" min-width="520">
          <template #default="{ row }">
            <div class="areas">
              <span v-for="a in row.areas" :key="a" class="area">{{ a }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="地区数" width="72" align="right">
          <template #default="{ row }"><span class="mono">{{ row.areas.length }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="96" fixed="right">
          <template #default="{ row }">
            <el-button v-can="'b-sys-wh-edit'" link type="primary" size="small" @click="openEdit(row)">更改</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 更改地区 -->
    <el-dialog v-model="dlgVisible" :title="cur ? cur.name + ' · 更改负责地区' : ''" width="760px">
      <template v-if="cur">
        <div class="dlg-bar">
          <el-input v-model="q" size="small" placeholder="搜索省 / 直辖市 / 自治区，简称与大区名均可" style="width: 300px" clearable />
          <span class="picked">已选 <b class="mono">{{ sel.length }}</b> 个</span>
          <span v-if="q.trim()" class="sub">匹配 {{ matchedGroups.length }} 个大区</span>
        </div>

        <div class="regions">
          <div v-for="g in visibleGroups" :key="g.key" class="rg">
            <div class="rg-h">
              <b>{{ g.key }}</b>
              <span class="sub">{{ g.areas.length }} 个地区</span>
              <el-checkbox
                :model-value="allPicked(g)"
                :indeterminate="somePicked(g) && !allPicked(g)"
                size="small" class="rg-all" @change="v => toggleGroup(g, v)">全选</el-checkbox>
            </div>
            <div class="grid">
              <div v-for="a in g.areas" :key="a" class="cell" :class="{ on: sel.includes(a) }" @click="toggleArea(a)">
                <span class="cb"><i v-if="sel.includes(a)">✓</i></span>
                <span class="an">{{ a }}</span>
                <span v-if="otherOwner(a)" class="sub own">{{ otherOwner(a) }}</span>
              </div>
            </div>
          </div>
          <div v-if="!visibleGroups.length" class="empty">
            没有匹配「{{ q }}」的地区，试试「华东」「浙江」「浙」等关键词。
          </div>
        </div>

        <div class="dlg-tip">
          保存时先校验至少保留一个地区，再以本次勾选覆盖该仓负责地区，最后把勾选的地区从其他仓移出（静默转移，不弹冲突提示）。
        </div>
      </template>
      <template #footer>
        <el-button @click="dlgVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { warehouses, REGIONS, REGION_ALIAS, ALL_AREAS, coveredAreas, unassignedAreas, ownerOfArea } from '@/data/system'

const kw = ref('')
const noop = () => {}
const unassigned = computed(() => unassignedAreas())
const coveredCount = computed(() => coveredAreas().size)

const view = computed(() => warehouses.filter(w => {
  const k = kw.value.trim()
  if (!k) return true
  return w.name.includes(k) || w.areas.some(a => a.includes(k))
}))

/* ---------- 更改地区 ---------- */
const dlgVisible = ref(false)
const cur = ref(null)
const q = ref('')
const sel = ref([])

function openEdit(row) {
  cur.value = row
  sel.value = [...row.areas]
  q.value = ''
  dlgVisible.value = true
}

/* 搜索：地区名、大区名、简称均命中 */
const matchArea = (g, a) => {
  const s = q.value.trim()
  if (!s) return true
  if (a.includes(s)) return true
  if (g.key.includes(s)) return true
  return (REGION_ALIAS[g.key] || []).some(x => x === s)
}
const matchedGroups = computed(() => REGIONS
  .map(g => ({ ...g, areas: g.areas.filter(a => matchArea(g, a)) }))
  .filter(g => g.areas.length))
const visibleGroups = computed(() => matchedGroups.value)

const allPicked = g => g.areas.every(a => sel.value.includes(a))
const somePicked = g => g.areas.some(a => sel.value.includes(a))
function toggleGroup(g, v) {
  if (v) {
    g.areas.forEach(a => { if (!sel.value.includes(a)) sel.value.push(a) })
  } else {
    sel.value = sel.value.filter(a => !g.areas.includes(a))
  }
}
function toggleArea(a) {
  if (sel.value.includes(a)) sel.value = sel.value.filter(x => x !== a)
  else sel.value.push(a)
}
const otherOwner = a => {
  const o = ownerOfArea(a)
  return o && o.id !== cur.value?.id ? o.name : ''
}

function save() {
  if (!sel.value.length) return ElMessage.error('至少保留一个负责地区')
  const moved = []
  warehouses.forEach(w => {
    if (w.id === cur.value.id) return
    const overlap = w.areas.filter(a => sel.value.includes(a))
    if (overlap.length) {
      moved.push({ name: w.name, n: overlap.length })
      w.areas = w.areas.filter(a => !sel.value.includes(a))
    }
  })
  cur.value.areas = [...sel.value]
  dlgVisible.value = false
  const base = `已保存，${cur.value.name} 负责 ${cur.value.areas.length} 个地区`
  ElMessage.success(moved.length
    ? `${base}；已从 ${moved.map(m => m.name).join('、')} 移出重叠地区`
    : base)
}

/* ---------- 导出 ---------- */
function exportCsv() {
  const head = ['仓库名称', '仓储类型', '所在城市', '负责地区', '地区数']
  const rows = view.value.map(w => [w.name, w.type, w.city, w.areas.join('、'), w.areas.length])
  const csv = [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `发货仓地区对照表-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success(`已导出 ${view.value.length} 个仓的地区对照表`)
}
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.stat { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.tag-warn {
  font-size: 11.5px; line-height: 22px; padding: 0 9px; border-radius: 4px;
  background: var(--warn-l); color: var(--warn); cursor: default;
}
.tag-ok {
  font-size: 11.5px; line-height: 22px; padding: 0 9px; border-radius: 4px;
  background: var(--ok-l); color: var(--ok);
}
.cov { font-size: 11.5px; color: var(--ink-3); }
.tt { max-width: 300px; line-height: 1.7; }

.areas { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px 7px; padding: 2px 0; }
.area {
  text-align: center;
  font-size: 13px; line-height: 22px; padding: 0 8px; border-radius: 3px;
  background: var(--fill); color: var(--ink-2);
}

.tip {
  margin-top: 14px; padding: 12px 14px; background: var(--brand-l);
  border: 1px solid #BFE3F2; border-radius: 6px;
  font-size: 12.5px; line-height: 1.8; color: #0E7FB2;
}
.tip b { font-weight: 600; }

.dlg-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.picked { font-size: 12.5px; color: var(--ink-2); }
.picked b { color: var(--brand-d); }
.sub { font-size: 11px; color: var(--ink-3); }

.regions { max-height: 52vh; overflow: auto; border: 1px solid var(--line-2); border-radius: 6px; padding: 4px 12px 12px; }
.rg { padding-top: 10px; }
.rg-h { display: flex; align-items: baseline; gap: 8px; padding: 4px 0 7px; border-bottom: 1px dashed var(--line-2); }
.rg-h b { font-size: 12.5px; }
.rg-all { margin-left: auto; }
.rg-all :deep(.el-checkbox__label) { font-size: 12px; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 9px; }
.cell {
  display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 9px;
  border: 1px solid var(--line); border-radius: 5px; cursor: pointer; font-size: 12.5px;
  background: #fff;
}
.cell:hover { border-color: var(--brand); }
.cell.on { background: var(--brand-l); border-color: var(--brand); }
.cb {
  width: 14px; height: 14px; border: 1px solid var(--line); border-radius: 3px; flex: none;
  display: flex; align-items: center; justify-content: center; background: #fff;
}
.cell.on .cb { background: var(--brand); border-color: var(--brand); color: #fff; }
.cb i { font-size: 10px; font-style: normal; line-height: 1; }
.an { white-space: nowrap; }
.own { margin-left: auto; font-size: 10px; color: var(--ink-3); background: var(--fill); border-radius: 3px; padding: 0 4px; }
.empty { text-align: center; color: var(--ink-3); font-size: 12.5px; padding: 34px 0; }
.dlg-tip { font-size: 11.5px; color: var(--ink-3); line-height: 1.7; margin-top: 10px; }
</style>
