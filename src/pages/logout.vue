<script setup>
import { useRouter } from 'vue-router'
import { useCookies } from '@vueuse/integrations/useCookies'
const router = useRouter()
const cookies = useCookies(['token'])
cookies.remove('token')
router.push({ name: 'LoginPage' })
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
