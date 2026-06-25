import { defineStore } from 'pinia'

export const useDashboardSettingStore = defineStore('dashboardSetting', {
  persist: true,
  state: () => ({
    shareUnit: 'share',
    themeMode: 'dark'
  }),
  actions: {
    setShareUnit(unit) {
      this.shareUnit = unit === 'lot' ? 'lot' : 'share'
    },
    setThemeMode(mode) {
      this.themeMode = ['light', 'dark', 'system'].includes(mode) ? mode : 'dark'
    }
  }
})
