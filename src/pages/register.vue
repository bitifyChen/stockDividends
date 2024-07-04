<script setup>
import { postUser } from '@/api/user.js'
import TwoDynamicForm from '@/components/Two/TwoDynamicForm.vue'
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
  postUser(parentForm.value).then((res) => {
    if (res.status === 200) {
      console.log('註冊成功', res.data.token)
    }
  })
}
</script>

<template>
  <TwoDynamicForm
    :fields="fields"
    :parentForm="parentForm"
    submitText="註冊"
    @submitFn="loginMethod"
    class="form"
  />
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
