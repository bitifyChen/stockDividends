import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import generatedRoutes from 'virtual:generated-pages'
import { useCookies } from '@vueuse/integrations/useCookies'
import { checkUser } from '@/firebase/user.js'
import { useUserInfoStore } from '@/stores/useUserInfo.js'

const cookies = useCookies(['token'])
const routes = setupLayouts(generatedRoutes)
const router = createRouter({
  history: createWebHistory('/stockDividends/'),
  routes
})

router.beforeEach(async (to, from, next) => {
  const piniaUserInfo = useUserInfoStore()
  if (to?.meta?.requiresAuth) {
    try {
      const user = await checkUser()
      piniaUserInfo.setUserInfo(user)
      cookies.set('token', user.uid)
      next() // 用户已验证，允许导航
    } catch (error) {
      next({ path: '/login' }) // 用户未验证，重定向到登录页面或其他逻辑
    }
  }
  next()
})

export default router
