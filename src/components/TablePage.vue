<template>
  <div>
    <PageHeader :title="title" :sub="sub">
      <slot name="actions" />
    </PageHeader>

    <div class="filters" v-if="filters.length || searchKeys.length">
      <el-input
        v-if="searchKeys.length"
        v-model="keyword" :placeholder="searchPlaceholder" clearable
        size="small" style="width: 200px" @keyup.enter="noop" />
      <el-select v-for="f in filters" :key="f.key" v-model="values[f.key]" size="small"
        :style="{ width: (f.width || 140) + 'px' }" :placeholder="f.label">
        <el-option :label="f.label" value="" />
        <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
      </el-select>
      <el-button size="small" type="primary" @click="noop">查询</el-button>
      <el-button size="small" @click="reset">重置</el-button>
      <span class="count">共 {{ view.length }} 条</span>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>{{ cardTitle || title }}</h3>
        <span class="extra"><slot name="hint">{{ hint }}</slot></span>
      </div>

      <el-table :data="view" size="small" :max-height="maxHeight" @row-click="onRow">
        <el-table-column v-for="c in columns" :key="c.prop"
          :prop="c.prop" :label="c.label" :width="c.width" :min-width="c.minWidth || 110"
          :align="c.align || (c.type === 'money' || c.type === 'num' ? 'right' : 'left')">
          <template #default="{ row, $index }">
            <span v-if="c.type === 'index'" class="mono">{{ $index + 1 }}</span>
            <span v-else-if="c.type === 'money'" class="mono">{{ money(row[c.prop]) }}</span>
            <span v-else-if="c.type === 'num'" class="mono">{{ row[c.prop] ?? '—' }}</span>
            <el-tag v-else-if="c.type === 'tag'" size="small" :type="tagOf(c, row[c.prop]).type">
              {{ tagOf(c, row[c.prop]).text }}
            </el-tag>
            <span v-else-if="c.type === 'timeLeft'" :class="'tl ' + left(row[c.prop]).type">
              {{ left(row[c.prop]).text }}
            </span>
            <span v-else-if="c.type === 'muted'" class="muted">{{ row[c.prop] ?? '—' }}</span>
            <span v-else>{{ row[c.prop] ?? '—' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="tip" v-if="note">
      <b>说明</b>　{{ note }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader from './PageHeader.vue'
import { money, timeLeft } from '@/utils/format'

const props = defineProps({
  title: String,
  sub: String,
  cardTitle: String,
  hint: String,
  note: String,
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  filters: { type: Array, default: () => [] },
  searchKeys: { type: Array, default: () => [] },
  searchPlaceholder: { type: String, default: '输入关键字查找' },
  maxHeight: { type: [String, Number], default: 620 }
})
const emit = defineEmits(['row-click'])

const keyword = ref('')
const values = reactive(Object.fromEntries(props.filters.map(f => [f.key, ''])))

const view = computed(() => props.rows.filter(r => {
  const okFilter = props.filters.every(f => !values[f.key] || String(r[f.key] ?? '') === values[f.key])
  const kw = keyword.value.trim()
  const okKw = !kw || props.searchKeys.some(k => String(r[k] ?? '').includes(kw))
  return okFilter && okKw
}))

const moneyFmt = money
const left = v => timeLeft(v)
const noop = () => {}
const reset = () => { keyword.value = ''; props.filters.forEach(f => values[f.key] = '') }
const onRow = row => emit('row-click', row)

function tagOf(col, v) {
  const m = col.map || {}
  return m[v] || { text: v ?? '—', type: 'info' }
}
</script>

<style scoped>
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.count { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.tl.danger { color: var(--danger); font-weight: 600; }
.tl.warning { color: var(--warn); font-weight: 600; }
.tl.info { color: var(--ink-2); }
.tip {
  margin-top: 14px; padding: 12px 14px; background: var(--brand-l);
  border: 1px solid #BFE3F2; border-radius: 6px;
  font-size: 12.5px; line-height: 1.8; color: #0E7FB2;
}
.tip b { font-weight: 600; }
</style>
