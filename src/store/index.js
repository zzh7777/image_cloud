import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: {
      username: '',
      institutionType: ''
    },
    isLoggedIn: false
  },
  getters: {
    username: state => state.user.username,
    institutionType: state => state.user.institutionType,
    isLoggedIn: state => state.isLoggedIn
  },
  mutations: {
    setUser(state, user) {
      state.user = user
      state.isLoggedIn = true
      // 保存到localStorage
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('isLoggedIn', 'true')
    },
    clearUser(state) {
      state.user = {
        username: '',
        institutionType: ''
      }
      state.isLoggedIn = false
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
    },
    initUser(state) {
      // 从localStorage恢复用户信息
      const user = localStorage.getItem('user')
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      if (user && isLoggedIn === 'true') {
        state.user = JSON.parse(user)
        state.isLoggedIn = true
      }
    }
  },
  actions: {
  },
  modules: {
  }
})
