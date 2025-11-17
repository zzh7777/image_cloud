<template>
  <!-- 主容器：垂直排列 header 和内容区 -->
  <el-container style="min-height: 100vh; border: 1px solid #eee;">
    <!-- 头部区域 -->
    <el-header style="background-color: #B3C0D1; text-align: center; line-height: 60px;">
      <h1 style="margin: 0; color: #333;">影像监管AI</h1>
    </el-header>

    <!-- 内容区容器：水平排列 aside 和 main -->
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" style="background-color: #D3DCE6; padding: 20px;">
        <h2 style="margin-top: 0;">工作台</h2>
        <!-- 可添加侧边栏菜单示例 -->
        <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" @select="handleMenuSelect">
          <el-menu-item index="knowledge-base">知识库管理</el-menu-item>
          <el-menu-item index="rule-base">规则库管理</el-menu-item>
          <el-menu-item index="model-base">模型管理</el-menu-item>
          <el-menu-item index="task-base">任务管理</el-menu-item>
          <el-menu-item index="warning-base">预警管理</el-menu-item>
          <el-menu-item index="data-base">数据统计</el-menu-item>
          <el-menu-item index="log-base">日志管理</el-menu-item>
          <el-menu-item index="permission-base">权限管理</el-menu-item>
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
      pageTitle: '首页'
    }
  },
  computed: {
    activeMenu() {
      // 根据当前路由设置激活的菜单项
      const routeName = this.$route.name
      if (routeName === 'knowledge-base') {
        return 'knowledge-base'
      }
      return '1'
    }
  },
  methods: {
    handleMenuSelect(index) {
      // 根据菜单项索引跳转到对应路由
      if (index === 'knowledge-base') {
        // 检查是否已经在目标路由，避免重复导航
        if (this.$route.name !== 'knowledge-base') {
          this.$router.push({ name: 'knowledge-base' }).catch(err => {
            // 忽略重复导航错误
            if (err.name !== 'NavigationDuplicated') {
              throw err
            }
          })
        }
      }
      if (index === 'rule-base') {
        // 检查是否已经在目标路由，避免重复导航
        if (this.$route.name !== 'rule-base') {
          this.$router.push({ name: 'rule-base' }).catch(err => {
            // 忽略重复导航错误
            if (err.name !== 'NavigationDuplicated') {
              throw err
            }
          })
        }
      }
      if (index === 'model-base') {
        // 检查是否已经在目标路由，避免重复导航
        if (this.$route.name !== 'model-base') {
          this.$router.push({ name: 'model-base' }).catch(err => {
            // 忽略重复导航错误
            if (err.name !== 'NavigationDuplicated') {
              throw err
            }
          })
        }
      }
      if (index === 'task-base') {
        // 检查是否已经在目标路由，避免重复导航
        if (this.$route.name !== 'task-base') {
          this.$router.push({ name: 'task-base' }).catch(err => {
            // 忽略重复导航错误
            if (err.name !== 'NavigationDuplicated') {
              throw err
            }
          })
        }
      }
      if (index === 'warning-base') {
        // 检查是否已经在目标路由，避免重复导航
        if (this.$route.name !== 'warning-base') {
          this.$router.push({ name: 'warning-base' }).catch(err => {
            // 忽略重复导航错误
            if (err.name !== 'NavigationDuplicated') {
              throw err
            }
          })
        }
      }
      if (index === 'data-base') {
        // 检查是否已经在目标路由，避免重复导航
        if (this.$route.name !== 'data-base') {
          this.$router.push({ name: 'data-base' }).catch(err => {
            // 忽略重复导航错误
            if (err.name !== 'NavigationDuplicated') {
              throw err
            }
          })
        }
      }
      if (index === 'log-base') {
        // 检查是否已经在目标路由，避免重复导航
        if (this.$route.name !== 'log-base') {
          this.$router.push({ name: 'log-base' }).catch(err => {
            // 忽略重复导航错误
            if (err.name !== 'NavigationDuplicated') {
              throw err
            }
          })
        }
      }
      if (index === 'permission-base') {
        // 检查是否已经在目标路由，避免重复导航
        if (this.$route.name !== 'permission-base') {
          this.$router.push({ name: 'permission-base' }).catch(err => {
            // 忽略重复导航错误
            if (err.name !== 'NavigationDuplicated') {
              throw err
            }
          })
        }
      }
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
}

.el-menu-vertical-demo .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.el-menu-vertical-demo .el-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.2) !important;
}
</style>