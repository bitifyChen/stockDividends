import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import generatedRoutes from 'virtual:generated-pages'
import { useCookies } from '@vueuse/integrations/useCookies'

const cookies = useCookies(['token'])
const routes = setupLayouts(generatedRoutes)
const router = createRouter({
  history: createWebHistory('/stockDividends/'),
  routes
})

router.beforeEach((to, from, next) => {
  const _token = cookies.get('token')
  if (to?.meta?.requiresAuth && !_token) {
    next('/login')
  }
  next()
})

export default router
