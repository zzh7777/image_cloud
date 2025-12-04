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
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
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
      <!-- 调试信息 -->
      <div v-if="false" style="padding: 10px; background: #f0f0f0; margin-bottom: 10px; font-size: 12px;">
        <div>logList 长度: {{ logList.length }}</div>
        <div>logList 数据: {{ JSON.stringify(logList) }}</div>
        <div>pagination.total: {{ pagination.total }}</div>
        <div>loading: {{ loading }}</div>
      </div>
      <el-table :data="logList" style="width: 100%" border stripe v-loading="loading">
        <el-table-column prop="time" label="时间" min-width="180"></el-table-column>
        <el-table-column prop="operator" label="操作者" min-width="120"></el-table-column>
        <el-table-column label="行为" min-width="200">
          <template slot-scope="scope">
            <div>
              <div style="font-weight: 500; margin-bottom: 4px;">{{ scope.row.action }}</div>
              <div style="font-size: 12px; color: #909399;">
                <span v-if="scope.row.entity_type">实体类型: {{ scope.row.entity_type }}</span>
                <span v-if="scope.row.entity_type && scope.row.entity_id"> | </span>
                <span v-if="scope.row.entity_id">实体ID: {{ scope.row.entity_id }}</span>
                <span v-if="!scope.row.entity_type && !scope.row.entity_id" style="color: #c0c4cc;">-</span>
              </div>
            </div>
          </template>
        </el-table-column>
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
        <el-descriptions-item label="实体类型">{{ viewLog.entity_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="实体ID">{{ viewLog.entity_id || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="viewDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { handle401Error } from '@/utils/api'

export default {
  name: 'LogBaseView',
  data() {
    return {
      loading: false,
      searchForm: {
        operator: '',
        dateRange: []
      },
      logList: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      viewDialogVisible: false,
      viewLog: {}
    }
  },
  computed: {
    // 调试用：检查 logList 状态
    logListDebug() {
      return {
        length: this.logList?.length || 0,
        isArray: Array.isArray(this.logList),
        firstItem: this.logList?.[0] || null
      }
    }
  },
  mounted() {
    console.log('LogBaseView mounted, 开始获取日志列表')
    this.fetchLogList()
  },
  methods: {
    async fetchLogList() {
      this.loading = true
      console.log('fetchLogList 开始执行')
      try {
        // 使用 getter 获取 token
        const token = this.$store.getters.accessToken
        console.log('获取到的 token:', token ? '存在' : '不存在', token ? token.substring(0, 20) + '...' : '')
        
        if (!token) {
          // 如果没有token，路由守卫会自动处理跳转，这里不需要手动跳转
          console.warn('没有 token，停止获取日志列表')
          this.loading = false
          return
        }

        // 构建查询参数
        const params = new URLSearchParams()
        params.append('page', this.pagination.currentPage)
        params.append('page_size', this.pagination.pageSize)
        
        if (this.searchForm.operator) {
          params.append('operator', this.searchForm.operator)
        }
        
        if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
          params.append('start_date', this.searchForm.dateRange[0])
          params.append('end_date', this.searchForm.dateRange[1])
        }

        const requestUrl = `/api/v1/logs/?${params.toString()}`
        console.log('准备发送请求，URL:', requestUrl)
        console.log('请求参数:', params.toString())
        
        let response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('收到响应，状态码:', response.status, response.statusText)

        // 处理401错误，尝试刷新token
        if (response.status === 401) {
          const refreshSuccess = await handle401Error(this.$store, this.$router, true)
          if (refreshSuccess) {
            // 刷新成功，使用新的token重试请求
            const newToken = this.$store.getters.accessToken
            console.log('Token 刷新成功，使用新 token 重试请求')
            response = await fetch(`/api/v1/logs/?${params.toString()}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              }
            })
          } else {
            // 刷新失败，已跳转到登录页
            this.loading = false
            return
          }
        }

        // 检查响应状态
        if (!response.ok) {
          let errorText = ''
          try {
            errorText = await response.text()
          } catch (e) {
            errorText = '无法读取错误信息'
          }
          console.error('获取日志列表失败，HTTP状态:', response.status, errorText)
          
          // 尝试解析错误响应
          let errorData = null
          try {
            errorData = JSON.parse(errorText)
          } catch (e) {
            // 不是JSON格式，使用默认错误消息
          }
          
          let errorMessage = errorData?.message || `获取日志列表失败: ${response.status}`
          
          // 处理权限错误
          if (response.status === 403) {
            console.error('权限错误详情:', {
              status: response.status,
              errorData: errorData,
              userRole: this.$store.getters.role,
              url: requestUrl
            })
            errorMessage = this.formatPermissionError(errorMessage, 'view')
          }
          
          console.error('错误信息:', errorMessage)
          this.$message.error(errorMessage)
          this.logList = []
          this.pagination.total = 0
          this.loading = false
          return
        }

        // 解析响应
        let data
        try {
          const responseText = await response.text()
          console.log('日志列表API原始响应:', responseText)
          data = JSON.parse(responseText)
          console.log('日志列表API解析后响应:', data)
        } catch (error) {
          console.error('解析响应失败:', error)
          this.$message.error('解析服务器响应失败')
          this.logList = []
          this.pagination.total = 0
          this.loading = false
          return
        }

        // 处理统一响应格式：{ code, message, data: { count, next, previous, results } }
        console.log('开始处理响应数据，data:', data)
        console.log('data.code:', data?.code)
        console.log('data.data:', data?.data)
        
        if (data && data.code === 0 && data.data) {
          const responseData = data.data
          console.log('responseData:', responseData)
          console.log('responseData.results:', responseData.results)
          console.log('responseData.results 是否为数组:', Array.isArray(responseData.results))
          
          // 确保 results 是数组
          if (responseData.results && Array.isArray(responseData.results)) {
            console.log('results 数组长度:', responseData.results.length)
            // 映射响应字段到前端数据
            const mappedList = responseData.results.map(item => {
              const mapped = {
                id: item.id,
                time: this.formatTime(item.timestamp),
                operator: item.operator || '-',
                action: this.mapAction(item.action),
                result: this.mapResult(item.result),
                entity_type: item.entity_type || null,
                entity_id: item.entity_id || null
              }
              console.log('映射单条数据:', item, '->', mapped)
              return mapped
            })
            
            // 使用 Vue.set 确保响应式更新
            this.$set(this, 'logList', mappedList)
            // 使用 count 字段作为总数
            this.pagination.total = responseData.count || 0
            
            console.log('处理后的日志列表:', this.logList)
            console.log('日志列表数量:', this.logList.length)
            console.log('总数:', this.pagination.total)
            console.log('this.logList 是否为数组:', Array.isArray(this.logList))
          } else {
            // results 不是数组或不存在
            console.warn('日志列表 results 不是数组或不存在:', responseData)
            console.warn('responseData.results 类型:', typeof responseData.results)
            this.$set(this, 'logList', [])
            this.pagination.total = responseData.count || 0
          }
        } else if (data && data.results) {
          // 兼容旧格式：数据直接在 data 中（向后兼容）
          console.log('使用旧格式处理数据')
          if (Array.isArray(data.results)) {
            const mappedList = data.results.map(item => ({
              id: item.id,
              time: this.formatTime(item.timestamp),
              operator: item.operator || '-',
              action: this.mapAction(item.action),
              result: this.mapResult(item.result),
              entity_type: item.entity_type || null,
              entity_id: item.entity_id || null
            }))
            this.$set(this, 'logList', mappedList)
            this.pagination.total = data.count || 0
          } else {
            this.$set(this, 'logList', [])
            this.pagination.total = 0
          }
        } else {
          // 错误响应或未知格式
          console.error('获取日志列表失败，响应码:', data?.code, '消息:', data?.message)
          console.error('完整响应数据:', JSON.stringify(data, null, 2))
          this.$message.error(data?.message || '获取日志列表失败')
          this.$set(this, 'logList', [])
          this.pagination.total = 0
        }
        
        // 最终检查
        console.log('最终 logList 状态:', this.logList)
        console.log('最终 logList 长度:', this.logList?.length)
        console.log('最终 pagination.total:', this.pagination.total)
      } catch (error) {
        console.error('获取日志列表失败:', error)
        this.$message.error('获取日志列表失败')
        this.logList = []
        this.pagination.total = 0
      } finally {
        this.loading = false
      }
    },
    async fetchLogDetail(id) {
      try {
        const token = this.$store.getters.accessToken
        if (!token) {
          // 如果没有token，路由守卫会自动处理跳转
          return
        }

        let response = await fetch(`/api/v1/logs/${id}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        // 处理401错误，尝试刷新token
        if (response.status === 401) {
          const refreshSuccess = await handle401Error(this.$store, this.$router, true)
          if (refreshSuccess) {
            // 刷新成功，使用新的token重试请求
            const newToken = this.$store.getters.accessToken
            response = await fetch(`/api/v1/logs/${id}/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              }
            })
          } else {
            // 刷新失败，已跳转到登录页
            return
          }
        }

        // 检查响应状态
        if (!response.ok) {
          let errorText = ''
          try {
            errorText = await response.text()
          } catch (e) {
            errorText = '无法读取错误信息'
          }
          
          // 尝试解析错误响应
          let errorData = null
          try {
            errorData = JSON.parse(errorText)
          } catch (e) {
            // 不是JSON格式，使用默认错误消息
          }
          
          let errorMessage = errorData?.message || `获取日志详情失败: ${response.status}`
          
          // 处理权限错误
          if (response.status === 403) {
            errorMessage = this.formatPermissionError(errorMessage, 'view')
          }
          
          this.$message.error(errorMessage)
          return
        }

        const text = await response.text()
        let data = null
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          this.$message.error('解析服务器响应失败')
          return
        }

        if (data && data.code === 0 && data.data) {
          this.viewLog = {
            id: data.data.id,
            time: this.formatTime(data.data.timestamp),
            operator: data.data.operator || '-',
            action: this.mapAction(data.data.action),
            result: this.mapResult(data.data.result),
            entity_type: data.data.entity_type || null,
            entity_id: data.data.entity_id || null
          }
          this.viewDialogVisible = true
        } else {
          this.$message.error(data.message || '获取日志详情失败')
        }
      } catch (error) {
        console.error('获取日志详情失败:', error)
        this.$message.error('获取日志详情失败')
      }
    },
    formatTime(timestamp) {
      if (!timestamp) return '-'
      try {
        const date = new Date(timestamp)
        if (isNaN(date.getTime())) {
          console.error('无效的时间戳:', timestamp)
          return timestamp // 如果无法解析，返回原始值
        }
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      } catch (error) {
        console.error('格式化时间失败:', error, timestamp)
        return timestamp
      }
    },
    mapResult(result) {
      // 将英文结果映射为中文
      const resultMap = {
        'Success': '成功',
        'Failed': '失败',
        'Cancelled': '取消',
        '成功': '成功',
        '失败': '失败',
        '取消': '取消'
      }
      return resultMap[result] || result || '成功'
    },
    mapAction(action) {
      // 将英文 action 映射为中文
      const actionMap = {
        // 用户相关操作
        'User Registration': '用户注册',
        'Create User': '创建用户',
        'Update User': '更新用户',
        'Delete User': '删除用户',
        // 知识库相关操作
        'Create KnowledgeBase': '创建知识库',
        'Update KnowledgeBase': '更新知识库',
        'Delete KnowledgeBase': '删除知识库',
        // 业务规则相关操作
        'Create BusinessRule': '创建业务规则',
        'Update BusinessRule': '更新业务规则',
        'Delete BusinessRule': '删除业务规则',
        // 规则模型相关操作
        'Create RuleModel': '创建规则模型',
        'Update RuleModel': '更新规则模型',
        'Delete RuleModel': '删除规则模型',
        // 数据记录相关操作
        'Create DataRecord': '创建数据记录',
        'Update DataRecord': '更新数据记录',
        'Delete DataRecord': '删除数据记录',
        // 批处理任务相关操作
        'Create BatchTask': '创建批处理任务',
        'Update BatchTask': '更新批处理任务',
        'Delete BatchTask': '删除批处理任务',
        // 医院相关操作
        'Create Hospital': '创建医院',
        'Update Hospital': '更新医院',
        'Delete Hospital': '删除医院'
      }
      // 如果直接匹配，返回映射值
      if (actionMap[action]) {
        return actionMap[action]
      }
      // 如果没有直接匹配，尝试解析格式：{操作类型} {模型名称}
      // 例如：Create KnowledgeBase -> 创建知识库
      const parts = action ? action.split(' ') : []
      if (parts.length >= 2) {
        const operation = parts[0] // Create, Update, Delete
        const model = parts.slice(1).join(' ') // KnowledgeBase, BusinessRule, 等
        
        const operationMap = {
          'Create': '创建',
          'Update': '更新',
          'Delete': '删除'
        }
        
        const modelMap = {
          'KnowledgeBase': '知识库',
          'BusinessRule': '业务规则',
          'RuleModel': '规则模型',
          'DataRecord': '数据记录',
          'BatchTask': '批处理任务',
          'Hospital': '医院',
          'User': '用户'
        }
        
        const operationCN = operationMap[operation] || operation
        const modelCN = modelMap[model] || model
        
        if (operationCN && modelCN) {
          return `${operationCN}${modelCN}`
        }
      }
      // 如果无法映射，返回原始值
      return action || '-'
    },
    handleQuery() {
      this.pagination.currentPage = 1
      this.fetchLogList()
    },
    handleReset() {
      this.searchForm = {
        operator: '',
        dateRange: []
      }
      this.pagination.currentPage = 1
      this.fetchLogList()
    },
    handleView(row) {
      this.fetchLogDetail(row.id)
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1
      this.fetchLogList()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchLogList()
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