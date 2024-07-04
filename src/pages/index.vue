<script setup>
import { getUser, postUser } from '@/api/user.js'

const get = async () => {
  getUser({
    username: 'bitify',
    password: '1227'
  }).then((res) => {
    if (res.status === 200) {
      console.log('登入成功', res.data.token)
    }
  })
}
const post = async () => {
  postUser({
    name: '12122332',
    username: 'asdasdasd',
    password: 'pwpwpwpw'
  }).then((res) => {
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
