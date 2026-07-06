<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.replace({ name: 'Dashboard_Etf_Events_Overview' })
})
</script>

<template>
  <div class="dashboard-redirect" aria-live="polite">正在前往當日進出總覽...</div>
</template>

<style scoped>
.dashboard-redirect {
  display: grid;
  min-height: 40vh;
  place-items: center;
  color: var(--dashboard-text-muted, #94a3b8);
  font-size: 14px;
  font-weight: 900;
}
</style>

<route>
{
  name: "Dashboard_Home",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
