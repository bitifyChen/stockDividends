<script setup>
import { getUser } from '@/api/user.js'
import TwoDynamicForm from '@/components/Two/TwoDynamicForm.vue'
import { useRouter } from 'vue-router'
import { useCookies } from '@vueuse/integrations/useCookies'
import { useUserInfoStore } from '@/stores/useUserInfo.js'
const piniaUserInfo = useUserInfoStore()
const router = useRouter()
const cookies = useCookies(['token'])
const fields = computed(() => [
  {
    name: 'username',
    label: '帳號',
    type: 'text',
    cssStyle: true,
    rules: [{ required: true, message: '帐号为必填项' }]
  },
  {
    name: 'password',
    label: '密碼',
    type: 'password',
    cssStyle: true,
    rules: [{ required: true, message: '密码为必填项' }]
  }
])
const parentForm = ref({})
const loading = ref(false)
const loginMethod = () => {
  loading.value = true
  getUser(parentForm.value)
    .then((res) => {
      if (res.status === 200) {
        ElMessage({
          message: '登入成功',
          type: 'success',
          plain: true
        })
        piniaUserInfo.setUserInfo(res.data)
        cookies.set('token', res.data.token)
        router.push({ name: 'IndexPage' })
      } else {
        ElMessage({
          message: '帳號或密碼錯誤',
          type: 'error',
          plain: true
        })
      }
    })
    .catch((err) => {
      ElMessage({
        message: '網路問題，請稍後再試',
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
  <div class="p-[20px] w-full">
    <div class="font-black text-[48px] text-white">
      <div class="text-center">Stock!</div>
    </div>
    <TwoDynamicForm
      :submitting="loading"
      :fields="fields"
      :parentForm="parentForm"
      submitText="登入"
      @submitFn="loginMethod"
      class="form"
    />
    <div class="flex justify-end">
      <router-link to="/register" class="text-white">沒有帳號嗎，前往註冊</router-link>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form {
  width: 100%;
}
</style>

<route>
{
  name: "LoginPage",
  meta: {
    layout: "empty",
  }
}
</route>
