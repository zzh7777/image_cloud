import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: {
      username: '',
      institutionType: '',
      role: '' // 用户角色：System Administrator, Medical Insurance Administrator, Medical Insurance User, Hospital Administrator, Hospital User
    },
    tokens: {
      access: '',
      refresh: ''
    },
    isLoggedIn: false
  },
  getters: {
    username: state => state.user.username,
    institutionType: state => state.user.institutionType,
    role: state => state.user.role,
    isLoggedIn: state => state.isLoggedIn,
    accessToken: state => state.tokens.access,
    refreshToken: state => state.tokens.refresh
  },
  mutations: {
    setUser(state, user) {
      state.user = user
      state.isLoggedIn = true
      // 保存到localStorage
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('isLoggedIn', 'true')
    },
    setTokens(state, tokens) {
      state.tokens = {
        access: tokens.access || '',
        refresh: tokens.refresh || ''
      }
      // 保存到localStorage
      localStorage.setItem('accessToken', tokens.access || '')
      localStorage.setItem('refreshToken', tokens.refresh || '')
    },
    clearUser(state) {
      state.user = {
        username: '',
        institutionType: '',
        role: ''
      }
      state.tokens = {
        access: '',
        refresh: ''
      }
      state.isLoggedIn = false
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
    initUser(state) {
      // 从localStorage恢复用户信息
      const user = localStorage.getItem('user')
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      if (user && isLoggedIn === 'true') {
        state.user = JSON.parse(user)
        state.isLoggedIn = true
      }
      if (accessToken && refreshToken) {
        state.tokens = {
          access: accessToken,
          refresh: refreshToken
        }
      }
    }
  },
  actions: {
    // 获取当前用户信息（包括角色）
    async fetchCurrentUser({ getters, commit }) {
      try {
        const accessToken = getters.accessToken
        if (!accessToken) {
          throw new Error('未登录')
        }

        const response = await fetch('/api/v1/users/me/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          // 如果接口不存在（404），尝试从 token 解析或使用默认值
          if (response.status === 404) {
            console.warn('用户信息接口不存在，使用默认角色')
            return null
          }
          throw new Error(`获取用户信息失败: ${response.status}`)
        }

        const text = await response.text()
        let data = null

        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('解析用户信息响应失败:', e)
          return null
        }

        // 处理统一响应格式
        if (data && data.code === 0 && data.data) {
          const userData = data.data
          // 从 groups 数组中提取角色（优先使用 groups，与登录逻辑保持一致）
          let userRole = ''
          if (userData.groups && Array.isArray(userData.groups) && userData.groups.length > 0) {
            // 使用第一个角色
            userRole = userData.groups[0]
          } else if (userData.role) {
            userRole = userData.role
          } else if (userData.user_type) {
            userRole = userData.user_type
          }
          
          // 更新用户信息，包括角色
          const updatedUser = {
            username: userData.username || getters.username,
            institutionType: userData.institution_type || userData.institutionType || '',
            role: userRole
          }
          commit('setUser', updatedUser)
          return updatedUser
        } else if (data && data.username) {
          // 兼容旧格式
          // 从 groups 数组中提取角色
          let userRole = ''
          if (data.groups && Array.isArray(data.groups) && data.groups.length > 0) {
            userRole = data.groups[0]
          } else if (data.role) {
            userRole = data.role
          } else if (data.user_type) {
            userRole = data.user_type
          }
          
          const updatedUser = {
            username: data.username,
            institutionType: data.institution_type || data.institutionType || '',
            role: userRole
          }
          commit('setUser', updatedUser)
          return updatedUser
        }

        return null
      } catch (error) {
        console.error('获取用户信息错误:', error)
        return null
      }
    },
    // 刷新 Access Token
    async refreshAccessToken({ state, commit }) {
      const refreshToken = state.tokens.refresh
      if (!refreshToken) {
        throw new Error('没有可用的 Refresh Token')
      }

      try {
        const response = await fetch('/api/v1/token/refresh/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refresh: refreshToken
          })
        })

        const text = await response.text()
        let data = null

        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('解析刷新Token响应失败:', e)
          throw new Error('刷新Token响应格式错误')
        }

        if (!response.ok) {
          // 刷新失败，清除用户信息
          commit('clearUser')
          throw new Error('Refresh Token 已过期，请重新登录')
        }

        // 刷新成功，更新 Access Token
        if (data && data.access) {
          commit('setTokens', {
            access: data.access,
            refresh: refreshToken // Refresh Token 不变
          })
          return data.access
        } else {
          throw new Error('刷新Token响应中缺少 access 字段')
        }
      } catch (error) {
        console.error('刷新Token错误:', error)
        // 刷新失败，清除用户信息
        commit('clearUser')
        throw error
      }
    }
  },
  modules: {
  }
})
