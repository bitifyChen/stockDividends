import { defineStore } from 'pinia'

export const useBaseStore = defineStore('base', {
  state: () => ({
    menuIsOpen: false,
    menuOnMount: false
  }),
  getters: {},
  actions: {
    toggleMenu() {
      this.menuIsOpen = !this.menuIsOpen
    },
    closeMenu() {
      this.menuIsOpen = false
    },
    activeMenu() {
      this.menuOnMount = true
    }
  }
})
