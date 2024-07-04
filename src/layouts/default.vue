<script setup></script>

<template>
  <div class="main">
    <NavBar />
    <div class="flex-1">
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
