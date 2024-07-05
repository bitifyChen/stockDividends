<script setup>
import { getStock } from '@/api/stock.js'
import { computed } from 'vue'
import { useCookies } from '@vueuse/integrations/useCookies'
const cookies = useCookies(['token'])
const _token = cookies.get('token')

const orgData = ref(null)
const data = computed(() => {
  return orgData.value
})
const stockIdList = computed(() => {
  const _set = new Set()
  if (data.value) {
    data.value.map((e) => {
      if (!_set.has(e.stockId)) _set.add(e.stockId)
    })
  }
  return _set
})

const loading = ref(false)
const getStockMethod = () => {
  loading.value = true
  getStock({ id: _token })
    .then((res) => {
      if (res.status === 200) {
        orgData.value = res.data
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const activeStock = ref('null')
//新增
const stockAddHook = ref(null)
const addMethod = () => stockAddHook.value && stockAddHook.value.open()

//Init
getStockMethod()
</script>

<template>
  <Navbar> <van-icon name="plus" size="28" @click="addMethod" /> </Navbar>
  <div class="min-h-[100vh]" v-loading="loading">
    <van-collapse v-model="activeStock" accordion>
      <van-collapse-item :title="id" :name="id" v-for="id in stockIdList" :key="id">
        {{ data.filter((e) => e.stockId === id) }}
      </van-collapse-item>
    </van-collapse>
  </div>

  <stockAdd ref="stockAddHook" @finish="getStockMethod" />
</template>

<style scoped lang="scss"></style>

<route>
{
  name: "StockPage",
  meta: {
    requiresAuth: true
  }
}
</route>
