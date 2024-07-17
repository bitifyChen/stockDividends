import { defineStore } from 'pinia'
export const useUserInfoStore = defineStore('userInfo', {
  persist: true,
  state: () => ({
    userInfo: {}
  }),
  getters: {
    userName: (state) => {
      return state.userInfo.displayName
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
