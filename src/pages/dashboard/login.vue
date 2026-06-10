<script setup>
import { postUserLogin } from '@/firebase/user.js'
import { useRouter, useRoute } from 'vue-router'
import { useStockStore } from '@/stores/useStock.js'

const router = useRouter()
const route = useRoute()
const piniaStock = useStockStore()

const fields = computed(() => [
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    cssStyle: true,
    rules: [{ required: true, message: 'Required' }]
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    cssStyle: true,
    rules: [{ required: true, message: 'Required' }]
  }
])

const parentForm = ref({})
const loading = ref(false)

const loginMethod = () => {
  loading.value = true
  postUserLogin(parentForm.value)
    .then(() => {
      piniaStock.clear()
      ElMessage({
        message: 'Login success',
        type: 'success',
        plain: true
      })
      router.push((route.query.redirect && String(route.query.redirect)) || { name: 'Dashboard_Home' })
    })
    .catch((err) => {
      ElMessage({
        message: err.message,
        type: 'error',
        plain: true
      })
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<template>
  <div class="min-h-[100dvh] bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] px-4 py-10">
    <div class="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-6xl items-center">
      <div class="grid w-full gap-0 overflow-hidden rounded-[32px] bg-white shadow-2xl lg:grid-cols-[1fr_1.1fr]">
        <section class="bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_100%)] p-8 text-white lg:p-12">
          <div class="text-[11px] uppercase tracking-[0.35em] text-white/55">Dashboard Access</div>
          <h1 class="mt-4 text-[42px] font-black leading-tight">Sign in to the CMS workspace</h1>
          <p class="mt-4 max-w-md text-white/70">
            Use the same Firebase authentication as the current app, but enter the dashboard shell
            with its own layout and future admin pages.
          </p>
        </section>

        <section class="p-6 lg:p-10">
          <div class="mb-8">
            <div class="text-[11px] uppercase tracking-[0.3em] text-slate-500">Login</div>
            <h2 class="mt-2 text-[28px] font-black text-slate-900">Dashboard Login</h2>
          </div>

          <TwoDynamicForm
            :submitting="loading"
            :fields="fields"
            :parentForm="parentForm"
            submitText="Sign in"
            @submitFn="loginMethod"
            class="form"
          />

          <div class="mt-4 flex justify-end">
            <router-link to="/login" class="text-slate-500">Back to app login</router-link>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<route>
{
  name: "DashboardLoginPage",
  meta: {
    layout: "empty"
  }
}
</route>
