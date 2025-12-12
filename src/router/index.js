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
import { hasRoutePermission } from '../utils/permissions'

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
      },
      {
        path: 'create-user',
        name: 'create-user',
        component: Register
      }
    ]
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: { requiresAuth: true }
  }
]

const router = new VueRouter({
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 初始化用户信息
  store.commit('initUser')
  
  // 如果访问根路径，直接重定向到登录页（不检查登录状态）
  if (to.path === '/') {
    next('/login')
    return
  }
  
  // 定义需要认证的路径前缀
  const protectedPaths = ['/main', '/workspace']
  const isProtectedPath = protectedPaths.some(path => to.path.startsWith(path))
  
  // 检查路由是否需要认证（包括父路由）
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth) || isProtectedPath
  
  if (requiresAuth) {
    if (store.getters.isLoggedIn) {
      // 检查权限
      const routeName = to.name
      const userRole = store.getters.role
      const userPermissions = store.getters.permissions
      const roleLevel = store.getters.roleLevel
      const roleType = store.getters.roleType
      
      // personal-info 对所有已登录用户开放，不需要检查权限
      if (routeName === 'personal-info') {
        next()
        return
      }
      
      // 工作台：医院管理员和医院用户不能访问
      if (routeName === 'workspace' || to.path === '/main/workspace') {
        if (userRole === 'Hospital Administrator' || userRole === 'Hospital User') {
          // 医院管理员和医院用户不能访问工作台，重定向到预警列表
          console.warn(`用户 ${store.getters.username} (角色: ${userRole}) 不能访问工作台`)
          next('/main/warning-base')
          return
        }
        // 其他角色可以访问工作台
        next()
        return
      }
      
      // 处理 /main 和 /workspace 路径的重定向（根据用户角色）
      if (to.path === '/main' || to.path === '/workspace') {
        if (userRole === 'Hospital Administrator' || userRole === 'Hospital User') {
          // 医院管理员和医院用户重定向到预警列表
          next('/main/warning-base')
          return
        }
        // 其他角色重定向到工作台
        next('/main/workspace')
        return
      }
      
      // 如果角色为空，允许访问 workspace（避免循环重定向）
      if (!userRole) {
        console.warn('用户角色未设置，允许访问工作台')
        if (routeName !== 'workspace' && to.path !== '/main/workspace') {
          next('/main/workspace')
        } else {
          next()
        }
        return
      }
      
      // 如果有路由名称，检查权限
      if (routeName) {
        // 创建用户页面：需要检查 role_level === 'admin' 或 Superuser
        if (routeName === 'create-user') {
          const isAdminRole = roleLevel === 'admin' && ['system', 'insurance', 'hospital'].includes(roleType)
          if (!(roleLevel === 'super' || userRole === 'Superuser' || isAdminRole)) {
            console.warn(`用户 ${store.getters.username} (角色: ${userRole}, 级别: ${roleLevel}) 没有权限访问 ${routeName}`)
            if (userRole === 'Hospital Administrator' || userRole === 'Hospital User' || (roleLevel && roleLevel !== 'admin')) {
              next('/main/warning-base')
            } else {
              next('/main/workspace')
            }
            return
          }
        } else if (!hasRoutePermission(userRole, routeName, userPermissions, roleLevel, roleType)) {
          // 其他页面使用原有的权限检查
          console.warn(`用户 ${store.getters.username} (角色: ${userRole}) 没有权限访问 ${routeName}`)
          // 医院管理员和医院用户重定向到预警列表，其他角色重定向到工作台
          if (userRole === 'Hospital Administrator' || userRole === 'Hospital User') {
            next('/main/warning-base')
          } else {
            next('/main/workspace')
          }
          return
        }
      }
      next()
    } else {
      // 未登录用户尝试访问受保护页面，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原始路径，登录后可以跳转回去
      })
    }
  } else if (to.path === '/login' && store.getters.isLoggedIn) {
    // 已登录用户访问登录页，根据角色重定向到合适的页面
    const userRole = store.getters.role
    if (userRole === 'Hospital Administrator' || userRole === 'Hospital User') {
      next('/main/warning-base')
    } else {
      next('/main/workspace')
    }
  } else if (to.path === '/register') {
    // 注册页面需要登录
    if (store.getters.isLoggedIn) {
      // 检查是否有创建用户的权限
      const userRole = store.getters.role
      const roleLevel = store.getters.roleLevel
      const roleType = store.getters.roleType
      const isAdminRole = roleLevel === 'admin' && ['system', 'insurance', 'hospital'].includes(roleType)
      if (roleLevel === 'super' || userRole === 'Superuser' || isAdminRole) {
        next()
      } else {
        // 没有权限，重定向到工作台
        next('/main/workspace')
      }
    } else {
      // 未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    next()
  }
})

export default router
