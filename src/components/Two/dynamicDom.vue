<script setup>
import { computed, ref, watch } from 'vue'
import { useElementSize } from '@vueuse/core'

const props = defineProps({
  dom: {
    type: String,
    default: ''
  },
  minHight: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 20
  }
})
const dom = computed(() => props.dom)
const animateSecond = computed(() => props.duration)
const animating = ref(false)
const currentHeight = ref(0) // 初始化為第一個高度
const animateHeight = (targetHeight) => {
  targetHeight += props.minHight
  const initialHeight = currentHeight.value
  const step = (targetHeight - initialHeight) / animateSecond.value // 定義步長，分30次完成動畫
  let count = 0
  const animate = () => {
    if (count < animateSecond.value) {
      count++
      currentHeight.value = initialHeight + step * count
      animating.value = true
      requestAnimationFrame(animate)
    } else {
      animating.value = false
      currentHeight.value = targetHeight // 確保最後達到目標高度
    }
  }
  animate()
}

const domHook = ref(null)
const { height } = useElementSize(domHook)
watch(
  () => height.value,
  (value) => animateHeight(value),
  { immediate: true }
)
</script>

<template>
  <div :style="{ height: `${currentHeight}px` }">
    <div :id="dom" ref="domHook" class="dom" :class="{ animate: animating }"><slot /></div>
  </div>
</template>

<style scoped lang="scss"></style>
