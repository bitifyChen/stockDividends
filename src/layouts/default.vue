<script setup></script>

<template>
  <div class="main">
    <div class="w-full h-[calc(100dvh-50px)] overflow-y-auto">
      <router-view />
    </div>
    <Footer />
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
