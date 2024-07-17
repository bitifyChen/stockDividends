<script setup>
import { patchUser } from '@/firebase/user.js'
import { useBaseStore } from '@/stores/useBase.js'
import { useUserInfoStore } from '@/stores/useUserInfo.js'
const piniaBase = useBaseStore()
const piniaUserInfo = useUserInfoStore()
const parentForm = ref({
  displayName: piniaUserInfo?.userName
})
const submitting = ref(false)
const fields = computed(() => [
  {
    name: 'displayName',
    label: '名稱',
    type: 'text',
    cssStyle: true,
    rules: [{ required: true, message: '必填' }]
  }
])
const submitMethod = () => {
  submitting.value = true
  patchUser(parentForm.value)
    .then((res) => {
      if (res.status === 200) {
        ElMessage({
          message: '更新成功',
          type: 'success',
          plain: true
        })
        syncUser(parentForm.value)
      }
    })
    .finally(() => {
      submitting.value = false
    })
}
const syncUser = (data) => {
  piniaUserInfo.syncUserInfo(data)
}
</script>

<template>
  <teleport to="#header-slot" v-if="piniaBase?.menuOnMount && !piniaBase?.menuIsOpen">
    <div class="w-full font-black justify-between items-center flex text-[48px] text-[white]">
      <div class="w-[26px] h-[26px]"></div>
      <div class="text-[24px] text-center">編輯個人資料</div>
      <div class="w-[26px] h-[26px]"></div>
    </div>
  </teleport>
  <div class="p-[20px]">
    <TwoDynamicForm
      ref="formHook"
      :fields="fields"
      :parentForm="parentForm"
      submitText="更新"
      :submitting="submitting"
      @submitFn="submitMethod()"
    >
    </TwoDynamicForm>
  </div>
</template>

<style scoped lang="scss"></style>

<route>
{
  name: "SettingProfilePage",
  meta: {
    requiresAuth: true
  }
}
</route>
