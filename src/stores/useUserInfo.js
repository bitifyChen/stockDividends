import { defineStore } from 'pinia'
export const useUserInfoStore = defineStore('userInfo', {
  persist: true,
  state: () => ({
    userInfo: {}
  }),
  getters: {},
  actions: {
    setUserInfo(e) {
      this.userInfo = e
    },
    clear() {
      this.userInfo = {}
    }
  }
})
