import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: {
      username: '',
      institutionType: ''
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
        institutionType: ''
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
  },
  modules: {
  }
})
