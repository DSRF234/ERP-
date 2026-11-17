<template>
  <svg width="100%" :viewBox="`0 0 660 ${height}`" preserveAspectRatio="none" style="display:block">
    <g>
      <line v-for="t in ticks" :key="t.v"
        :x1="pad.l" :y1="y(t.v)" :x2="660 - pad.r" :y2="y(t.v)"
        stroke="#F0F2F5" stroke-width="1" />
      <text v-for="t in ticks" :key="'t' + t.v"
        :x="pad.l - 8" :y="y(t.v) + 3.5" font-size="10" fill="#C0C4CC" text-anchor="end">{{ t.v }}</text>

      <polygon :points="areaPoints" :fill="color" opacity="0.10" />
      <polyline :points="linePoints" fill="none" :stroke="color" stroke-width="2" stroke-linejoin="round" />

      <circle v-for="(v, i) in series" :key="i"
        :cx="x(i)" :cy="y(v)" r="2.4" fill="#fff" :stroke="color" stroke-width="1.4">
        <title>{{ labels[i] }}　{{ v }}</title>
      </circle>

      <text v-for="(l, i) in labels" :key="'l' + i" v-show="i % 2 === 0"
        :x="x(i)" :y="height - 8" font-size="10" fill="#C0C4CC" text-anchor="middle">{{ l }}</text>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  labels: { type: Array, default: () => [] },
  series: { type: Array, default: () => [] },
  max: { type: Number, default: 100 },
  color: { type: String, default: '#409EFF' },
  height: { type: Number, default: 210 }
})

const pad = { l: 40, r: 12, t: 14, b: 26 }
const ticks = computed(() => {
  const step = props.max / 3
  return [0, 1, 2, 3].map(i => ({ v: Math.round(step * i) }))
})
const x = i => pad.l + (660 - pad.l - pad.r) * i / Math.max(1, props.labels.length - 1)
const y = v => pad.t + (props.height - pad.t - pad.b) * (1 - v / props.max)
const linePoints = computed(() => props.series.map((v, i) => `${x(i)},${y(v)}`).join(' '))
const areaPoints = computed(() =>
  `${pad.l},${y(0)} ${linePoints.value} ${x(props.series.length - 1)},${y(0)}`
)
</script>
