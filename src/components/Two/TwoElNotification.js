import { ElNotification } from 'element-plus'

export const useElNotification = (message, type = 'error', title = null, duration = 2000) => {
  return new Promise((resolve) => {
    // eslint-disable-next-line no-unused-vars
    const notification = ElNotification({
      title: title || getTypeTitle(type),
      message,
      type,
      duration,
      onClose: () => {
        resolve()
      }
    })
  })
}

const getTypeTitle = (type) => {
  switch (type) {
    case 'success':
      return 'SUCCESS'
    case 'warning':
      return 'WARNING'
    case 'info':
      return 'INFO'
    default:
      return ''
  }
}
