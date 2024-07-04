<script setup>
import { getUser } from '@/api/user.js'
import TwoDynamicForm from '@/components/Two/TwoDynamicForm.vue'
const fields = computed(() => [
  {
    name: 'username',
    label: '帐号',
    type: 'text',
    cssStyle: true,
    rules: [{ required: true, message: '帐号为必填项' }]
  },
  {
    name: 'password',
    label: '密码',
    type: 'password',
    cssStyle: true,
    rules: [{ required: true, message: '密码为必填项' }]
  }
])
const parentForm = ref({})
const loginMethod = () => {
  getUser(parentForm.value).then((res) => {
    if (res.status === 200) {
      console.log('登入成功', res.data.token)
    }
  })
}
</script>

<template>
  <TwoDynamicForm
    :fields="fields"
    :parentForm="parentForm"
    submitText="登 录"
    @submitFn="loginMethod"
    class="form"
  />
</template>

<style scoped lang="scss"></style>

<route>
{
  name: "LoginPage",
  meta: {
    layout: "empty",
  }
}
</route>
