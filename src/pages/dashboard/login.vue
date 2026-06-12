<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-vue-next'
import { postUserLogin } from '@/firebase/user.js'
import { useStockStore } from '@/stores/useStock.js'

const router = useRouter()
const route = useRoute()
const piniaStock = useStockStore()

const formRef = ref(null)
const loading = ref(false)
const form = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '請輸入 Email', trigger: 'blur' },
    { type: 'email', message: 'Email 格式不正確', trigger: ['blur', 'change'] }
  ],
  password: [{ required: true, message: '請輸入密碼', trigger: 'blur' }]
}

const loginMethod = async () => {
  if (loading.value) return

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await postUserLogin(form)
    piniaStock.clear()
    ElMessage({
      message: '登入成功',
      type: 'success',
      plain: true
    })
    router.push(
      (route.query.redirect && String(route.query.redirect)) || { name: 'Dashboard_Home' }
    )
  } catch (err) {
    ElMessage({
      message: err.message || '登入失敗',
      type: 'error',
      plain: true
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="dashboard-login-page">
    <main class="login-shell">
      <section class="login-panel">
        <div class="brand-side">
          <div class="brand-line">
            <div class="brand-mark">
              <LockKeyhole :size="22" />
            </div>
            <div>
              <span>Dashboard Access</span>
              <strong>Stock Dividends</strong>
            </div>
          </div>
        </div>

        <div class="form-side">
          <div class="form-head">
            <span>Login</span>
            <h2>Dashboard Login</h2>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            class="dashboard-login-form"
            label-position="top"
            @submit.prevent="loginMethod"
          >
            <el-form-item label="Email" prop="email">
              <el-input
                v-model.trim="form.email"
                type="email"
                autocomplete="email"
                placeholder="name@example.com"
              />
            </el-form-item>

            <el-form-item label="Password" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                placeholder="請輸入密碼"
                show-password
                @keydown.enter.prevent="loginMethod"
              />
            </el-form-item>

            <button class="submit-button" type="submit" :disabled="loading">
              <span>{{ loading ? '登入中' : '登入後台' }}</span>
              <ArrowRight :size="17" />
            </button>
          </el-form>

          <div class="form-footer">
            <router-link to="/login">回到前台登入</router-link>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard-login-page {
  min-height: 100dvh;
  width: 100%;
  color: #e5eef7;
  background: radial-gradient(circle at 14% 18%, rgb(34 211 238 / 0.14), transparent 24%),
    radial-gradient(circle at 86% 12%, rgb(16 185 129 / 0.1), transparent 20%),
    linear-gradient(180deg, #05070b 0%, #090c13 100%);
}

.login-shell {
  display: grid;
  min-height: 100dvh;
  place-items: center;
  padding: 24px;
}

.login-panel {
  display: grid;
  width: min(100%, 980px);
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  overflow: hidden;
  border: 1px solid rgb(148 163 184 / 0.14);
  border-radius: 24px;
  background: linear-gradient(180deg, rgb(15 18 26 / 0.92), rgb(10 13 20 / 0.94));
  box-shadow:
    0 24px 80px rgb(0 0 0 / 0.32),
    inset 0 1px 0 rgb(255 255 255 / 0.04);
}

.brand-side,
.form-side {
  padding: 34px;
}

.brand-side {
  display: grid;
  align-content: space-between;
  gap: 40px;
  border-right: 1px solid rgb(148 163 184 / 0.12);
  background: linear-gradient(135deg, rgb(34 211 238 / 0.08), transparent 36%),
    rgb(255 255 255 / 0.02);
}

.brand-line {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 14px;
  color: #041016;
  background: linear-gradient(135deg, #22d3ee, #10b981);
  box-shadow: 0 18px 42px rgb(34 211 238 / 0.16);
}

.brand-line div:last-child,
.brand-copy,
.form-head {
  display: grid;
  gap: 4px;
}

.brand-line span,
.brand-copy p,
.form-head span,
.security-note span,
.form-footer a {
  color: #7d8a9d;
  font-size: 12px;
  font-weight: 800;
}

.brand-line strong {
  color: #f8fbff;
  font-size: 18px;
  font-weight: 900;
}

.brand-copy h1,
.form-head h2 {
  margin: 0;
  color: #f8fbff;
  font-weight: 900;
  letter-spacing: 0;
}

.brand-copy h1 {
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1.05;
}

.brand-copy span {
  max-width: 34ch;
  color: #a4b0c0;
  font-size: 14px;
  line-height: 1.8;
}

.security-note {
  display: flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  border: 1px solid rgb(148 163 184 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.03);
  padding: 10px 12px;
}

.security-note svg {
  flex: 0 0 auto;
  color: #22d3ee;
}

.form-side {
  display: grid;
  align-content: center;
  gap: 24px;
}

.form-head h2 {
  font-size: 30px;
}

.dashboard-login-form {
  display: grid;
  gap: 14px;
}

.dashboard-login-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.dashboard-login-form :deep(.el-form-item__label) {
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: 8px;
}

.dashboard-login-form :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 12px;
  background: rgb(255 255 255 / 0.04);
  box-shadow: 0 0 0 1px rgb(148 163 184 / 0.14) inset;
}

.dashboard-login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgb(34 211 238 / 0.34) inset;
}

.dashboard-login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px #22d3ee inset,
    0 0 0 4px rgb(34 211 238 / 0.1);
}

.dashboard-login-form :deep(.el-input__inner) {
  color: #f8fbff;
  font-size: 14px;
}

.dashboard-login-form :deep(.el-input__inner::placeholder) {
  color: #667386;
}

.submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 46px;
  border: 1px solid rgb(34 211 238 / 0.32);
  border-radius: 12px;
  background: linear-gradient(135deg, #22d3ee, #10b981);
  color: #041016;
  font-size: 14px;
  font-weight: 900;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}

.submit-button:hover {
  box-shadow: 0 18px 42px rgb(34 211 238 / 0.16);
}

.submit-button:active {
  transform: translateY(1px);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
}

.form-footer a {
  color: #c8f8f4;
  text-decoration: none;
}

.form-footer a:hover {
  color: #ffffff;
}

@media (max-width: 860px) {
  .login-panel {
    grid-template-columns: 1fr;
  }

  .brand-side {
    border-right: 0;
    border-bottom: 1px solid rgb(148 163 184 / 0.12);
  }
}

@media (max-width: 560px) {
  .login-shell {
    padding: 14px;
  }

  .brand-side,
  .form-side {
    padding: 22px;
  }

  .security-note {
    width: 100%;
    border-radius: 12px;
  }
}
</style>

<route>
{
  name: "DashboardLoginPage",
  meta: {
    layout: "empty"
  }
}
</route>
