<script setup>
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { Activity, Bell, Database, RefreshCw, Sparkles } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import {
  getBatchStatus,
  runDividendBatch,
  runEtfEventsSummaryNotify,
  runEtfFetchAll,
  runOhlcDailyFetch
} from '@/api/maintenance.js'
import { useDashboardMessageBox } from '@/composables/useDashboardMessageBox.js'
import { etfTypeOptions } from '@/data/dashboardDataMapping.js'
import { normalizeObject } from '@/utils/etfDashboard.js'

const dashboardMessageBox = useDashboardMessageBox()
const loadingStatus = ref(false)
const actionLoading = ref('')
const statusPayload = ref({})
const resultPayload = ref(null)
const resultTitle = ref('')
const notifyDate = ref('')
const notifyEtfType = ref('')
const notifyTopN = ref(5)
const errorMessage = ref('')

const resultJson = computed(() =>
  resultPayload.value ? JSON.stringify(resultPayload.value, null, 2) : ''
)

const maintenanceJobs = computed(() => [
  {
    key: 'etfFetchAll',
    title: 'ETF 批次更新',
    description: '抓取已啟用 ETF 來源並寫入持股、事件資料。',
    status: readStatus('etfFetchAll')
  },
  {
    key: 'dividendFetchAll',
    title: '股利資料批次',
    description: '同步全市場或指定個股股利資料。',
    status: readStatus('dividendFetchAll')
  },
  {
    key: 'etfEventSummaryNotify',
    title: 'ETF 摘要通知',
    description: '產生每日進出摘要，必要時發送 Telegram。',
    status: readStatus('etfEventSummaryNotify')
  },
  {
    key: 'ohlcDailyFetch',
    title: 'OHLC 日線批次',
    description: '股票 K 線資料更新狀態。',
    status: readStatus('ohlcDailyFetch')
  }
])

const getJob = (key) => maintenanceJobs.value.find((job) => job.key === key) || {}
const getJobStatus = (key) => getJob(key).status || {}

function readStatus(key) {
  const payload = normalizeObject(statusPayload.value)
  const items = normalizeObject(payload.items)
  const record = normalizeObject(items?.[key])

  return {
    raw: record,
    key: record.key || key,
    label: record.label || '',
    category: record.category || '',
    enabled: record.enabled ?? true,
    state: record.lastStatus || '-',
    lastRunAt: record.lastRunAt || null,
    lastFinishedAt: record.lastFinishedAt || null,
    lastSuccessAt: record.lastSuccessAt || null,
    lastDataDate: record.lastDataDate || null,
    lastSourceDate: record.lastSourceDate || null,
    lastError: record.lastError || null,
    successCount: Number(record.successCount || 0),
    failedCount: Number(record.failedCount || 0),
    skippedCount: Number(record.skippedCount || 0),
    waitingCount: Number(record.waitingCount || 0),
    rowCount: Number(record.rowCount || 0),
    updatedAt: record.updatedAt || null
  }
}

function formatDateTime(value) {
  if (!value) return '尚無成功紀錄'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY/MM/DD HH:mm') : String(value)
}

function formatDataDate(value) {
  if (!value) return '資料日未回報'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY/MM/DD') : String(value)
}

function statusTone(state) {
  if (['success', 'succeeded', 'ok', 'done', 'completed'].includes(String(state).toLowerCase()))
    return 'success'
  if (['failed', 'error'].includes(String(state).toLowerCase())) return 'danger'
  if (['running', 'pending', 'waiting'].includes(String(state).toLowerCase())) return 'warning'
  return 'info'
}

async function loadStatus() {
  loadingStatus.value = true
  errorMessage.value = ''

  try {
    statusPayload.value = normalizeObject(await getBatchStatus())
  } catch (error) {
    errorMessage.value = error?.message || '無法讀取維運狀態'
    statusPayload.value = {}
  } finally {
    loadingStatus.value = false
  }
}

async function confirmOperation(config) {
  const options = typeof config === 'string' ? { message: config } : config

  await dashboardMessageBox.confirm({
    title: '確認維運操作',
    message: options.message,
    confirmButtonText: '確認執行',
    cancelButtonText: '取消',
    tone: options.tone || 'info'
  })
}

