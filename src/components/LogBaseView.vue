<template>
  <div class="log-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">日志分析</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="action-section">
      <!-- 搜索表单 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="操作者">
            <el-input
              v-model="searchForm.operator"
              placeholder="请输入操作者"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="行为">
            <el-select v-model="searchForm.action" placeholder="请选择行为" clearable>
              <el-option label="全部" value=""></el-option>
              <el-option label="新增规则" value="新增规则"></el-option>
              <el-option label="编辑规则" value="编辑规则"></el-option>
              <el-option label="删除规则" value="删除规则"></el-option>
              <el-option label="启用规则" value="启用规则"></el-option>
              <el-option label="停用规则" value="停用规则"></el-option>
              <el-option label="创建任务" value="创建任务"></el-option>
              <el-option label="启动任务" value="启动任务"></el-option>
              <el-option label="停止任务" value="停止任务"></el-option>
              <el-option label="删除任务" value="删除任务"></el-option>
              <el-option label="登录系统" value="登录系统"></el-option>
              <el-option label="登出系统" value="登出系统"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="结果">
            <el-select v-model="searchForm.result" placeholder="请选择结果" clearable>
              <el-option label="全部" value=""></el-option>
              <el-option label="成功" value="成功"></el-option>
              <el-option label="失败" value="失败"></el-option>
              <el-option label="取消" value="取消"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="searchForm.timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="yyyy-MM-dd HH:mm:ss"
            >
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 日志列表表格 -->
    <div class="table-section">
      <el-table :data="logList" style="width: 100%" border stripe>
        <el-table-column prop="time" label="时间" min-width="180"></el-table-column>
        <el-table-column prop="operator" label="操作者" min-width="120"></el-table-column>
        <el-table-column prop="action" label="行为" min-width="150"></el-table-column>
        <el-table-column label="结果" min-width="100" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="getResultType(scope.row.result)"
              size="small"
            >
              {{ scope.row.result }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" min-width="140"></el-table-column>
        <el-table-column prop="module" label="模块" min-width="120"></el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleView(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total">
        </el-pagination>
      </div>
    </div>

    <!-- 查看日志详情对话框 -->
    <el-dialog
      title="日志详情"
      :visible.sync="viewDialogVisible"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="时间">{{ viewLog.time }}</el-descriptions-item>
        <el-descriptions-item label="操作者">{{ viewLog.operator }}</el-descriptions-item>
        <el-descriptions-item label="行为">{{ viewLog.action }}</el-descriptions-item>
        <el-descriptions-item label="结果">
          <el-tag
            :type="getResultType(viewLog.result)"
            size="small"
          >
            {{ viewLog.result }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ viewLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ viewLog.module }}</el-descriptions-item>
        <el-descriptions-item label="详细描述" :span="2">
          {{ viewLog.description || '无详细描述' }}
        </el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="viewDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'LogBaseView',
  data() {
    return {
      searchForm: {
        operator: '',
        action: '',
        result: '',
        timeRange: []
      },
      logList: [
        {
          time: '2025-11-10 12:38:00',
          operator: '张三',
          action: '新增规则',
          result: '成功',
          ip: '192.168.1.100',
          module: '规则库管理',
          description: '新增规则：影像检查串换项目次数'
        },
        {
          time: '2025-11-10 11:38:00',
          operator: '张三',
          action: '新增规则',
          result: '取消',
          ip: '192.168.1.100',
          module: '规则库管理',
          description: '取消新增规则操作'
        },
        {
          time: '2025-11-10 10:25:00',
          operator: '李四',
          action: '启动任务',
          result: '成功',
          ip: '192.168.1.105',
          module: '任务管理',
          description: '启动任务：虚假检查监测'
        },
        {
          time: '2025-11-10 09:15:00',
          operator: '王五',
          action: '编辑规则',
          result: '成功',
          ip: '192.168.1.110',
          module: '规则库管理',
          description: '编辑规则：患者重复检查次数'
        },
        {
          time: '2025-11-10 08:45:00',
          operator: '赵六',
          action: '停止任务',
          result: '成功',
          ip: '192.168.1.115',
          module: '任务管理',
          description: '停止任务：重复检查监测'
        },
        {
          time: '2025-11-09 18:30:00',
          operator: '张三',
          action: '删除规则',
          result: '失败',
          ip: '192.168.1.100',
          module: '规则库管理',
          description: '删除规则失败：规则正在被任务使用'
        },
        {
          time: '2025-11-09 16:20:00',
          operator: '李四',
          action: '创建任务',
          result: '成功',
          ip: '192.168.1.105',
          module: '任务管理',
          description: '创建任务：图像白片监测'
        },
        {
          time: '2025-11-09 14:10:00',
          operator: '王五',
          action: '启用规则',
          result: '成功',
          ip: '192.168.1.110',
          module: '规则库管理',
          description: '启用规则：影像DICOM文件重复次数'
        },
        {
          time: '2025-11-09 10:00:00',
          operator: '张三',
          action: '登录系统',
          result: '成功',
          ip: '192.168.1.100',
          module: '系统管理',
          description: '用户登录系统'
        },
        {
          time: '2025-11-09 09:55:00',
          operator: '李四',
          action: '登录系统',
          result: '失败',
          ip: '192.168.1.105',
          module: '系统管理',
          description: '登录失败：密码错误'
        }
      ],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 10
      },
      viewDialogVisible: false,
      viewLog: {}
    }
  },
  methods: {
    handleQuery() {
      console.log('查询', this.searchForm)
      // TODO: 实现查询逻辑，调用后端API
    },
    handleReset() {
      this.searchForm = {
        operator: '',
        action: '',
        result: '',
        timeRange: []
      }
      // 重置后重新加载列表
      this.handleQuery()
    },
    handleView(row) {
      this.viewLog = { ...row }
      this.viewDialogVisible = true
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.handleQuery()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.handleQuery()
    },
    getResultType(result) {
      const typeMap = {
        '成功': 'success',
        '失败': 'danger',
        '取消': 'info'
      }
      return typeMap[result] || 'info'
    }
  }
}
</script>

<style scoped>
.log-base {
  padding: 20px;
  background-color: #fff;
  min-height: 100%;
}

.title-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.title-bar {
  width: 4px;
  height: 20px;
  background-color: #409EFF;
  margin-right: 10px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #303133;
}

.action-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.search-form {
  flex: 1;
}

.table-section {
  margin-top: 20px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>