<template>
  <div class="stat-row">
    <div v-for="s in items" :key="s.label" class="stat" :class="s.tone ? 'is-' + s.tone : ''">
      <div class="stat-label">{{ s.label }}</div>
      <div class="stat-value">
        {{ s.value }}<span v-if="s.unit" class="unit">{{ s.unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // [{ label, value, unit, tone: 'warn' | 'danger' }]
  items: { type: Array, default: () => [] }
})
</script>