async function promptStockId() {
  const { value } = await dashboardMessageBox.prompt({
    title: '僅更新個股',
    message: '請輸入要更新股利資料的股票代號。',
    confirmButtonText: '確認執行',
    cancelButtonText: '取消',
    tone: 'info',
    inputPattern: /^\d{4,6}[A-Z]?$/i,
    inputErrorMessage: '請輸入有效股票代號，例如 2330。',
    inputPlaceholder: '例如 2330'
  })

  return String(value || '').trim()
}

async function runAction(key, title, action, confirmMessage) {
  if (actionLoading.value) return

  try {
    if (confirmMessage) await confirmOperation(confirmMessage)
    actionLoading.value = key
    resultTitle.value = title
    resultPayload.value = await action()
    ElMessage.success(`${title} 已完成`)
    await loadStatus()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    resultTitle.value = `${title} 失敗`
    resultPayload.value = error?.response?.data || { message: error?.message || '操作失敗' }
    ElMessage.error(error?.message || '操作失敗')
  } finally {
    actionLoading.value = ''
  }
}

function runEtfBatch(force = false) {
  runAction(
    force ? 'etf-force' : 'etf',
    force ? '強制執行 ETF 批次更新' : '執行 ETF 批次更新',
    () => runEtfFetchAll({ force }),
    force
      ? {
          tone: 'warning',
          message:
            '強制執行會略過 ETF 來源公布時間判斷，可能重新寫入同一資料日、重新備份來源檔案，並重新發送批次通知。只有在確認資料已公布但一般執行被擋住時才建議使用。確定強制執行？'
        }
      : {
          tone: 'info',
          message:
            '將依 ETF 來源公布時間與既有保護規則執行批次更新。若來源尚未公布，可能會回傳等待狀態。確定執行？'
        }
  )
}

async function runDividend(stockOnly = false) {
  let stockId = ''

  if (stockOnly) {
    try {
      stockId = await promptStockId()
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      throw error
    }
  }

  runAction(
    stockOnly ? 'dividend-stock' : 'dividend-all',
    stockOnly ? `執行 ${stockId} 股利更新` : '執行全部股利更新',
    () => runDividendBatch({ stockId }),
    {
      tone: 'info',
      message: stockOnly
        ? `確定更新 ${stockId} 的股利資料？`
        : '全市場股利更新可能耗時較久。確定執行？'
    }
  )
}

function sendNotify() {
  runAction(
    'notify-send',
    '發送 ETF 摘要通知',
    () =>
      runEtfEventsSummaryNotify({
        date: notifyDate.value || null,
        send: true,
        etfType: notifyEtfType.value || null,
        topN: notifyTopN.value
      }),
    {
      tone: 'warning',
      message: '此操作會發送 Telegram 摘要通知。確定送出？'
    }
  )
}

function runOhlcDaily(force = false) {
  runAction(
    force ? 'ohlc-force' : 'ohlc',
    force ? '強制執行 OHLC 日線批次' : '執行 OHLC 日線批次',
    () => runOhlcDailyFetch({ force }),
    force
      ? {
          tone: 'warning',
          message:
            '強制執行會針對後端判定的最近官方可取得交易日重新寫入 OHLC 日線資料，即使該交易日已有足量資料也會覆寫。此操作會影響個股 K 線與技術分析顯示。確定強制執行？'
        }
      : {
          tone: 'info',
          message:
            '將抓取最近官方可取得交易日的 OHLC 日線資料；若該交易日已有足量資料，後端會略過重寫。確定執行？'
        }
  )
}

onMounted(loadStatus)
</script>

