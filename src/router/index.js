import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import generatedRoutes from 'virtual:generated-pages'

const routes = setupLayouts(generatedRoutes)
const router = createRouter({
  history: createWebHistory('/stockDividends/'),
  routes
})

router.beforeEach((to, from, next) => {
  next()
})

export default router
