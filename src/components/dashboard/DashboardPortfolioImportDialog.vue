<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, FileText, LockKeyhole, ShieldCheck, Upload } from 'lucide-vue-next'
import { IMPORT_ADAPTER_IDS } from '@/utils/import/adapter.js'
import stockName from '@/data/stockName.json'
import { useStockStore } from '@/stores/useStock.js'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import {
  getPortfolioImportSalt,
  savePortfolioReconciliation
} from '@/firebase/portfolioReconciliation.js'
import { detectAndParseImport } from '@/utils/import/registry.js'
import {
  buildReconciliationPreview,
  getReconciliationSummary
} from '@/utils/import/reconciliation.js'
import { formatShare, shareUnitLabel } from '@/utils/etfDashboard.js'

const emit = defineEmits(['finish'])

const stockStore = useStockStore()
const dashboardSettingStore = useDashboardSettingStore()
const visible = ref(false)
const stage = ref('source')
const selectedSourceId = ref(null)
const fileList = ref([])
const password = ref('')
const canonicalResult = ref(null)
const preview = ref(null)
const savedResult = ref(null)
const parsing = ref(false)
const submitting = ref(false)

const sourceOptions = [
  {
    id: IMPORT_ADAPTER_IDS.TDCC_LEDGER_PDF,
    label: '集保',
    title: '集保流水 PDF',
    description: '上傳證券存摺登摺資料／交易異動明細 PDF。',
    accept: '.pdf,application/pdf'
  }
]

const selectedSource = computed(() =>
  sourceOptions.find((source) => source.id === selectedSourceId.value)
)
const dialogTitle = computed(() =>
  selectedSource.value ? `自動匯入 / ${selectedSource.value.label}` : '自動匯入持股'
)
const dialogDescription = computed(() =>
  selectedSource.value
    ? selectedSource.value.description
    : '選擇資料供應商後，依照該來源的格式匯入並核對持股。'
)

const rawFiles = computed(() => fileList.value.map((item) => item.raw).filter(Boolean))
const previewRows = computed(() => preview.value?.rows || [])
const previewSummary = computed(
  () => preview.value?.summary || getReconciliationSummary(previewRows.value)
)
const selectedCount = computed(() => previewRows.value.filter((row) => row.selected).length)
const selectedShares = computed(() =>
  previewRows.value
    .filter((row) => row.selected && row.deltaShares > 0)
    .reduce((total, row) => total + row.deltaShares, 0)
)
const resultSummary = computed(() => {
  const added = previewRows.value.filter((row) => row.selected && row.status === 'add').length
  return {
    added,
    verified: previewSummary.value.verified,
    review: previewSummary.value.review,
    skipped: previewSummary.value.unobserved + previewSummary.value.add - added,
    failed: savedResult.value?.failedCount || 0
  }
})

const statusMap = {
  add: { label: '可補入', type: 'warning' },
  review: { label: '需要確認', type: 'danger' },
  unobserved: { label: '未涵蓋', type: 'info' },
  verified: { label: '一致', type: 'success' }
}

const formatShares = (value) => {
  const formatted = formatShare(value, dashboardSettingStore.shareUnit)
  return formatted === '-'
    ? formatted
    : `${formatted} ${shareUnitLabel(dashboardSettingStore.shareUnit)}`
}
const formatDate = (value) => value || '-'

const reset = () => {
  stage.value = 'source'
  selectedSourceId.value = null
  fileList.value = []
  password.value = ''
  canonicalResult.value = null
  preview.value = null
  savedResult.value = null
  parsing.value = false
  submitting.value = false
}

const open = () => {
  reset()
  visible.value = true
}

const selectSource = (source) => {
  selectedSourceId.value = source.id
  stage.value = 'upload'
}

const handleFileChange = (_file, files) => {
  fileList.value = files.filter(
    (item) => item.raw?.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf')
  )
}

const parseImport = async () => {
  if (!rawFiles.value.length) {
    ElMessage.warning(`請先選擇${selectedSource.value?.title || '匯入檔案'}。`)
    return
  }
  if (!password.value) {
    ElMessage.warning(`請輸入${selectedSource.value?.label || '來源'}檔案密碼。`)
    return
  }

  parsing.value = true
  try {
    const accountSalt = await getPortfolioImportSalt()
    const result = await detectAndParseImport(rawFiles.value, {
      password: password.value,
      accountSalt,
      sourceId: selectedSourceId.value
    })
    canonicalResult.value = result
    preview.value = buildReconciliationPreview({
      canonicalResult: result,
      orgData: stockStore.orgData,
      adjustments: stockStore.orgReconciliationData,
      stockName
    })
    stage.value = 'preview'
  } catch (error) {
    if (error?.code === 'INVALID_PASSWORD') {
      const fileScope = rawFiles.value.length > 1 ? '其中一份' : '這份'
      ElMessage.error(
        `無法解開${fileScope}檔案，請確認所有選取檔案使用同一組密碼，且密碼前後沒有多餘空白。`
      )
    } else {
      ElMessage.error(error?.message || '無法解析匯入檔案。')
    }
  } finally {
    parsing.value = false
    password.value = ''
  }
}