<template>
  <div class="setting-page etf-console">
    <section class="console-bar setting-hero">
      <div>
        <div class="breadcrumb">Dashboard / Setting</div>
        <h1>系統設定</h1>
        <p>集中管理後台維運操作；寫入資料或發送通知前皆會二次確認。</p>
      </div>

      <div class="console-tools">
        <button class="refresh-button" type="button" :disabled="loadingStatus" @click="loadStatus">
          <RefreshCw :size="16" />
        </button>
      </div>
    </section>

    <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

    <section class="action-grid">
      <article class="action-card maintenance-card">
        <header class="card-header">
          <div class="action-icon">
            <Database :size="20" />
          </div>
          <div class="card-title">
            <span>ETF / Fetch All</span>
            <h2>ETF 批次更新</h2>
          </div>
        </header>

        <div class="card-status">
          <span>前次</span>
          <template v-if="loadingStatus">
            <i class="status-skeleton-line"></i>
            <i class="status-skeleton-badge"></i>
          </template>
          <template v-else>
            <div class="status-times">
              <time>{{ formatDateTime(getJobStatus('etfFetchAll').lastSuccessAt) }}</time>
              <small>{{ formatDataDate(getJobStatus('etfFetchAll').lastDataDate) }}</small>
            </div>
            <el-tag
              round
              :type="statusTone(getJobStatus('etfFetchAll').state)"
              effect="dark"
              :class="['status-badge', `status-${statusTone(getJobStatus('etfFetchAll').state)}`]"
            >
              {{ getJobStatus('etfFetchAll').state }}
            </el-tag>
          </template>
        </div>

        <div class="card-copy">
          <p>同步 ETF 最新持股與每日進出資料，適合資料延遲或批次異常時手動重跑。</p>
        </div>
        <div class="button-row">
          <button
            class="force-link"
            type="button"
            :disabled="Boolean(actionLoading)"
            @click="runEtfBatch(true)"
          >
            強制執行
          </button>
          <button
            class="primary-button"
            type="button"
            :disabled="Boolean(actionLoading)"
            @click="runEtfBatch(false)"
          >
            執行
          </button>
        </div>
      </article>

      <article class="action-card maintenance-card">
        <header class="card-header">
          <div class="action-icon">
            <Sparkles :size="20" />
          </div>
          <div class="card-title">
            <span>Dividend / Sync</span>
            <h2>股利資料更新</h2>
          </div>
        </header>

        <div class="card-status">
          <span>前次</span>
          <template v-if="loadingStatus">
            <i class="status-skeleton-line"></i>
            <i class="status-skeleton-badge"></i>
          </template>
          <template v-else>
            <div class="status-times">
              <time>{{ formatDateTime(getJobStatus('dividendFetchAll').lastSuccessAt) }}</time>
              <small>{{ formatDataDate(getJobStatus('dividendFetchAll').lastDataDate) }}</small>
            </div>
            <el-tag
              round
              :type="statusTone(getJobStatus('dividendFetchAll').state)"
              effect="dark"
              :class="[
                'status-badge',
                `status-${statusTone(getJobStatus('dividendFetchAll').state)}`
              ]"
            >
              {{ getJobStatus('dividendFetchAll').state }}
            </el-tag>
          </template>
        </div>

        <div class="card-copy">
          <p>更新股利資料，可針對全市場同步，也可只補指定股票。</p>
        </div>
        <div class="button-row">
          <button
            class="ghost-button"
            type="button"
            :disabled="Boolean(actionLoading)"
            @click="runDividend(true)"
          >
            僅個股
          </button>
          <button
            class="primary-button"
            type="button"
            :disabled="Boolean(actionLoading)"
            @click="runDividend(false)"
          >
            執行
          </button>
        </div>
      </article>

      <article class="action-card maintenance-card">
        <header class="card-header">
          <div class="action-icon">
            <Bell :size="20" />
          </div>
          <div class="card-title">
            <span>Telegram / Notify</span>
            <h2>ETF 摘要通知</h2>
          </div>
        </header>

        <div class="card-status">
          <span>前次</span>
          <template v-if="loadingStatus">
            <i class="status-skeleton-line"></i>
            <i class="status-skeleton-badge"></i>
          </template>
          <template v-else>
            <div class="status-times">
              <time>{{ formatDateTime(getJobStatus('etfEventSummaryNotify').lastSuccessAt) }}</time>
              <small>
                {{ formatDataDate(getJobStatus('etfEventSummaryNotify').lastDataDate) }}
              </small>
            </div>
            <el-tag
              round
              :type="statusTone(getJobStatus('etfEventSummaryNotify').state)"
              effect="dark"
              :class="[
                'status-badge',
                `status-${statusTone(getJobStatus('etfEventSummaryNotify').state)}`
              ]"
            >
              {{ getJobStatus('etfEventSummaryNotify').state }}
            </el-tag>
          </template>
        </div>

        <div class="card-copy">
          <p>依指定條件產生每日 ETF 進出摘要，並發送 Telegram 通知。</p>
        </div>

        <div class="notify-fields">
          <label class="field">
            <span>資料日期</span>
            <el-date-picker
              v-model="notifyDate"
              class="dashboard-date-picker"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="最新資料日"
              clearable
              popper-class="dashboard-date-popper"
            />
          </label>

          <label class="field">
            <span>ETF 類型</span>
            <el-select
              v-model="notifyEtfType"
              class="dashboard-select"
              placeholder="全部 ETF"
              clearable
            >
              <el-option
                v-for="item in etfTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </label>

          <label class="field">
            <span>顯示筆數</span>
            <el-input-number v-model="notifyTopN" :min="1" :max="20" controls-position="right" />
          </label>
        </div>

        <div class="button-row">
          <button
            class="primary-button"
            type="button"
            :disabled="Boolean(actionLoading)"
            @click="sendNotify"
          >
            發送
          </button>
        </div>
      </article>

      <article class="action-card maintenance-card">
        <header class="card-header">
          <div class="action-icon">
            <Activity :size="20" />
          </div>
          <div class="card-title">
            <span>OHLC / Candles</span>
            <h2>OHLC 日線批次</h2>
          </div>
        </header>

        <div class="card-status">
          <span>前次</span>
          <template v-if="loadingStatus">
            <i class="status-skeleton-line"></i>
            <i class="status-skeleton-badge"></i>
          </template>
          <template v-else>
            <div class="status-times">
              <time>{{ formatDateTime(getJobStatus('ohlcDailyFetch').lastSuccessAt) }}</time>
              <small>{{ formatDataDate(getJobStatus('ohlcDailyFetch').lastDataDate) }}</small>
            </div>
            <el-tag
              round
              :type="statusTone(getJobStatus('ohlcDailyFetch').state)"
              effect="dark"
              :class="[
                'status-badge',
                `status-${statusTone(getJobStatus('ohlcDailyFetch').state)}`
              ]"
            >
              {{ getJobStatus('ohlcDailyFetch').state }}
            </el-tag>
          </template>
        </div>

        <div class="card-copy">
          <p>更新股票日線資料，提供個股技術分析與走勢圖使用。</p>
        </div>
        <div class="button-row">
          <button
            class="force-link"
            type="button"
            :disabled="Boolean(actionLoading)"
            @click="runOhlcDaily(true)"
          >
            強制執行
          </button>
          <button
            class="primary-button"
            type="button"
            :disabled="Boolean(actionLoading)"
            @click="runOhlcDaily(false)"
          >
            執行
          </button>
        </div>
      </article>
    </section>

    <section v-if="resultPayload" class="console-panel result-panel">
      <div class="panel-heading">
        <div>
          <h2>{{ resultTitle }}</h2>
          <span>API 回應結果</span>
        </div>
        <el-tag v-if="actionLoading" round type="warning" effect="dark">執行中</el-tag>
      </div>
      <pre>{{ resultJson }}</pre>
    </section>
  </div>
