<script setup>
import { useRouter } from 'vue-router'
import { LayoutDashboard, SearchX } from 'lucide-vue-next'

const router = useRouter()
const goDashboard = () => router.push('/dashboard')
</script>

<template>
  <div class="dashboard-404">
    <div class="error-panel">
      <div class="icon-wrapper">
        <SearchX :size="48" stroke-width="1.5" />
      </div>
      <h1 class="error-code">404</h1>
      <h2 class="error-title">資源未找到</h2>
      <p class="error-message">
        系統無法定位您請求的數據路徑。該資源可能已遷移、刪除，或者您的訪問權限已更改。
      </p>
      <div class="actions">
        <button class="dashboard-button" @click="goDashboard">
          <LayoutDashboard :size="18" />
          <span>返回概覽</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-404 {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60dvh;
  padding: 24px;
}

.error-panel {
  max-width: 480px;
  width: 100%;
  text-align: center;
  padding: 48px 24px;
  border: 1px solid rgb(148 163 184 / 0.12);
  border-radius: 28px;
  background: linear-gradient(180deg, rgb(15 18 26 / 0.8), rgb(10 13 20 / 0.8));
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 80px rgb(0 0 0 / 0.25);
}

.icon-wrapper {
  display: inline-flex;
  margin-bottom: 24px;
  color: #22d3ee;
  opacity: 0.8;
}

.error-code {
  font-size: 64px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #f8fbff;
  margin: 0;
  line-height: 1;
}

.error-title {
  font-size: 20px;
  font-weight: 800;
  color: #f8fbff;
  margin: 12px 0 16px;
}

.error-message {
  font-size: 14px;
  line-height: 1.6;
  color: #7c8a9d;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  justify-content: center;
}

.dashboard-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border: 1px solid rgb(34 211 238 / 0.22);
  border-radius: 14px;
  background: linear-gradient(135deg, rgb(34 211 238 / 0.12), rgb(8 145 178 / 0.08));
  color: #f8fbff;
  font-weight: 800;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgb(34 211 238 / 0.4);
    background: linear-gradient(135deg, rgb(34 211 238 / 0.18), rgb(8 145 178 / 0.12));
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>

<route>
{
  name: "DashboardNotFoundPage",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