const goBack = () => {
  stage.value = 'upload'
  canonicalResult.value = null
  preview.value = null
}

const saveImport = async () => {
  if (!canonicalResult.value || !preview.value) return

  submitting.value = true
  try {
    const result = await savePortfolioReconciliation({
      canonicalResult: canonicalResult.value,
      rows: previewRows.value
    })
    savedResult.value = result
    stage.value = 'success'
    emit('finish', result)
  } catch (error) {
    ElMessage.error(error?.message || '儲存對帳結果失敗。')
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    class="dashboard-import-dialog"
    width="min(920px, calc(100vw - 32px))"
    destroy-on-close
    :close-on-click-modal="false"
    @closed="reset"
  >
    <template #header>
      <div class="dialog-heading">
        <div class="dialog-icon"><FileText :size="18" /></div>
        <div>
          <div class="dialog-kicker">IMPORT & RECONCILE</div>
          <h2>{{ dialogTitle }}</h2>
          <p>{{ dialogDescription }}</p>
        </div>
      </div>
    </template>

    <div v-if="stage === 'source'" class="import-stage source-stage">
      <div class="source-stage-intro">
        <span class="dialog-kicker">CHOOSE PROVIDER</span>
        <strong>選擇資料供應商</strong>
        <p>不同來源會使用各自的格式解析器，後續可在這裡擴充券商或截圖匯入。</p>
      </div>

      <div class="source-options">
        <button
          v-for="source in sourceOptions"
          :key="source.id"
          class="source-option"
          type="button"
          @click="selectSource(source)"
        >
          <span class="source-option-mark"><FileText :size="18" /></span>
          <span class="source-option-copy">
            <strong>{{ source.label }}</strong>
            <span>{{ source.title }}</span>
            <small>{{ source.description }}</small>
          </span>
          <el-tag size="small" round effect="plain">PDF</el-tag>
        </button>
      </div>

      <div class="scope-note">
        <ShieldCheck :size="16" />
        <span>來源選擇只決定解析方式，不會直接寫入資料；確認預覽後才會儲存。</span>
      </div>
    </div>

    <div v-else-if="stage === 'upload'" class="import-stage">
      <div class="privacy-note">
        <LockKeyhole :size="16" />
        <span>PDF 只在這個瀏覽器解析，不會上傳檔案或保存密碼。</span>
      </div>

      <el-upload
        v-model:file-list="fileList"
        class="import-upload"
        drag
        multiple
        :auto-upload="false"
        :accept="selectedSource?.accept"
        :on-change="handleFileChange"
      >
        <Upload :size="28" />
        <div class="el-upload__text">
          拖曳 {{ selectedSource?.title || '檔案' }} 到這裡，或 <em>選擇檔案</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">可一次選擇同一來源的多份檔案，重複檔案會自動排除。</div>
        </template>
      </el-upload>

      <el-form label-position="top" class="import-form" @submit.prevent>
        <el-form-item label="檔案密碼">
          <el-input
            v-model="password"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="輸入來源檔案密碼"
            @keyup.enter="parseImport"
          />
        </el-form-item>
      </el-form>

      <div class="scope-note">
        <ShieldCheck :size="16" />
        <span>這是期間性流水對帳。查詢期間沒有出現的股票，不會被判定為零股。</span>
      </div>
    </div>

    <div v-else-if="stage === 'preview'" class="import-stage preview-stage">
      <div class="preview-summary">
        <div>
          <span>資料日期</span>
          <strong>{{ formatDate(preview?.sourceAsOfDate) }}</strong>
        </div>
        <div>
          <span>可補入股票</span>
          <strong>{{ previewSummary.add }} 檔</strong>
        </div>
        <div>
          <span>待確認差異</span>
          <strong>{{ previewSummary.review }} 檔</strong>
        </div>
        <div>
          <span>選取{{ shareUnitLabel(dashboardSettingStore.shareUnit) }}</span>
          <strong>{{ formatShares(selectedShares) }}</strong>
        </div>
      </div>

      <div class="source-list">
        <span>本次來源</span>
        <el-tag
          v-for="account in canonicalResult?.accounts || []"
          :key="account.accountFingerprint"
          round
          effect="plain"
        >
          {{ account.brokerName || '集保來源' }}
        </el-tag>
      </div>

      <el-alert
        title="只會儲存你勾選的正向差額；負向差異不會自動賣出或刪除。"
        type="info"
        :closable="false"
      />
      <el-alert
        v-for="warning in canonicalResult?.warnings || []"
        :key="warning"
        :title="warning"
        type="warning"
        :closable="false"
      />

      <el-table :data="previewRows" max-height="390" class="reconciliation-table">
        <el-table-column width="56" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="row.selected" :disabled="row.status !== 'add'" />
          </template>
        </el-table-column>
        <el-table-column label="股票" min-width="160">
          <template #default="{ row }">
            <div class="stock-cell">
              <strong>{{ row.stockName }}</strong>
              <span>{{ row.stockId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="`集保${shareUnitLabel(dashboardSettingStore.shareUnit)}`"
          align="right"
          min-width="120"
        >
          <template #default="{ row }">{{
            row.observedShares === null ? '-' : formatShares(row.observedShares)
          }}</template>
        </el-table-column>
        <el-table-column
          :label="`目前${shareUnitLabel(dashboardSettingStore.shareUnit)}`"
          align="right"
          min-width="120"
        >
          <template #default="{ row }">{{ formatShares(row.appShares) }}</template>
        </el-table-column>
        <el-table-column label="差額" align="right" min-width="120">
          <template #default="{ row }">
            <strong
              :class="row.deltaShares > 0 ? 'value-up' : row.deltaShares < 0 ? 'value-down' : ''"
            >
              {{
                row.deltaShares === null
                  ? '-'
                  : `${row.deltaShares > 0 ? '+' : ''}${formatShares(row.deltaShares)}`
              }}
            </strong>
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status].type" round effect="plain">
              {{ statusMap[row.status].label }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="preview-footnote">
        <span>本次已選 {{ selectedCount }} 檔，新增資料會標記為「成本待補」。</span>
        <span v-if="previewSummary.unobserved"
          >未涵蓋 {{ previewSummary.unobserved }} 檔不會改動。</span
        >
      </div>
    </div>

    <div v-else class="import-success">
      <div class="success-icon"><Check :size="28" /></div>
      <h3>對帳完成</h3>
      <p>已更新持股數量。新增差額保留為成本待補，不會影響既有手動交易紀錄。</p>
      <div class="result-summary">
        <div>
          <span>已補入</span><strong>{{ resultSummary.added }} 檔</strong>
        </div>
        <div>
          <span>已核對</span><strong>{{ resultSummary.verified }} 檔</strong>
        </div>
        <div>
          <span>待確認</span><strong>{{ resultSummary.review }} 檔</strong>
        </div>
        <div>
          <span>略過</span><strong>{{ resultSummary.skipped }} 檔</strong>
        </div>
        <div>
          <span>失敗</span><strong>{{ resultSummary.failed }} 筆</strong>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-actions">
        <el-button v-if="stage === 'upload'" text @click="stage = 'source'">
          <ArrowLeft :size="15" /> 返回供應商選擇
        </el-button>
        <el-button v-else-if="stage === 'preview'" text @click="goBack">
          <ArrowLeft :size="15" /> 返回檔案選擇
        </el-button>
        <span v-else />
        <div class="dialog-actions-right">
          <el-button @click="visible = false">關閉</el-button>
          <el-button
            v-if="stage === 'upload'"
            type="primary"
            :loading="parsing"
            @click="parseImport"
          >
            解析並預覽
          </el-button>
          <el-button
            v-if="stage === 'preview'"
            type="primary"
            :loading="submitting"
            @click="saveImport"
          >
            確認對帳
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.dialog-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.dialog-icon,
.success-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgb(34 211 238 / 0.25);
  border-radius: 12px;
  background: rgb(34 211 238 / 0.1);
  color: #67e8f9;
}

.dialog-icon {
  width: 36px;
  height: 36px;
}

.dialog-kicker {
  color: var(--dashboard-text-muted, #8a97a8);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.1em;
}

h2,
h3,
p {
  margin: 0;
}

h2 {
  margin-top: 3px;
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 19px;
}

.dialog-heading p {
  margin-top: 5px;
  color: var(--dashboard-text-muted, #8a97a8);
  font-size: 12px;
}

.import-stage {
  display: grid;
  gap: 16px;
}

.source-stage {
  min-height: 260px;
}

.source-stage-intro {
  display: grid;
  gap: 7px;
}

.source-stage-intro strong {
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 18px;
}

.source-stage-intro p {
  color: var(--dashboard-text-muted, #8a97a8);
  font-size: 13px;
  line-height: 1.6;
}

.source-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.source-option {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  border: 1px solid var(--main-border-color);
  border-radius: 14px;
  background: var(--dashboard-section-bg);
  padding: 14px;
  color: var(--dashboard-text-primary, #f8fbff);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.source-option:hover {
  border-color: rgb(34 211 238 / 0.5);
  background: var(--dashboard-control-bg, #111317);
  transform: translateY(-1px);
}

.source-option:focus-visible {
  outline: 2px solid #67e8f9;
  outline-offset: 2px;
}

.source-option-mark {
  display: grid;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgb(34 211 238 / 0.24);
  border-radius: 11px;
  background: rgb(34 211 238 / 0.1);
  color: #67e8f9;
}

.source-option-copy {
  display: grid;
  min-width: 0;
  flex: 1 1 auto;
  gap: 3px;
}

.source-option-copy strong {
  font-size: 14px;
}

.source-option-copy span {
  color: var(--dashboard-text-secondary, #dbeafe);
  font-size: 12px;
  font-weight: 700;
}

.source-option-copy small {
  overflow: hidden;
  color: var(--dashboard-text-muted, #8a97a8);
  font-size: 11px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.privacy-note,
.scope-note {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
}

.privacy-note {
  background: rgb(34 211 238 / 0.08);
  color: var(--dashboard-text-secondary, #dbeafe);
}

.scope-note {
  color: var(--dashboard-text-muted, #8a97a8);
}

.import-upload :deep(.el-upload-dragger) {
  border-color: var(--dashboard-control-border, #30343a);
  background: var(--dashboard-control-bg, #111317);
  color: var(--dashboard-text-muted, #8a97a8);
}

.import-upload :deep(.el-upload-dragger:hover) {
  border-color: #22d3ee;
}

.import-upload :deep(.el-upload__text) {
  margin-top: 8px;
  color: var(--dashboard-text-secondary, #dbeafe);
}

.import-upload :deep(.el-upload__text em) {
  color: #67e8f9;
  font-style: normal;
}

.import-upload :deep(.el-upload__tip) {
  color: var(--dashboard-text-muted, #8a97a8);
}

.preview-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.preview-summary > div {
  display: grid;
  gap: 6px;
  border: 1px solid var(--main-border-color);
  border-radius: 12px;
  background: var(--dashboard-section-bg);
  padding: 11px 12px;
}

.preview-summary span {
  color: var(--dashboard-text-muted, #8a97a8);
  font-size: 11px;
  font-weight: 800;
}

.preview-summary strong {
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 15px;
}

.source-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--dashboard-text-muted, #8a97a8);
  font-size: 12px;
  font-weight: 800;
}

.stock-cell {
  display: grid;
  gap: 3px;
}

.stock-cell strong {
  color: var(--dashboard-text-primary, #f8fbff);
}

.stock-cell span,
.preview-footnote {
  color: var(--dashboard-text-muted, #8a97a8);
  font-size: 12px;
}

.preview-footnote,
.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.value-up {
  color: var(--stock-rise-color) !important;
}

.value-down {
  color: var(--stock-fall-color) !important;
}

.dialog-actions-right {
  display: flex;
  gap: 8px;
}

.import-success {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 42px 20px 48px;
  text-align: center;
}

.success-icon {
  width: 56px;
  height: 56px;
  border-color: rgb(52 211 153 / 0.28);
  background: rgb(52 211 153 / 0.12);
  color: #6ee7b7;
}

.import-success h3 {
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 20px;
}

.import-success p {
  max-width: 450px;
  color: var(--dashboard-text-muted, #8a97a8);
  font-size: 13px;
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  width: 100%;
  max-width: 640px;
  gap: 8px;
  margin-top: 8px;
}

.result-summary > div {
  display: grid;
  gap: 4px;
  border: 1px solid var(--main-border-color);
  border-radius: 10px;
  background: var(--dashboard-section-bg);
  padding: 9px 7px;
}

.result-summary span {
  color: var(--dashboard-text-muted, #8a97a8);
  font-size: 11px;
}

.result-summary strong {
  color: var(--dashboard-text-primary, #f8fbff);
  font-size: 14px;
}

@media (max-width: 680px) {
  .source-options {
    grid-template-columns: 1fr;
  }

  .source-option-copy small {
    white-space: normal;
  }

  .preview-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .preview-footnote,
  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .dialog-actions-right {
    width: 100%;
  }

  .result-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dialog-actions-right :deep(.el-button) {
    flex: 1;
  }
}
</style>
