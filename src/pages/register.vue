<script setup>
import { postUser } from '@/firebase/user.js'
import TwoDynamicForm from '@/components/Two/TwoDynamicForm.vue'
import router from '@/router'
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
  },
  {
    name: 'rePassword',
    label: '確認密码',
    type: 'password',
    cssStyle: true,
    rules: [{ required: true, message: '密码为必填项' }]
  }
])
const parentForm = ref({})
const submitting = ref(false)
const loginMethod = () => {
  if (parentForm.value.password !== parentForm.value.rePassword) {
    return ElMessage({
      message: '兩次輸入的密碼不相同',
      type: 'error',
      plain: true
    })
  }
  submitting.value = true
  postUser(parentForm.value)
    .then((res) => {
      ElMessage({
        message: '註冊成功',
        type: 'success',
        plain: true
      })
      router.push({ path: '/login' })
    })
    .catch((err) => {
      ElMessage({
        message: err.message,
        type: 'error',
        plain: true
      })
    })
    .finally(() => {
      submitting.value = false
    })
}
</script>

<template>
  <div class="p-[20px] w-full">
    <div class="font-black text-[48px] text-[var(--main-primary-color)]">
      <div class="text-center">Stock!</div>
    </div>
    <TwoDynamicForm
      :fields="fields"
      :parentForm="parentForm"
      :submitting="submitting"
      submitText="註冊"
      @submitFn="loginMethod"
      class="form"
    />
    <div class="flex justify-end">
      <router-link to="/login" class="text-[var(--main-primary-color)]"
        >有帳號嗎，前往登入</router-link
      >
    </div>
  </div>
</template>

<style scoped lang="scss"></style>

<route>
{
  name: "registerPage",
  meta: {
    layout: "empty",
  }
}
</route>
