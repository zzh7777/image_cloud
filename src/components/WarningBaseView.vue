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
          <el-form-item label="任务编码">
            <el-input
              v-model="searchForm.taskCode"
              placeholder="请输入任务编码"
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
      <div class="table-wrapper">
        <el-table 
          :data="warningList" 
          style="width: 100%; min-width: 1400px;" 
          border
          v-loading="loading"
          element-loading-text="加载中...">
          <el-table-column prop="task_code" label="任务编码" min-width="180" align="left"></el-table-column>
          <el-table-column prop="task_name" label="任务名称" min-width="160" align="left"></el-table-column>
          <el-table-column prop="completion_time" label="任务完成时间" min-width="180" align="left">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.completion_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="total_warning_count" label="预警总条数" min-width="130" align="left"></el-table-column>
          <el-table-column prop="pending_initial_review_count" label="待初审条数" min-width="130" align="left"></el-table-column>
          <el-table-column prop="hospital_review_count" label="医院复核条数" min-width="140" align="left"></el-table-column>
          <el-table-column prop="pending_final_review_count" label="待终审条数" min-width="130" align="left"></el-table-column>
          <el-table-column prop="final_reviewed_count" label="已终审条数" min-width="130" align="left"></el-table-column>
          <el-table-column prop="confirmed_violation_count" label="明确违规条数" min-width="140" align="left"></el-table-column>
          <el-table-column prop="positive_rate" label="阳性率" min-width="120" align="left">
            <template slot-scope="scope">
              <span :style="{ color: getPositiveRateColor(scope.row.positive_rate), fontWeight: 'bold' }">
                {{ formatPositiveRate(scope.row.positive_rate) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button type="text" @click="handleView(scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

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
        <el-descriptions-item label="任务编码">{{ viewWarning.task_code }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ viewWarning.task_name }}</el-descriptions-item>
        <el-descriptions-item label="任务完成时间">{{ formatDateTime(viewWarning.completion_time) }}</el-descriptions-item>
        <el-descriptions-item label="预警总条数">{{ viewWarning.total_warning_count }}</el-descriptions-item>
        <el-descriptions-item label="待初审条数">
          <el-tag type="warning">{{ viewWarning.pending_initial_review_count }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="医院复核条数">
          <el-tag type="info">{{ viewWarning.hospital_review_count }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="待终审条数">
          <el-tag type="warning">{{ viewWarning.pending_final_review_count }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="已终审条数">
          <el-tag type="success">{{ viewWarning.final_reviewed_count }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="明确违规条数">
          <el-tag type="danger">{{ viewWarning.confirmed_violation_count }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="阳性率">
          <span :style="{ color: getPositiveRateColor(viewWarning.positive_rate), fontWeight: 'bold' }">
            {{ formatPositiveRate(viewWarning.positive_rate) }}
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 预警数据统计图表区域 -->
      <div class="chart-section">
        <h3 style="margin-top: 30px; margin-bottom: 15px;">预警数据统计</h3>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-label">待初审</div>
            <div class="stat-value warning">{{ viewWarning.pending_initial_review_count }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">医院复核</div>
            <div class="stat-value info">{{ viewWarning.hospital_review_count }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">待终审</div>
            <div class="stat-value warning">{{ viewWarning.pending_final_review_count }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">已终审</div>
            <div class="stat-value success">{{ viewWarning.final_reviewed_count }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">明确违规</div>
            <div class="stat-value danger">{{ viewWarning.confirmed_violation_count }}</div>
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
      loading: false,
      searchForm: {
        taskCode: '',
        taskName: ''
      },
      warningList: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      viewDialogVisible: false,
      viewWarning: {}
    }
  },
  mounted() {
    this.fetchSummaryList()
  },
  methods: {
    // 获取预警汇总列表
    async fetchSummaryList() {
      this.loading = true
      
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        this.loading = false
        return
      }
      
      try {
        // 构建请求参数
        const params = new URLSearchParams({
          page: this.pagination.currentPage,
          page_size: this.pagination.pageSize
        })
        
        // 添加搜索条件
        if (this.searchForm.taskCode) {
          params.append('task_code', this.searchForm.taskCode)
        }
        if (this.searchForm.taskName) {
          params.append('task_name', this.searchForm.taskName)
        }
        
        const url = `/api/v1/summaries/?${params.toString()}`
        
        let response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        // 如果是401错误，尝试刷新token（静默处理）
        if (response.status === 401) {
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router, true)
          if (!refreshSuccess) {
            // 刷新失败，已经跳转到登录页
            this.loading = false
            return
          }
          
          // 刷新成功，使用新token重试请求
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          // 如果重试后仍然是401，说明token仍然无效
          if (response.status === 401) {
            this.$store.commit('clearUser')
            this.$router.push('/login')
            this.loading = false
            return
          }
        }
        
        // 读取响应文本
        const text = await response.text()
        let data = null
        
        // 尝试解析 JSON
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('解析预警汇总列表响应失败:', e)
          if (!response.ok) {
            throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
          }
          this.loading = false
          return
        }
        
        // 检查响应码（统一响应格式中的 code 字段）
        if (data && data.code !== undefined && data.code !== 0) {
          // code 非0表示错误
          const errorMessage = data.message || `获取预警汇总列表失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        if (!response.ok) {
          let errorMessage = `获取预警汇总列表失败: ${response.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (data && data.code !== undefined && data.message) {
            errorMessage = data.message
          } else if (response.status === 401) {
            // 如果到这里还是401，说明重试后仍然失败
            this.$store.commit('clearUser')
            this.$router.push('/login')
            this.loading = false
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能访问'
          } else if (data) {
            if (data.detail) {
              errorMessage = data.detail
            } else if (data.message) {
              errorMessage = data.message
            }
          }
          
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: { count, results } }
        if (data && data.code === 0 && data.data && data.data.results) {
          this.warningList = data.data.results
          this.pagination.total = data.data.count || 0
        } else if (data && data.results) {
          // 兼容旧格式
          this.warningList = data.results
          this.pagination.total = data.count || 0
        } else {
          this.warningList = []
          this.pagination.total = 0
        }
      } catch (error) {
        console.error('获取预警汇总列表错误:', error)
        const errorMessage = error.message || '获取预警汇总列表失败，请稍后重试'
        this.$message.error(errorMessage)
      } finally {
        this.loading = false
      }
    },
    handleQuery() {
      // 重置到第一页
      this.pagination.currentPage = 1
      this.fetchSummaryList()
    },
    handleReset() {
      this.searchForm = {
        taskCode: '',
        taskName: ''
      }
      // 重置后重新加载列表
      this.pagination.currentPage = 1
      this.fetchSummaryList()
    },
    handleView(row) {
      // 跳转到预警详情列表页面
      this.$router.push({
        name: 'warning-detail',
        query: {
          taskId: row.task || row.id,
          taskCode: row.task_code,
          taskName: row.task_name
        }
      })
    },
    handleExport() {
      this.$message.success('数据导出功能开发中...')
      // TODO: 实现导出功能
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1
      this.fetchSummaryList()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchSummaryList()
    },
    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      try {
        const date = new Date(dateTime)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      } catch (e) {
        return dateTime
      }
    },
    // 格式化阳性率（从小数转为百分比）
    formatPositiveRate(rate) {
      if (rate === null || rate === undefined || rate === '') return '0.00%'
      const value = parseFloat(rate)
      if (isNaN(value)) return '0.00%'
      return `${(value * 100).toFixed(2)}%`
    },
    // 获取阳性率颜色
    getPositiveRateColor(rate) {
      if (rate === null || rate === undefined || rate === '') return '#909399'
      const value = parseFloat(rate) * 100 // 转换为百分比
      if (isNaN(value) || value === 0) {
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
  background-color: #fff;
}

.table-wrapper {
  overflow-x: auto;
  padding: 20px;
}

.pagination-section {
  margin-top: 20px;
  padding: 0 20px 20px;
  display: flex;
  justify-content: flex-end;
}

/* 表格样式优化 */
.table-wrapper .el-table th {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: 600;
}

.table-wrapper .el-table td,
.table-wrapper .el-table th {
  padding: 12px 0;
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