<script setup>
import { usePageSettingStore } from '@/stores/usePageSetting.js'
const piniaPageSetting = usePageSettingStore()

const emit = defineEmits(['finish'])
const active = ref(false)
const toggle = () => (active.value = !active.value)

//隱藏已賣出
const hiddenSold = computed(() => piniaPageSetting.stock.hiddenSold)
const hiddenSoldHandler = () => piniaPageSetting.toggleSetting('stock', 'hiddenSold')
defineExpose({
  toggle
})
</script>

<template>
  <!-- 右側彈出 -->
  <van-popup
    v-model:show="active"
    position="right"
    :style="{ width: '100%', height: '100%', backgroundColor: 'var(--main-gray-color)' }"
    @close="onClose"
    closeable
  >
    <div class="my-[50px] px-[10px] custom-cell">
      <van-cell title="隱藏已賣出">
        <van-switch :model-value="hiddenSold" @update:model-value="hiddenSoldHandler" />
      </van-cell>
    </div>
  </van-popup>
</template>

<style scoped lang="scss">
.custom-cell :deep() .van-cell__title {
  display: flex;
  align-items: center;
  font-size: 16px;
}
</style>