</template>

<style scoped lang="scss">
.setting-page {
  --setting-card-radius: 18px;
  --setting-card-border: rgb(148 163 184 / 0.14);
  --setting-card-bg: linear-gradient(145deg, rgb(255 255 255 / 0.052), rgb(255 255 255 / 0.018)),
    rgb(8 11 16 / 0.58);
}

.setting-hero {
  min-height: 142px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  min-width: 0;
}

.action-card {
  position: relative;
  display: flex;
  overflow: hidden;
  min-width: 0;
  min-height: 350px;
  flex-direction: column;
  gap: 18px;
  border: 1px solid var(--setting-card-border);
  border-radius: var(--setting-card-radius);
  background: radial-gradient(circle at 0% 0%, rgb(34 211 238 / 0.09), transparent 32%),
    var(--setting-card-bg);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    0 20px 56px rgb(0 0 0 / 0.16);
  padding: 18px;
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
}

.action-card::before {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, rgb(255 255 255 / 0.06), transparent 34%);
  content: '';
  pointer-events: none;
}

.action-card > * {
  position: relative;
  z-index: 1;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 48px;
}

.action-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgb(34 211 238 / 0.28);
  border-radius: 14px;
  background: rgb(34 211 238 / 0.1);
  color: #22d3ee;
}

