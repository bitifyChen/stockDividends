<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { ref } from 'vue'

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW()

const showUpdatePrompt = ref(false)

// 當有新版本需要更新時，顯示提示
watch(needRefresh, (newValue) => {
  if (newValue) {
    showUpdatePrompt.value = true
  }
})

const close = () => {
  offlineReady.value = false
  needRefresh.value = false
  showUpdatePrompt.value = false
}

const updatePWA = async () => {
  await updateServiceWorker()
  close()
}
</script>

<template>
  <div v-if="showUpdatePrompt" class="pwa-update-notification">
    <div class="message">
      <span>有新版本可用！點擊更新以獲取最新功能。</span>
    </div>
    <div class="actions">
      <button @click="updatePWA">更新</button>
      <button @click="close">稍後</button>
    </div>
  </div>
</template>

<style scoped>
.pwa-update-notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000; /* 確保在最上層 */
  text-align: center;
}

.pwa-update-notification .message {
  font-size: 16px;
}

.pwa-update-notification .actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.pwa-update-notification button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.pwa-update-notification button:hover {
  background-color: #0056b3;
}

.pwa-update-notification button:last-child {
  background-color: #6c757d;
}

.pwa-update-notification button:last-child:hover {
  background-color: #5a6268;
}
</style>
