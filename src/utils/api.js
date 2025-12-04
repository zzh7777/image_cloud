/**
 * API请求工具函数
 * 自动处理token刷新
 */

/**
 * 处理401错误，自动刷新token
 * @param {object} store - Vuex store实例
 * @param {object} router - Vue Router实例
 * @param {boolean} silent - 是否静默处理（不显示错误消息，用于页面加载时）
 * @returns {Promise<boolean>} - 返回true表示刷新成功，false表示刷新失败
 */
export async function handle401Error(store, router, silent = false) {
  try {
    // 尝试刷新token
    await store.dispatch('refreshAccessToken')
    return true // 刷新成功
  } catch (error) {
    // 刷新失败，清除用户信息，跳转到登录页
    if (!silent) {
      console.error('Token刷新失败:', error)
    }
    store.commit('clearUser')
    if (router) {
      router.push('/login')
    }
    return false // 刷新失败
  }
}

/**
 * 带自动token刷新的fetch请求
 * @param {string} url - 请求URL
 * @param {object} options - fetch选项
 * @param {object} store - Vuex store实例
 * @param {object} router - Vue Router实例
 * @param {boolean} silent - 是否静默处理（不显示错误消息，用于页面加载时）
 * @returns {Promise<Response>}
 */
export async function fetchWithAuth(url, options = {}, store, router, silent = false) {
  // 获取当前access token
  const accessToken = store.getters.accessToken
  
  // 设置Authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`
  }

  // 第一次请求
  let response = await fetch(url, {
    ...options,
    headers
  })

  // 如果是401错误，尝试刷新token
  if (response.status === 401) {
    const refreshSuccess = await handle401Error(store, router, silent)
    
    if (refreshSuccess) {
      // 刷新成功，使用新的token重试请求
      const newAccessToken = store.getters.accessToken
      const retryHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${newAccessToken}`
      }
      
      response = await fetch(url, {
        ...options,
        headers: retryHeaders
      })
      
      // 如果重试后仍然是401，说明token仍然无效
      if (response.status === 401) {
        store.commit('clearUser')
        if (router) {
          router.push('/login')
        }
        if (!silent) {
          throw new Error('认证失败，请重新登录')
        }
      }
    } else {
      // 刷新失败，已经跳转到登录页
      if (!silent) {
        throw new Error('Token已过期，请重新登录')
      }
    }
  }

  return response
}

