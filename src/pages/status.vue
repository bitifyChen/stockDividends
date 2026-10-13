<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cloud,
  Database,
  RefreshCw,
  ShieldCheck
} from 'lucide-vue-next'
import { getDataStatus } from '@/api/maintenance.js'

const loading = ref(true)
const error = ref('')
const payload = ref(null)
let refreshTimer = null

const statusMeta = {
  operational: { label: '資料齊全', tone: 'ok' },
  waiting: { label: '等待官方發布', tone: 'waiting' },
  running: { label: '更新中', tone: 'running' },
  partial: { label: '部分缺漏', tone: 'warning' },
  failed: { label: '更新失敗', tone: 'danger' },
  stale: { label: '資料過期', tone: 'danger' },
  unknown: { label: '尚無證據', tone: 'unknown' }
}

const statusInfo = (status) => statusMeta[status] || statusMeta.unknown
const formatDateTime = (value) => {
  if (!value) return '尚無紀錄'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
}
const formatNumber = (value) => new Intl.NumberFormat('zh-TW').format(Number(value || 0))

const overall = computed(() => statusInfo(payload.value?.status))
const history = computed(() => [...(payload.value?.history || [])].reverse())
const evidenceCount = computed(() => payload.value?.history?.length || 0)

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    payload.value = await getDataStatus({ historyDays: 90 })
  } catch {
    error.value = '目前無法取得資料完整度快照，請稍後再試。'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refresh()
  refreshTimer = window.setInterval(refresh, 60_000)
})

onBeforeUnmount(() => window.clearInterval(refreshTimer))
</script>

