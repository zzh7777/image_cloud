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
        <!-- 可添加侧边栏菜单示例 -->
        <el-menu 
          :default-active="activeMenu" 
          class="el-menu-vertical-demo" 
          :collapse="isCollapse"
          @select="handleMenuSelect"
        >
          <el-menu-item index="workspace">
            <i class="el-icon-s-home"></i>
            <span slot="title">工作台</span>
          </el-menu-item>
          <el-menu-item index="knowledge-base">
            <i class="el-icon-document"></i>
            <span slot="title">知识库管理</span>
          </el-menu-item>
          <el-menu-item index="rule-base">
            <i class="el-icon-setting"></i>
            <span slot="title">规则库管理</span>
          </el-menu-item>
          <el-menu-item index="database">
            <i class="el-icon-box"></i>
            <span slot="title">数据库管理</span>
          </el-menu-item>
          <el-menu-item index="model-base">
            <i class="el-icon-cpu"></i>
            <span slot="title">模型管理</span>
          </el-menu-item>
          <el-menu-item index="task-base">
            <i class="el-icon-s-order"></i>
            <span slot="title">任务管理</span>
          </el-menu-item>
          <el-menu-item index="warning-base">
            <i class="el-icon-warning"></i>
            <span slot="title">预警管理</span>
          </el-menu-item>
          <el-menu-item index="data-base">
            <i class="el-icon-data-analysis"></i>
            <span slot="title">数据统计</span>
          </el-menu-item>
          <el-menu-item index="log-base">
            <i class="el-icon-document-copy"></i>
            <span slot="title">日志管理</span>
          </el-menu-item>
          <el-menu-item index="permission-base">
            <i class="el-icon-user-solid"></i>
            <span slot="title">权限管理</span>
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