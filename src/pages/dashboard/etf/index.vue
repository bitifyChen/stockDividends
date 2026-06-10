<script setup>
const cards = [
  {
    title: '每日進出',
    description: '查看單一主動 ETF 在指定資料日的買入、加碼、減碼與清空事件。',
    to: '/dashboard/etf/events',
    meta: 'events'
  },
  {
    title: '目前持股',
    description: '查看單一主動 ETF 最新或指定日期的持股排名、權重、股數與市值。',
    to: '/dashboard/etf/holdings',
    meta: 'holdings'
  },
  {
    title: '首次買入',
    description: '查看單一主動 ETF 在指定資料日首次納入的個股。',
    to: '/dashboard/etf/first-buy',
    meta: 'first buy'
  }
]
</script>

<template>
  <div class="etf-console">
    <section class="console-bar">
      <div>
        <div class="breadcrumb">主動 ETF</div>
        <h1>主動 ETF 資料中心</h1>
      </div>
    </section>

    <section class="console-panel">
      <div class="intro">
        <p>
          目前 ETF 後台先拆成三個清楚的檢視面：每日進出、目前持股、首次買入。
          後續若後端提供跨 ETF 彙總 API，再新增雷達或排行型頁面。
        </p>
      </div>

      <div class="card-grid">
        <RouterLink v-for="card in cards" :key="card.to" class="feature-card" :to="card.to">
          <span>{{ card.meta }}</span>
          <strong>{{ card.title }}</strong>
          <p>{{ card.description }}</p>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.etf-console {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #cbd5e1;
}

.console-bar,
.console-panel {
  border: 1px solid #2f3339;
  border-radius: 6px;
  background: #1b1d21;
}

.console-bar {
  padding: 18px 20px;
}

.breadcrumb {
  color: #7c858f;
  font-size: 12px;
  font-weight: 900;
}

h1 {
  margin: 4px 0 0;
  color: #f7fafc;
  font-size: 22px;
  font-weight: 900;
}

.console-panel {
  padding: 16px;
}

.intro {
  border-bottom: 1px solid #2f3339;
  padding-bottom: 16px;
}

.intro p {
  max-width: 760px;
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.8;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-top: 16px;
}

.feature-card {
  display: grid;
  gap: 10px;
  min-height: 168px;
  border: 1px solid #2f3339;
  border-radius: 4px;
  background: #202328;
  padding: 16px;
  color: inherit;
  text-decoration: none;
}

.feature-card:hover {
  border-color: #10bfae;
  background: #22272c;
}

.feature-card span {
  color: #10bfae;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.feature-card strong {
  color: #f7fafc;
  font-size: 18px;
  font-weight: 900;
}

.feature-card p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .card-grid {
    grid-template-columns: 1fr;
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