<template>
  <main class="status-page">
    <nav class="status-nav" aria-label="狀態頁導覽">
      <a class="brand" href="/">
        <span class="brand-mark">QW</span>
        <span><b>QuantWeave</b><small>資料完整度</small></span>
      </a>
      <button type="button" :disabled="loading" @click="refresh">
        <RefreshCw :size="17" :class="{ spinning: loading }" />
        重新檢查
      </button>
    </nav>

    <div class="status-shell">
      <header class="status-intro">
        <div>
          <p class="status-kicker">DATA READINESS</p>
          <h1>資料齊不齊，<br />一眼確認。</h1>
        </div>
        <p>依交易日、官方發布時間與必要來源判定。這不是 HTTP 可用率，也不會以雲端狀態推定你的電腦已完成同步。</p>
      </header>

      <section v-if="loading && !payload" class="hero-state hero-skeleton" aria-live="polite">
        <i></i><div><i></i><i></i></div>
      </section>

      <section v-else-if="error" class="hero-state danger-state" role="alert">
        <AlertTriangle :size="25" />
        <div><strong>狀態暫時無法確認</strong><p>{{ error }}</p></div>
      </section>

      <template v-else>
        <section :class="['hero-state', `tone-${overall.tone}`]">
          <component :is="payload?.status === 'operational' ? CheckCircle2 : AlertTriangle" :size="27" />
          <div>
            <strong>{{ overall.label }}</strong>
            <p v-if="payload?.completeness != null">目前可判定項目的完整率為 {{ payload.completeness }}%</p>
            <p v-else>尚無足夠證據計算完整率。</p>
          </div>
          <time>更新於 {{ formatDateTime(payload?.generatedAt) }}</time>
        </section>

        <section class="history-panel" aria-labelledby="history-heading">
          <div class="section-heading">
            <div><span>RECENT EVIDENCE</span><h2 id="history-heading">交易日完整度</h2></div>
            <p>{{ evidenceCount }} 個具快照證據的交易日，缺少證據的日期不會補成綠色。</p>
          </div>
          <div v-if="history.length" class="history-strip" role="list" aria-label="每日資料完整度">
            <div
              v-for="day in history"
              :key="`${day.auditDate}-${day.tradeDate}`"
              :class="['history-day', `tone-${statusInfo(day.status).tone}`]"
              role="listitem"
              :title="`${day.tradeDate}｜${statusInfo(day.status).label}｜${day.completeness ?? '未知'}%`"
            >
              <span></span><small>{{ day.tradeDate?.slice(5) }}</small>
            </div>
          </div>
          <div v-else class="empty-history"><Clock3 :size="20" />尚無歷史快照，下一次每日稽核完成後開始累積。</div>
          <div class="legend" aria-label="狀態圖例">
            <span v-for="(meta, key) in statusMeta" :key="key"><i :class="`tone-${meta.tone}`"></i>{{ meta.label }}</span>
          </div>
        </section>

        <section class="components-panel" aria-labelledby="components-heading">
          <div class="section-heading">
            <div><span>DATA COMPONENTS</span><h2 id="components-heading">資料元件</h2></div>
            <p>展開元件可查看應有日期、實際日期、筆數與必要來源。</p>
          </div>

          <div class="group-list">
            <details v-for="group in payload?.groups || []" :key="group.key" class="group-row">
              <summary>
                <span class="group-icon"><Cloud v-if="group.key === 'online'" :size="19" /><Database v-else :size="19" /></span>
                <span class="group-title"><strong>{{ group.name }}</strong><small>{{ group.components.length }} 個元件</small></span>
                <span :class="['status-chip', `tone-${statusInfo(group.status).tone}`]">{{ statusInfo(group.status).label }}</span>
                <b>{{ group.completeness == null ? '--' : `${group.completeness}%` }}</b>
                <ChevronDown class="chevron" :size="18" />
              </summary>

              <div class="component-list">
                <article v-for="item in group.components" :key="item.key" class="component-row">
                  <div class="component-topline">
                    <div><strong>{{ item.name }}</strong><span :class="['status-chip', `tone-${statusInfo(item.status).tone}`]">{{ statusInfo(item.status).label }}</span></div>
                    <small>最後完成 {{ formatDateTime(item.lastFinishedAt) }}</small>
                  </div>
                  <dl>
                    <div><dt>應有資料日</dt><dd>{{ item.expectedDate || '不適用' }}</dd></div>
                    <div><dt>實際資料日</dt><dd>{{ item.actualDate || '尚無證據' }}</dd></div>
                    <div><dt>資料筆數</dt><dd>{{ formatNumber(item.rowCount) }}</dd></div>
                    <div><dt>更新截止</dt><dd>{{ formatDateTime(item.dueAt) }}</dd></div>
                  </dl>

                  <div v-if="item.strictSources?.length" class="source-block">
                    <header><ShieldCheck :size="17" /><strong>必要官方來源</strong><span>{{ item.strictSources.filter((source) => source.status === 'complete').length }} / {{ item.strictSources.length }}</span></header>
                    <div class="source-grid">
                      <span v-for="source in item.strictSources" :key="source.key" :class="`source-${source.status}`">
                        <i></i><b>{{ source.name }}</b><small>{{ source.actualDate || '缺漏' }} · {{ formatNumber(source.rowCount) }} 筆</small>
                      </span>
                    </div>
                  </div>

                  <details v-if="item.optionalSources?.length" class="optional-sources">
                    <summary>選配與低頻來源 {{ item.optionalSources.length }} 項</summary>
                    <div class="source-grid">
                      <span v-for="source in item.optionalSources" :key="source.key" :class="`source-${source.status}`">
                        <i></i><b>{{ source.name }}</b><small>{{ source.frequency === 'weekly' ? '每週' : '依事件' }} · {{ source.actualDate || '尚無資料' }}</small>
                      </span>
                    </div>
                  </details>
                </article>
              </div>
            </details>
          </div>
        </section>

        <footer>
          <p>{{ payload?.disclaimer }}</p>
          <span>公開頁面只提供白名單摘要，不含維護權杖、內部路徑或第三方原始回應。</span>
        </footer>
      </template>
    </div>
  </main>
</template>

<route>
{
  name: "DataStatusPage",
  meta: { layout: "empty" }
}
</route>

