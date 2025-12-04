<template>
  <!-- 主容器：垂直排列 header 和内容区 -->
  <el-container style="min-height: 100vh; border: 1px solid #eee;">
    <!-- 头部区域 -->
    <el-header style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); line-height: 60px; position: relative; display: flex; justify-content: flex-end; align-items: center; padding: 0 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h1 style="margin: 0; color: #fff; position: absolute; left: 50%; transform: translateX(-50%); font-weight: 500;">影像监管AI</h1>
      <div style="display: flex; align-items: center; gap: 15px;">
        <el-dropdown @command="handleUserCommand" trigger="click">
          <span style="color: #fff; font-size: 14px; cursor: pointer;">
            {{ username }}<i class="el-icon-arrow-down el-icon--right"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="personal-info">个人信息</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 内容区容器：水平排列 aside 和 main -->
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="isCollapse ? '64px' : '200px'" style="background-color: #f5f7fa; transition: width 0.3s; border-right: 1px solid #e4e7ed;">
        <div style="padding: 20px 10px; display: flex; align-items: center; gap: 10px;">
          <h2 v-show="!isCollapse" style="margin: 0; font-size: 20px; margin-left: 10%; font-weight: bold; color: #303133;">导航栏</h2>
          <el-button 
            type="text" 
            :icon="isCollapse ? 'el-icon-d-arrow-right' : 'el-icon-d-arrow-left'"
            @click="toggleCollapse"
            style="color: #606266; padding: 5px;"
          ></el-button>
        </div>
        <!-- 根据权限动态显示菜单项 -->
        <el-menu 
          :default-active="activeMenu" 
          class="el-menu-vertical-demo" 
          :collapse="isCollapse"
          @select="handleMenuSelect"
        >
          <el-menu-item 
            v-for="item in menuItems" 
            :key="item.index"
            :index="item.index"
          >
            <i :class="item.icon"></i>
            <span slot="title">{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main style="background-color: #E9EEF3; padding: 0;">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { hasRoutePermission } from '@/utils/permissions'

export default {
  name: 'LayoutExample',
  data() {
    return {
      pageTitle: '首页',
      isCollapse: false
    }
  },
  computed: {
    activeMenu() {
      // 根据当前路由设置激活的菜单项
      return this.$route.name || 'workspace'
    },
    username() {
      return this.$store.getters.username || '未登录'
    },
    userRole() {
      return this.$store.getters.role || ''
    },
    // 根据权限过滤菜单项
    menuItems() {
      const allMenuItems = [
        { index: 'workspace', icon: 'el-icon-s-home', title: '工作台' },
        { index: 'knowledge-base', icon: 'el-icon-document', title: '知识库管理' },
        { index: 'rule-base', icon: 'el-icon-setting', title: '规则库管理' },
        { index: 'database', icon: 'el-icon-box', title: '数据库管理' },
        { index: 'model-base', icon: 'el-icon-cpu', title: '模型管理' },
        { index: 'task-base', icon: 'el-icon-s-order', title: '任务管理' },
        { index: 'warning-base', icon: 'el-icon-warning', title: '预警管理' },
        { index: 'data-base', icon: 'el-icon-data-analysis', title: '数据统计' },
        { index: 'log-base', icon: 'el-icon-document-copy', title: '日志管理' },
        { index: 'permission-base', icon: 'el-icon-user-solid', title: '权限管理' },
        { index: 'create-user', icon: 'el-icon-user', title: '创建用户' }
      ]
      
      // System Administrator, Medical Insurance Administrator, Medical Insurance User 可以看到所有菜单项
      // 其他角色根据权限过滤
      return allMenuItems.filter(item => {
        return hasRoutePermission(this.userRole, item.index)
      })
    }
  },
  methods: {
    handleMenuSelect(index) {
      // 根据菜单项索引跳转到对应路由
      if (this.$route.name !== index) {
        this.$router.push({ name: index }).catch(err => {
          // 忽略重复导航错误
          if (err.name !== 'NavigationDuplicated') {
            throw err
          }
        })
      }
    },
    handleUserCommand(command) {
      if (command === 'personal-info') {
        // 检查当前路由，避免重复导航
        if (this.$route.name !== 'personal-info') {
          this.$router.push({ name: 'personal-info' }).catch(err => {
            // 忽略重复导航错误
            if (err.name !== 'NavigationDuplicated') {
              throw err
            }
          })
        }
      } else if (command === 'logout') {
        this.handleLogout()
      }
    },
    handleLogout() {
      this.$confirm('确定要退出登录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.commit('clearUser')
        this.$router.push('/login')
        this.$message.success('已退出登录')
      }).catch(() => {})
    },
    toggleCollapse() {
      this.isCollapse = !this.isCollapse
    }
  }
}
</script>

<style scoped>
/* 可选：添加额外样式调整 */
.el-menu-vertical-demo {
  background-color: transparent !important;
}

.el-menu-vertical-demo .el-menu-item {
  background-color: transparent !important;
  text-align: left !important;
}

.el-menu-vertical-demo >>> .el-menu-item {
  text-align: left !important;
  justify-content: flex-start !important;
}

.el-menu-vertical-demo >>> .el-menu-item span {
  text-align: left !important;
}

/* 折叠状态下的样式调整 */
.el-menu-vertical-demo.el-menu--collapse {
  width: 64px;
}

.el-menu-vertical-demo.el-menu--collapse .el-menu-item {
  padding-left: 20px !important;
}
</style>