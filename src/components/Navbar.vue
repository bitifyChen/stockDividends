<script setup></script>

<template>
  <div class="w-full absolute top-0 z-10">
    <van-nav-bar title="庫存">
      <template #right>
        <slot />
      </template>
    </van-nav-bar>
  </div>
  <div class="mb-[46px]"></div>
</template>

<style scoped></style>
