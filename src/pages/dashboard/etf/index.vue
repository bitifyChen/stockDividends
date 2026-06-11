<script setup>
import { RouterLink } from 'vue-router'
import { ArrowRight, ChartLine, Layers3, TrendingUp } from 'lucide-vue-next'

const cards = [
  {
    title: '每日進出',
    description: '觀察主動 ETF 每個交易日對持股的加碼、減碼與首次買入變化。',
    to: '/dashboard/etf/events',
    icon: TrendingUp
  },
  {
    title: '目前持股',
    description: '以 ETF 為出發點，查看最新持股排行、權重與曲線變化。',
    to: '/dashboard/etf/holdings',
    icon: Layers3
  },
  {
    title: '首次買入',
    description: '追蹤每檔主動 ETF 第一次建立部位的訊號與進場位置。',
    to: '/dashboard/etf/first-buy',
    icon: ChartLine
  }
]
</script>

<template>
  <div class="etf-home">
    <section class="hero-shell">
      <div class="hero-copy">
        <div class="eyebrow">Active ETF</div>
        <h1>主動 ETF 資料控制台</h1>
        <p>
          專為投資人設計的資料檢視介面。聚焦主動 ETF 的每日進出、持股結構與首次建倉訊號，
          用更冷靜、更有層次的視覺語言呈現市場脈動。
        </p>
      </div>
      <div class="hero-note">
        <span>入口</span>
        <strong>三大分析模組</strong>
        <p>所有頁面都已統一成黑底霓虹系統，單位切換會同步影響相關欄位。</p>
      </div>
    </section>

    <section class="bento-grid">
      <RouterLink v-for="card in cards" :key="card.to" :to="card.to" class="feature-card">
        <div class="card-icon">
          <component :is="card.icon" :size="22" />
        </div>
        <div class="card-copy">
          <span>Dashboard Module</span>
          <strong>{{ card.title }}</strong>
          <p>{{ card.description }}</p>
        </div>
        <div class="card-arrow">
          <ArrowRight :size="16" />
        </div>
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.etf-home {
  display: grid;
  gap: 18px;
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);
  gap: 18px;
  padding: 28px;
  border: 1px solid rgb(148 163 184 / 0.12);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgb(15 18 26 / 0.92), rgb(10 13 20 / 0.92));
  box-shadow:
    0 18px 48px rgb(0 0 0 / 0.16),
    inset 0 1px 0 rgb(255 255 255 / 0.03);
}

.eyebrow {
  color: #22d3ee;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  margin: 10px 0 0;
  color: #f8fbff;
  font-size: clamp(2rem, 4.4vw, 4rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.hero-copy p {
  max-width: 62ch;
  margin: 16px 0 0;
  color: #a4b0c0;
  font-size: 14px;
  line-height: 1.8;
}

.hero-note {
  align-self: end;
  display: grid;
  gap: 6px;
  padding: 18px;
  border: 1px solid rgb(34 211 238 / 0.16);
  border-radius: 20px;
  background: rgb(255 255 255 / 0.03);
}

.hero-note span {
  color: #7d8a9d;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-note strong {
  color: #f8fbff;
  font-size: 18px;
  font-weight: 900;
}

.hero-note p {
  margin: 0;
  color: #91a0b4;
  font-size: 13px;
  line-height: 1.7;
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.feature-card {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 18px;
  gap: 14px;
  align-items: center;
  min-height: 180px;
  padding: 20px;
  border: 1px solid rgb(148 163 184 / 0.12);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgb(15 18 26 / 0.92), rgb(10 13 20 / 0.92));
  box-shadow:
    0 18px 48px rgb(0 0 0 / 0.14),
    inset 0 1px 0 rgb(255 255 255 / 0.03);
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  border-color: rgb(34 211 238 / 0.26);
  box-shadow:
    0 24px 56px rgb(0 0 0 / 0.18),
    0 0 0 1px rgb(34 211 238 / 0.08) inset;
}

.card-icon {
  display: flex;
  height: 52px;
  width: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  color: #061016;
  background:
    linear-gradient(135deg, rgb(34 211 238), rgb(16 185 129));
  box-shadow: 0 16px 40px rgb(34 211 238 / 0.16);
}

.card-copy {
  display: grid;
  gap: 8px;
}

.card-copy span {
  color: #7d8a9d;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-copy strong {
  color: #f8fbff;
  font-size: 18px;
  font-weight: 900;
}

.card-copy p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.7;
}

.card-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8da0b6;
}

@media (max-width: 1100px) {
  .hero-shell,
  .bento-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    grid-template-columns: 52px minmax(0, 1fr);
  }

  .card-arrow {
    display: none;
  }
}

@media (max-width: 720px) {
  .hero-shell {
    padding: 20px;
  }

  .feature-card {
    min-height: 0;
    padding: 18px;
  }
}
</style>

<route>
{
  name: "Dashboard_Etf_Home",
  meta: {
    layout: "dashboard",
    requiresAuth: true
  }
}
</route>
