<script setup></script>

<template>
  <div class="main">
    <div class="flex-1 w-full pb-[50px]">
      <router-view />
    </div>
    <Footer />
  </div>
</template>

<style scoped lang="scss">
.main {
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
