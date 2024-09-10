import { defineStore } from 'pinia'

export const usePageSettingStore = defineStore('pageSetting', {
  persist: true,
  state: () => ({
    stock: {
      hiddenSold:false
    }
  }),
  getters: {},
  actions: {
    toggleSetting(page, key) {
      this[page][key] = !this[page][key]
    }
  }
})
