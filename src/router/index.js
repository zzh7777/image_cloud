import Vue from 'vue'
import VueRouter from 'vue-router'
import Navigation from '../views/Navigation.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import WorkspaceView from '../components/WorkspaceView.vue'
import RuleBaseView from '../components/RuleBaseView.vue'
import KnowledgeBaseView from '../components/KnowledgeBaseView.vue'
import DatabaseManageView from '../components/DatabaseManageView.vue'
import TaskBaseView from '../components/TaskBaseView.vue'
import WarningBaseView from '../components/WarningBaseView.vue'
import WarningDetailView from '../components/WarningDetailView.vue'
import WarningRecordView from '../components/WarningRecordView.vue'
import DataBaseView from '../components/DataBaseView.vue'
import LogBaseView from '../components/LogBaseView.vue'
import PermissionBaseView from '../components/PermissionBaseView.vue'
import ModelBaseView from '../components/ModelBaseView.vue'
import PersonalInfoView from '../components/PersonalInfoView.vue'
import store from '../store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/register',
    name: 'register',
    component: Register
  },
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/workspace',
    redirect: '/main/workspace'
  },
  {
    path: '/main',
    component: Navigation,
    redirect: '/main/workspace',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'workspace',
        name: 'workspace',
        component: WorkspaceView
      },
      {
        path: 'knowledge-base',
        name: 'knowledge-base',
        component: KnowledgeBaseView
      },
      {
        path: 'rule-base',
        name: 'rule-base',
        component: RuleBaseView
      },
      {
        path: 'database',
        name: 'database',
        component: DatabaseManageView
      },
      {
        path: 'model-base',
        name: 'model-base',
        component: ModelBaseView
      },
      {
        path: 'task-base',
        name: 'task-base',
        component: TaskBaseView
      },
      {
        path: 'warning-base',
        name: 'warning-base',
        component: WarningBaseView
      },
      {
        path: 'warning-detail',
        name: 'warning-detail',
        component: WarningDetailView
      },
      {
        path: 'warning-record',
        name: 'warning-record',
        component: WarningRecordView
      },
      {
        path: 'data-base',
        name: 'data-base',
        component: DataBaseView
      },
      {
        path: 'log-base',
        name: 'log-base',
        component: LogBaseView
      },
      {
        path: 'permission-base',
        name: 'permission-base',
        component: PermissionBaseView
      },
      {
        path: 'personal-info',
        name: 'personal-info',
        component: PersonalInfoView
      }
    ]
  }
]

const router = new VueRouter({
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 初始化用户信息
  store.commit('initUser')
  
  // 定义需要认证的路径前缀
  const protectedPaths = ['/main', '/workspace']
  const isProtectedPath = protectedPaths.some(path => to.path.startsWith(path))
  
  // 检查路由是否需要认证（包括父路由）
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth) || isProtectedPath
  
  if (requiresAuth) {
    if (store.getters.isLoggedIn) {
      next()
    } else {
      // 未登录用户尝试访问受保护页面，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原始路径，登录后可以跳转回去
      })
    }
  } else if ((to.path === '/login' || to.path === '/register') && store.getters.isLoggedIn) {
    // 已登录用户访问登录/注册页，重定向到主页
    next('/main')
  } else {
    next()
  }
})

export default router
