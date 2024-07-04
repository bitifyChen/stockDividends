<script setup>
import { ref, computed, defineProps, defineExpose } from 'vue'
import { useElMessageBox } from '@/components/Two/TwoElMessageBox.js'

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
    class="setting-base-form-use mx-[-10px] grid grid-cols-12 md:px-[20px] xl:px-[15px]"
    :hide-required-asterisk="props.isHideAsterisk"
  >
    <div
      v-for="field in props.fields"
      :key="field.name"
      class="px-[10px] max-xl:!col-span-12"
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
          class="form-input-setting-unit-use h-[48px] flex-1"
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
        <template v-if="field.type === 'countdown'">
          <el-input
            v-if="field.type === 'countdown'"
            v-model="form[field.name]"
            :type="field.type"
            :placeholder="field.placeholder ? field.placeholder : ''"
            :class="[field.readonly ? 'is-readonly' : '']"
            :readonly="field.readonly"
            class="h-[48px] flex-1"
          >
            <template #append v-if="field.callback">
              <div
                class="countdown-btn"
                :class="{
                  'is-disabled': countdown
                }"
                @click="countdownMethod(field.callback)"
              >
                {{ countdownText }}
              </div>
            </template>
          </el-input>
        </template>
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
    <slot name="bottom"></slot>
    <div class="submit col-span-12 flex pb-[20px]" v-if="!props.submitHide">
      <el-button
        color="#2969FF"
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
  .el-input__inner {
    font-size: 16px;
  }

  .el-form-item__content {
    width: 100%;
  }

  .el-form-item__content {
    .el-button {
      border: 0;
      border-top: 1px solid rgba(17, 17, 19, 0.2);
      border-bottom: 1px solid rgba(17, 17, 19, 0.2);
      border-right: 1px solid rgba(17, 17, 19, 0.2);
    }
  }

  .el-form-item__label {
    color: #000;
    padding-left: 12px;
    padding-right: 12px;
    font-size: 16px;
  }

  .el-input__wrapper {
    border: 1px solid rgba(17, 17, 19, 0.2);
    border-radius: 4px;
    box-shadow: none;

    &.is-focus {
      position: relative;
      border: 1px solid #111113;

      &::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: calc(100% + 6px);
        height: calc(100% + 6px);
        border: solid 3px rgba(17, 17, 19, 0.2);
        border-radius: 6px;
        overflow: hidden;
      }

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
      background: rgba(0, 0, 0, 0.02);
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
    color: #fff;
    &.btn-submit {
      padding: 9px 30px;
      font-size: 20px;
      line-height: 24px;
      margin-top: 20px;
    }
  }

  .form-has-check,
  .form-has-allIn,
  .form-has-count {
    .el-input__wrapper {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      // border-right: 0;
      box-shadow: none;
    }

    .el-button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      background-color: #1599f2;
    }

    &.is-error {
      .el-input__wrapper,
      .el-button {
        border-color: var(--el-color-danger);
      }
    }
  }
}

.login-wrapper {
  .btn-submit {
    background: #1599f2;
    min-width: 230px;
    border: 0;
    box-shadow: none;
  }
}
.form-input-setting-unit-use {
  .el-input-group__append {
    position: absolute;
    right: 0;
    box-shadow: none;
    background-color: transparent;
    z-index: 2;
  }
  :deep(.el-input__inner) {
    border: 1px solid #000;
  }
}
.countdown-btn {
  background-color: #e6a23c;
  color: white;
  cursor: pointer;
  margin: 0px -20px;
  padding: 0px 20px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0px 4px 4px 0px;
  border: 1px solid rgba(17, 17, 19, 0.2);
  &:hover {
    background-color: #f5c97b;
  }
  &.is-disabled {
    background-color: #fdf6ec;
    color: #e6a23c;
    cursor: not-allowed;
  }
}
@for $i from 1 through 12 {
  .col-span-#{$i} {
    grid-column: span #{$i} / span #{$i};
  }
}
</style>
