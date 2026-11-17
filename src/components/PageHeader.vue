<template>
  <div class="page-head">
    <div class="left">
      <h1>{{ title }}</h1>
      <span v-if="sub" class="sub">{{ sub }}</span>
    </div>
    <div class="actions"><slot /></div>
  </div>
</template>

<script setup>
defineProps({ title: String, sub: String })
</script>

<style scoped>
.page-head { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 14px; }
h1 { margin: 0; font-size: 19px; font-weight: 600; color: var(--ink); letter-spacing: .2px; }
.sub { font-size: 12.5px; color: var(--ink-3); }
.actions { margin-left: auto; display: flex; gap: 8px; }
</style>
