import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false
Vue.use(ElementUI)

// 初始化用户信息
store.commit('initUser')

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
}).$mount('#app')
