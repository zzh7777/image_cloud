<template>
  <div class="warning-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">预警管理</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="action-section">
      <!-- 搜索表单 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="任务ID">
            <el-input
              v-model="searchForm.taskId"
              placeholder="请输入任务ID"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="任务名称">
            <el-input
              v-model="searchForm.taskName"
              placeholder="请输入任务名称"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 预警列表表格 -->
    <div class="table-section">
      <el-table :data="warningList" style="width: 100%" border>
        <el-table-column prop="taskId" label="任务ID" width="160"></el-table-column>
        <el-table-column prop="taskName" label="任务名称" width="140"></el-table-column>
        <el-table-column prop="completeTime" label="任务完成时间" width="160"></el-table-column>
        <el-table-column prop="totalCount" label="预警总条数" width="110" align="center"></el-table-column>
        <el-table-column prop="pendingFirstReview" label="待初审条数" width="110" align="center"></el-table-column>
        <el-table-column prop="hospitalReview" label="医院复核条数" width="120" align="center"></el-table-column>
        <el-table-column prop="pendingFinalReview" label="待终审条数" width="110" align="center"></el-table-column>
        <el-table-column prop="finalReviewed" label="已终审条数" width="110" align="center"></el-table-column>
        <el-table-column prop="confirmedViolation" label="明确违规条数" width="120" align="center"></el-table-column>
        <el-table-column prop="positiveRate" label="阳性率" width="100" align="center">
          <template slot-scope="scope">
            <span :style="{ color: getPositiveRateColor(scope.row.positiveRate) }">
              {{ scope.row.positiveRate }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" @click="handleView(scope.row)">查看</el-button>
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

    <!-- 查看预警详情对话框 -->
    <el-dialog
      title="预警详情"
      :visible.sync="viewDialogVisible"
      width="900px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务ID">{{ viewWarning.taskId }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ viewWarning.taskName }}</el-descriptions-item>
        <el-descriptions-item label="任务完成时间">{{ viewWarning.completeTime }}</el-descriptions-item>
        <el-descriptions-item label="预警总条数">{{ viewWarning.totalCount }}</el-descriptions-item>
        <el-descriptions-item label="待初审条数">
          <el-tag type="warning">{{ viewWarning.pendingFirstReview }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="医院复核条数">
          <el-tag type="info">{{ viewWarning.hospitalReview }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="待终审条数">
          <el-tag type="warning">{{ viewWarning.pendingFinalReview }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="已终审条数">
          <el-tag type="success">{{ viewWarning.finalReviewed }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="明确违规条数">
          <el-tag type="danger">{{ viewWarning.confirmedViolation }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="阳性率">
          <span :style="{ color: getPositiveRateColor(viewWarning.positiveRate), fontWeight: 'bold' }">
            {{ viewWarning.positiveRate }}
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 预警数据统计图表区域 -->
      <div class="chart-section">
        <h3 style="margin-top: 30px; margin-bottom: 15px;">预警数据统计</h3>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-label">待初审</div>
            <div class="stat-value warning">{{ viewWarning.pendingFirstReview }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">医院复核</div>
            <div class="stat-value info">{{ viewWarning.hospitalReview }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">待终审</div>
            <div class="stat-value warning">{{ viewWarning.pendingFinalReview }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">已终审</div>
            <div class="stat-value success">{{ viewWarning.finalReviewed }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">明确违规</div>
            <div class="stat-value danger">{{ viewWarning.confirmedViolation }}</div>
          </div>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="viewDialogVisible = false">关 闭</el-button>
        <el-button type="primary" @click="handleExport">导出数据</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'WarningBaseView',
  data() {
    return {
      searchForm: {
        taskId: '',
        taskName: ''
      },
      warningList: [
        {
          taskId: 'JG0000000000014',
          taskName: '虚假检查监测',
          completeTime: '20250516 14:23:26',
          totalCount: 200,
          pendingFirstReview: 100,
          hospitalReview: 0,
          pendingFinalReview: 50,
          finalReviewed: 50,
          confirmedViolation: 12,
          positiveRate: '6.00%'
        },
        {
          taskId: 'JG0000000000015',
          taskName: '虚假检查监测',
          completeTime: '20250514 14:23:26',
          totalCount: 5,
          pendingFirstReview: 2,
          hospitalReview: 0,
          pendingFinalReview: 2,
          finalReviewed: 1,
          confirmedViolation: 0,
          positiveRate: '0.00%'
        },
        {
          taskId: 'JG0000000000011',
          taskName: '虚假检查监测',
          completeTime: '20250513 14:23:26',
          totalCount: 100,
          pendingFirstReview: 50,
          hospitalReview: 0,
          pendingFinalReview: 25,
          finalReviewed: 25,
          confirmedViolation: 20,
          positiveRate: '20.00%'
        },
        {
          taskId: 'JG0000000000010',
          taskName: '虚假检查监测',
          completeTime: '20250512 14:23:26',
          totalCount: 100,
          pendingFirstReview: 0,
          hospitalReview: 0,
          pendingFinalReview: 0,
          finalReviewed: 100,
          confirmedViolation: 20,
          positiveRate: '20.00%'
        },
        {
          taskId: 'JG0000000000012',
          taskName: '重复检查监测',
          completeTime: '20250511 14:23:26',
          totalCount: 50,
          pendingFirstReview: 25,
          hospitalReview: 0,
          pendingFinalReview: 15,
          finalReviewed: 10,
          confirmedViolation: 8,
          positiveRate: '16.00%'
        }
      ],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 5
      },
      viewDialogVisible: false,
      viewWarning: {}
    }
  },
  methods: {
    handleQuery() {
      console.log('查询', this.searchForm)
      // TODO: 实现查询逻辑，调用后端API
    },
    handleReset() {
      this.searchForm = {
        taskId: '',
        taskName: ''
      }
      // 重置后重新加载列表
      this.handleQuery()
    },
    handleView(row) {
      this.viewWarning = { ...row }
      this.viewDialogVisible = true
    },
    handleExport() {
      this.$message.success('数据导出功能开发中...')
      // TODO: 实现导出功能
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.handleQuery()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.handleQuery()
    },
    getPositiveRateColor(rate) {
      const value = parseFloat(rate)
      if (value === 0) {
        return '#909399'
      } else if (value < 10) {
        return '#67C23A'
      } else if (value < 20) {
        return '#E6A23C'
      } else {
        return '#F56C6C'
      }
    }
  }
}
</script>

<style scoped>
.warning-base {
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

.chart-section {
  margin-top: 20px;
}

.stats-cards {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 120px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e4e7ed;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-value.warning {
  color: #E6A23C;
}

.stat-value.info {
  color: #909399;
}

.stat-value.success {
  color: #67C23A;
}

.stat-value.danger {
  color: #F56C6C;
}
</style>