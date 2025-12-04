<template>
  <div class="warning-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">预警管理</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="action-section">
      <!-- 搜索表单 - 医保管理员显示任务搜索 -->
      <div v-if="!isHospitalUser" class="search-form">
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
      <!-- 搜索表单 - 医院人员显示患者搜索 -->
      <div v-else class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="患者姓名">
            <el-input
              v-model="searchForm.patientName"
              placeholder="请输入患者姓名"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="患者身份证号码">
            <el-input
              v-model="searchForm.patientIdNumber"
              placeholder="请输入患者身份证号码"
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
        <!-- 医保管理员：预警汇总表 -->
        <el-table 
          v-if="!isHospitalUser"
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
        
        <!-- 医院人员：待审核预警列表 -->
        <el-table 
          v-else
          :data="warningList" 
          style="width: 100%;" 
          border
          v-loading="loading"
          element-loading-text="加载中...">
          <el-table-column prop="hospital_name" label="医疗机构名称" min-width="180" align="left">
            <template slot-scope="scope">
              {{ scope.row.treatment_info?.hospital_name || scope.row.warning_info?.supplementary_info?.hospital_name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="patient_name" label="患者名称" min-width="120" align="left">
            <template slot-scope="scope">
              {{ scope.row.patient_name || scope.row.treatment_info?.patient_name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="patient_id_number" label="患者身份证号码" min-width="180" align="left">
            <template slot-scope="scope">
              {{ scope.row.patient_id_number || scope.row.treatment_info?.patient_id_number || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="visit_type" label="就诊类别" min-width="120" align="left">
            <template slot-scope="scope">
              {{ formatVisitType(scope.row.visit_type || scope.row.treatment_info?.visit_type) }}
            </template>
          </el-table-column>
          <el-table-column prop="visit_department" label="就诊科室" min-width="150" align="left">
            <template slot-scope="scope">
              {{ scope.row.visit_department || scope.row.treatment_info?.visit_department || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="warning_reason" label="预警原因" min-width="200" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ scope.row.warning_reason || scope.row.warning_info?.warning_reason || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="review_status" label="审核状态" width="130" align="center">
            <template slot-scope="scope">
              <el-tag 
                :type="getReviewStatusType(scope.row.review_status)" 
                :style="getReviewStatusStyle(scope.row.review_status)"
                size="small">
                {{ formatReviewStatus(scope.row.review_status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="final_result" label="终审结果" width="130" align="center">
            <template slot-scope="scope">
              <el-tag
                v-if="getFinalResult(scope.row)"
                :type="getFinalResultType(scope.row)"
                size="small"
              >
                {{ formatFinalResult(getFinalResult(scope.row)) }}
              </el-tag>
              <span v-else style="color: #909399;">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button type="text" @click="handleViewDetail(scope.row)">查看</el-button>
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
        taskName: '',
        patientName: '',
        patientIdNumber: ''
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
  computed: {
    // 判断是否是医院人员（管理员或普通用户）
    isHospitalUser() {
      const role = this.$store.getters.role
      return role === 'Hospital Administrator' || role === 'Hospital User'
    }
  },
  mounted() {
    // 根据用户角色加载不同的数据
    if (this.isHospitalUser) {
      this.fetchHospitalAlertList()
    } else {
      this.fetchSummaryList()
    }
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
        
        // 优先检查统一响应格式（如果有 code 字段）
        if (data && data.code !== undefined) {
          if (data.code !== 0) {
            // code 非0表示错误
            const errorMessage = data.message || `获取预警汇总列表失败: code ${data.code}`
            throw new Error(errorMessage)
          }
          // code === 0 表示成功，继续处理
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
            // 使用统一响应格式的错误信息
            if (data && data.code !== undefined && data.message) {
              errorMessage = data.message
            } else {
              errorMessage = '权限不足，无法访问预警汇总列表'
            }
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
      if (this.isHospitalUser) {
        this.fetchHospitalAlertList()
      } else {
        this.fetchSummaryList()
      }
    },
    handleReset() {
      if (this.isHospitalUser) {
        this.searchForm = {
          taskCode: '',
          taskName: '',
          patientName: '',
          patientIdNumber: ''
        }
      } else {
        this.searchForm = {
          taskCode: '',
          taskName: '',
          patientName: '',
          patientIdNumber: ''
        }
      }
      // 重置后重新加载列表
      this.pagination.currentPage = 1
      if (this.isHospitalUser) {
        this.fetchHospitalAlertList()
      } else {
        this.fetchSummaryList()
      }
    },
    handleView(row) {
      // 医保管理员：跳转到预警详情列表页面
      this.$router.push({
        name: 'warning-detail',
        query: {
          taskId: row.task || row.id,
          taskCode: row.task_code,
          taskName: row.task_name
        }
      })
    },
    handleViewDetail(row) {
      // 医院人员：跳转到预警记录详情页面
      this.$router.push({
        name: 'warning-record',
        query: {
          id: row.id
        }
      })
    },
    handleExport() {
      this.$message.success('数据导出功能开发中...')
      // TODO: 实现导出功能
    },
    // 获取医院待审核预警列表
    async fetchHospitalAlertList() {
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
        
        // 添加搜索条件（如果有）
        if (this.searchForm.patientName) {
          params.append('patient_name', this.searchForm.patientName)
        }
        if (this.searchForm.patientIdNumber) {
          params.append('patient_id_number', this.searchForm.patientIdNumber)
        }
        
        const url = `/api/v1/hospital/alerts/?${params.toString()}`
        
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
            this.loading = false
            return
          }
          
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
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
        
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('解析医院待审核预警列表响应失败:', e)
          if (!response.ok) {
            throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
          }
          this.loading = false
          return
        }
        
        // 优先检查统一响应格式（如果有 code 字段）
        if (data && data.code !== undefined) {
          if (data.code !== 0) {
            const errorMessage = data.message || `获取待审核预警列表失败: code ${data.code}`
            throw new Error(errorMessage)
          }
        }
        
        if (!response.ok) {
          let errorMessage = `获取待审核预警列表失败: ${response.status}`
          
          if (data && data.code !== undefined && data.message) {
            errorMessage = data.message
          } else if (response.status === 401) {
            this.$store.commit('clearUser')
            this.$router.push('/login')
            this.loading = false
            return
          } else if (response.status === 403) {
            if (data && data.code !== undefined && data.message) {
              errorMessage = data.message
            } else {
              errorMessage = '权限不足，无法访问待审核预警列表'
            }
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
        let results = []
        if (data && data.code === 0 && data.data && data.data.results) {
          results = data.data.results
          this.pagination.total = data.data.count || 0
        } else if (data && data.results) {
          // 兼容旧格式
          results = data.results
          this.pagination.total = data.count || 0
        } else {
          this.warningList = []
          this.pagination.total = 0
          return
        }
        
        // 调试：打印第一条数据，查看数据结构
        if (results.length > 0) {
          console.log('医院待审核预警列表 - 第一条数据:', results[0])
          console.log('终审结果相关字段:', {
            final_result: results[0].final_result,
            final_review_result: results[0].final_review_result,
            warning_info: results[0].warning_info,
            review_status: results[0].review_status,
            violation_definition: results[0].violation_definition
          })
        }
        
        this.warningList = results
      } catch (error) {
        console.error('获取医院待审核预警列表错误:', error)
        const errorMessage = error.message || '获取待审核预警列表失败，请稍后重试'
        this.$message.error(errorMessage)
      } finally {
        this.loading = false
      }
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1
      if (this.isHospitalUser) {
        this.fetchHospitalAlertList()
      } else {
        this.fetchSummaryList()
      }
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      if (this.isHospitalUser) {
        this.fetchHospitalAlertList()
      } else {
        this.fetchSummaryList()
      }
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
    },
    // 格式化就诊类别
    formatVisitType(visitType) {
      if (!visitType) return '-'
      const typeMap = {
        'Imaging': '影像',
        'Outpatient': '门诊',
        'Inpatient': '住院',
        'Emergency': '急诊'
      }
      return typeMap[visitType] || visitType
    },
    // 格式化审核状态
    formatReviewStatus(status) {
      if (!status) return '-'
      const statusMap = {
        'pending_initial': '待医保初审',
        'pending_hospital_review': '待医院复核',
        'hospital_review': '待医院复核',
        'pending_final': '待医保终审',
        'final_reviewed': '审批已完成',
        'completed': '审批已完成'
      }
      return statusMap[status] || status
    },
    // 获取审核状态标签类型
    getReviewStatusType(status) {
      if (!status) return ''
      const typeMap = {
        'pending_initial': 'warning', // 待医保初审 - 橙色
        'pending_hospital_review': 'primary', // 待医院复核 - 蓝色
        'hospital_review': 'primary', // 待医院复核 - 蓝色
        'pending_final': '', // 待医保终审 - 使用自定义样式（紫色）
        'final_reviewed': 'success', // 审批已完成 - 绿色
        'completed': 'success' // 审批已完成 - 绿色
      }
      return typeMap[status] || ''
    },
    // 获取审核状态自定义样式（用于紫色等特殊颜色）
    getReviewStatusStyle(status) {
      if (!status) return {}
      // 待医保终审使用浅紫色（Element UI 风格）
      if (status === 'pending_final') {
        return {
          backgroundColor: '#f3e5f5',
          borderColor: '#ce93d8',
          color: '#7b1fa2'
        }
      }
      return {}
    },
    // 获取终审结果（从多个可能的字段中获取）
    getFinalResult(row) {
      if (!row) return null
      
      // 优先从 final_result 字段获取
      if (row.final_result) {
        return row.final_result
      }
      // 从 warning_info 中获取
      if (row.warning_info) {
        if (row.warning_info.final_result) {
          return row.warning_info.final_result
        }
        // 检查 warning_info 中是否有其他终审相关字段
        if (row.warning_info.final_review_result) {
          return row.warning_info.final_review_result
        }
      }
      // 从其他可能的字段获取
      if (row.final_review_result) {
        return row.final_review_result
      }
      // 如果审核状态是 final_reviewed，但还没有终审结果，可能需要从 violation_definition 推断
      // 但根据接口文档，这个字段可能不包含终审结果信息
      
      // 调试：打印当前行的数据，帮助定位问题
      if (row.review_status === 'final_reviewed' || row.review_status === '审批已完成') {
        console.log('审核状态为已完成，但未找到终审结果字段:', row)
      }
      
      return null
    },
    // 获取终审结果标签类型
    getFinalResultType(row) {
      const result = this.getFinalResult(row)
      if (!result) return ''
      const resultStr = String(result).toLowerCase()
      if (resultStr === '明确违规' || resultStr === 'confirmed_violation') {
        return 'danger'
      } else if (resultStr === '没有违规' || resultStr === 'no_violation') {
        return 'success'
      }
      return 'info'
    },
    // 格式化终审结果
    formatFinalResult(result) {
      if (!result) return '-'
      const resultMap = {
        'confirmed_violation': '明确违规',
        'no_violation': '没有违规',
        '明确违规': '明确违规',
        '没有违规': '没有违规'
      }
      return resultMap[result] || result
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