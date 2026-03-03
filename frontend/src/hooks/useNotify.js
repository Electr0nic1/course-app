import { App } from 'antd'

/**
 * Tiny wrapper around Ant Design message/notification.
 */
export function useNotify() {
  const antdApp = App.useApp()

  return {
    msg: antdApp.message,
    notify: antdApp.notification,
  }
}
