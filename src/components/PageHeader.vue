<template>
  <div class="page-head">
    <h1>{{ title }}</h1>
    <span v-if="sub" class="sub">{{ sub }}</span>
    <div class="actions"><slot /></div>
  </div>
</template>

<script setup>
defineProps({ title: String, sub: String })
</script>

<style scoped>
.page-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 14px; }
h1 { margin: 0; font-size: 19px; font-weight: 600; color: #1f2d3d; }
.sub { font-size: 12px; color: var(--text3); }
.actions { margin-left: auto; display: flex; gap: 8px; }
</style>
