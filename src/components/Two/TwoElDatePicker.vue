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
    const nowDate = new Date(date.value)
    const timeZoneOffset = 8 * 60
    nowDate.setMinutes(nowDate.getMinutes() + timeZoneOffset)
    return nowDate.toISOString().split('T')[0]
  })
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        date.value = new Date(props.modelValue)
      }
    },
    { immediate: true }
  )
</script>

<template>
  <div class="el-date-picker">
    <el-date-picker
      v-model="date"
      :class="[props.readonly ? 'is-readonly' : '']"
      type="date"
      :placeholder="props.placeholder"
      @change="onChange"
      :readonly="props.readonly"
      :disabled="props.disabled"
    />
  </div>
</template>

<style scoped lang="scss">
  .el-date-picker :deep() {
    .el-input {
      width: 100%;
      height: 48px;
    }
    .el-input__wrapper {
      width: 100%;
      border: 1px solid rgba(17, 17, 19, 0.2);
      border-radius: 4px;
      box-shadow: none;
      height: 48px;
      line-height: 48px;
    }
  }
</style>
