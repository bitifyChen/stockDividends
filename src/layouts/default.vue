<script setup></script>

<template>
  <div class="main">
    <Header />
    <div class="w-full">
      <router-view />
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>
