<script setup>
import axios from 'axios'
const get = async () => {
  axios
    .get(
      'https://script.google.com/macros/s/AKfycbyGiWxziMDnKbryeHRfq2oh6Rx8D_VRznrK8kJPJ_xwCAwB8B7tp4NPgrGlejBZn1A_LQ/exec'
    )
    .then((res) => {
      console.log(res)
    })
}
const post = async () => {
  axios
    .post(
      'https://script.google.com/macros/s/AKfycbyGiWxziMDnKbryeHRfq2oh6Rx8D_VRznrK8kJPJ_xwCAwB8B7tp4NPgrGlejBZn1A_LQ/exec',
      {
        name: '1212'
      }
    )
    .then((res) => {
      console.log(res)
    })
}
</script>

<template>
  <div @click="get">GET</div>
  <div @click="post">POST</div>
</template>

<style scoped lang="scss"></style>

<route>
{
  name: "IndexPage",
  meta: {
    layout: "empty"
  }
}
</route>