<style scoped>
.status-page {
  --ink: #10241f;
  --muted: #63716c;
  --line: #dce5e1;
  --paper: #f4f7f5;
  --accent: #0f8f67;
  --ok: #20ad7c;
  --waiting: #d99b24;
  --danger: #d65945;
  width: 100%;
  min-height: 100dvh;
  color: var(--ink);
  background:
    radial-gradient(circle at 10% -10%, rgba(32, 173, 124, 0.12), transparent 31rem),
    linear-gradient(180deg, #fbfdfc 0, var(--paper) 42rem);
  font-family: "Noto Sans TC", "PingFang TC", sans-serif;
}

.status-nav { width: min(1180px, calc(100% - 48px)); height: 76px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
.brand { display: inline-flex; align-items: center; gap: 11px; color: inherit; text-decoration: none; }
.brand-mark { display: grid; width: 37px; height: 37px; place-items: center; border-radius: 10px; color: white; background: var(--ink); font-size: 11px; font-weight: 900; letter-spacing: -0.04em; }
.brand > span:last-child { display: flex; flex-direction: column; line-height: 1.08; }
.brand b { font-size: 15px; letter-spacing: -0.03em; }
.brand small { margin-top: 5px; color: var(--muted); font-size: 10px; letter-spacing: 0.08em; }
.status-nav button { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border: 1px solid #cbd7d2; border-radius: 10px; color: var(--ink); background: rgba(255,255,255,.82); font-weight: 700; cursor: pointer; }
.status-nav button:active { transform: translateY(1px); }
.status-nav button:disabled { opacity: .58; cursor: progress; }
.spinning { animation: spin .8s linear infinite; }

.status-shell { width: min(1080px, calc(100% - 48px)); margin: 38px auto 0; padding-bottom: 70px; }
.status-intro { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(260px, .8fr); align-items: end; gap: 50px; margin-bottom: 34px; }
.status-kicker, .section-heading span { margin: 0 0 10px; color: var(--accent); font-size: 11px; font-weight: 900; letter-spacing: .15em; }
.status-intro h1 { margin: 0; max-width: 720px; font-size: clamp(42px, 7vw, 78px); line-height: .98; letter-spacing: -.07em; }
.status-intro > p { max-width: 33rem; margin: 0 0 5px; color: var(--muted); font-size: 15px; line-height: 1.85; }

.hero-state { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px; min-height: 108px; padding: 24px 28px; border: 1px solid rgba(15,143,103,.3); border-radius: 16px; background: rgba(228,247,239,.9); box-shadow: 0 18px 50px rgba(18,64,50,.08); }
.hero-state strong { display: block; font-size: 20px; letter-spacing: -.03em; }
.hero-state p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
.hero-state time { color: var(--muted); font-size: 12px; }
.hero-state.tone-danger, .danger-state { border-color: rgba(214,89,69,.35); color: #8c2d20; background: rgba(255,239,235,.92); }
.hero-state.tone-warning, .hero-state.tone-waiting { border-color: rgba(217,155,36,.4); color: #80520b; background: rgba(255,247,225,.92); }
.hero-state.tone-unknown { border-color: var(--line); color: #495852; background: rgba(255,255,255,.88); }
.hero-skeleton > i, .hero-skeleton div i { display: block; border-radius: 7px; background: linear-gradient(100deg, #e2eae6 30%, #f4f8f6 50%, #e2eae6 70%); background-size: 300% 100%; animation: shimmer 1.4s infinite; }
.hero-skeleton > i { width: 28px; height: 28px; }
.hero-skeleton div i:first-child { width: 150px; height: 18px; }
.hero-skeleton div i:last-child { width: 240px; height: 12px; margin-top: 10px; }

.history-panel, .components-panel { margin-top: 24px; padding: 27px 28px; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,.9); box-shadow: 0 16px 45px rgba(31,59,50,.055); }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 28px; margin-bottom: 24px; }
.section-heading span { display: block; }
.section-heading h2 { margin: 0; font-size: 24px; letter-spacing: -.04em; }
.section-heading p { max-width: 430px; margin: 0; color: var(--muted); font-size: 12px; line-height: 1.65; text-align: right; }

.history-strip { display: grid; grid-template-columns: repeat(90, minmax(4px, 1fr)); align-items: end; gap: 3px; min-height: 72px; overflow: hidden; }
.history-day { min-width: 4px; }
.history-day span { display: block; height: 32px; border-radius: 3px; background: #cbd5d1; transition: transform .2s ease, height .2s ease; }
.history-day:hover span { height: 42px; transform: translateY(-4px); }
.history-day small { display: none; }
.history-day.tone-ok span { background: var(--ok); }
.history-day.tone-waiting span, .history-day.tone-running span { background: var(--waiting); }
.history-day.tone-warning span { background: #ef7d32; }
.history-day.tone-danger span { background: var(--danger); }
.history-day.tone-unknown span { background: #bdc9c4; }
.legend { display: flex; flex-wrap: wrap; gap: 9px 18px; margin-top: 18px; color: var(--muted); font-size: 11px; }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend i { width: 9px; height: 9px; border-radius: 3px; background: #bdc9c4; }
.legend i.tone-ok { background: var(--ok); }.legend i.tone-waiting,.legend i.tone-running { background: var(--waiting); }.legend i.tone-warning { background: #ef7d32; }.legend i.tone-danger { background: var(--danger); }
.empty-history { display: flex; align-items: center; gap: 9px; min-height: 70px; color: var(--muted); font-size: 13px; }

.group-list { border-top: 1px solid var(--line); }
.group-row { border-bottom: 1px solid var(--line); }
.group-row > summary { display: grid; grid-template-columns: auto minmax(180px, 1fr) auto 64px auto; align-items: center; gap: 16px; min-height: 82px; list-style: none; cursor: pointer; }
.group-row > summary::-webkit-details-marker { display: none; }
.group-icon { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 10px; color: var(--accent); background: #e9f4ef; }
.group-title { display: flex; flex-direction: column; gap: 4px; }
.group-title strong { font-size: 15px; }.group-title small { color: var(--muted); font-size: 11px; }
.group-row > summary > b { font-variant-numeric: tabular-nums; text-align: right; }
.chevron { color: var(--muted); transition: transform .2s ease; }.group-row[open] .chevron { transform: rotate(180deg); }
.status-chip { display: inline-flex; width: fit-content; padding: 4px 8px; border-radius: 7px; color: #4d5a55; background: #e8eeeb; font-size: 10px; font-weight: 800; }
.status-chip.tone-ok { color: #087250; background: #dff5eb; }.status-chip.tone-waiting,.status-chip.tone-running { color: #86540a; background: #fff0c9; }.status-chip.tone-warning { color: #984914; background: #ffe4d1; }.status-chip.tone-danger { color: #9c3424; background: #ffe0da; }

.component-list { display: grid; gap: 12px; padding: 0 0 20px 54px; }
.component-row { padding: 18px; border-radius: 12px; background: var(--paper); }
.component-topline { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.component-topline > div { display: flex; align-items: center; gap: 9px; }.component-topline small { color: var(--muted); }
.component-row dl { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0 0; }
.component-row dl div { min-width: 0; }.component-row dt { color: var(--muted); font-size: 10px; }.component-row dd { margin: 5px 0 0; overflow: hidden; font-size: 12px; font-weight: 800; text-overflow: ellipsis; }
.source-block { margin-top: 19px; padding-top: 17px; border-top: 1px solid #d7e1dd; }
.source-block > header { display: flex; align-items: center; gap: 8px; font-size: 12px; }.source-block > header span { margin-left: auto; color: var(--muted); }
.source-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 11px; }
.source-grid > span { display: grid; grid-template-columns: auto 1fr; gap: 2px 7px; padding: 10px; border-radius: 9px; background: white; }
.source-grid i { grid-row: 1 / 3; width: 7px; height: 7px; margin-top: 4px; border-radius: 2px; background: var(--danger); }
.source-grid .source-complete i { background: var(--ok); }
.source-grid b { overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.source-grid small { color: var(--muted); font-size: 9px; }
.optional-sources { margin-top: 13px; }.optional-sources > summary { color: var(--muted); font-size: 11px; cursor: pointer; }

footer { display: flex; align-items: flex-start; justify-content: space-between; gap: 40px; padding: 27px 4px 0; color: var(--muted); font-size: 11px; line-height: 1.6; }
footer p { margin: 0; color: var(--ink); font-weight: 700; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shimmer { to { background-position: -300% 0; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }

@media (max-width: 760px) {
  .status-nav, .status-shell { width: min(100% - 28px, 1080px); }
  .status-shell { margin-top: 22px; padding-bottom: 38px; }
  .status-intro { grid-template-columns: 1fr; gap: 20px; }
  .status-intro h1 { font-size: clamp(39px, 13vw, 57px); }
  .status-intro > p { font-size: 13px; }
  .hero-state { grid-template-columns: auto 1fr; padding: 20px; }.hero-state time { grid-column: 2; }
  .history-panel, .components-panel { padding: 20px 17px; border-radius: 14px; }
  .section-heading { display: block; }.section-heading p { margin-top: 9px; text-align: left; }
  .history-strip { grid-template-columns: repeat(30, minmax(5px, 1fr)); overflow-x: auto; }
  .group-row > summary { grid-template-columns: auto 1fr auto; gap: 10px; }.group-row > summary > .status-chip { grid-column: 2; }.group-row > summary > b { grid-column: 3; grid-row: 1; }.group-row > summary > .chevron { grid-column: 3; grid-row: 2; justify-self: end; }
  .component-list { padding-left: 0; }.component-topline { display: block; }.component-topline small { display: block; margin-top: 8px; }
  .component-row dl { grid-template-columns: repeat(2, 1fr); }.source-grid { grid-template-columns: 1fr; }
  footer { display: block; } footer span { display: block; margin-top: 8px; }
}
</style>
