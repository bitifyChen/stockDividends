import { defineStore } from 'pinia'

export const useBaseStore = defineStore('base', {
  persist: true,
  state: () => ({
    menuIsOpen: false
  }),
  getters: {},
  actions: {
    toggleMenu() {
      this.menuIsOpen = !this.menuIsOpen
    }
  }
})
