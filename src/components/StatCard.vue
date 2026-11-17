<template>
  <div class="stat" :class="{ warn }">
    <div class="k">{{ label }}</div>
    <div class="v">{{ value }}<i v-if="unit">{{ unit }}</i></div>
    <div class="d" v-html="desc"></div>
  </div>
</template>

<script setup>
defineProps({ label: String, value: String, unit: String, desc: String, warn: Boolean })
</script>

<style scoped>
.stat {
  background: #fff; border: 1px solid var(--line); border-radius: 8px;
  padding: 14px 16px 13px;
}
.stat .k { font-size: 12px; color: var(--text3); }
.stat .v {
  font-size: 25px; font-weight: 600; color: #1f2d3d;
  margin: 7px 0 6px; letter-spacing: -.4px; font-variant-numeric: tabular-nums;
}
.stat .v i { font-size: 13px; font-weight: 400; color: var(--text3); font-style: normal; margin-left: 3px; }
.stat .d { font-size: 11.5px; color: var(--text3); }
.stat.warn .v { color: var(--amber); }
:deep(.up) { color: var(--red); }
:deep(.down) { color: var(--green); }
</style>
