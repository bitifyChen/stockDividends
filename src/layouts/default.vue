<script setup></script>

<template>
  <div class="main">
    <div class="w-full h-[calc(100vh-50px)]">
      <router-view />
    </div>
    <Footer />
  </div>
</template>

<style scoped lang="scss">
.main {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
</style>
