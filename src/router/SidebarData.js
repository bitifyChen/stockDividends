import { Activity, Briefcase, Coins, Eye, Network, Settings, TrendingUp } from 'lucide-vue-next'

export const navGroups = [
  {
    label: 'ETF',
    items: [
      {
        title: '每日進出',
        path: 'Dashboard_Etf_Events',
        to: '/dashboard/etf/events/overview',
        icon: Activity
      },
      {
        title: '目前持股',
        path: 'Dashboard_Etf_Holdings',
        to: '/dashboard/etf/holdings/overview',
        icon: Briefcase
      },
      {
        title: '首次買入',
        path: 'Dashboard_Etf_FirstBuy',
        icon: TrendingUp
      },
      {
        title: '個股觀測',
        path: 'Dashboard_Etf_Stocks',
        icon: Eye
      },
      {
        title: '產業鏈地圖',
        path: 'Dashboard_Industry_Chain',
        to: '/dashboard/industry/chain',
        icon: Network
      }
    ]
  },
  {
    label: '我的',
    items: [
      {
        title: '持股管理',
        path: 'Dashboard_My_Holdings',
        icon: Briefcase
      },
      {
        title: '股利記錄',
        path: 'Dashboard_My_Dividend',
        icon: Coins
      }
    ]
  },
  {
    label: '系統',
    items: [
      {
        title: '系統設定',
        path: 'Dashboard_Setting',
        icon: Settings,
        requiresSuperuser: true
      }
    ]
  }
]
