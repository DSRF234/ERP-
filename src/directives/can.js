/**
 * 权限指令与组合函数
 * ------------------------------------------------------------------
 * 用法：
 *   <el-button v-can="'b-order-review-audit'">审核</el-button>   无权限则不渲染（占位被移除）
 *   const { can } = usePerm()
 *   <el-button v-if="can('b-order-review-export')">导出</el-button>
 *
 * 判定依据：当前登录人的「职位」在 src/data/system.js 中保存的权限 id 列表，
 * 用「职位名」关联，改职位或改权限后刷新页面即生效。
 */
import { effect, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { posts } from '@/data/system'
import { canDo, canOperate, permsOfPostName } from '@/data/perm'

/** 当前登录人的权限 id 列表（响应式，权限变更后按钮即时联动） */
export function usePerm() {
  const store = useUserStore()
  const perms = computed(() => permsOfPostName(store.post))
  return {
    perms,
    can: id => canDo(perms.value, id),
    canOperate: page => canOperate(perms.value, page)
  }
}

export const vCan = {
  mounted(el, binding) {
    if (!binding.value) return
    effect(() => {
      const ok = canDo(permsOfNow(), binding.value)
      el.style.display = ok ? '' : 'none'
    })
  }
}

function permsOfNow() {
  const store = useUserStore()
  const hit = posts.find(p => p.name === store.post)
  return hit ? hit.perms : []
}
