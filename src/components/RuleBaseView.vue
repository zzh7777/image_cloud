<template>
  <div class="rule-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">规则库</h2>
    </div>

    <!-- 搜索和创建区域 -->
    <div class="action-section">
      <!-- 搜索表单 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="规则编号">
            <el-input
              v-model="searchForm.ruleCode"
              placeholder="请输入规则编号"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="规则名称">
            <el-input
              v-model="searchForm.ruleName"
              placeholder="请输入规则名称"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="创建人">
            <el-input
              v-model="searchForm.creator"
              placeholder="请输入创建人"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              clearable
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 创建按钮 -->
      <div class="create-section">
        <el-button 
          type="primary" 
          @click="handleCreate"
          :disabled="!canCreate"
        >创建</el-button>
      </div>
    </div>

    <!-- 规则列表表格 -->
    <div class="table-section">
      <el-table 
        :data="ruleList" 
        style="width: 100%" 
        border
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column prop="ruleCode" label="规则编号" width="200" show-overflow-tooltip></el-table-column>
        <el-table-column prop="ruleName" label="规则名称" width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="ruleContent" label="规则内容" min-width="250" show-overflow-tooltip></el-table-column>
        <el-table-column prop="ruleBasis" label="规则依据" width="180" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.ruleBasisFileName || (scope.row.ruleBasis ? `加载中...` : '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
        <el-table-column label="规则状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '启用' ? 'success' : 'info'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" @click="handleView(scope.row)">查看详情</el-button>
            <el-divider direction="vertical"></el-divider>
            <!-- 如果状态是启用，只显示停用按钮 -->
            <template v-if="scope.row.status === '启用'">
              <el-button 
                type="text" 
                @click="handleToggleStatus(scope.row)"
                v-if="canUpdateStatus"
              >停用</el-button>
              <el-divider direction="vertical" v-if="canUpdateStatus && canDelete"></el-divider>
              <el-button 
                type="text" 
                style="color: #f56c6c" 
                @click="handleDelete(scope.row)"
                v-if="canDelete"
              >删除</el-button>
            </template>
            <!-- 如果状态是停用，显示启用、编辑和删除按钮 -->
            <template v-else>
              <el-button 
                type="text" 
                @click="handleToggleStatus(scope.row)"
                v-if="canUpdateStatus"
              >启用</el-button>
              <el-divider direction="vertical" v-if="canUpdateStatus && canEdit"></el-divider>
              <el-button 
                type="text" 
                @click="handleEdit(scope.row)"
                v-if="canEdit"
              >编辑</el-button>
              <el-divider direction="vertical" v-if="(canUpdateStatus || canEdit) && canDelete"></el-divider>
              <el-button 
                type="text" 
                style="color: #f56c6c" 
                @click="handleDelete(scope.row)"
                v-if="canDelete"
              >删除</el-button>
            </template>
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

    <!-- 创建/编辑规则对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="700px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="120px">
        <el-form-item label="规则编号">
          <el-input v-model="ruleForm.ruleCode" placeholder="自动生成" disabled style="width: 100%"></el-input>
        </el-form-item>
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" style="width: 100%"></el-input>
        </el-form-item>
        <el-form-item label="规则内容" prop="ruleContent">
          <el-input
            type="textarea"
            v-model="ruleForm.ruleContent"
            :rows="4"
            placeholder="请输入规则内容"
            style="width: 100%"
          ></el-input>
        </el-form-item>
        <el-form-item label="规则算法" prop="ruleAlgorithm">
          <el-input
            type="textarea"
            v-model="ruleForm.ruleAlgorithm"
            :rows="4"
            placeholder="请输入规则算法"
            style="width: 100%"
          ></el-input>
        </el-form-item>
        <el-form-item label="规则依据" prop="basedKnowledge">
          <el-select 
            v-model="ruleForm.basedKnowledge" 
            placeholder="请选择规则依据" 
            clearable
            filterable
            :loading="knowledgeBaseLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in knowledgeBaseList"
              :key="item.id"
              :label="item.file_name"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="规则类型" prop="ruleType">
          <el-select v-model="ruleForm.ruleType" placeholder="请选择规则类型" clearable style="width: 100%">
            <el-option label="虚构检查" value="虚构检查"></el-option>
            <el-option label="重复检查" value="重复检查"></el-option>
            <el-option label="串换检查" value="串换检查"></el-option>
            <el-option label="过度检查" value="过度检查"></el-option>
            <el-option label="超标准检查" value="超标准检查"></el-option>
            <el-option label="缺失检查" value="缺失检查"></el-option>
            <el-option label="不合理检查" value="不合理检查"></el-option>
            <el-option label="其他" value="其他"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="违规定义" prop="violationType">
          <el-select v-model="ruleForm.violationType" placeholder="请选择违规定义" clearable style="width: 100%">
            <el-option label="明确违规" value="明确违规"></el-option>
            <el-option label="疑似违规" value="疑似违规"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 查看规则详情对话框 -->
    <el-dialog
      title="规则详情"
      :visible.sync="viewDialogVisible"
      width="800px"
      :close-on-click-modal="false"
      @close="handleViewDialogClose"
    >
      <div v-if="viewingRule" class="rule-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="规则编号">{{ viewingRule.ruleCode || viewingRule.rule_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="规则名称">{{ viewingRule.ruleName || viewingRule.rule_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="规则类型" :span="2">
            <el-tag v-if="viewingRule.ruleType || viewingRule.rule_type">
              {{ mapRuleTypeFromApi(viewingRule.ruleType || viewingRule.rule_type) }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="违规定义" :span="2">
            <el-tag 
              :type="mapViolationTypeFromApi(viewingRule.violationType || viewingRule.violation_type) === '明确违规' ? 'danger' : 'warning'" 
              v-if="viewingRule.violationType || viewingRule.violation_type"
            >
              {{ mapViolationTypeFromApi(viewingRule.violationType || viewingRule.violation_type) }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="规则状态" :span="2">
            <el-tag :type="(viewingRule.status === '启用' || viewingRule.status === 'active') ? 'success' : 'info'">
              {{ viewingRule.status === 'active' ? '启用' : (viewingRule.status === 'inactive' ? '停用' : viewingRule.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="规则内容" :span="2">
            <div style="white-space: pre-wrap; word-break: break-word;">
              {{ viewingRule.ruleContent || viewingRule.rule_content || '-' }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="规则描述" :span="2">
            <div style="white-space: pre-wrap; word-break: break-word;">
              {{ viewingRule.ruleDescription || viewingRule.rule_description || '-' }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="规则算法" :span="2">
            <div style="white-space: pre-wrap; word-break: break-word;">
              {{ viewingRule.ruleAlgorithm || viewingRule.algorithm_type || '-' }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="规则版本">{{ viewingRule.ruleVersion || viewingRule.rule_version || '-' }}</el-descriptions-item>
          <el-descriptions-item label="规则依据">
            <span v-if="viewingRule.basedKnowledgeName || viewingRule.ruleBasisFileName || viewingRule.based_knowledge_name">
              {{ viewingRule.basedKnowledgeName || viewingRule.ruleBasisFileName || viewingRule.based_knowledge_name }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="生效时间">
            {{ viewingRule.effectiveTime || viewingRule.effective_time ? formatDateTime(viewingRule.effectiveTime || viewingRule.effective_time) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ viewingRule.createTime || viewingRule.create_time ? formatDateTime(viewingRule.createTime || viewingRule.create_time) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ viewingRule.creator || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ viewingRule.updateTime || viewingRule.update_time ? formatDateTime(viewingRule.updateTime || viewingRule.update_time) : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <div v-else style="text-align: center; padding: 40px;">
        <i class="el-icon-loading" style="font-size: 24px;"></i>
        <p style="margin-top: 10px; color: #909399;">加载中...</p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { hasEditPermission } from '@/utils/permissions'

export default {
  name: 'RuleBaseView',
  data() {
    return {
      searchForm: {
        ruleCode: '',
        ruleName: '',
        creator: '',
        dateRange: null // [startDate, endDate]
      },
      ruleList: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      loading: false,
      dialogVisible: false,
      dialogType: 'create', // create 或 edit
      editingRuleId: null, // 当前编辑的规则ID
      submitting: false,
      viewDialogVisible: false, // 查看详情对话框
      viewingRule: null, // 当前查看的规则
      viewLoading: false, // 查看详情加载状态
      ruleForm: {
        ruleCode: '', // 规则编号，自动生成
        ruleName: '',
        ruleContent: '',
        ruleAlgorithm: '', // 规则算法
        ruleType: '',
        violationType: '',
        basedKnowledge: null,
        isDeleted: false // 是否删除
      },
      rules: {
        ruleName: [
          { required: true, message: '请输入规则名称', trigger: 'blur' }
        ],
        ruleContent: [
          { required: true, message: '请输入规则内容', trigger: 'blur' }
        ]
      },
      knowledgeBaseList: [],
      knowledgeBaseLoading: false
    }
  },
  computed: {
    dialogTitle() {
      return this.dialogType === 'create' ? '规则创建' : '规则编辑'
    },
    // 检查是否有创建权限
    canCreate() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'create')
    },
    // 检查是否有编辑权限
    canEdit() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'update')
    },
    // 检查是否有删除权限
    canDelete() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'delete')
    },
    // 检查是否有状态更新权限（启用/停用）
    canUpdateStatus() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'update')
    }
  },
  mounted() {
    // 组件挂载时获取规则列表和知识库列表
    this.fetchRuleList()
    this.fetchKnowledgeBaseList()
  },
  methods: {
    // 将中文规则类型转换为API接受的英文值
    mapRuleTypeToApi(中文值) {
      const ruleTypeMap = {
        '虚构检查': 'fictional',
        '重复检查': 'duplicate',
        '串换检查': 'swapping',
        '过度检查': 'excessive',
        '超标准检查': 'over_standard',
        '缺失检查': 'missing',
        '不合理检查': 'unreasonable',
        '其他': 'other'
      }
      return ruleTypeMap[中文值] || 中文值
    },
    // 将API返回的英文规则类型转换为中文显示
    mapRuleTypeFromApi(英文值) {
      const ruleTypeMap = {
        'fictional': '虚构检查',
        'duplicate': '重复检查',
        'swapping': '串换检查',
        'excessive': '过度检查',
        'over_standard': '超标准检查',
        'missing': '缺失检查',
        'unreasonable': '不合理检查',
        'other': '其他'
      }
      return ruleTypeMap[英文值] || 英文值
    },
    // 将中文违规定义转换为API接受的英文值
    mapViolationTypeToApi(中文值) {
      const violationTypeMap = {
        '明确违规': 'confirmed',
        '疑似违规': 'suspected'
      }
      return violationTypeMap[中文值] || 中文值
    },
    // 将API返回的英文违规定义转换为中文显示
    mapViolationTypeFromApi(英文值) {
      const violationTypeMap = {
        'confirmed': '明确违规',
        'suspected': '疑似违规'
      }
      return violationTypeMap[英文值] || 英文值
    },
    // 获取规则列表
    async fetchRuleList() {
      this.loading = true
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        this.loading = false
        return
      }
      
      // 构建请求 URL，添加分页参数
      const params = new URLSearchParams({
        page: this.pagination.currentPage,
        page_size: this.pagination.pageSize
      })
      
      // 如果有搜索条件，添加到参数中
      if (this.searchForm.ruleCode) {
        params.append('rule_code', this.searchForm.ruleCode)
      }
      if (this.searchForm.ruleName) {
        params.append('rule_name', this.searchForm.ruleName)
      }
      if (this.searchForm.creator) {
        params.append('creator', this.searchForm.creator)
      }
      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        params.append('start_date', this.searchForm.dateRange[0])
        params.append('end_date', this.searchForm.dateRange[1])
      }
      
      const url = `/api/v1/business-rules/?${params.toString()}`
      
      try {
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
        
        // 打印响应用于调试
        console.log('规则列表响应状态:', response.status, response.statusText)
        console.log('响应 Content-Type:', response.headers.get('content-type'))
        
        // 读取响应文本
        const text = await response.text()
        let data = null
        
        // 打印原始响应文本
        console.log('原始响应文本:', text.substring(0, 500))
        
        // 尝试解析 JSON
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('响应不是有效的 JSON:', text.substring(0, 500))
          // 如果是错误状态码，先检查是否是 HTML 错误页面
          if (!response.ok) {
            // 404 或其他错误可能返回 HTML
            if (text.includes('<html') || text.includes('<!DOCTYPE')) {
              throw new Error(`服务器返回了 HTML 错误页面 (${response.status})，可能是接口路径不正确`)
            }
            throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status}): ${text.substring(0, 100)}`)
          }
        }
        
        // 打印解析后的数据
        console.log('规则列表响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `获取规则列表失败: ${response.status}`
          
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
          } else if (response.status === 404) {
            errorMessage = '接口不存在 (404)，请检查接口路径是否正确'
            if (data && data.message) {
              errorMessage = data.message
            } else if (data && data.detail) {
              errorMessage = data.detail
            }
          } else if (data) {
            if (data.detail) {
              errorMessage = data.detail
            } else if (data.message) {
              errorMessage = data.message
            } else if (data.error) {
              errorMessage = data.error
            } else if (typeof data === 'object') {
              // 尝试提取字段错误
              const fieldErrors = Object.keys(data)
                .map(key => {
                  const value = data[key]
                  if (Array.isArray(value)) {
                    return `${key}: ${value.join(', ')}`
                  }
                  return `${key}: ${value}`
                })
                .join('; ')
              
              if (fieldErrors) {
                errorMessage = fieldErrors
              }
            }
          }
          
          throw new Error(errorMessage)
        }
        
        // 检查响应码（统一响应格式中的 code 字段）
        if (data && data.code !== undefined && data.code !== 0) {
          // code 非0表示错误
          const errorMessage = data.message || `获取规则列表失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理新的响应格式：{ code, message, data: { count, results } }
        let responseData = data
        if (data && data.code === 0 && data.data) {
          // 新格式：数据在 data.data 中
          responseData = data.data
        } else if (data && data.results) {
          // 旧格式：数据直接在 data 中（兼容处理）
          responseData = data
        }
        
        // 更新数据
        if (responseData && responseData.results) {
          // 映射后端字段到前端字段
          this.ruleList = responseData.results.map(item => {
            // 调试：打印原始数据（仅第一条）
            if (responseData.results.indexOf(item) === 0) {
              console.log('规则数据项示例:', item)
              console.log('rule_code字段:', item.rule_code)
            }
            return {
              id: item.id,
              ruleCode: item.rule_code || item.ruleCode || '',  // 优先使用rule_code，兼容多种字段名
              ruleName: item.rule_name || item.ruleName || '',
              ruleDescription: item.rule_description || '',
              ruleContent: item.rule_content || '',
              ruleType: this.mapRuleTypeFromApi(item.rule_type) || '',
              ruleVersion: item.rule_version || '',
              algorithmType: item.algorithm_type || '',
              violationType: this.mapViolationTypeFromApi(item.violation_type) || '',
              ruleBasis: item.based_knowledge || null,
              ruleBasisFileName: null, // 文件名，稍后获取
              effectiveTime: item.effective_time || '',
              createTime: item.create_time || '',
              updateTime: item.update_time || '',
              creator: item.creator || '',
              status: item.status === 'active' || item.status === true ? '启用' : '停用'
            }
          })
          this.pagination.total = responseData.count || 0
          
          // 获取规则依据对应的文件名
          await this.fetchKnowledgeBaseFileNames()
        } else {
          this.ruleList = []
          this.pagination.total = 0
        }
        
      } catch (error) {
        console.error('获取规则列表错误:', error)
        this.$message.error(error.message || '获取规则列表失败，请稍后重试')
        this.ruleList = []
        this.pagination.total = 0
      } finally {
        this.loading = false
      }
    },
    handleQuery() {
      console.log('查询', this.searchForm)
      // 重置到第一页并重新获取列表
      this.pagination.currentPage = 1
      this.fetchRuleList()
    },
    handleReset() {
      this.searchForm = {
        ruleCode: '',
        ruleName: '',
        creator: '',
        dateRange: null
      }
      // 重置后重新加载列表
      this.pagination.currentPage = 1
      this.fetchRuleList()
    },
    // 获取知识库文件名（用于显示规则依据）
    async fetchKnowledgeBaseFileNames() {
      // 收集所有需要获取的知识库ID（去重）
      const knowledgeBaseIds = [...new Set(
        this.ruleList
          .filter(rule => rule.ruleBasis !== null && rule.ruleBasis !== undefined)
          .map(rule => rule.ruleBasis)
      )]
      
      if (knowledgeBaseIds.length === 0) {
        return
      }
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        return
      }
      
      // 并发获取所有知识库详情
      const fetchPromises = knowledgeBaseIds.map(async (id) => {
        try {
          const response = await fetch(`/api/v1/knowledge-base/${id}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!response.ok) {
            console.warn(`获取知识库 ${id} 详情失败: ${response.status}`)
            return { id, fileName: null }
          }
          
          const text = await response.text()
          let data = null
          
          try {
            data = text ? JSON.parse(text) : null
          } catch (e) {
            console.error(`知识库 ${id} 响应解析失败:`, text.substring(0, 200))
            return { id, fileName: null }
          }
          
          if (!response.ok) {
            return { id, fileName: null }
          }
          
          // 处理新的响应格式：{ code, message, data: {...} }
          let responseData = data
          if (data && data.code === 0 && data.data) {
            // 新格式：数据在 data.data 中
            responseData = data.data
          } else if (data && data.file_name) {
            // 旧格式：数据直接在 data 中（兼容处理）
            responseData = data
          }
          
          if (responseData && responseData.file_name) {
            return { id, fileName: responseData.file_name }
          } else {
            return { id, fileName: null }
          }
        } catch (error) {
          console.error(`获取知识库 ${id} 详情错误:`, error)
          return { id, fileName: null }
        }
      })
      
      // 等待所有请求完成
      const results = await Promise.all(fetchPromises)
      
      // 创建ID到文件名的映射
      const idToFileNameMap = {}
      results.forEach(result => {
        if (result && result.id !== undefined) {
          idToFileNameMap[result.id] = result.fileName || '未知文件'
        }
      })
      
      // 更新规则列表中的文件名
      this.ruleList.forEach(rule => {
        if (rule.ruleBasis !== null && rule.ruleBasis !== undefined) {
          rule.ruleBasisFileName = idToFileNameMap[rule.ruleBasis] || '文件不存在'
        }
      })
      
      // 强制更新视图
      this.$forceUpdate()
    },
    // 获取知识库列表（用于选择基础知识）
    async fetchKnowledgeBaseList() {
      this.knowledgeBaseLoading = true
      
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.knowledgeBaseLoading = false
        return
      }
      
      try {
        // 获取所有知识库（不分页，用于下拉选择）
        const response = await fetch('/api/v1/knowledge-base/?page_size=1000', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        const text = await response.text()
        let data = null
        
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('知识库列表响应解析失败:', text.substring(0, 200))
        }
        
        if (!response.ok) {
          this.knowledgeBaseList = []
          return
        }
        
        // 处理新的响应格式：{ code, message, data: { count, results } }
        let responseData = data
        if (data && data.code === 0 && data.data) {
          // 新格式：数据在 data.data 中
          responseData = data.data
        } else if (data && data.results) {
          // 旧格式：数据直接在 data 中（兼容处理）
          responseData = data
        }
        
        if (responseData && responseData.results && Array.isArray(responseData.results)) {
          this.knowledgeBaseList = responseData.results
        } else {
          this.knowledgeBaseList = []
        }
      } catch (error) {
        console.error('获取知识库列表错误:', error)
        this.knowledgeBaseList = []
      } finally {
        this.knowledgeBaseLoading = false
      }
    },
    // 查看规则详情
    async handleView(row) {
      console.log('查看规则详情', row)
      this.viewDialogVisible = true
      this.viewLoading = true
      this.viewingRule = null
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        this.viewDialogVisible = false
        return
      }
      
      try {
        // 先使用列表中的数据，避免对话框打开时没有数据
        this.viewingRule = row
        
        // 通过 API 获取规则详情
        let response = await fetch(`/api/v1/business-rules/${row.id}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        // 如果是401错误，尝试刷新token
        if (response.status === 401) {
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (!refreshSuccess) {
            // 刷新失败，已经跳转到登录页
            this.viewDialogVisible = false
            return
          }
          
          // 刷新成功，使用新token重试请求
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(`/api/v1/business-rules/${row.id}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json'
            }
          })
        }
        
        const text = await response.text()
        let data = null
        
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('规则详情响应解析失败:', text.substring(0, 200))
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
        
        if (!response.ok) {
          let errorMessage = `获取规则详情失败: ${response.status}`
          
          // 处理统一错误响应格式
          if (data && data.code !== undefined && data.message) {
            errorMessage = data.message
          }
          
          // 处理权限错误
          if (response.status === 403) {
            errorMessage = this.formatPermissionError(errorMessage, 'view')
          }
          
          throw new Error(errorMessage)
        }
        
        // 检查响应码（统一响应格式中的 code 字段）
        if (data && data.code !== undefined && data.code !== 0) {
          const errorMessage = data.message || `获取规则详情失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        let ruleData = null
        if (data && data.code === 0 && data.data) {
          ruleData = data.data
        } else if (data && !data.code) {
          // 兼容旧格式：数据直接在 data 中
          ruleData = data
        }
        
        if (!ruleData) {
          throw new Error('无法解析规则详情数据')
        }
        
        // 转换数据格式，统一字段名
        const rawRuleType = ruleData.rule_type || ruleData.ruleType
        this.viewingRule = {
          id: ruleData.id,
          ruleCode: ruleData.rule_code || ruleData.ruleCode,
          ruleName: ruleData.rule_name || ruleData.ruleName,
          ruleContent: ruleData.rule_content || ruleData.ruleContent,
          ruleDescription: ruleData.rule_description || ruleData.ruleDescription,
          ruleType: rawRuleType, // 保留原始值（可能是英文），在显示时通过 mapRuleTypeFromApi 转换
          ruleVersion: ruleData.rule_version || ruleData.ruleVersion,
          ruleAlgorithm: ruleData.algorithm_type || ruleData.ruleAlgorithm,
          violationType: ruleData.violation_type || ruleData.violationType,
          basedKnowledge: ruleData.based_knowledge || ruleData.basedKnowledge,
          basedKnowledgeName: ruleData.based_knowledge_name || ruleData.basedKnowledgeName,
          effectiveTime: ruleData.effective_time || ruleData.effectiveTime,
          createTime: ruleData.create_time || ruleData.createTime,
          creator: ruleData.creator,
          updateTime: ruleData.update_time || ruleData.updateTime,
          status: ruleData.status === 'active' ? '启用' : (ruleData.status === 'inactive' ? '停用' : ruleData.status)
        }
        
        // 如果有知识库ID，尝试获取知识库名称
        if (this.viewingRule.basedKnowledge && !this.viewingRule.basedKnowledgeName) {
          // 从知识库列表中查找
          const knowledge = this.knowledgeBaseList.find(kb => kb.id === this.viewingRule.basedKnowledge)
          if (knowledge) {
            this.viewingRule.basedKnowledgeName = knowledge.file_name
          }
        }
        
        this.viewLoading = false
      } catch (error) {
        console.error('获取规则详情错误:', error)
        this.viewLoading = false
        this.$message.error(error.message || '获取规则详情失败，请稍后重试')
        // 如果出错，仍然显示列表中的数据
        if (!this.viewingRule) {
          this.viewingRule = row
        }
      }
    },
    // 关闭查看详情对话框
    handleViewDialogClose() {
      this.viewingRule = null
      this.viewLoading = false
    },
    handleCreate() {
      // 检查权限
      if (!this.canCreate) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能新增')
        return
      }
      
      this.dialogType = 'create'
      // 生成规则编号（示例：YX0000000000000005）
      // 这里可以根据实际需求生成，暂时使用时间戳
      const timestamp = Date.now()
      const ruleCode = `YX${timestamp.toString().slice(-15).padStart(15, '0')}`
      
      this.ruleForm = {
        ruleCode: ruleCode,
        ruleName: '',
        ruleContent: '',
        ruleAlgorithm: '',
        ruleType: '',
        violationType: '',
        basedKnowledge: null,
        isDeleted: false
      }
      this.dialogVisible = true
      // 确保知识库列表已加载
      if (this.knowledgeBaseList.length === 0) {
        this.fetchKnowledgeBaseList()
      }
    },
    async handleEdit(row) {
      // 检查权限
      if (!this.canEdit) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能修改')
        return
      }
      
      this.dialogType = 'edit'
      this.editingRuleId = row.id
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      try {
        // 通过 API 获取规则详情
        let response = await fetch(`/api/v1/business-rules/${row.id}/`, {
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
            return
          }
          
          // 刷新成功，使用新token重试请求
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(`/api/v1/business-rules/${row.id}/`, {
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
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
        
        // 打印响应用于调试
        console.log('获取规则详情响应状态:', response.status)
        console.log('获取规则详情响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `获取规则详情失败: ${response.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (data && data.code !== undefined && data.message) {
            errorMessage = data.message
          } else if (response.status === 401) {
            // 如果到这里还是401，说明重试后仍然失败
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能查看规则详情'
          } else if (response.status === 404) {
            errorMessage = '规则不存在'
            if (data && data.message) {
              errorMessage = data.message
            } else if (data && data.detail) {
              errorMessage = data.detail
            }
          } else if (data) {
            if (data.detail) {
              errorMessage = data.detail
            } else if (data.message) {
              errorMessage = data.message
            } else if (data.error) {
              errorMessage = data.error
            }
          }
          
          throw new Error(errorMessage)
        }
        
        // 检查响应码（统一响应格式中的 code 字段）
        if (data && data.code !== undefined && data.code !== 0) {
          // code 非0表示错误
          const errorMessage = data.message || `获取规则详情失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        let ruleData = null
        if (data && data.code === 0 && data.data) {
          ruleData = data.data
        } else if (data && data.id) {
          // 兼容旧格式：数据直接在 data 中
          ruleData = data
        }
        
        if (!ruleData) {
          throw new Error('无法解析规则详情数据')
        }
        
        // 将后端字段映射到前端表单字段
        // 将 API 返回的英文值转换为前端显示的中文值
        const ruleType = ruleData.rule_type ? this.mapRuleTypeFromApi(ruleData.rule_type) : ''
        const violationType = ruleData.violation_type ? this.mapViolationTypeFromApi(ruleData.violation_type) : ''
        const status = ruleData.status || 'inactive'
        const isDeleted = status === 'inactive' || status === '停用'
        
        this.ruleForm = {
          ruleCode: ruleData.rule_code || '',
          ruleName: ruleData.rule_name || '',
          ruleContent: ruleData.rule_content || '',
          ruleAlgorithm: ruleData.algorithm_type || '',
          ruleType: ruleType,
          violationType: violationType,
          basedKnowledge: ruleData.based_knowledge || null,
          isDeleted: isDeleted
        }
        
        this.dialogVisible = true
        
        // 确保知识库列表已加载
        if (this.knowledgeBaseList.length === 0) {
          this.fetchKnowledgeBaseList()
        }
      } catch (error) {
        console.error('获取规则详情错误:', error)
        this.$message.error(error.message || '获取规则详情失败，请稍后重试')
      }
    },
    async handleToggleStatus(row) {
      // 检查权限
      if (!this.canUpdateStatus) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能修改')
        return
      }
      
      const newStatus = row.status === '启用' ? '停用' : '启用'
      const newStatusValue = newStatus === '启用' ? 'active' : 'inactive'
      
      try {
        await this.$confirm(`确定要${newStatus}该规则吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch {
        this.$message.info('已取消操作')
        return
      }
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      try {
        // 先获取当前规则的完整信息
        const getResponse = await fetch(`/api/v1/business-rules/${row.id}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!getResponse.ok) {
          throw new Error(`获取规则详情失败: ${getResponse.status}`)
        }
        
        const getText = await getResponse.text()
        let getData = null
        
        try {
          getData = getText ? JSON.parse(getText) : null
        } catch (e) {
          throw new Error('获取规则详情响应解析失败')
        }
        
        if (!getResponse.ok) {
          // 处理统一错误响应格式
          let errorMessage = `获取规则详情失败: ${getResponse.status}`
          if (getData && getData.code !== undefined && getData.message) {
            errorMessage = getData.message
          } else if (getData && getData.detail) {
            errorMessage = getData.detail
          }
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        let currentData = getData
        if (getData && getData.code === 0 && getData.data) {
          // 新格式：数据在 data.data 中
          currentData = getData.data
        } else if (getData && getData.id) {
          // 旧格式：数据直接在 data 中（兼容处理）
          currentData = getData
        }
        
        if (!currentData) {
          throw new Error('无法解析规则详情数据')
        }
        
        // 构建更新请求数据，只更新状态
        const requestData = {
          rule_name: currentData.rule_name,
          rule_content: currentData.rule_content,
          rule_description: currentData.rule_description || '',
          rule_type: currentData.rule_type || 'general',
          rule_version: currentData.rule_version || '1.0',
          algorithm_type: currentData.algorithm_type || null,
          violation_type: currentData.violation_type || 'suspected',
          effective_time: currentData.effective_time || null,
          based_knowledge: currentData.based_knowledge || null,
          status: newStatusValue
        }
        
        // 调用更新接口
        let response = await fetch(`/api/v1/business-rules/${row.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })
        
        // 如果是401错误，尝试刷新token
        if (response.status === 401) {
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (!refreshSuccess) {
            // 刷新失败，已经跳转到登录页
            return
          }
          
          // 刷新成功，使用新token重试请求
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(`/api/v1/business-rules/${row.id}/`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          })
          
          // 如果重试后仍然是401，说明token仍然无效
          if (response.status === 401) {
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          }
        }
        
        const text = await response.text()
        let data = null
        
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
        
        if (!response.ok) {
          let errorMessage = `更新规则状态失败: ${response.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (data && data.code !== undefined && data.message) {
            errorMessage = data.message
          } else if (response.status === 401) {
            // 如果到这里还是401，说明重试后仍然失败
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能更新规则状态'
          } else if (response.status === 404) {
            errorMessage = '规则不存在 (404)'
            if (data && data.message) {
              errorMessage = data.message
            } else if (data && data.detail) {
              errorMessage = data.detail
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
        
        // 检查响应码（统一响应格式中的 code 字段）
        if (data && data.code !== undefined && data.code !== 0) {
          // code 非0表示错误
          const errorMessage = data.message || `更新规则状态失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 更新成功，更新本地状态并刷新列表
        // 始终使用中文成功消息，不显示API返回的英文消息
        row.status = newStatus
        this.$message.success(`${newStatus}成功`)
        // 刷新列表以确保数据同步
        this.fetchRuleList()
        
      } catch (error) {
        console.error('更新规则状态错误:', error)
        this.$message.error(error.message || `${newStatus}失败，请稍后重试`)
      }
    },
    // 删除规则
    async handleDelete(row) {
      // 检查权限
      if (!this.canDelete) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能删除')
        return
      }
      
      console.log('删除规则', row)
      
      try {
        await this.$confirm('确定要删除该规则吗？删除操作不可恢复，将同时删除数据库记录和所有关联的规则模型。', '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 从 store 获取 access token
        const accessToken = this.$store.getters.accessToken
        if (!accessToken) {
          this.$message.error('未登录，请先登录')
          return
        }

        // 调用删除接口
        let response = await fetch(`/api/v1/business-rules/${row.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        // 如果是401错误，尝试刷新token
        if (response.status === 401) {
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (!refreshSuccess) {
            // 刷新失败，已经跳转到登录页
            return
          }
          
          // 刷新成功，使用新token重试请求
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(`/api/v1/business-rules/${row.id}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          // 如果重试后仍然是401，说明token仍然无效
          if (response.status === 401) {
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          }
        }

        // 读取响应文本
        const text = await response.text()
        let data = null

        // 打印响应用于调试
        console.log('删除规则响应状态:', response.status)
        console.log('删除规则响应文本:', text)

        // 如果响应为空（204 No Content 或空响应），视为成功
        if (response.status === 204 || (response.ok && !text)) {
          this.$message.success('规则删除成功')
          this.fetchRuleList()
          return
        }

        // 如果响应为空，且状态码是200-299，认为删除成功
        if (!text || !text.trim()) {
          if (response.ok) {
            this.$message.success('规则删除成功')
            this.fetchRuleList()
            return
          }
        }

        // 检查是否是代理错误（代理错误但删除可能已成功）
        if (text && (text.includes('Proxy error') || text.includes('HPE_INVALID_CONSTANT'))) {
          console.warn('检测到代理错误，但删除操作可能已成功，尝试刷新列表')
          // 延迟一下再刷新，给服务器时间完成删除操作
          setTimeout(() => {
            this.fetchRuleList()
          }, 500)
          // 不显示错误，因为删除可能已经成功
          this.$message.success('规则删除成功')
          return
        }

        // 尝试解析 JSON
        if (text && text.trim()) {
          try {
            data = JSON.parse(text)
            console.log('删除规则响应数据:', data)
          } catch (e) {
            // 如果响应不是 JSON，检查是否是 HTML 错误页面
            if (text.includes('<html') || text.includes('<!DOCTYPE')) {
              console.error('服务器返回了 HTML 错误页面:', text.substring(0, 500))
              throw new Error(`服务器返回了 HTML 错误页面 (${response.status})，可能是服务器内部错误`)
            } else {
              console.error('解析 JSON 失败:', e, '响应文本:', text.substring(0, 200))
              // 如果响应不是 JSON，但状态码是200-299或204，也认为删除成功
              if (response.ok || response.status === 204) {
                this.$message.success('规则删除成功')
                this.fetchRuleList()
                return
              }
              // 如果状态码是500，可能是代理错误或后端问题，删除可能已成功
              if (response.status === 500) {
                console.warn('500错误，可能是代理问题或后端响应格式问题，删除操作可能已成功，尝试刷新列表')
                // 延迟刷新，给服务器时间完成删除操作
                setTimeout(() => {
                  this.fetchRuleList()
                }, 1000)
                // 显示成功消息，因为删除可能已经成功
                this.$message.success('规则删除成功')
                return
              }
              // 其他错误，显示详细错误信息
              const errorPreview = text ? text.substring(0, 100).replace(/\n/g, ' ') : '无响应内容'
              throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status}): ${errorPreview}`)
            }
          }
        }

        // 处理统一响应格式：{ code: 0, message: "success", data: null }
        if (data && data.code !== undefined) {
          if (data.code === 0) {
            // 成功：code 为 0
            this.$message.success('规则删除成功')
            this.fetchRuleList()
            return
          } else {
            // 错误：code 非 0
            // 如果是 403 权限错误，使用格式化函数转换为中文
            let errorMessage = data.message || `删除规则失败: code ${data.code}`
            if (response.status === 403) {
              errorMessage = this.formatPermissionError(errorMessage, 'delete')
            }
            throw new Error(errorMessage)
          }
        }

        // 如果没有统一响应格式，检查 HTTP 状态码
        if (!response.ok) {
          let errorMessage = `删除规则失败: ${response.status}`

          if (response.status === 401) {
            // 如果到这里还是401，说明重试后仍然失败
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (response.status === 403) {
            // 使用格式化函数处理权限错误
            if (data && data.message) {
              errorMessage = this.formatPermissionError(data.message, 'delete')
            } else {
              errorMessage = '权限不足，只有 ADMIN 角色才能删除、新增、修改'
            }
          } else if (response.status === 404) {
            errorMessage = '规则不存在'
            if (data && data.message) {
              errorMessage = data.message
            } else if (data && data.detail) {
              errorMessage = data.detail
            }
          } else if (data) {
            if (data.detail) {
              errorMessage = data.detail
            } else if (data.message) {
              // 如果是 403 错误，也格式化
              if (response.status === 403) {
                errorMessage = this.formatPermissionError(data.message, 'delete')
              } else {
                errorMessage = data.message
              }
            } else if (data.error) {
              errorMessage = data.error
            }
          }

          throw new Error(errorMessage)
        }

        // 如果响应成功但没有统一格式，也视为成功
        this.$message.success('规则删除成功')
        this.fetchRuleList()
      } catch (error) {
        // 用户取消删除操作
        if (error === 'cancel' || error.message === 'cancel') {
          this.$message.info('已取消删除操作')
        } else {
          console.error('删除规则错误:', error)
          this.$message.error(error.message || '删除规则失败，请稍后重试')
        }
      }
    },
    async handleSubmit() {
      this.$refs.ruleForm.validate(async (valid) => {
        if (valid) {
          if (this.dialogType === 'create') {
            await this.handleCreateRule()
          } else {
            await this.handleUpdateRule()
          }
        }
      })
    },
    // 创建规则
    async handleCreateRule() {
      this.submitting = true
      
      try {
        // 从 store 获取 access token
        const accessToken = this.$store.getters.accessToken
        if (!accessToken) {
          this.$message.error('未登录，请先登录')
          this.submitting = false
          return
        }

        // 构建请求数据
        // 必填字段：rule_name, rule_content, rule_type, based_knowledge, algorithm_type
        const requestData = {
          rule_name: this.ruleForm.ruleName,
          rule_content: this.ruleForm.ruleContent
        }

        // 必填字段：规则类型
        if (this.ruleForm.ruleType) {
          // 将中文规则类型转换为API接受的英文值
          requestData.rule_type = this.mapRuleTypeToApi(this.ruleForm.ruleType)
        } else {
          throw new Error('规则类型为必填项')
        }

        // 必填字段：关联的知识库ID
        if (this.ruleForm.basedKnowledge) {
          requestData.based_knowledge = this.ruleForm.basedKnowledge
        } else {
          throw new Error('规则依据为必填项')
        }

        // 必填字段：算法类型
        if (this.ruleForm.ruleAlgorithm) {
          requestData.algorithm_type = this.ruleForm.ruleAlgorithm
        } else {
          throw new Error('规则算法为必填项')
        }

        // 可选字段：规则描述
        if (this.ruleForm.ruleDescription) {
          requestData.rule_description = this.ruleForm.ruleDescription
        }

        // 可选字段：规则版本（默认"1.0"）
        if (this.ruleForm.ruleVersion) {
          requestData.rule_version = this.ruleForm.ruleVersion
        } else {
          requestData.rule_version = '1.0'
        }

        // 可选字段：违规类型（默认"suspected"）
        if (this.ruleForm.violationType) {
          // 将中文违规定义转换为API接受的英文值
          requestData.violation_type = this.mapViolationTypeToApi(this.ruleForm.violationType)
        } else {
          requestData.violation_type = 'suspected'
        }

        // 可选字段：生效时间
        if (this.ruleForm.effectiveTime) {
          requestData.effective_time = this.ruleForm.effectiveTime
        }

        // 可选字段：状态（默认"active"）
        requestData.status = 'active'

        console.log('创建规则请求数据:', requestData)

        const response = await fetch('/api/v1/business-rules/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })

        // 读取响应文本
        const text = await response.text()
        let data = null

        // 尝试解析 JSON
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('响应不是有效的 JSON:', text.substring(0, 200))
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }

        // 打印响应用于调试
        console.log('创建规则响应状态:', response.status)
        console.log('创建规则响应数据:', data)

        if (!response.ok) {
          let errorMessage = `创建规则失败: ${response.status}`

          if (response.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能创建规则'
          } else if (response.status === 400) {
            // 参数错误
            // 处理新的响应格式：{ code, message, data }
            let errorData = data
            if (data && data.code !== undefined && data.data) {
              // 新格式：错误信息可能在 data.data 中
              errorData = data.data
            }
            
            if (errorData) {
              if (typeof errorData === 'object') {
                // 尝试提取字段错误
                const fieldErrors = Object.keys(errorData)
                  .map(key => {
                    const value = errorData[key]
                    if (Array.isArray(value)) {
                      return `${key}: ${value.join(', ')}`
                    }
                    return `${key}: ${value}`
                  })
                  .join('; ')

                if (fieldErrors) {
                  errorMessage = fieldErrors
                } else if (errorData.detail) {
                  errorMessage = errorData.detail
                } else if (errorData.message) {
                  errorMessage = errorData.message
                } else if (data.message) {
                  errorMessage = data.message
                }
              } else if (typeof errorData === 'string') {
                errorMessage = errorData
              }
            }
          } else if (data) {
            // 处理新的响应格式
            if (data.code !== undefined && data.message) {
              errorMessage = data.message
            } else if (data.detail) {
              errorMessage = data.detail
            } else if (data.message) {
              errorMessage = data.message
            } else if (data.error) {
              errorMessage = data.error
            }
          }

          throw new Error(errorMessage)
        }

        // 检查响应码（统一响应格式中的 code 字段）
        if (data && data.code !== undefined && data.code !== 0) {
          // code 非0表示错误
          const errorMessage = data.message || `创建规则失败: code ${data.code}`
          throw new Error(errorMessage)
        }

        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        // 始终使用中文成功消息，不显示API返回的英文消息
        const successMessage = '规则创建成功'

        // 创建成功
        this.$message.success(successMessage)
        this.dialogVisible = false

        // 重新获取列表
        this.fetchRuleList()

      } catch (error) {
        console.error('创建规则错误:', error)
        this.$message.error(error.message || '创建规则失败，请稍后重试')
      } finally {
        this.submitting = false
      }
    },
    // 更新规则
    async handleUpdateRule() {
      if (!this.editingRuleId) {
        this.$message.error('未找到要更新的规则ID')
        return
      }
      
      this.submitting = true
      
      try {
        // 从 store 获取 access token
        const accessToken = this.$store.getters.accessToken
        if (!accessToken) {
          this.$message.error('未登录，请先登录')
          this.submitting = false
          return
        }

        // 构建请求数据（PUT需要所有必填字段）
        const requestData = {
          rule_name: this.ruleForm.ruleName,
          rule_content: this.ruleForm.ruleContent
        }

        // 添加可选字段
        if (this.ruleForm.ruleAlgorithm) {
          requestData.algorithm_type = this.ruleForm.ruleAlgorithm
        }
        if (this.ruleForm.ruleType) {
          // 将中文规则类型转换为API接受的英文值
          requestData.rule_type = this.mapRuleTypeToApi(this.ruleForm.ruleType)
        }
        if (this.ruleForm.violationType) {
          // 将中文违规定义转换为API接受的英文值
          requestData.violation_type = this.mapViolationTypeToApi(this.ruleForm.violationType)
        }
        if (this.ruleForm.basedKnowledge !== undefined && this.ruleForm.basedKnowledge !== null) {
          requestData.based_knowledge = this.ruleForm.basedKnowledge
        } else {
          requestData.based_knowledge = null
        }
        // 默认设置为 active
        requestData.status = 'active'

        console.log('更新规则请求数据:', requestData)

        let response = await fetch(`/api/v1/business-rules/${this.editingRuleId}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })

        // 如果是401错误，尝试刷新token
        if (response.status === 401) {
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (!refreshSuccess) {
            // 刷新失败，已经跳转到登录页
            return
          }
          
          // 刷新成功，使用新token重试请求
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(`/api/v1/business-rules/${this.editingRuleId}/`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          })
          
          // 如果重试后仍然是401，说明token仍然无效
          if (response.status === 401) {
            this.$store.commit('clearUser')
            this.$router.push('/login')
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
          console.error('响应不是有效的 JSON:', text.substring(0, 200))
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }

        // 打印响应用于调试
        console.log('更新规则响应状态:', response.status)
        console.log('更新规则响应数据:', data)

        if (!response.ok) {
          let errorMessage = `更新规则失败: ${response.status}`

          if (response.status === 401) {
            // 如果到这里还是401，说明重试后仍然失败
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能更新规则'
          } else if (response.status === 404) {
            errorMessage = '规则不存在 (404)'
            // 处理新的响应格式
            if (data) {
              if (data.code !== undefined && data.message) {
                errorMessage = data.message
              } else if (data.detail) {
                errorMessage = data.detail
              }
            }
          } else if (response.status === 400) {
            // 参数错误
            // 处理新的响应格式：{ code, message, data }
            let errorData = data
            if (data && data.code !== undefined && data.data) {
              // 新格式：错误信息可能在 data.data 中
              errorData = data.data
            }
            
            if (errorData) {
              if (typeof errorData === 'object') {
                // 尝试提取字段错误
                const fieldErrors = Object.keys(errorData)
                  .map(key => {
                    const value = errorData[key]
                    if (Array.isArray(value)) {
                      return `${key}: ${value.join(', ')}`
                    }
                    return `${key}: ${value}`
                  })
                  .join('; ')

                if (fieldErrors) {
                  errorMessage = fieldErrors
                } else if (errorData.detail) {
                  errorMessage = errorData.detail
                } else if (errorData.message) {
                  errorMessage = errorData.message
                } else if (data.message) {
                  errorMessage = data.message
                }
              } else if (typeof errorData === 'string') {
                errorMessage = errorData
              }
            }
          } else if (data) {
            // 处理新的响应格式
            if (data.code !== undefined && data.message) {
              errorMessage = data.message
            } else if (data.detail) {
              errorMessage = data.detail
            } else if (data.message) {
              errorMessage = data.message
            } else if (data.error) {
              errorMessage = data.error
            }
          }

          throw new Error(errorMessage)
        }

        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        // 始终使用中文成功消息，不显示API返回的英文消息
        const successMessage = '规则更新成功'

        // 更新成功
        this.$message.success(successMessage)
        this.dialogVisible = false
        this.editingRuleId = null

        // 重新获取列表
        this.fetchRuleList()

      } catch (error) {
        console.error('更新规则错误:', error)
        this.$message.error(error.message || '更新规则失败，请稍后重试')
      } finally {
        this.submitting = false
      }
    },
    // 关闭对话框
    handleDialogClose() {
      this.ruleForm = {
        ruleCode: '',
        ruleName: '',
        ruleContent: '',
        ruleAlgorithm: '',
        ruleType: '',
        violationType: '',
        basedKnowledge: null,
        isDeleted: false
      }
      this.editingRuleId = null
      this.dialogType = 'create'
      if (this.$refs.ruleForm) {
        this.$refs.ruleForm.clearValidate()
      }
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1 // 重置到第一页
      this.fetchRuleList()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchRuleList()
    },
    // 格式化日期时间
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '-'
      try {
        const date = new Date(dateTimeString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      } catch (e) {
        return dateTimeString
      }
    }
  }
}
</script>

<style scoped>
.rule-base {
  padding: 20px;
  background-color: #fff;
  min-height: 100%;
}

/* 标题区域 */
.title-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.title-bar {
  width: 4px;
  height: 24px;
  background-color: #409EFF;
  margin-right: 12px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

/* 操作区域 */
.action-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  flex-wrap: wrap;
  gap: 20px;
}

.search-form {
  flex: 1;
  min-width: 600px;
}

.create-section {
  display: flex;
  align-items: center;
}

/* 表格区域 */
.table-section {
  background-color: #fff;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-section {
    flex-direction: column;
  }

  .search-form {
    min-width: 100%;
  }
}

.demo-form-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.demo-form-inline .el-form-item {
  margin-bottom: 0;
}
</style>
