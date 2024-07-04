import { ElMessageBox } from 'element-plus'
import { showConfirmDialog, showDialog } from 'vant'

export const useElMessageBox = (
  message,
  title,
  type = 'msg',
  confirmButtonText = '确认',
  cancelButtonText = '取消'
) => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-unused-vars
      ElMessageBox.confirm(message, title, {
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
        center: true,
        customClass: type
      })
        .then(() => resolve(true))
        .catch(() => reject(false))
  })
}

export const useElMessageBoxConfirmType = (message, title, type = 'msg') => {
  return new Promise((resolve) => {
    if (isMobile()) {
      showDialog({
        title: title,
        message: message,
        confirmButtonColor: '#f98c11'
      }).then(() => {
        resolve(true)
      })
    } else {
      ElMessageBox.alert(message, title, {
        confirmButtonText: '确认',
        center: true,
        customClass: type
      }).then(() => resolve(true))
    }
  })
}
