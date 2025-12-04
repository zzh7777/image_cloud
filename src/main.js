import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import router from './router'
import store from './store'
import errorMixin from './utils/errorMixin'

Vue.config.productionTip = false
Vue.use(ElementUI)

// 注册全局 mixin，所有组件都可以使用 formatPermissionError 方法
Vue.mixin(errorMixin)

// 初始化用户信息
store.commit('initUser')

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
}).$mount('#app')
