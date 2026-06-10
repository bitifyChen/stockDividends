import { defineStore } from 'pinia'

export const useDashboardSettingStore = defineStore('dashboardSetting', {
  persist: true,
  state: () => ({
    shareUnit: 'share'
  }),
  actions: {
    setShareUnit(unit) {
      this.shareUnit = unit === 'lot' ? 'lot' : 'share'
    }
  }
})
