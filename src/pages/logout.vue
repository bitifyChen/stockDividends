<script setup>
import { postUserLogout } from '@/firebase/user.js'
import { useRouter } from 'vue-router'
import { useCookies } from '@vueuse/integrations/useCookies'
import { useStockStore } from '@/stores/useStock.js'
const router = useRouter()
const cookies = useCookies(['token'])
const piniaStock = useStockStore()
cookies.remove('token')
piniaStock.clear()
postUserLogout().finally(() => {
  router.push({ name: 'LoginPage' })
})
</script>

<template></template>

<style scoped lang="scss"></style>

<route>
{
  name: "LogoutPage",
  meta: {
    requiresAuth: true
  }
}
</route>
