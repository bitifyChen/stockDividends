<script setup>
import { ref, computed, defineProps, defineExpose } from 'vue'
import { useElMessageBox } from '@/components/Two/TwoElMessageBox.js'
import TwoElDatePicker from './TwoElDatePicker.vue'

const props = defineProps({
  fields: {
    type: Array,
    required: true
  },
  parentForm: {
    type: Object,
    required: true
  },
  rules: {
    type: Object,
    default: () => {}
  },
  submitHide: {
    type: Boolean,
    default: false
  },
  submitting: {
    type: Boolean,
    default: false
  },
  submitAlert: {
    type: String,
    required: false
  },
  submitText: {
    type: String,
    default: ''
  },
  isHideAsterisk: {
    //米字號位置隱藏，預設隱藏
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['submitFn'])

const ruleFormRef = ref(null)
const form = computed(() => props.parentForm)

//倒數功能
const countdown = ref(0)
const countdownTime = 100
const countdownLoading = ref(false)
const countdownText = computed(() => {
  return countdown.value ? countdown.value : '取得驗證碼'
})
const countdownMethod = (callback = () => {}) => {
  if (countdown.value === 0 && !countdownLoading.value) {
    countdownLoading.value = true
    callback().then(() => {
      countdown.value = countdownTime
      countdownLoading.value = false
      const _countdown = setInterval(() => {
        if (countdown.value === 0) {
          clearInterval(_countdown)
        } else {
          countdown.value--
        }
      }, 1000)
    })
  }
}
const submitForm = (formEl) => {
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      if (props.submitAlert) {
        useElMessageBox(props.submitAlert, () => emit('submitFn'))
      } else {
        emit('submitFn')
      }
    } else {
      return false
    }
  })
}

const validateFormMethod = () => {
  return new Promise((resolve, reject) => {
    ruleFormRef.value.validate((valid) => {
      if (valid) {
        resolve()
      } else {
        reject()
      }
    })
  })
}

const resetFormMethod = () => {
  ruleFormRef.value.resetFields()
}

defineExpose({
  resetFormMethod,
  validateFormMethod
})
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="form"
    :rules="props.rules"
    @submit.enter.prevent="submitForm"
    class="setting-base-form-use grid grid-cols-12"
    :hide-required-asterisk="props.isHideAsterisk"
  >
    <div
      v-for="field in props.fields"
      :key="field.name"
      class="max-xl:!col-span-12"
      :class="[field.col ? `col-span-${field.col}` : 'col-span-12']"
    >
      <el-form-item
        :label="field.label"
        :prop="field.name"
        :rules="field.rules"
        class="setting-form-item flex flex-col items-start"
      >
        <el-input
          v-if="
            field.type === 'text' ||
            field.type === 'password' ||
            field.type === 'number' ||
            field.type === 'textarea'
          "
          v-model="form[field.name]"
          :type="field.type"
          :placeholder="field.placeholder ? field.placeholder : ''"
          :show-password="field.type === 'password'"
          :class="[field.readonly ? 'is-readonly' : '']"
          :readonly="field.readonly"
          class="h-[48px] flex-1"
        >
          <template #append v-if="field.unit">
            <div class="show-unit">
              {{ field.unit }}
            </div>
          </template>
        </el-input>
        <el-select
          v-if="field.type === 'select' && !field.multiple"
          v-model="form[field.name]"
          class="flex-1"
          :placeholder="field.placeholder ? field.placeholder : ''"
        >
          <el-option
            :label="select.label"
            :value="select.value"
            v-for="select in field.selectOption"
            :key="select.value"
          />
        </el-select>
        <el-select
          v-if="field.type === 'select' && field.multiple"
          v-model="form[field.name]"
          multiple
          :collapse-tags="field.readonly ? false : true"
          :collapse-tags-tooltip="field.readonly ? false : true"
          :disabled="field.readonly"
          class="flex-1"
          :placeholder="field.placeholder ? field.placeholder : ''"
        >
          <el-option
            :label="select.label"
            :value="select.value"
            v-for="select in field.selectOption"
            :key="select.value"
          />
        </el-select>
        <el-radio-group
          v-if="field.type === 'radio'"
          v-model="form[field.name]"
          :disabled="field.readonly"
          class="flex-1"
        >
          <el-radio
            :label="select.label"
            :value="select.value"
            v-for="select in field.selectOption"
            :key="select.value"
          />
        </el-radio-group>
        <el-switch
          v-if="field.type === 'switch'"
          v-model="form[field.name]"
          :disabled="field.readonly"
          class="flex-1"
          inline-prompt
          :active-icon="Check"
          :inactive-icon="Close"
        />
        <TwoElDatePicker
          v-if="field.type === 'date'"
          v-model="form[field.name]"
          type="date"
          class="flex-1"
          :placeholder="field.placeholder ? field.placeholder : ''"
          :readonly="field.readonly"
        />
        <div v-if="field.slot" class="flex-1" :class="[field.slotClassName]">
          <slot :name="field.slot"></slot>
        </div>
      </el-form-item>
    </div>
    <div class="col-span-12">
      <slot name="bottom"></slot>
    </div>
    <div class="submit col-span-12 flex pb-[20px]" v-if="!props.submitHide">
      <el-button
        @click="submitForm(ruleFormRef)"
        class="ml-auto mr-auto !h-[48px] w-auto !rounded-[7px] text-[16px]"
        :class="props.submitText ? 'btn-submit' : ''"
        :loading="props.submitting"
      >
        {{ props.submitText || '送出' }}
      </el-button>
    </div>
  </el-form>
</template>

<style lang="scss">
.setting-base-form-use {
  .el-form-item__content {
    width: 100%;
  }

  .el-form-item__label {
    color: #000;
    font-weight: 900;
    font-size: 16px;
  }

  .el-input__wrapper {
    border-radius: 4px;
    box-shadow: none;
    background-color: var(--form-bg-color);
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      transition: background-color 5000s ease-in-out 0s;
    }
    &.is-focus {
      position: relative;

      & > * {
        position: relative;
      }
    }
  }

  .is-readonly {
    * {
      cursor: default !important;
    }
    .el-input__wrapper {
      font-weight: 700;
      &:hover {
        box-shadow: none;
      }
      &.is-focus {
        border: solid 1px rgba(17, 17, 19, 0.2);
      }
    }
  }

  .is-error,
  .is-readonly {
    .el-input__wrapper.is-focus::before {
      display: none;
    }
  }

  .el-select {
    height: 48px;
    line-height: 48px;

    .el-input {
      height: 100%;
    }

    .el-tooltip__trigger {
      height: 100%;

      .el-input__wrapper {
        padding: 3px 11px;
      }
    }
  }

  .el-button {
    color: var(--form-btn-text-color);
    background-color: var(--form-btn-bg-color);
    border: none;
    width: 100%;
    font-weight: 700;
    letter-spacing: 0.2em;
    &.btn-submit {
      padding: 9px 30px;
      font-size: 20px;
      line-height: 24px;
      margin-top: 20px;
    }
  }
}
</style>
