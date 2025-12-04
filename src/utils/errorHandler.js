/**
 * 错误处理工具函数
 * 统一处理 API 错误响应，将英文错误信息转换为中文
 */

/**
 * 处理错误消息，将英文权限错误转换为中文
 * @param {string} errorMessage - 原始错误消息
 * @param {number} statusCode - HTTP 状态码
 * @param {string} action - 操作类型（可选）：'create', 'update', 'delete', 'edit'
 * @returns {string} - 处理后的中文错误消息
 */
export function formatErrorMessage(errorMessage, statusCode = null, action = null) {
  if (!errorMessage) {
    return '操作失败'
  }

  // 如果是 403 权限错误，统一转换为中文
  if (statusCode === 403) {
    // 检查是否是权限相关的英文错误
    const permissionKeywords = [
      'permission',
      'not have permission',
      'do not have permission',
      'insufficient permission',
      'forbidden',
      'access denied'
    ]
    
    const isPermissionError = permissionKeywords.some(keyword => 
      errorMessage.toLowerCase().includes(keyword.toLowerCase())
    )
    
    if (isPermissionError) {
      // 根据操作类型返回不同的中文错误信息
      if (action === 'create' || action === '新增') {
        return '权限不足，只有 ADMIN 角色才能新增'
      } else if (action === 'update' || action === '修改' || action === 'edit') {
        return '权限不足，只有 ADMIN 角色才能修改'
      } else if (action === 'delete' || action === '删除') {
        return '权限不足，只有 ADMIN 角色才能删除'
      } else if (action === 'view' || action === '查看') {
        return '权限不足，无法查看详情'
      } else if (action === 'download' || action === '下载') {
        return '权限不足，只有 ADMIN 角色才能下载'
      } else {
        return '权限不足，只有 ADMIN 角色才能删除、新增、修改'
      }
    }
  }

  // 如果错误消息已经是中文，直接返回
  // 简单判断：如果包含中文字符，认为是中文
  if (/[\u4e00-\u9fa5]/.test(errorMessage)) {
    return errorMessage
  }

  // 其他常见的英文错误消息转换
  const errorMap = {
    'not found': '未找到',
    'not found.': '未找到',
    'does not exist': '不存在',
    'already exists': '已存在',
    'invalid': '无效',
    'required': '必填',
    'authentication': '认证失败',
    'unauthorized': '未授权',
    'bad request': '请求错误',
    'server error': '服务器错误',
    'internal server error': '服务器内部错误'
  }

  // 尝试匹配并替换常见的英文错误
  for (const [english, chinese] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(english)) {
      // 如果错误消息主要是英文，尝试替换
      if (!/[\u4e00-\u9fa5]/.test(errorMessage)) {
        return errorMessage.replace(new RegExp(english, 'gi'), chinese)
      }
    }
  }

  // 如果无法转换，返回原始错误消息
  return errorMessage
}

/**
 * 从 API 响应中提取错误消息
 * @param {object} response - fetch 响应对象
 * @param {object} data - 解析后的响应数据
 * @param {string} action - 操作类型（可选）
 * @returns {Promise<string>} - 错误消息
 */
export async function extractErrorMessage(response, data = null, action = null) {
  let errorMessage = `操作失败: ${response.status}`

  // 如果没有提供 data，尝试从响应中读取
  if (!data && response) {
    try {
      const text = await response.text()
      if (text) {
        try {
          data = JSON.parse(text)
        } catch (e) {
          // 如果不是 JSON，使用文本作为错误消息
          return formatErrorMessage(text, response.status, action)
        }
      }
    } catch (e) {
      // 无法读取响应文本
    }
  }

  // 处理统一响应格式：{ code, message, data }
  if (data && data.code !== undefined && data.message) {
    errorMessage = formatErrorMessage(data.message, response?.status, action)
  } else if (data && data.detail) {
    errorMessage = formatErrorMessage(data.detail, response?.status, action)
  } else if (data && data.message) {
    errorMessage = formatErrorMessage(data.message, response?.status, action)
  } else if (data && data.error) {
    errorMessage = formatErrorMessage(data.error, response?.status, action)
  } else if (typeof data === 'string') {
    errorMessage = formatErrorMessage(data, response?.status, action)
  } else if (response) {
    // 根据状态码设置默认错误消息
    if (response.status === 401) {
      errorMessage = '认证失败，请重新登录'
    } else if (response.status === 403) {
      errorMessage = formatErrorMessage('You do not have permission to perform this action.', 403, action)
    } else if (response.status === 404) {
      errorMessage = '资源不存在'
    } else if (response.status === 400) {
      errorMessage = '请求参数错误'
    } else if (response.status >= 500) {
      errorMessage = '服务器错误，请稍后重试'
    }
  }

  return errorMessage
}

