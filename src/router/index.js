import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import generatedRoutes from 'virtual:generated-pages'
import { useCookies } from '@vueuse/integrations/useCookies'
import { checkUser } from '@/firebase/user.js'
import { useUserInfoStore } from '@/stores/useUserInfo.js'

const cookies = useCookies(['token'])
const routes = setupLayouts(generatedRoutes)

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

router.beforeEach(async (to, from, next) => {
  const piniaUserInfo = useUserInfoStore()

  if (to?.meta?.requiresAuth) {
    try {
      const user = await checkUser()
      piniaUserInfo.setUserInfo(user)
      cookies.set('token', user.uid)

      if (to?.meta?.requiresSuperuser && !piniaUserInfo.isSuperuser) {
        next({ name: 'Dashboard_Home' })
        return
      }

      next()
    } catch (error) {
      next({
        name: to?.path?.startsWith('/dashboard') ? 'DashboardLoginPage' : 'LoginPage',
        query: to?.path?.startsWith('/dashboard') ? { redirect: to.fullPath } : undefined
      })
    }
    return
  }

  next()
})

export default router
