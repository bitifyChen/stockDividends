<script setup></script>

<template>
  <div class="footer w-full absolute bottom-0 z-[9999]">
    <van-tabbar v-model="active" :fixed="false" route>
      <van-tabbar-item replace to="/" icon="wap-home">首頁</van-tabbar-item>
      <van-tabbar-item replace to="/stock" icon="balance-list">庫存</van-tabbar-item>
      <van-tabbar-item replace to="/logout" icon="lock">登出</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped lang="scss">
.footer :deep() {
  .van-tabbar-item {
    color: var(--main-sub-color);
    &.van-tabbar-item--active {
      color: var(--main-primary-color);
    }
  }
}
</style>
