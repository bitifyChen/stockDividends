<script setup>
import { postUserLogout } from '@/firebase/user.js'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCookies } from '@vueuse/integrations/useCookies'
import { useStockStore } from '@/stores/useStock.js'
import { useUserInfoStore } from '@/stores/useUserInfo.js'
const router = useRouter()
const route = useRoute()
const cookies = useCookies(['token'])
const piniaStock = useStockStore()
const piniaUser = useUserInfoStore()
const logoutTarget = computed(() => String(route.query.target || 'frontend'))

cookies.remove('token')
piniaStock.clear()
piniaUser.clear()
postUserLogout().finally(() => {
  router.push({
    name: logoutTarget.value === 'dashboard' ? 'DashboardLoginPage' : 'LoginPage'
  })
})
</script>

<template></template>

<style scoped lang="scss"></style>

<route>
{
  name: "LogoutPage",
  meta: {
    layout: "empty"
  }
}
</route>
