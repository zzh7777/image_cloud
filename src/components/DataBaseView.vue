<template>
  <div class="data-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">数据统计</h2>
    </div>

    <!-- 数据汇总卡片 -->
    <div class="summary-section">
      <h3 class="section-title">数据汇总</h3>
      <div class="summary-cards">
        <div class="summary-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="card-icon">
            <i class="el-icon-warning"></i>
          </div>
          <div class="card-content">
            <div class="card-label">预警总数</div>
            <div class="card-value">{{ summaryData.totalWarnings }}</div>
          </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div class="card-icon">
            <i class="el-icon-close"></i>
          </div>
          <div class="card-content">
            <div class="card-label">违规总数</div>
            <div class="card-value">{{ summaryData.totalViolations }}</div>
          </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <div class="card-icon">
            <i class="el-icon-check"></i>
          </div>
          <div class="card-content">
            <div class="card-label">无违规总数</div>
            <div class="card-value">{{ summaryData.totalNoViolations }}</div>
          </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <div class="card-icon">
            <i class="el-icon-data-analysis"></i>
          </div>
          <div class="card-content">
            <div class="card-label">平均阳性率</div>
            <div class="card-value">{{ summaryData.avgPositiveRate }}</div>
          </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
          <div class="card-icon">
            <i class="el-icon-user"></i>
          </div>
          <div class="card-content">
            <div class="card-label">患者总数</div>
            <div class="card-value">{{ summaryData.totalPatients }}</div>
          </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
          <div class="card-icon">
            <i class="el-icon-office-building"></i>
          </div>
          <div class="card-content">
            <div class="card-label">科室总数</div>
            <div class="card-value">{{ summaryData.totalDepartments }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索表单 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="任务名称">
        <el-input v-model="searchForm.taskName" placeholder="请输入任务名称" clearable @keyup.enter.native="handleQuery"></el-input>
      </el-form-item>
      <el-form-item label="医院名称">
        <el-input v-model="searchForm.hospitalName" placeholder="请输入医院名称" clearable @keyup.enter.native="handleQuery"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery" :loading="loading">查询</el-button>
        <el-button icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table :data="tableData" style="width: 100%; min-width: 1200px;" border v-loading="loading">
        <el-table-column prop="taskName" label="任务名称" min-width="180"></el-table-column>
        <el-table-column prop="hospitalName" label="医院名称" min-width="150"></el-table-column>
        <el-table-column prop="totalWarnings" label="预警总数" min-width="120" align="center"></el-table-column>
        <el-table-column prop="violations" label="明确违规" min-width="120" align="center">
          <template slot-scope="scope">
            <span style="color: #F56C6C; font-weight: bold;">{{ scope.row.violations }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="noViolations" label="无违规" min-width="100" align="center">
          <template slot-scope="scope">
            <span style="color: #67C23A; font-weight: bold;">{{ scope.row.noViolations }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="positiveRate" label="阳性率" min-width="100" align="center">
          <template slot-scope="scope">
            <span :style="{ color: getPositiveRateColor(scope.row.positiveRate), fontWeight: 'bold' }">
              {{ formatPositiveRate(scope.row.positiveRate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="patientCount" label="患者数" min-width="100" align="center"></el-table-column>
        <el-table-column prop="departmentCount" label="科室数" min-width="100" align="center"></el-table-column>
        <el-table-column prop="taskCompletionTime" label="任务完成时间" min-width="180" align="center">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.taskCompletionTime) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pagination.currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pagination.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      class="pagination">
    </el-pagination>
  </div>
</template>

<script>
import { fetchWithAuth } from '@/utils/api'

export default {
  name: 'DataBaseView',
  data() {
    return {
      loading: false,
      searchForm: {
        taskName: '',
        hospitalName: ''
      },
      summaryData: {
        totalWarnings: 0,
        totalViolations: 0,
        totalNoViolations: 0,
        avgPositiveRate: '0.00%',
        totalPatients: 0,
        totalDepartments: 0
      },
      tableData: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  mounted() {
    this.fetchStatisticsList()
  },
  methods: {
    /**
     * 获取统计数据列表
     */
    async fetchStatisticsList() {
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
        
        // 添加搜索条件（根据接口文档，支持模糊匹配）
        if (this.searchForm.taskName && this.searchForm.taskName.trim()) {
          params.append('task_name', this.searchForm.taskName.trim())
        }
        if (this.searchForm.hospitalName && this.searchForm.hospitalName.trim()) {
          params.append('hospital_name', this.searchForm.hospitalName.trim())
        }
        
        const url = `/api/v1/statistics/?${params.toString()}`
        console.log('请求统计数据列表，URL:', url)
        console.log('搜索条件:', {
          taskName: this.searchForm.taskName,
          hospitalName: this.searchForm.hospitalName
        })
        
        const response = await fetchWithAuth(
          url,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          },
          this.$store,
          this.$router
        )
        
        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = `获取统计数据失败: ${response.status} ${response.statusText}`
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            // 如果响应不是JSON，使用默认错误消息
          }
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        
        // 检查响应码（统一响应格式中的 code 字段）
        if (data && data.code !== undefined && data.code !== 0) {
          // code 非0表示错误
          const errorMessage = data.message || `获取统计数据失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: { count, results } }
        if (data && data.code === 0 && data.data && data.data.results) {
          // 映射后端数据到前端显示格式
          this.tableData = data.data.results.map(item => ({
            id: item.id,
            task: item.task,
            hospital: item.hospital,
            taskName: item.task_name || '',
            hospitalName: item.hospital_name || '',
            totalWarnings: item.total_warning_count || 0,
            violations: item.confirmed_violation_count || 0,
            noViolations: item.no_violation_count || 0,
            positiveRate: item.positive_rate || '0.0000',
            patientCount: item.patient_count || 0,
            departmentCount: item.department_count || 0,
            taskCompletionTime: item.task_completion_time || '',
            updatedAt: item.updated_at || ''
          }))
          
          // 更新分页信息
          this.pagination.total = data.data.count || 0
          
          // 计算汇总数据（从当前页数据计算，如果需要全局汇总可能需要单独接口）
          this.calculateSummaryData()
          
          console.log('统计数据列表加载成功，共', data.data.count, '条记录，当前页', this.tableData.length, '条')
        } else if (data && data.results) {
          // 兼容旧格式（没有 code 字段的情况）
          this.tableData = data.results.map(item => ({
            id: item.id,
            task: item.task,
            hospital: item.hospital,
            taskName: item.task_name || '',
            hospitalName: item.hospital_name || '',
            totalWarnings: item.total_warning_count || 0,
            violations: item.confirmed_violation_count || 0,
            noViolations: item.no_violation_count || 0,
            positiveRate: item.positive_rate || '0.0000',
            patientCount: item.patient_count || 0,
            departmentCount: item.department_count || 0,
            taskCompletionTime: item.task_completion_time || '',
            updatedAt: item.updated_at || ''
          }))
          this.pagination.total = data.count || 0
          this.calculateSummaryData()
        } else {
          this.tableData = []
          this.pagination.total = 0
          this.summaryData = {
            totalWarnings: 0,
            totalViolations: 0,
            totalNoViolations: 0,
            avgPositiveRate: '0.00%',
            totalPatients: 0,
            totalDepartments: 0
          }
        }
      } catch (error) {
        console.error('获取统计数据列表错误:', error)
        this.$message.error(error.message || '获取统计数据失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 计算汇总数据（从当前列表数据计算）
     * 注意：如果需要全局汇总，可能需要调用单独的汇总接口
     */
    calculateSummaryData() {
      if (this.tableData.length === 0) {
        this.summaryData = {
          totalWarnings: 0,
          totalViolations: 0,
          totalNoViolations: 0,
          avgPositiveRate: '0.00%',
          totalPatients: 0,
          totalDepartments: 0
        }
        return
      }
      
      // 计算总和
      const totals = this.tableData.reduce((acc, item) => {
        acc.totalWarnings += item.totalWarnings || 0
        acc.totalViolations += item.violations || 0
        acc.totalNoViolations += item.noViolations || 0
        acc.totalPatients += item.patientCount || 0
        acc.totalDepartments += item.departmentCount || 0
        return acc
      }, {
        totalWarnings: 0,
        totalViolations: 0,
        totalNoViolations: 0,
        totalPatients: 0,
        totalDepartments: 0
      })
      
      // 计算平均阳性率
      const totalPositiveRate = this.tableData.reduce((sum, item) => {
        const rate = parseFloat(item.positiveRate) || 0
        return sum + rate
      }, 0)
      const avgPositiveRate = this.tableData.length > 0 
        ? (totalPositiveRate / this.tableData.length).toFixed(2) 
        : 0
      
      this.summaryData = {
        totalWarnings: totals.totalWarnings,
        totalViolations: totals.totalViolations,
        totalNoViolations: totals.totalNoViolations,
        avgPositiveRate: `${avgPositiveRate}%`,
        totalPatients: totals.totalPatients,
        totalDepartments: totals.totalDepartments
      }
    },
    
    /**
     * 查询按钮点击事件
     */
    handleQuery() {
      this.pagination.currentPage = 1 // 重置到第一页
      this.fetchStatisticsList()
    },
    
    /**
     * 重置按钮点击事件
     */
    handleReset() {
      this.searchForm = {
        taskName: '',
        hospitalName: ''
      }
      this.pagination.currentPage = 1
      this.fetchStatisticsList()
    },
    
    /**
     * 分页大小改变
     */
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1
      this.fetchStatisticsList()
    },
    
    /**
     * 当前页改变
     */
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchStatisticsList()
    },
    
    /**
     * 格式化阳性率显示（后端返回的是字符串，如 "0.0500"）
     */
    formatPositiveRate(rate) {
      if (!rate) return '0.00%'
      const value = parseFloat(rate)
      if (isNaN(value)) return '0.00%'
      return `${(value * 100).toFixed(2)}%`
    },
    
    /**
     * 根据阳性率值返回颜色
     */
    getPositiveRateColor(rate) {
      const value = parseFloat(rate) * 100 // 转换为百分比
      if (isNaN(value) || value === 0) {
        return '#909399'
      } else if (value < 1) {
        return '#67C23A'
      } else if (value < 5) {
        return '#409EFF'
      } else if (value < 10) {
        return '#E6A23C'
      } else {
        return '#F56C6C'
      }
    },
    
    /**
     * 格式化日期时间
     */
    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return '-'
      try {
        const date = new Date(dateTimeStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      } catch (error) {
        console.error('日期格式化错误:', error)
        return dateTimeStr
      }
    }
  }
}
</script>

<style scoped>
.data-base {
  padding: 20px;
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

.search-form {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 0;
  margin-top: 0;
}

/* 数据汇总区域 */
.summary-section {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.summary-card {
  padding: 20px;
  border-radius: 12px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.card-icon {
  font-size: 36px;
  opacity: 0.9;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
}

/* 表格区域 */
.table-wrapper {
  overflow-x: auto;
  background-color: #fff;
  padding: 10px;
  border-radius: 8px;
  margin-top: 5px;
  margin-bottom: 5px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.table-wrapper .el-table {
  min-width: 1200px;
}

.table-wrapper .el-table th {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: 600;
}

.table-wrapper .el-table td,
.table-wrapper .el-table th {
  padding: 12px 0;
  font-size: 14px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
