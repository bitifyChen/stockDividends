import { defineStore } from 'pinia'
export const useUserInfoStore = defineStore('userInfo', {
  persist: true,
  state: () => ({
    userInfo: {}
  }),
  getters: {
    userName: (state) => {
      return state.userInfo.displayName
    },
    isSuperuser: (state) => {
      return state.userInfo?.superuser === true
    }
  },
  actions: {
    setUserInfo(e) {
      this.userInfo = e
    },
    syncUserInfo(e) {
      this.userInfo = { ...this.userInfo, ...e }
    },
    clear() {
      this.userInfo = {}
    }
  }
})
