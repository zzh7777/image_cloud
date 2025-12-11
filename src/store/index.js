import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: {
      username: '',
      institutionType: '',
      role: '', // 用户角色：System Administrator, Medical Insurance Administrator, Medical Insurance User, Hospital Administrator, Hospital User
      hospital: '', // 医院编码（仅医院角色有）
      hospital_name: '', // 医院名称（仅医院角色有）
      role_level: '', // 角色级别：super, admin, user
      role_type: '' // 角色类型：system, insurance, hospital
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
    hospital: state => state.user.hospital, // 获取医院编码
    hospitalName: state => state.user.hospital_name, // 获取医院名称
    roleLevel: state => state.user.role_level, // 获取角色级别
    roleType: state => state.user.role_type, // 获取角色类型
    isLoggedIn: state => state.isLoggedIn,
    accessToken: state => state.tokens.access,
    refreshToken: state => state.tokens.refresh
  },
  mutations: {
    setUser(state, user) {
      // 确保所有字段存在
      state.user = {
        username: user.username || '',
        institutionType: user.institutionType || '',
        role: user.role || '',
        hospital: user.hospital || '',
        hospital_name: user.hospital_name || '',
        role_level: user.role_level || '',
        role_type: user.role_type || ''
      }
      state.isLoggedIn = true
      // 保存到localStorage
      localStorage.setItem('user', JSON.stringify(state.user))
      localStorage.setItem('isLoggedIn', 'true')
      console.log('Store setUser:', state.user)
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
        role: '',
        hospital: '',
        hospital_name: '',
        role_level: '',
        role_type: ''
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
        const parsedUser = JSON.parse(user)
        state.user = {
          username: parsedUser.username || '',
          institutionType: parsedUser.institutionType || '',
          role: parsedUser.role || '',
          hospital: parsedUser.hospital || '',
          hospital_name: parsedUser.hospital_name || '',
          role_level: parsedUser.role_level || '',
          role_type: parsedUser.role_type || ''
        }
        state.isLoggedIn = true
        console.log('Store initUser 从 localStorage 恢复:', state.user)
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
          const rolesData = data.data.roles || []
          const roleLevel = data.data.role_level
          
          // 优先从 roles 数组和 role_level 判断系统管理员（与登录逻辑保持一致）
          let userRole = ''
          if (rolesData && Array.isArray(rolesData) && rolesData.length > 0) {
            const firstRole = rolesData[0]
            // 如果 role_level 是 super 且 role_type 是 system，则是系统管理员（Superuser）
            if (roleLevel === 'super' && firstRole.role_type === 'system') {
              userRole = 'Superuser'
            } else if (firstRole.name) {
              // 否则使用角色的 name
              userRole = firstRole.name
            }
          }
          
          // 如果从 roles 中没有获取到角色，则从 groups 数组中提取角色（向后兼容）
          if (!userRole) {
            if (userData.groups && Array.isArray(userData.groups) && userData.groups.length > 0) {
              // 使用第一个角色
              userRole = userData.groups[0]
            } else if (userData.role) {
              userRole = userData.role
            } else if (userData.user_type) {
              userRole = userData.user_type
            }
          }
          
          // 更新用户信息，包括角色、医院编码、医院名称、角色级别和角色类型
          const firstRole = rolesData && rolesData.length > 0 ? rolesData[0] : null
          const updatedUser = {
            username: userData.username || getters.username,
            institutionType: userData.institution_type || userData.institutionType || '',
            role: userRole,
            hospital: userData.hospital || data.data.hospital_code || getters.hospital || '', // 保存医院编码
            hospital_name: data.data.hospital_name || getters.hospitalName || '', // 保存医院名称
            role_level: roleLevel || getters.roleLevel || '', // 保存角色级别
            role_type: firstRole ? firstRole.role_type || '' : getters.roleType || '' // 保存角色类型
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
            role: userRole,
            hospital: data.hospital || '' // 保存医院编码
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
