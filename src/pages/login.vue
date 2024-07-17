<script setup>
import { postUserLogin } from '@/firebase/user.js'
import TwoDynamicForm from '@/components/Two/TwoDynamicForm.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const fields = computed(() => [
  {
    name: 'email',
    label: '帳號(電子信箱)',
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
const parentForm = ref({
  email: 'bitify@gmail.com',
  password: '123456'
})
const loading = ref(false)
const loginMethod = () => {
  loading.value = true
  postUserLogin(parentForm.value)
    .then((res) => {
      ElMessage({
        message: '登入成功',
        type: 'success',
        plain: true
      })
      router.push({ name: 'IndexPage' })
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
  <div class="p-[20px] w-full">
    <div class="font-black text-[48px] text-[var(--main-primary-color)]">
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
      <router-link to="/register" class="text-[var(--main-primary-color)]"
        >沒有帳號嗎，前往註冊</router-link
      >
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
