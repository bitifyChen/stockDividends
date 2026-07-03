import { ElMessageBox } from 'element-plus'

const DEFAULT_TONE = 'warning'

const toneTypeMap = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error'
}

function getDashboardThemeClass() {
  if (typeof document === 'undefined') return 'dashboard-message-box--dark'
  const isLight = Boolean(document.querySelector('.dashboard-shell.theme-light'))
  return isLight ? 'dashboard-message-box--light' : 'dashboard-message-box--dark'
}

function createClassName(tone = DEFAULT_TONE) {
  return ['dashboard-message-box', `dashboard-message-box--${tone}`, getDashboardThemeClass()]
    .filter(Boolean)
    .join(' ')
}

function createModalClassName() {
  return ['dashboard-message-box-overlay', getDashboardThemeClass()].join(' ')
}

function createOptions(options = {}) {
  const tone = options.tone || DEFAULT_TONE
  const customClass = options.customClass
  const modalClass = options.modalClass
  const elementOptions = { ...options }

  delete elementOptions.title
  delete elementOptions.message
  delete elementOptions.tone
  delete elementOptions.customClass
  delete elementOptions.modalClass

  return {
    confirmButtonText: elementOptions.confirmButtonText || '確認',
    cancelButtonText: elementOptions.cancelButtonText || '取消',
    type: toneTypeMap[tone] || toneTypeMap[DEFAULT_TONE],
    distinguishCancelAndClose: true,
    closeOnClickModal: false,
    closeOnPressEscape: true,
    showClose: true,
    ...elementOptions,
    customClass: [createClassName(tone), customClass].filter(Boolean).join(' '),
    modalClass: [createModalClassName(), modalClass].filter(Boolean).join(' ')
  }
}

export function useDashboardMessageBox() {
  function confirm(options = {}) {
    return ElMessageBox.confirm(
      options.message || '',
      options.title || '確認操作',
      createOptions(options)
    )
  }

  function prompt(options = {}) {
    return ElMessageBox.prompt(
      options.message || '',
      options.title || '輸入資料',
      createOptions(options)
    )
  }

  return {
    confirm,
    prompt
  }
}
