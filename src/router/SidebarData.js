import { Activity, Briefcase, Coins, Eye, TrendingUp } from 'lucide-vue-next'

export const navGroups = [
  {
    label: 'ETF',
    items: [
      {
        title: '每日進出',
        path: 'Dashboard_Etf_Events',
        icon: Activity
      },
      {
        title: '目前持股',
        path: 'Dashboard_Etf_Holdings',
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
  }
]
