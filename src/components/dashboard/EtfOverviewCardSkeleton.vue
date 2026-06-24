<script setup>
defineProps({
  rows: {
    type: Number,
    default: 6
  }
})
</script>

<template>
  <article class="overview-card-skeleton">
    <el-skeleton animated>
      <template #template>
        <header class="skeleton-header">
          <div class="skeleton-title">
            <el-skeleton-item variant="text" class="code-line" />
            <el-skeleton-item variant="h3" class="name-line" />
          </div>
          <el-skeleton-item variant="button" class="status-pill" />
        </header>

        <div class="skeleton-summary">
          <el-skeleton-item variant="text" />
          <el-skeleton-item variant="text" />
          <el-skeleton-item variant="text" />
        </div>

        <div class="skeleton-list">
          <div v-for="row in rows" :key="row" class="skeleton-row">
            <el-skeleton-item variant="button" class="rank-pill" />
            <div class="row-main">
              <el-skeleton-item variant="text" class="stock-line" />
              <el-skeleton-item variant="text" class="sub-line" />
            </div>
            <el-skeleton-item variant="text" class="metric-line" />
            <el-skeleton-item variant="button" class="action-pill" />
          </div>
        </div>
      </template>
    </el-skeleton>
  </article>
</template>

<style scoped>
.overview-card-skeleton {
  overflow: hidden;
  min-width: 0;
  height: 100%;
  min-height: 390px;
  border: 1px solid var(--main-border-color, rgb(148 163 184 / 0.16));
  border-radius: 16px;
  background: radial-gradient(circle at 100% 0%, rgb(34 211 238 / 0.06), transparent 30%),
    var(--main-surface-color, #0f1320);
  box-shadow:
    0 16px 36px rgb(0 0 0 / 0.16),
    inset 0 1px 0 rgb(255 255 255 / 0.03);
}

.overview-card-skeleton :deep(.el-skeleton) {
  --el-skeleton-color: rgb(148 163 184 / 0.1);
  --el-skeleton-to-color: rgb(34 211 238 / 0.16);
}

.skeleton-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
}

.skeleton-title {
  display: grid;
  flex: 1;
  gap: 8px;
}

.code-line {
  width: 70px;
}

.name-line {
  width: 68%;
}

.status-pill {
  width: 64px;
  height: 24px;
  border-radius: 999px;
}

.skeleton-summary {
  display: grid;
  grid-template-columns: 0.9fr 0.7fr 0.8fr;
  gap: 12px;
  padding: 0 18px 12px;
}

.skeleton-list {
  display: grid;
  border-top: 1px solid rgb(148 163 184 / 0.12);
}

.skeleton-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 58px 30px;
  gap: 10px;
  align-items: center;
  padding: 9px 14px;
  border-bottom: 1px solid rgb(148 163 184 / 0.1);
}

.rank-pill {
  width: 46px;
  height: 24px;
  border-radius: 999px;
}

.row-main {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.stock-line {
  width: 78%;
}

.sub-line {
  width: 42%;
}

.metric-line {
  width: 52px;
}

.action-pill {
  width: 30px;
  height: 30px;
  border-radius: 8px;
}

@media (max-width: 520px) {
  .skeleton-header {
    padding: 16px 14px 10px;
  }

  .skeleton-summary {
    grid-template-columns: 1fr 1fr;
    padding: 0 14px 10px;
  }

  .skeleton-row {
    grid-template-columns: minmax(0, 1fr) 54px 30px;
    padding-inline: 12px;
  }

  .rank-pill {
    grid-column: 1 / -1;
  }
}
</style>
