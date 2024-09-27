<script setup>
import { ref, computed, watch } from 'vue'
// eslint-disable-next-line no-unused-vars
const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:modelValue'])
const date = ref('')
const onChange = () => {
  emit('update:modelValue', dataOnlyDate.value)
}
const dataOnlyDate = computed(() => {
  if (!date.value) return null
  const nowDate = new Date(date.value)
  const timeZoneOffset = 8 * 60
  nowDate.setMinutes(nowDate.getMinutes() + timeZoneOffset)
  return nowDate.toISOString().split('T')[0]
})
watch(
  () => props.modelValue,
  () => {
    date.value = props.modelValue ? props.modelValue : null
  },
  { immediate: true }
)

const preventNativeKeyboard = () => {
  datePicker.value.blur() // 让输入框失去焦点，防止键盘弹出
}
</script>

<template>
  <input
    type="date"
    v-model="date"
    class="time-input"
    :class="[props.readonly ? 'is-readonly' : '']"
    :placeholder="props.placeholder"
    :readonly="props.readonly"
    :disabled="props.disabled"
    @change="onChange"
    @click="(e) => e.currentTarget.showPicker()"
  />
</template>

<style scoped lang="scss">
.time-input {
  width: 100%;
  border-radius: 4px;
  box-shadow: none;
  background-color: var(--form-bg-color);
  height: 48px;
  flex: 1 1 auto;
  text-align: left;
  padding: 1px 11px;
  color: var(--el-input-text-color, var(--el-text-color-regular));
  -webkit-appearance: none;
  -moz-appearance: none;
}
input::-webkit-date-and-time-value {
  text-align: left;
}
</style>
