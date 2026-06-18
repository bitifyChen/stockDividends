<script setup>
import { useRouter } from 'vue-router'
import { Home } from 'lucide-vue-next'

const router = useRouter()
const goHome = () => router.push('/')
</script>

<template>
  <div class="error-container">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">找不到頁面</h2>
      <p class="error-message">抱歉，您訪問的頁面可能已被移除、名稱已更改或暫時無法使用。</p>
      <button class="home-button" @click="goHome">
        <Home :size="18" />
        <span>回到首頁</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-container {
  min-height: calc(100dvh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: var(--main-bg-sub-color, #f8fafc);
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-code {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  color: var(--main-gray-color, #e2e8f0);
  margin-bottom: -20px;
}

.error-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main-color, #1e293b);
  margin-bottom: 16px;
}

.error-message {
  color: var(--text-secondary-color, #64748b);
  font-size: 16px;
  margin-bottom: 32px;
  line-height: 1.6;
}

.home-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: var(--main-primary-color, #3b82f6);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}
</style>

<route>
{
  name: "NotFoundPage",
  meta: {
    requiresAuth: false,
    layout: "default"
  }
}
</route>
