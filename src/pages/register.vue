<script setup>
import { postUser } from '@/api/user.js'
import TwoDynamicForm from '@/components/Two/TwoDynamicForm.vue'
import router from '@/router'
const fields = computed(() => [
  {
    name: 'name',
    label: '姓名',
    type: 'text',
    cssStyle: true,
    rules: [{ required: true, message: '姓名为必填项' }]
  },
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
const loginMethod = () => {
  if (parentForm.value.password !== parentForm.value.rePassword) {
    ElMessage({
      message: '兩次輸入的密碼不相同',
      type: 'error',
      plain: true
    })
  }
  postUser(parentForm.value).then((res) => {
    console.log(res)
    if (res.status === 200) {
      ElMessage({
        message: '註冊成功',
        type: 'success',
        plain: true
      })
      router.push({ path: '/login' })
    }
  })
}
</script>

<template>
  <div class="p-[20px] w-full">
    <div class="font-black text-[48px] text-white">
      <div class="text-center">Stock!</div>
    </div>
    <TwoDynamicForm
      :fields="fields"
      :parentForm="parentForm"
      submitText="註冊"
      @submitFn="loginMethod"
      class="form"
    />
    <div class="flex justify-end">
      <router-link to="/login" class="text-white">有帳號嗎，前往登入</router-link>
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
