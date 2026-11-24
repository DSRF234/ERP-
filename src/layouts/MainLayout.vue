<template>
  <div class="shell">
    <aside class="side">
      <div class="brand">
        <span class="logo">星</span>
        <span class="name">星野优选 ERP</span>
      </div>

      <el-menu :default-active="route.path" router class="nav">
        <template v-for="m in menu" :key="m.id">
          <el-menu-item v-if="m.flat && m.pages.length" :index="m.pages[0].path">
            <el-icon><component :is="m.icon" /></el-icon><span>{{ m.pages[0].label }}</span>
          </el-menu-item>
          <el-sub-menu v-else-if="m.pages.length" :index="m.id">
            <template #title><el-icon><component :is="m.icon" /></el-icon><span>{{ m.label }}</span></template>
            <el-menu-item v-for="p in m.pages" :key="p.id" :index="p.path">
              {{ p.label }}<span v-if="p.path === '/aftersale/wait' && waitCount" class="badge">{{ waitCount }}</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </aside>

    <div class="main">
      <header class="topbar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-if="route.meta.group">{{ route.meta.group }}</el-breadcrumb-item>
          <el-breadcrumb-item v-if="route.meta.parent">{{ route.meta.parent.title }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="right">
          <el-popover placement="bottom-end" :width="360" trigger="click" @show="msg.markAllRead">
            <template #reference>
              <div class="bell" title="消息通知">
                <el-badge :value="msg.unread" :hidden="!msg.unread" :max="99">
                  <el-icon><Bell /></el-icon>
                </el-badge>
              </div>
            </template>
            <div class="msg-head">消息通知 <span class="muted">（{{ msg.list.length }} 条）</span></div>
            <div class="msg-body">
              <div v-for="m in msg.list" :key="m.id" class="msg-item">
                <div class="msg-t">{{ m.title }}</div>
                <div class="msg-b">{{ m.body }}</div>
                <div class="msg-time">收件人：{{ m.to }} · {{ m.time }}</div>
              </div>
              <div v-if="!msg.list.length" class="msg-empty">暂无消息</div>
            </div>
          </el-popover>
          <span class="time">数据更新至 {{ today }}</span>

          <el-dropdown trigger="click" @command="onCommand">
            <div class="user">
              <el-avatar :size="26" class="avatar">{{ initial }}</el-avatar>
              <span class="uname">{{ store.name }}</span>
              <span class="upost">{{ store.post }}</span>
              <el-icon class="arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>账号：{{ store.user?.account }}</el-dropdown-item>
                <el-dropdown-item disabled>部门：{{ store.user?.dept }}</el-dropdown-item>
                <el-dropdown-item divided command="pwd">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </div>

    <el-dialog v-model="pwdVisible" title="修改密码" width="420px">
      <el-form :model="pwd" label-width="92px" size="small">
        <el-form-item label="原密码">
          <el-input v-model="pwd.old" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwd.n1" type="password" show-password placeholder="8-20 位，需含字母和数字" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="pwd.n2" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
      </el-form>
      <div class="pwd-tip">修改成功后，下次登录请使用新密码。</div>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPwd">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAfterStore } from '@/stores/aftersale'
import { useMessageStore } from '@/stores/message'
import { MODULES, canView, permsOfPostName } from '@/data/perm'

const route = useRoute()
const router = useRouter()
const store = useUserStore()
const afterStore = useAfterStore()
const msg = useMessageStore()

/* 菜单完全由权限树推导：没有「查看页面」权限的页面不出现，模块下全无可见页面则整块隐藏 */
const perms = computed(() => permsOfPostName(store.post))
const menu = computed(() => MODULES.map(m => ({
  ...m,
  pages: m.children.filter(p => p.path && p.menu !== false && canView(perms.value, p.path))
})))

const initial = computed(() => (store.name || '星').slice(0, 1))
const waitCount = computed(() => afterStore.counts.wait)

const pwdVisible = ref(false)
const pwd = reactive({ old: '', n1: '', n2: '' })

function submitPwd() {
  if (!pwd.old) return ElMessage.error('请输入原密码')
  if (!/^(?=.*[A-Za-z])(?=.*\d)[\S]{8,20}$/.test(pwd.n1)) {
    return ElMessage.error('新密码需 8-20 位，且同时包含字母和数字')
  }
  if (pwd.n1 !== pwd.n2) return ElMessage.error('两次输入的新密码不一致')
  try {
    store.changePassword(pwd.old, pwd.n1)
    pwdVisible.value = false
    pwd.old = pwd.n1 = pwd.n2 = ''
    ElMessage.success('密码已修改，下次登录请使用新密码')
  } catch (e) {
    ElMessage.error(e.message || '修改失败')
  }
}

async function onCommand(cmd) {
  if (cmd === 'pwd') { pwdVisible.value = true; return }
  if (cmd !== 'logout') return
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      confirmButtonText: '退出', cancelButtonText: '取消', type: 'warning'
    })
    store.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  } catch (e) { /* 取消 */ }
}