.card-title {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.card-title span {
  color: var(--dashboard-text-muted);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-title h2,
.panel-heading h2 {
  margin: 0;
  color: var(--dashboard-text-primary);
  font-weight: 900;
  letter-spacing: -0.02em;
}

.card-title h2 {
  font-size: 18px;
}

.panel-heading h2 {
  font-size: 18px;
}

.card-status {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  border-top: 1px solid rgb(148 163 184 / 0.1);
  border-bottom: 1px solid rgb(148 163 184 / 0.1);
  padding: 8px 0;
}

.status-badge {
  --el-tag-bg-color: rgb(100 116 139 / 0.16);
  --el-tag-border-color: rgb(148 163 184 / 0.42);
  --el-tag-text-color: #e2e8f0;
  min-width: 62px;
  height: 22px;
  justify-content: center;
  border-width: 1px;
  box-shadow: 0 0 18px rgb(148 163 184 / 0.08);
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.02em;
}

.status-badge.status-success {
  --el-tag-bg-color: rgb(16 185 129 / 0.2);
  --el-tag-border-color: rgb(52 211 153 / 0.72);
  --el-tag-text-color: #d1fae5;
  box-shadow:
    0 0 0 1px rgb(52 211 153 / 0.18),
    0 0 20px rgb(16 185 129 / 0.18);
}

.status-badge.status-warning {
  --el-tag-bg-color: rgb(245 158 11 / 0.2);
  --el-tag-border-color: rgb(251 191 36 / 0.72);
  --el-tag-text-color: #fef3c7;
}

.status-badge.status-danger {
  --el-tag-bg-color: rgb(239 68 68 / 0.2);
  --el-tag-border-color: rgb(248 113 113 / 0.72);
  --el-tag-text-color: #fee2e2;
}

.status-badge.status-info {
  --el-tag-bg-color: rgb(34 211 238 / 0.16);
  --el-tag-border-color: rgb(34 211 238 / 0.44);
  --el-tag-text-color: #cffafe;
}

.card-status span {
  color: var(--dashboard-text-muted);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.status-times {
  display: grid;
  flex: 1 1 auto;
  overflow: hidden;
  min-width: 0;
  gap: 3px;
}

.card-status time,
.status-times small {
  color: var(--dashboard-text-muted);
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-status time {
  overflow: hidden;
  font-size: 11px;
}

.status-times small {
  overflow: hidden;
  font-size: 10px;
  opacity: 0.72;
}

.status-skeleton-line,
.status-skeleton-badge {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(148 163 184 / 0.14);
}

.status-skeleton-line::after,
.status-skeleton-badge::after {
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.16), transparent);
  animation: status-skeleton-shimmer 1.4s ease-in-out infinite;
  content: '';
}

.status-skeleton-line {
  flex: 1 1 auto;
  max-width: 112px;
  height: 10px;
}

.status-skeleton-badge {
  flex: 0 0 auto;
  width: 62px;
  height: 22px;
}

@keyframes status-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.card-copy {
  min-height: 58px;
}

.card-copy p {
  margin: 0;
  color: var(--dashboard-text-muted);
  font-size: 13px;
  line-height: 1.7;
}

.field {
  display: grid;
  gap: 7px;
}

.field span {
  color: var(--dashboard-text-muted);
  font-size: 12px;
  font-weight: 900;
}

.notify-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.text-input,
.notify-fields :deep(.el-date-editor.el-input),
.notify-fields :deep(.el-select),
.field :deep(.el-select__wrapper),
.field :deep(.el-input__wrapper),
.field :deep(.el-input-number) {
  width: 100%;
}

.text-input {
  height: 40px;
  border: 1px solid var(--dashboard-control-border);
  border-radius: 12px;
  background: var(--dashboard-control-bg);
  padding: 0 12px;
  color: var(--dashboard-text-primary);
  outline: none;
}

.text-input:focus {
  border-color: rgb(34 211 238 / 0.46);
  box-shadow: 0 0 0 3px rgb(34 211 238 / 0.12);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: auto;
}

.primary-button,
.ghost-button,
.warning-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border-radius: 12px;
  padding: 0 14px;
  font-weight: 900;
  white-space: nowrap;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;
}

.primary-button {
  border: 1px solid rgb(16 185 129 / 0.42);
  background: linear-gradient(135deg, rgb(16 185 129 / 0.26), rgb(20 184 166 / 0.16));
  color: var(--dashboard-text-primary);
}

.ghost-button {
  border: 1px solid var(--dashboard-control-border);
  background: rgb(148 163 184 / 0.07);
  color: var(--dashboard-text-secondary);
}

.force-link {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  border: 0;
  background: transparent;
  padding: 0 4px;
  color: #fca5a5;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
  text-decoration: underline;
  text-decoration-color: rgb(248 113 113 / 0.28);
  text-underline-offset: 4px;
  transition:
    color 0.18s ease,
    opacity 0.18s ease,
    text-decoration-color 0.18s ease;
}

.warning-button {
  border: 1px solid rgb(245 158 11 / 0.42);
  background: linear-gradient(135deg, rgb(245 158 11 / 0.18), rgb(251 191 36 / 0.1));
  color: #fde68a;
}

.danger-button {
  border: 1px solid rgb(239 68 68 / 0.48);
  background: linear-gradient(135deg, rgb(239 68 68 / 0.22), rgb(127 29 29 / 0.14));
  color: #fecaca;
}

.primary-button:hover {
  border-color: rgb(16 185 129 / 0.62);
  background: linear-gradient(135deg, rgb(16 185 129 / 0.34), rgb(20 184 166 / 0.2));
}

.ghost-button:hover {
  border-color: rgb(148 163 184 / 0.46);
  background: rgb(148 163 184 / 0.12);
}

.force-link:hover {
  color: #fecaca;
  text-decoration-color: rgb(248 113 113 / 0.72);
}

.warning-button:hover {
  border-color: rgb(245 158 11 / 0.6);
  background: linear-gradient(135deg, rgb(245 158 11 / 0.25), rgb(251 191 36 / 0.14));
}

.danger-button:hover {
  border-color: rgb(239 68 68 / 0.68);
  background: linear-gradient(135deg, rgb(239 68 68 / 0.3), rgb(127 29 29 / 0.18));
}

.primary-button:active,
.ghost-button:active,
.warning-button:active,
.danger-button:active {
  transform: translateY(1px);
}

.primary-button:disabled,
.ghost-button:disabled,
.force-link:disabled,
.warning-button:disabled,
.danger-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.error-banner {
  border: 1px solid rgb(239 68 68 / 0.34);
  border-radius: 14px;
  background: rgb(239 68 68 / 0.1);
  padding: 12px 14px;
  color: #fecaca;
  font-size: 13px;
  font-weight: 800;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-heading span {
  display: block;
  margin-top: 6px;
  color: var(--dashboard-text-muted);
  font-size: 13px;
}

.result-panel pre {
  overflow: auto;
  max-height: 420px;
  margin: 0;
  border: 1px solid var(--dashboard-control-border);
  border-radius: 16px;
  background: rgb(0 0 0 / 0.18);
  padding: 16px;
  color: var(--dashboard-text-secondary);
  font-size: 12px;
  line-height: 1.7;
}

:global(.dashboard-shell.theme-light) .setting-page {
  --setting-card-border: rgb(71 85 105 / 0.14);
  --setting-card-bg: linear-gradient(145deg, rgb(255 255 255 / 0.82), rgb(255 255 255 / 0.48)),
    rgb(248 252 254 / 0.72);
}

:global(.dashboard-shell.theme-light) .setting-page .action-card {
  background: radial-gradient(circle at 0% 0%, rgb(14 165 233 / 0.11), transparent 34%),
    var(--setting-card-bg);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.84),
    0 22px 70px rgb(15 23 42 / 0.1);
}

:global(.dashboard-shell.theme-light) .setting-page .card-status {
  border-color: rgb(71 85 105 / 0.12);
}

:global(.dashboard-shell.theme-light) .setting-page .card-title h2,
:global(.dashboard-shell.theme-light) .setting-page .panel-heading h2 {
  color: #102033;
}

:global(.dashboard-shell.theme-light) .setting-page .card-title span,
:global(.dashboard-shell.theme-light) .setting-page .card-status span,
:global(.dashboard-shell.theme-light) .setting-page .card-status time,
:global(.dashboard-shell.theme-light) .setting-page .status-times small,
:global(.dashboard-shell.theme-light) .setting-page .card-copy p,
:global(.dashboard-shell.theme-light) .setting-page .field span,
:global(.dashboard-shell.theme-light) .setting-page .panel-heading span {
  color: #64748b;
}

:global(.dashboard-shell.theme-light) .setting-page .text-input {
  border-color: rgb(71 85 105 / 0.14);
  background: rgb(255 255 255 / 0.72);
  color: #102033;
}

:global(.dashboard-shell.theme-light) .setting-page .force-link {
  color: #991b1b;
  text-decoration-color: rgb(220 38 38 / 0.24);
}

:global(.dashboard-shell.theme-light) .setting-page .force-link:hover {
  color: #7f1d1d;
  text-decoration-color: rgb(220 38 38 / 0.58);
}

:global(.dashboard-shell.theme-light) .setting-page .status-badge {
  --el-tag-bg-color: rgb(71 85 105 / 0.08);
  --el-tag-border-color: rgb(71 85 105 / 0.28);
  --el-tag-text-color: #334155;
}

:global(.dashboard-shell.theme-light) .setting-page .status-badge.status-success {
  --el-tag-bg-color: rgb(16 185 129 / 0.14);
  --el-tag-border-color: rgb(5 150 105 / 0.48);
  --el-tag-text-color: #047857;
}

:global(.dashboard-shell.theme-light) .setting-page .status-badge.status-warning {
  --el-tag-bg-color: rgb(245 158 11 / 0.14);
  --el-tag-border-color: rgb(217 119 6 / 0.48);
  --el-tag-text-color: #b45309;
}

:global(.dashboard-shell.theme-light) .setting-page .status-badge.status-danger {
  --el-tag-bg-color: rgb(239 68 68 / 0.12);
  --el-tag-border-color: rgb(220 38 38 / 0.42);
  --el-tag-text-color: #b91c1c;
}

:global(.dashboard-shell.theme-light) .setting-page .status-badge.status-info {
  --el-tag-bg-color: rgb(14 165 233 / 0.12);
  --el-tag-border-color: rgb(2 132 199 / 0.38);
  --el-tag-text-color: #0369a1;
}

:global(.dashboard-shell.theme-light) .setting-page .status-skeleton-line,
:global(.dashboard-shell.theme-light) .setting-page .status-skeleton-badge {
  background: rgb(71 85 105 / 0.12);
}

:global(.dashboard-shell.theme-light) .setting-page .status-skeleton-line::after,
:global(.dashboard-shell.theme-light) .setting-page .status-skeleton-badge::after {
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.62), transparent);
}

@media (max-width: 1500px) {
  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .action-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .setting-hero,
  .panel-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .action-card {
    min-height: auto;
    border-radius: 18px;
    padding: 16px;
  }

  .button-row,
  .primary-button,
  .ghost-button,
  .warning-button,
  .danger-button {
    width: 100%;
  }

  .force-link {
    justify-content: center;
    width: 100%;
  }
}
</style>

<route>
{
  name: "Dashboard_Setting",
  meta: {
    layout: "dashboard",
    requiresAuth: true,
    requiresSuperuser: true
  }
}
</route>
