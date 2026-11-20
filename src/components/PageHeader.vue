<template>
  <div class="page-head">
    <div class="left">
      <a v-if="back" class="back" @click="goBack">
        <el-icon class="back-ico"><ArrowLeft /></el-icon><span>{{ back }}</span>
      </a>
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
  /** 有值时在标题上方显示返回链接，值为链接文案（如「返回采购订单」） */
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
.page-head {
  display: flex; align-items: flex-end; gap: 12px;
  margin-bottom: 16px;
}
/* 返回链接、标题、副标题纵向堆叠，靠 margin 控制间距（.left 原为普通块，行高挤压过紧） */
.left {
  display: flex; flex-direction: column; align-items: flex-start;
  min-width: 0;
}
h1 {
  margin: 0; font-size: 20px; font-weight: 600; color: var(--ink);
  letter-spacing: .2px; line-height: 1.3;
}
.sub { margin-top: 6px; font-size: 12.5px; color: var(--ink-3); line-height: 1.5; }
/* 返回做成描边胶囊，与标题拉开层级，避免看上去像标题的附属文字 */
.back {
  display: inline-flex; align-items: center; gap: 4px;
  margin-bottom: 10px; padding: 3px 10px 3px 8px;
  border: 1px solid var(--line); border-radius: 13px;
  background: #fff; color: var(--ink-2);
  font-size: 12px; line-height: 1.4; cursor: pointer;
  transition: color .15s, border-color .15s, background .15s;
}
.back:hover { color: var(--brand); border-color: var(--brand); background: var(--brand-l); }
.back-ico { font-size: 11px; }
.actions { margin-left: auto; display: flex; gap: 8px; align-self: center; }
</style>
