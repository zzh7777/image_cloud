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
        <h2 style="margin-top: 0;">菜单</h2>
        <!-- 可添加侧边栏菜单示例 -->
        <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" @select="handleMenuSelect">
          <el-menu-item index="workspace">工作台</el-menu-item>
          <el-menu-item index="knowledge-base">知识库管理</el-menu-item>
          <el-menu-item index="rule-base">规则库管理</el-menu-item>
          <el-menu-item index="database">数据库管理</el-menu-item>
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
      return this.$route.name || 'workspace'
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