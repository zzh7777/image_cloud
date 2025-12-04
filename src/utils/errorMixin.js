/**
 * 错误处理 Mixin
 * 提供统一的权限错误格式化方法
 */
import { formatErrorMessage } from './errorHandler'

export default {
  methods: {
    /**
     * 格式化权限错误消息为中文
     * @param {string} errorMessage - 原始错误消息
     * @param {string} action - 操作类型（可选）：'create', 'update', 'delete', 'edit'
     * @returns {string} - 处理后的中文错误消息
     */
    formatPermissionError(errorMessage, action = null) {
      return formatErrorMessage(errorMessage, 403, action)
    }
  }
}