const today = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`
})
</script>

<style scoped>
.shell { display: flex; height: 100vh; overflow: hidden; }
.side { width: 190px; flex: none; background: #fff; border-right: 1px solid var(--line); display: flex; flex-direction: column; }
.brand { height: 52px; display: flex; align-items: center; gap: 9px; padding: 0 16px; border-bottom: 1px solid var(--line-2); }
.logo { width: 22px; height: 22px; border: 1.5px solid var(--brand); border-radius: 5px; color: var(--brand); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.name { font-size: 13.5px; font-weight: 600; }
.nav { border-right: none; padding: 6px 0; flex: 1; overflow-y: auto; }
.nav :deep(.el-menu-item), .nav :deep(.el-sub-menu__title) { height: 38px; line-height: 38px; font-size: 13px; }
.nav :deep(.el-menu-item.is-active) { background: var(--brand-l); color: var(--brand-d); font-weight: 600; }
.badge { margin-left: 6px; background: var(--danger); color: #fff; font-size: 10.5px; border-radius: 9px; padding: 0 6px; line-height: 15px; display: inline-block; height: 15px; }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.topbar { height: 52px; flex: none; background: #fff; border-bottom: 1px solid var(--line); display: flex; align-items: center; padding: 0 20px; }
.right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.bell { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; color: var(--ink-2); }
.bell:hover { background: var(--fill); }
.msg-head { font-size: 13px; font-weight: 600; padding-bottom: 8px; border-bottom: 1px solid var(--line-2); }
.msg-head .muted { font-weight: 400; font-size: 11.5px; color: var(--ink-3); }
.msg-body { max-height: 320px; overflow-y: auto; }
.msg-item { padding: 9px 0; border-bottom: 1px dashed var(--line-2); }
.msg-item:last-child { border-bottom: none; }
.msg-t { font-size: 12.5px; color: var(--ink); font-weight: 600; }
.msg-b { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
.msg-time { font-size: 11px; color: var(--ink-3); margin-top: 3px; }
.msg-empty { padding: 18px 0; text-align: center; font-size: 12px; color: var(--ink-3); }
.time { font-size: 12px; color: var(--ink-3); }
.user { display: flex; align-items: center; gap: 7px; cursor: pointer; padding: 3px 6px; border-radius: 5px; }
.user:hover { background: var(--fill); }
.avatar { background: var(--brand-l); color: var(--brand-d); font-size: 12px; }
.uname { font-size: 12.5px; color: var(--ink); }
.upost { font-size: 11px; color: var(--ink-3); background: var(--fill); border-radius: 3px; padding: 1px 5px; }
.arrow { font-size: 11px; color: var(--ink-3); }

.pwd-tip {
  margin: 4px 0 0 92px; font-size: 12px; color: var(--ink-3);
}
.content { flex: 1; overflow-y: auto; padding: 18px 20px 40px; }
</style>
