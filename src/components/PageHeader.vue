<template>
  <div class="page-head">
    <div class="left">
      <a v-if="back" class="back" @click="goBack">‹ {{ back }}</a>
      <h1>{{ title }}</h1>
      <span v-if="sub" class="sub">{{ sub }}</span>
    </div>
    <div class="actions"><slot /></div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: String,
  sub: String,
  /** 有值时在标题左侧显示返回链接，值为链接文案（如「采购管理」） */
  back: String,
  /** 返回目标路由，缺省回退一页 */
  backTo: String
})

const router = useRouter()
function goBack() {
  if (props.backTo) router.push(props.backTo)
  else router.back()
}
</script>

<style scoped>
.page-head { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 14px; }
h1 { margin: 0; font-size: 19px; font-weight: 600; color: var(--ink); letter-spacing: .2px; }
.sub { font-size: 12.5px; color: var(--ink-3); }
.back {
  font-size: 12.5px; color: var(--brand); cursor: pointer; padding-bottom: 2px;
  align-self: center; margin-right: 2px;
}
.back:hover { text-decoration: underline; }
.actions { margin-left: auto; display: flex; gap: 8px; }
</style>
