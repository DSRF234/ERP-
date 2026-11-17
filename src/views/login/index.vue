<template>
  <div class="login">
    <div class="box">
      <!-- 左侧品牌区 -->
      <aside class="brand">
        <div class="mark">
          <span class="logo">星</span>
          <span class="title">星野优选 ERP</span>
        </div>
        <p class="slogan">多渠道零售一体化管理平台</p>

        <ul class="feats">
          <li><i></i>多平台订单统一处理</li>
          <li><i></i>多仓库存实时共享，杜绝超卖</li>
          <li><i></i>平台账单自动对账，口径统一</li>
          <li><i></i>经营数据一屏掌握</li>
        </ul>

        <div class="copy">© 2026 星野优选 · 内部系统</div>
      </aside>

      <!-- 右侧表单区 -->
      <div class="form">
        <h2>账号登录</h2>
        <p class="sub">请使用公司分配的账号登录</p>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
          <el-form-item label="登录账号" prop="account">
            <el-input v-model="form.account" size="large" placeholder="请输入登录账号"
              :prefix-icon="User" clearable @keyup.enter="submit" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" size="large" type="password" placeholder="请输入密码"
              :prefix-icon="Lock" show-password @keyup.enter="submit" />
          </el-form-item>

          <div class="row">
            <el-checkbox v-model="form.remember">记住账号</el-checkbox>
            <el-link type="primary" :underline="false" @click="forgot">忘记密码？</el-link>
          </div>

          <el-button type="primary" size="large" class="submit" :loading="loading" @click="submit">
            {{ loading ? '登录中…' : '登 录' }}
          </el-button>
        </el-form>

        <div class="demo">
          <div class="demo-t">演示账号</div>
          <div class="demo-row" v-for="a in demo" :key="a.account" @click="fill(a)">
            <span class="acc">{{ a.account }}</span>
            <span class="post">{{ a.post }}</span>
            <span class="pwd">Xy@2026</span>
          </div>
          <div class="demo-hint">点击任意一行可自动填充</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore, ACCOUNTS } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const store = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const form = reactive({ account: '', password: '', remember: true })
const demo = ACCOUNTS.slice(0, 4)

const rules = {
  account: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

onMounted(() => {
  const saved = localStorage.getItem('xy_erp_saved_account')
  if (saved) form.account = saved
})

function fill(a) {
  form.account = a.account
  form.password = 'Xy@2026'
}

function forgot() {
  ElMessage.info('请联系系统管理员重置密码（初始密码 Xy@2026）')
}

async function submit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return

  loading.value = true
  try {
    store.login(form.account, form.password)
    if (form.remember) localStorage.setItem('xy_erp_saved_account', form.account)
    else localStorage.removeItem('xy_erp_saved_account')

    ElMessage.success(`欢迎回来，${store.name}`)
    const redirect = route.query.redirect || '/dashboard'
    router.replace(redirect)
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg);
  background-image: radial-gradient(circle at 20% 20%, #E6F4FB 0, transparent 45%),
                    radial-gradient(circle at 85% 75%, #EDEFF2 0, transparent 40%);
}

.box {
  width: 900px; max-width: 94vw; height: 600px;
  display: grid; grid-template-columns: 1fr 400px;
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 18px 50px -18px rgba(22, 155, 213, .25), 0 2px 8px rgba(0, 0, 0, .04);
}

/* 品牌区 */
.brand {
  background: linear-gradient(160deg, #169BD5 0%, #1289BE 60%, #0F76A6 100%);
  color: #fff; padding: 46px 44px; display: flex; flex-direction: column; position: relative;
}
.brand::after {
  content: ""; position: absolute; right: -60px; bottom: -60px;
  width: 240px; height: 240px; border-radius: 50%;
  background: rgba(255, 255, 255, .06);
}
.mark { display: flex; align-items: center; gap: 10px; }
.logo {
  width: 30px; height: 30px; border: 1.5px solid rgba(255,255,255,.85); border-radius: 7px;
  display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;
}
.title { font-size: 17px; font-weight: 600; letter-spacing: .5px; }
.slogan { margin: 14px 0 0; font-size: 13px; opacity: .85; letter-spacing: .3px; }

.feats { list-style: none; padding: 0; margin: 44px 0 0; }
.feats li {
  display: flex; align-items: center; gap: 10px;
  font-size: 13.5px; opacity: .95; padding: 9px 0;
}
.feats i {
  width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.7); flex: none;
}
.copy { margin-top: auto; font-size: 11.5px; opacity: .6; position: relative; z-index: 1; }

/* 表单区 */
.form { padding: 38px 40px 26px; display: flex; flex-direction: column; }
.form h2 { margin: 0; font-size: 21px; font-weight: 600; color: var(--ink); }
.sub { margin: 8px 0 20px; font-size: 12.5px; color: var(--ink-3); }

.row { display: flex; align-items: center; justify-content: space-between; margin: -4px 0 18px; }
.submit { width: 100%; height: 42px; font-size: 14.5px; letter-spacing: 2px; }

.demo {
  margin-top: auto; border-top: 1px dashed var(--line); padding-top: 14px;
}
.demo-t { font-size: 11.5px; color: var(--ink-3); margin-bottom: 6px; }
.demo-row {
  display: flex; align-items: center; gap: 10px;
  font-size: 11.5px; padding: 3px 8px; border-radius: 4px; cursor: pointer;
}
.demo-row:hover { background: var(--brand-l); }
.demo-row .acc { width: 74px; color: var(--ink); font-weight: 500; }
.demo-row .post { width: 40px; color: var(--ink-2); }
.demo-row .pwd { margin-left: auto; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.demo-hint { font-size: 11px; color: var(--ink-3); margin-top: 6px; padding-left: 8px; }

:deep(.el-form-item__label) { font-size: 12.5px; color: var(--ink-2); padding-bottom: 4px; }
:deep(.el-input__wrapper) { border-radius: 5px; }

@media (max-width: 900px) {
  .box { grid-template-columns: 1fr; height: auto; }
  .brand { display: none; }
  .form { padding: 36px 28px 28px; }
}
</style>
