<template>
  <div class="model-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">模型</h2>
    </div>

    <!-- 搜索和创建区域 -->
    <div class="action-section">
      <!-- 搜索表单 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="模型名称">
            <el-input
              v-model="searchForm.modelName"
              placeholder="请输入模型名称"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="模型类型">
            <el-input
              v-model="searchForm.modelType"
              placeholder="请输入模型类型"
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

    <!-- 模型列表表格 -->
    <div class="table-section">
      <div class="table-wrapper">
        <el-table 
          :data="modelList" 
          style="width: 100%; min-width: 1000px;" 
          border
          v-loading="loading"
          element-loading-text="加载中..."
        >
          <el-table-column prop="modelName" label="模型名称" min-width="200" align="left"></el-table-column>
          <el-table-column prop="modelType" label="模型类型" min-width="150" align="left"></el-table-column>
          <el-table-column prop="modelVersion" label="模型版本" min-width="120" align="left"></el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="180" align="left">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="creator" label="创建人" min-width="120" align="left"></el-table-column>
          <el-table-column label="运行状态" min-width="120" align="left">
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
              <!-- 如果状态是启用，显示禁用和删除 -->
              <template v-if="scope.row.status === '启用'">
                <el-button 
                  type="text" 
                  @click="handleToggleStatus(scope.row)"
                  v-if="canUpdateStatus"
                >禁用</el-button>
                <el-divider direction="vertical" v-if="canUpdateStatus && canDelete"></el-divider>
                <el-button 
                  type="text" 
                  style="color: #f56c6c" 
                  @click="handleDelete(scope.row)"
                  v-if="canDelete"
                >删除</el-button>
              </template>
              <!-- 如果状态是禁用，显示启用、编辑和删除 -->
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

    <!-- 创建/编辑模型对话框 -->
    <el-dialog
      title="模型明细"
      :visible.sync="dialogVisible"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form :model="modelForm" :rules="rules" ref="modelForm" label-width="100px">
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="modelForm.modelName" placeholder="请输入模型名称（50字以内）"></el-input>
        </el-form-item>
        <el-form-item label="模型类型" prop="modelType">
          <el-input v-model="modelForm.modelType" placeholder="请输入模型类型（50字以内）"></el-input>
        </el-form-item>
        <el-form-item label="模型版本" prop="modelVersion">
          <el-input v-model="modelForm.modelVersion" placeholder="请输入模型版本（50字以内）"></el-input>
        </el-form-item>
        
        <el-form-item label="规则选择" prop="selectedRules" class="rule-transfer-item">
          <div class="transfer-container">
            <div class="transfer-panel">
              <div class="panel-header">待加入规则</div>
              <el-input
                v-model="availableRuleSearch"
                placeholder="搜索规则"
                size="small"
                clearable
                style="margin: 10px 10px 0 10px; width: calc(100% - 20px); box-sizing: border-box;"
              ></el-input>
              <div class="panel-body">
                <el-checkbox-group v-model="tempAvailableSelected">
                  <div
                    v-for="rule in filteredAvailableRules"
                    :key="rule.ruleCode"
                    class="rule-item"
                  >
                    <el-checkbox :label="rule.ruleCode">
                      {{ rule.ruleCode }} {{ rule.ruleName }}
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>
            </div>
            
            <div class="transfer-buttons">
              <el-button
                @click="addRules"
                :disabled="tempAvailableSelected.length === 0"
                icon="el-icon-arrow-right"
                size="small"
              ></el-button>
              <el-button
                @click="removeRules"
                :disabled="tempSelectedRules.length === 0"
                icon="el-icon-arrow-left"
                size="small"
                style="margin-top: 10px;"
              ></el-button>
            </div>
            
            <div class="transfer-panel">
              <div class="panel-header">已加入规则</div>
              <el-input
                v-model="selectedRuleSearch"
                placeholder="搜索规则"
                size="small"
                clearable
                style="margin: 10px 10px 0 10px; width: calc(100% - 20px); box-sizing: border-box;"
              ></el-input>
              <div class="panel-body">
                <el-checkbox-group v-model="tempSelectedRules">
                  <div
                    v-for="rule in filteredSelectedRules"
                    :key="rule.ruleCode"
                    class="rule-item"
                  >
                    <el-checkbox :label="rule.ruleCode">
                      {{ rule.ruleCode }} {{ rule.ruleName }}
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="数据源" prop="dataSources">
          <el-select 
            v-model="modelForm.dataSources" 
            multiple 
            placeholder="请选择数据源" 
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="dataRecord in dataRecordsList"
              :key="dataRecord.id"
              :label="dataRecord.dataName"
              :value="dataRecord.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 查看模型详情对话框 -->
    <el-dialog
      title="模型详情"
      :visible.sync="viewDialogVisible"
      width="900px"
      :close-on-click-modal="false"
      @close="handleViewDialogClose"
    >
      <div v-if="viewingModel" class="model-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模型名称">{{ viewingModel.modelName || viewingModel.model_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="模型编码">{{ viewingModel.modelCode || viewingModel.model_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="模型类型">
            <el-tag v-if="viewingModel.modelType || viewingModel.model_type">
              {{ viewingModel.modelType || viewingModel.model_type }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="模型版本">{{ viewingModel.modelVersion || viewingModel.model_version || '-' }}</el-descriptions-item>
          <el-descriptions-item label="执行顺序">
            <el-tag v-if="viewingModel.executionOrder || viewingModel.execution_order">
              {{ viewingModel.executionOrder === 'sequential' || viewingModel.execution_order === 'sequential' ? '顺序执行' : 
                 (viewingModel.executionOrder === 'parallel' || viewingModel.execution_order === 'parallel' ? '并行执行' : 
                 (viewingModel.executionOrder || viewingModel.execution_order || '-')) }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="模型状态">
            <el-tag :type="(viewingModel.status === '启用' || viewingModel.status === 'active') ? 'success' : 'info'">
              {{ viewingModel.status === 'active' ? '启用' : (viewingModel.status === 'inactive' ? '禁用' : viewingModel.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模型描述" :span="2">
            <div style="white-space: pre-wrap; word-break: break-word;">
              {{ viewingModel.modelDescription || viewingModel.model_description || '-' }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="生效时间">
            {{ viewingModel.effectiveTime || viewingModel.effective_time ? formatDateTime(viewingModel.effectiveTime || viewingModel.effective_time) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="失效时间">
            {{ viewingModel.expiryTime || viewingModel.expiry_time ? formatDateTime(viewingModel.expiryTime || viewingModel.expiry_time) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ viewingModel.createTime || viewingModel.create_time ? formatDateTime(viewingModel.createTime || viewingModel.create_time) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ viewingModel.creator || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ viewingModel.updateTime || viewingModel.update_time ? formatDateTime(viewingModel.updateTime || viewingModel.update_time) : '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 关联规则列表 -->
        <div style="margin-top: 20px;" v-if="viewingModel.rules && viewingModel.rules.length > 0">
          <h4 style="margin-bottom: 10px;">关联规则</h4>
          <el-table :data="viewingModel.rules" border style="width: 100%">
            <el-table-column prop="rule_code" label="规则编码" width="200"></el-table-column>
            <el-table-column prop="rule_name" label="规则名称" min-width="200"></el-table-column>
          </el-table>
        </div>

        <!-- 关联数据源列表 -->
        <div style="margin-top: 20px;" v-if="viewingModel.dataSources && viewingModel.dataSources.length > 0">
          <h4 style="margin-bottom: 10px;">关联数据源</h4>
          <el-table :data="viewingModel.dataSources" border style="width: 100%">
            <el-table-column prop="data" label="数据源ID" width="150"></el-table-column>
            <el-table-column prop="data_name" label="数据源名称" min-width="200"></el-table-column>
            <el-table-column prop="create_time" label="关联时间" width="180">
              <template slot-scope="scope">
                {{ scope.row.create_time ? formatDateTime(scope.row.create_time) : '-' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
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
  name: 'ModelBaseView',
  data() {
    return {
      searchForm: {
        modelName: '',
        modelType: '',
        creator: '',
        dateRange: null
      },
      modelList: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      dialogVisible: false,
      dialogType: 'create',
      viewDialogVisible: false, // 查看详情对话框
      viewingModel: null, // 当前查看的模型
      viewLoading: false, // 查看详情加载状态
      modelForm: {
        modelName: '',
        modelType: '',
        modelVersion: '',
        selectedRules: [],
        dataSources: [],
        isDelete: false
      },
      rules: {
        modelName: [
          { required: true, message: '请输入模型名称', trigger: 'blur' },
          { max: 50, message: '名称长度不超过50个字符', trigger: 'blur' }
        ],
        modelType: [
          { required: true, message: '请输入模型类型', trigger: 'blur' },
          { max: 50, message: '类型长度不超过50个字符', trigger: 'blur' }
        ],
        modelVersion: [
          { required: true, message: '请输入模型版本', trigger: 'blur' },
          { max: 50, message: '版本长度不超过50个字符', trigger: 'blur' }
        ],
        selectedRules: [
          { 
            type: 'array',
            required: true,
            message: '至少选择一条规则',
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (!value || value.length === 0) {
                callback(new Error('至少选择一条规则'))
              } else {
                callback()
              }
            }
          }
        ],
        dataSources: [
          { 
            type: 'array',
            required: true,
            message: '至少选择一个数据源',
            trigger: 'change'
          }
        ]
      },
      // 所有可用规则（从数据库获取）
      allRules: [],
      // 所有数据记录（从数据库获取，用于数据源选择）
      dataRecordsList: [],
      // 待加入规则的临时选择
      tempAvailableSelected: [],
      // 已加入规则的临时选择
      tempSelectedRules: [],
      // 搜索关键词
      availableRuleSearch: '',
      selectedRuleSearch: ''
    }
  },
  computed: {
    userPermissions() {
      return this.$store.getters.permissions || []
    },
    // 检查是否有创建权限
    canCreate() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'create', this.userPermissions)
    },
    // 检查是否有编辑权限
    canEdit() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'update', this.userPermissions)
    },
    // 检查是否有删除权限
    canDelete() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'delete', this.userPermissions)
    },
    // 检查是否有状态更新权限（启用/禁用，set_status 权限）
    canUpdateStatus() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'set_status', this.userPermissions)
    },
    // 待加入规则列表（排除已选择的，只展示启用状态的规则）
    availableRules() {
      return this.allRules.filter(rule => {
        // 过滤：已加入模型的规则不再出现在“待加入规则”中
        if (this.modelForm.selectedRules.includes(rule.ruleCode)) {
          return false
        }
        // 过滤：禁用状态的规则不展示
        // 后端可能返回 status 为 'active' / 'inactive'，也可能在前端映射为 '启用' / '停用'
        const status = rule.status
        if (status === 'inactive' || status === '停用') {
          return false
        }
        // 其他情况（启用或无状态字段）都展示
        return true
      })
    },
    // 已加入规则列表
    selectedRulesList() {
      return this.allRules.filter(rule =>
        this.modelForm.selectedRules.includes(rule.ruleCode)
      )
    },
    // 过滤后的待加入规则
    filteredAvailableRules() {
      if (!this.availableRuleSearch) return this.availableRules
      const keyword = this.availableRuleSearch.toLowerCase()
      return this.availableRules.filter(rule =>
        rule.ruleCode.toLowerCase().includes(keyword) ||
        rule.ruleName.toLowerCase().includes(keyword)
      )
    },
    // 过滤后的已加入规则
    filteredSelectedRules() {
      if (!this.selectedRuleSearch) return this.selectedRulesList
      const keyword = this.selectedRuleSearch.toLowerCase()
      return this.selectedRulesList.filter(rule =>
        rule.ruleCode.toLowerCase().includes(keyword) ||
        rule.ruleName.toLowerCase().includes(keyword)
      )
    }
  },
  mounted() {
    // 组件挂载时获取所有规则、数据记录和模型列表
    this.fetchAllRules()
    this.fetchDataRecordsList()
    this.fetchModelList()
  },
  methods: {
    // 获取所有规则列表（用于规则选择）
    async fetchAllRules() {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        console.warn('未登录，无法获取规则列表')
        return
      }
      
      try {
        let allRulesData = []
        let page = 1
        let hasNext = true
        const pageSize = 100 // 每页获取100条
        
        // 分页获取所有规则
        while (hasNext) {
          const params = new URLSearchParams({
            page: page,
            page_size: pageSize
          })
          
          const url = `/api/v1/business-rules/?${params.toString()}`
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!response.ok) {
            console.error('获取规则列表失败:', response.status)
            break
          }
          
          const text = await response.text()
          let data = null
          
          try {
            data = text ? JSON.parse(text) : null
          } catch (e) {
            console.error('解析规则列表响应失败:', e)
            break
          }
          
          if (!response.ok) {
            console.error('获取规则列表失败:', response.status, data)
            break
          }
          
          // 检查响应码（统一响应格式中的 code 字段）
          if (data && data.code !== undefined && data.code !== 0) {
            console.error('获取规则列表失败:', data.message)
            break
          }
          
          // 处理统一响应格式：{ code: 0, message: "success", data: { count, results } }
          let results = null
          let next = null
          if (data && data.code === 0 && data.data && data.data.results) {
            results = data.data.results
            next = data.data.next
          } else if (data && data.results) {
            // 兼容旧格式
            results = data.results
            next = data.next
          }
          
          if (results && results.length > 0) {
            // 映射规则数据：保留规则编码、名称和状态（用于在模型创建时过滤禁用规则）
            const pageRules = results.map(item => ({
              ruleCode: item.rule_code || '',
              ruleName: item.rule_name || '',
              status: item.status || item.rule_status || '' // 可能是 'active' / 'inactive'
            }))
            allRulesData = allRulesData.concat(pageRules)
            
            // 检查是否还有下一页
            hasNext = !!next
            page++
          } else {
            hasNext = false
          }
        }
        
        // 更新所有规则列表
        this.allRules = allRulesData
      } catch (error) {
        console.error('获取规则列表错误:', error)
      }
    },
    // 获取所有数据记录列表（用于数据源选择）
    async fetchDataRecordsList() {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        console.warn('未登录，无法获取数据记录列表')
        return
      }
      
      try {
        let allDataRecords = []
        let page = 1
        let hasNext = true
        const pageSize = 100 // 每页获取100条
        
        // 分页获取所有数据记录
        while (hasNext) {
          const params = new URLSearchParams({
            page: page,
            page_size: pageSize
          })
          
          const url = `/api/v1/data-records/?${params.toString()}`
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!response.ok) {
            console.error('获取数据记录列表失败:', response.status)
            break
          }
          
          const text = await response.text()
          let data = null
          
          try {
            data = text ? JSON.parse(text) : null
          } catch (e) {
            console.error('解析数据记录列表响应失败:', e)
            if (!response.ok) {
              break
            }
            continue
          }
          
          if (!response.ok) {
            console.error('获取数据记录列表失败:', response.status, data)
            break
          }
          
          // 检查响应码（统一响应格式中的 code 字段）
          if (data && data.code !== undefined && data.code !== 0) {
            console.error('获取数据记录列表失败:', data.message)
            break
          }
          
          // 处理统一响应格式：{ code: 0, message: "success", data: { count, results } }
          let results = null
          let next = null
          if (data && data.code === 0 && data.data && data.data.results) {
            results = data.data.results
            next = data.data.next
          } else if (data && data.results) {
            // 兼容旧格式
            results = data.results
            next = data.next
          }
          
          if (results && results.length > 0) {
            // 映射数据记录，保留 id 和 data_name
            const pageDataRecords = results.map(item => ({
              id: item.id,
              dataName: item.data_name || ''
            }))
            allDataRecords = allDataRecords.concat(pageDataRecords)
            
            // 检查是否还有下一页
            hasNext = !!next
            page++
          } else {
            hasNext = false
          }
        }
        
        // 更新所有数据记录列表
        this.dataRecordsList = allDataRecords
      } catch (error) {
        console.error('获取数据记录列表错误:', error)
      }
    },
    // 获取模型列表
    async fetchModelList() {
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
        if (this.searchForm.modelName && this.searchForm.modelName.trim()) {
          params.append('model_name', this.searchForm.modelName.trim())
        }
        if (this.searchForm.modelType && this.searchForm.modelType.trim()) {
          params.append('model_type', this.searchForm.modelType.trim())
        }
        if (this.searchForm.creator && this.searchForm.creator.trim()) {
          params.append('creator', this.searchForm.creator.trim())
        }
        // 添加日期范围搜索条件（格式：YYYY-MM-DD）
        if (this.searchForm.dateRange && Array.isArray(this.searchForm.dateRange) && this.searchForm.dateRange.length === 2) {
          // 确保日期格式正确（value-format="yyyy-MM-dd" 已设置）
          params.append('start_date', this.searchForm.dateRange[0])
          params.append('end_date', this.searchForm.dateRange[1])
        }
        
        const url = `/api/v1/rule-models/?${params.toString()}`
        console.log('请求模型列表，URL:', url)
        console.log('搜索条件:', {
          modelName: this.searchForm.modelName,
          modelType: this.searchForm.modelType,
          creator: this.searchForm.creator,
          dateRange: this.searchForm.dateRange
        })
        
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
          console.error('解析模型列表响应失败:', e)
          if (!response.ok) {
            throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
          }
          this.loading = false
          return
        }
        
        // 打印响应用于调试
        console.log('模型列表响应状态:', response.status)
        console.log('模型列表响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `获取模型列表失败: ${response.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (data && data.code !== undefined && data.message) {
            errorMessage = data.message
          } else if (response.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
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
            }
          }
          
          throw new Error(errorMessage)
        }
        
        // 检查响应码（统一响应格式中的 code 字段）
        if (data && data.code !== undefined && data.code !== 0) {
          // code 非0表示错误
          const errorMessage = data.message || `获取模型列表失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: { count, results } }
        // 优先检查 code === 0 的情况
        if (data && data.code === 0 && data.data && data.data.results) {
          // 映射后端数据到前端显示格式
          this.modelList = data.data.results.map(item => ({
            id: item.id,
            modelName: item.model_name || '',
            modelCode: item.model_code || '',
            modelType: item.model_type || '',
            modelVersion: item.model_version || '',
            createTime: item.create_time || '',
            creator: item.creator || '',
            status: item.status === 'active' ? '启用' : '禁用',
            updateTime: item.update_time || ''
          }))
          
          // 更新分页信息
          this.pagination.total = data.data.count || 0
          console.log('模型列表加载成功，共', data.data.count, '条记录，当前页', this.modelList.length, '条')
        } else if (data && data.results) {
          // 兼容旧格式（没有 code 字段的情况）
          this.modelList = data.results.map(item => ({
            id: item.id,
            modelName: item.model_name || '',
            modelCode: item.model_code || '',
            modelType: item.model_type || '',
            modelVersion: item.model_version || '',
            createTime: item.create_time || '',
            creator: item.creator || '',
            status: item.status === 'active' ? '启用' : '禁用',
            updateTime: item.update_time || ''
          }))
          this.pagination.total = data.count || 0
        } else {
          this.modelList = []
          this.pagination.total = 0
        }
      } catch (error) {
        console.error('获取模型列表错误:', error)
        this.$message.error('获取模型列表失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    handleQuery() {
      // 重置到第一页并查询
      this.pagination.currentPage = 1
      this.fetchModelList()
    },
    handleReset() {
      this.searchForm = {
        modelName: '',
        modelType: '',
        creator: '',
        dateRange: []
      }
      // 重置后重新加载列表
      this.pagination.currentPage = 1
      this.fetchModelList()
    },
    // 查看模型详情
    async handleView(row) {
      console.log('查看模型详情', row)
      this.viewDialogVisible = true
      this.viewLoading = true
      this.viewingModel = null
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        this.viewDialogVisible = false
        return
      }
      
      try {
        // 先使用列表中的数据，避免对话框打开时没有数据
        this.viewingModel = row
        
        // 通过 API 获取模型详情
        let response = await fetch(`/api/v1/rule-models/${row.id}/`, {
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
          response = await fetch(`/api/v1/rule-models/${row.id}/`, {
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
          console.error('模型详情响应解析失败:', text.substring(0, 200))
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
        
        if (!response.ok) {
          let errorMessage = `获取模型详情失败: ${response.status}`
          
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
          const errorMessage = data.message || `获取模型详情失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        let modelData = null
        if (data && data.code === 0 && data.data) {
          modelData = data.data
        } else if (data && !data.code) {
          // 兼容旧格式：数据直接在 data 中
          modelData = data
        }
        
        if (!modelData) {
          throw new Error('无法解析模型详情数据')
        }
        
        // 转换数据格式，统一字段名
        this.viewingModel = {
          id: modelData.id,
          modelName: modelData.model_name || modelData.modelName,
          modelCode: modelData.model_code || modelData.modelCode,
          modelType: modelData.model_type || modelData.modelType,
          modelVersion: modelData.model_version || modelData.modelVersion,
          modelDescription: modelData.model_description || modelData.modelDescription,
          executionOrder: modelData.execution_order || modelData.executionOrder,
          status: modelData.status === 'active' ? '启用' : (modelData.status === 'inactive' ? '禁用' : modelData.status),
          effectiveTime: modelData.effective_time || modelData.effectiveTime,
          expiryTime: modelData.expiry_time || modelData.expiryTime,
          createTime: modelData.create_time || modelData.createTime,
          creator: modelData.creator,
          updateTime: modelData.update_time || modelData.updateTime,
          rules: modelData.rules || [],
          dataSources: modelData.data_sources || modelData.dataSources || []
        }
        
        // 如果有数据源ID，尝试获取数据源名称
        if (this.viewingModel.dataSources && this.viewingModel.dataSources.length > 0) {
          // 从数据记录列表中查找数据源名称
          const dataRecordsList = await this.fetchDataRecordsListForView()
          this.viewingModel.dataSources = this.viewingModel.dataSources.map(ds => {
            const dataRecord = dataRecordsList.find(dr => dr.id === ds.data)
            return {
              ...ds,
              data_name: dataRecord ? dataRecord.dataName : `数据源ID: ${ds.data}`
            }
          })
        }
        
        this.viewLoading = false
      } catch (error) {
        console.error('获取模型详情错误:', error)
        this.viewLoading = false
        this.$message.error(error.message || '获取模型详情失败，请稍后重试')
        // 如果出错，仍然显示列表中的数据
        if (!this.viewingModel) {
          this.viewingModel = row
        }
      }
    },
    // 获取数据记录列表（用于查看详情时显示数据源名称）
    async fetchDataRecordsListForView() {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        return []
      }
      
      try {
        const response = await fetch('/api/v1/data-records/?page_size=1000', {
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
          return []
        }
        
        if (!response.ok || !data) {
          return []
        }
        
        // 处理统一响应格式
        let responseData = data
        if (data.code === 0 && data.data) {
          responseData = data.data
        }
        
        if (responseData.results && Array.isArray(responseData.results)) {
          return responseData.results.map(item => ({
            id: item.id,
            dataName: item.data_name || ''
          }))
        }
        
        return []
      } catch (error) {
        console.error('获取数据记录列表失败:', error)
        return []
      }
    },
    // 关闭查看详情对话框
    handleViewDialogClose() {
      this.viewingModel = null
      this.viewLoading = false
    },
    handleCreate() {
      // 检查权限
      if (!this.canCreate) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能新增')
        return
      }
      
      this.dialogType = 'create'
      this.modelForm = {
        modelName: '',
        modelType: '',
        modelVersion: '',
        selectedRules: [],
        dataSources: [],
        isDelete: false
      }
      this.tempAvailableSelected = []
      this.tempSelectedRules = []
      this.availableRuleSearch = ''
      this.selectedRuleSearch = ''
      this.dialogVisible = true
    },
    async handleEdit(row) {
      // 检查权限
      if (!this.canEdit) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能修改')
        return
      }
      
      this.dialogType = 'edit'
      
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      try {
        // 获取模型详情
        const response = await fetch(`/api/v1/rule-models/${row.id}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
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
        console.log('获取模型详情响应状态:', response.status)
        console.log('获取模型详情响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `获取模型详情失败: ${response.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (data && data.code !== undefined && data.message) {
            errorMessage = data.message
          } else if (response.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能查看模型详情'
          } else if (response.status === 404) {
            errorMessage = '模型不存在'
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
          const errorMessage = data.message || `获取模型详情失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        let modelData = null
        if (data && data.code === 0 && data.data) {
          modelData = data.data
        } else if (data && data.id) {
          // 兼容旧格式：数据直接在 data 中
          modelData = data
        }
        
        if (!modelData) {
          throw new Error('无法解析模型详情数据')
        }
        
        // 填充表单数据
        // 从rules数组中提取rule_code
        // 后端返回的rules数组中，每个元素包含rule字段（规则ID），需要通过API获取rule_code
        let selectedRules = []
        if (modelData.rules && modelData.rules.length > 0) {
          // 通过API获取所有规则的rule_code
          const rulePromises = modelData.rules.map(async rule => {
            const ruleId = rule.rule || rule.rule_code
            if (!ruleId) return null
            
            // 先尝试从allRules中查找
            const foundRule = this.allRules.find(r => String(r.ruleCode) === String(ruleId))
            if (foundRule) {
              return foundRule.ruleCode
            }
            
            // 如果没找到，通过API获取规则详情
            try {
              let ruleResponse = await fetch(`/api/v1/business-rules/${ruleId}/`, {
                headers: { 
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              })
              
              // 如果是401错误，尝试刷新token
              if (ruleResponse.status === 401) {
                const { handle401Error } = await import('@/utils/api')
                const refreshSuccess = await handle401Error(this.$store, this.$router, true)
                if (refreshSuccess) {
                  const newAccessToken = this.$store.getters.accessToken
                  ruleResponse = await fetch(`/api/v1/business-rules/${ruleId}/`, {
                    headers: { 
                      'Authorization': `Bearer ${newAccessToken}`,
                      'Content-Type': 'application/json'
                    }
                  })
                }
              }
              
              if (ruleResponse.ok) {
                // 读取响应文本
                const text = await ruleResponse.text()
                let ruleData = null
                
                try {
                  ruleData = text ? JSON.parse(text) : null
                } catch (e) {
                  console.error(`解析规则 ${ruleId} 响应失败:`, e)
                  return null
                }
                
                // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
                if (ruleData && ruleData.code === 0 && ruleData.data) {
                  return ruleData.data.rule_code
                } else if (ruleData && ruleData.rule_code) {
                  // 兼容旧格式：数据直接在响应中
                  return ruleData.rule_code
                }
              }
            } catch (e) {
              console.error(`获取规则 ${ruleId} 详情失败:`, e)
            }
            
            // 如果都失败了，尝试直接使用ruleId（可能是rule_code格式）
            return String(ruleId)
          })
          
          const ruleResults = await Promise.all(rulePromises)
          selectedRules = ruleResults.filter(code => code)
        }
        
        this.modelForm = {
          id: modelData.id,
          modelName: modelData.model_name || '',
          modelType: modelData.model_type || '',
          modelVersion: modelData.model_version || '',
          selectedRules: selectedRules,
          // 从data_sources数组中提取data id
          dataSources: modelData.data_sources ? modelData.data_sources.map(ds => ds.data || ds) : [],
          isDelete: false
        }
        
        this.tempAvailableSelected = []
        this.tempSelectedRules = []
        this.availableRuleSearch = ''
        this.selectedRuleSearch = ''
        this.dialogVisible = true
      } catch (error) {
        console.error('获取模型详情错误:', error)
        this.$message.error(error.message || '获取模型详情失败，请稍后重试')
      }
    },
    async handleToggleStatus(row) {
      // 检查权限
      if (!this.canUpdateStatus) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能修改')
        return
      }
      
      const newStatus = row.status === '启用' ? '禁用' : '启用'
      const newStatusValue = newStatus === '启用' ? 'active' : 'inactive'
      
      try {
        await this.$confirm(`确定要${newStatus}该模型吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const accessToken = this.$store.getters.accessToken
        if (!accessToken) {
          this.$message.error('未登录，请先登录')
          return
        }
        
        // 先获取当前模型详情，确保包含所有字段
        const getResponse = await fetch(`/api/v1/rule-models/${row.id}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        // 读取响应文本
        const getText = await getResponse.text()
        let getData = null
        
        // 尝试解析 JSON
        try {
          getData = getText ? JSON.parse(getText) : null
        } catch (e) {
          throw new Error(`服务器返回了非 JSON 格式的响应 (${getResponse.status})`)
        }
        
        // 打印响应用于调试
        console.log('获取模型详情响应状态:', getResponse.status)
        console.log('获取模型详情响应数据:', getData)
        
        if (!getResponse.ok) {
          let errorMessage = `获取模型详情失败: ${getResponse.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (getData && getData.code !== undefined && getData.message) {
            errorMessage = getData.message
          } else if (getResponse.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (getResponse.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能查看模型详情'
          } else if (getResponse.status === 404) {
            errorMessage = '模型不存在'
            if (getData && getData.message) {
              errorMessage = getData.message
            } else if (getData && getData.detail) {
              errorMessage = getData.detail
            }
          } else if (getData) {
            if (getData.detail) {
              errorMessage = getData.detail
            } else if (getData.message) {
              errorMessage = getData.message
            } else if (getData.error) {
              errorMessage = getData.error
            }
          }
          
          throw new Error(errorMessage)
        }
        
        // 检查响应码（统一响应格式中的 code 字段）
        if (getData && getData.code !== undefined && getData.code !== 0) {
          // code 非0表示错误
          const errorMessage = getData.message || `获取模型详情失败: code ${getData.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        let currentData = null
        if (getData && getData.code === 0 && getData.data) {
          currentData = getData.data
        } else if (getData && getData.id) {
          // 兼容旧格式：数据直接在 getData 中
          currentData = getData
        }
        
        if (!currentData) {
          throw new Error('无法解析模型详情数据')
        }
        
        // 构建请求体，包含所有必需字段
        const requestData = {
          model_name: currentData.model_name,
          model_type: currentData.model_type,
          model_version: currentData.model_version || '1.0',
          status: newStatusValue,
          execution_order: currentData.execution_order || 'sequential'
        }
        
        // 添加规则和数据源（如果存在）
        if (currentData.rules && currentData.rules.length > 0) {
          // 通过API获取所有规则的rule_code和rule_name
          const rulePromises = currentData.rules.map(async rule => {
            const ruleId = rule.rule || rule.rule_code
            if (!ruleId) return null
            
            // 先尝试从allRules中查找
            const foundRule = this.allRules.find(r => String(r.ruleCode) === String(ruleId))
            if (foundRule) {
              return {
                rule_code: foundRule.ruleCode,
                rule_name: foundRule.ruleName
              }
            }
            
            // 如果没找到，通过API获取规则详情
            try {
              let ruleResponse = await fetch(`/api/v1/business-rules/${ruleId}/`, {
                headers: { 
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              })
              
              // 如果是401错误，尝试刷新token
              if (ruleResponse.status === 401) {
                const { handle401Error } = await import('@/utils/api')
                const refreshSuccess = await handle401Error(this.$store, this.$router, true)
                if (refreshSuccess) {
                  const newAccessToken = this.$store.getters.accessToken
                  ruleResponse = await fetch(`/api/v1/business-rules/${ruleId}/`, {
                    headers: { 
                      'Authorization': `Bearer ${newAccessToken}`,
                      'Content-Type': 'application/json'
                    }
                  })
                }
              }
              
              if (ruleResponse.ok) {
                // 读取响应文本
                const text = await ruleResponse.text()
                let ruleData = null
                
                try {
                  ruleData = text ? JSON.parse(text) : null
                } catch (e) {
                  console.error(`解析规则 ${ruleId} 响应失败:`, e)
                  return null
                }
                
                // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
                let actualRuleData = null
                if (ruleData && ruleData.code === 0 && ruleData.data) {
                  actualRuleData = ruleData.data
                } else if (ruleData && ruleData.rule_code) {
                  // 兼容旧格式：数据直接在响应中
                  actualRuleData = ruleData
                }
                
                if (actualRuleData) {
                  return {
                    rule_code: actualRuleData.rule_code,
                    rule_name: actualRuleData.rule_name
                  }
                }
              }
            } catch (e) {
              console.error(`获取规则 ${ruleId} 详情失败:`, e)
            }
            
            // 如果都失败了，尝试使用现有数据
            return {
              rule_code: rule.rule_code || String(ruleId),
              rule_name: rule.rule_name || ''
            }
          })
          
          const ruleResults = await Promise.all(rulePromises)
          requestData.rules = ruleResults.filter(rule => rule !== null)
        }
        
        if (currentData.data_sources && currentData.data_sources.length > 0) {
          requestData.data_sources = currentData.data_sources.map(ds => ({
            data: ds.data || ds
          }))
        }
        
        // 添加可选字段
        if (currentData.model_description) {
          requestData.model_description = currentData.model_description
        }
        if (currentData.effective_time) {
          requestData.effective_time = currentData.effective_time
        }
        if (currentData.expiry_time) {
          requestData.expiry_time = currentData.expiry_time
        }
        
        const response = await fetch(`/api/v1/rule-models/${row.id}/`, {
          method: 'PUT',
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
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
        
        // 打印响应用于调试
        console.log('更新模型状态响应状态:', response.status)
        console.log('更新模型状态响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `${newStatus}模型失败: ${response.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (data && data.code !== undefined && data.message) {
            errorMessage = data.message
          } else if (response.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能更新模型状态'
          } else if (response.status === 404) {
            errorMessage = '模型不存在'
            if (data && data.message) {
              errorMessage = data.message
            } else if (data && data.detail) {
              errorMessage = data.detail
            }
          } else if (response.status === 400) {
            // 参数错误
            if (data) {
              // 处理统一响应格式的错误
              if (data.code !== undefined && data.message) {
                errorMessage = data.message
              } else if (data.detail) {
                errorMessage = data.detail
              } else if (typeof data === 'object') {
                // 兼容旧格式：尝试提取字段错误
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
          } else if (data) {
            // 处理统一响应格式的错误
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
          const errorMessage = data.message || `${newStatus}模型失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        // 更新成功，更新本地状态并刷新列表
        // 始终使用中文成功消息，不显示API返回的英文消息
        row.status = newStatus
        this.$message.success(`${newStatus}成功`)
        // 刷新模型列表
        this.fetchModelList()
      } catch (error) {
        if (error.message && !error.message.includes('已取消')) {
          this.$message.error(error.message)
        } else if (error !== 'cancel') {
          this.$message.info('已取消操作')
        }
        console.error('更新模型状态错误:', error)
      }
    },
    // 删除模型
    async handleDelete(row) {
      // 检查权限
      if (!this.canDelete) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能删除')
        return
      }
      
      try {
        await this.$confirm('确定要删除该模型吗？删除操作不可恢复，将同时删除数据库记录和所有关联的业务规则关联、数据源关联和批量任务。', '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const accessToken = this.$store.getters.accessToken
        if (!accessToken) {
          this.$message.error('未登录，请先登录')
          return
        }
        
        let response = await fetch(`/api/v1/rule-models/${row.id}/`, {
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
          response = await fetch(`/api/v1/rule-models/${row.id}/`, {
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
        
        console.log('删除模型响应状态:', response.status)
        
        // 204 No Content 表示删除成功（无响应体）
        if (response.status === 204) {
          this.$message.success('模型删除成功')
          // 重新获取列表
          this.fetchModelList()
          return
        }
        
        // 尝试读取响应（可能返回统一响应格式）
        const text = await response.text()
        console.log('删除模型响应文本:', text)
        let data = null
        
        // 如果响应为空，且状态码是200-299，认为删除成功
        if (!text || !text.trim()) {
          if (response.ok) {
            this.$message.success('模型删除成功')
            this.fetchModelList()
            return
          }
        }
        
        // 检查是否是代理错误（代理错误但删除可能已成功）
        if (text && (text.includes('Proxy error') || text.includes('HPE_INVALID_CONSTANT'))) {
          console.warn('检测到代理错误，但删除操作可能已成功，尝试刷新列表')
          // 延迟一下再刷新，给服务器时间完成删除操作
          setTimeout(() => {
            this.fetchModelList()
          }, 500)
          // 不显示错误，因为删除可能已经成功
          this.$message.success('模型删除成功')
          return
        }
        
        // 尝试解析 JSON
        if (text && text.trim()) {
          try {
            data = JSON.parse(text)
            console.log('删除模型响应数据:', data)
          } catch (e) {
            // 如果响应不是 JSON，检查是否是 HTML 错误页面
            if (text.includes('<html') || text.includes('<!DOCTYPE')) {
              console.error('服务器返回了 HTML 错误页面:', text.substring(0, 500))
              throw new Error(`服务器返回了 HTML 错误页面 (${response.status})，可能是服务器内部错误`)
            } else {
              console.error('解析 JSON 失败:', e, '响应文本:', text.substring(0, 200))
              // 如果响应不是 JSON，但状态码是200-299或204，也认为删除成功
              if (response.ok || response.status === 204) {
                this.$message.success('模型删除成功')
                this.fetchModelList()
                return
              }
              // 如果状态码是500，可能是代理错误或后端问题，删除可能已成功
              if (response.status === 500) {
                console.warn('500错误，可能是代理问题或后端响应格式问题，删除操作可能已成功，尝试刷新列表')
                // 延迟刷新，给服务器时间完成删除操作
                setTimeout(() => {
                  this.fetchModelList()
                }, 1000)
                // 显示成功消息，因为删除可能已经成功
                this.$message.success('模型删除成功')
                return
              }
              // 其他错误，显示详细错误信息
              const errorPreview = text ? text.substring(0, 100).replace(/\n/g, ' ') : '无响应内容'
              throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status}): ${errorPreview}`)
            }
          }
        }
        
        // 优先检查统一响应格式中的 code 字段
        if (data && data.code !== undefined) {
          if (data.code === 0) {
            // 成功：code 为 0（即使 HTTP 状态码可能是 500）
            this.$message.success('模型删除成功')
            // 重新获取列表
            this.fetchModelList()
            return
          } else {
            // 错误：code 非 0
            // 如果是 403 权限错误，使用格式化函数转换为中文
            let errorMessage = data.message || `删除模型失败: code ${data.code}`
            if (response.status === 403) {
              errorMessage = this.formatPermissionError(errorMessage, 'delete')
            }
            throw new Error(errorMessage)
          }
        }
        
        // 如果没有统一响应格式，检查 HTTP 状态码
        if (response.ok) {
          // HTTP 状态码是 200-299，认为删除成功
          this.$message.success('模型删除成功')
          this.fetchModelList()
          return
        }
        
        // 处理错误响应
        let errorMessage = `删除模型失败: ${response.status}`
        
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
          errorMessage = '模型不存在'
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
      } catch (error) {
        if (error.message && error.message !== '已取消删除') {
          this.$message.error(error.message)
        } else if (error !== 'cancel') {
          this.$message.info('已取消删除')
        }
        console.error('删除模型错误:', error)
      }
    },
    // 添加规则到已选择
    addRules() {
      this.modelForm.selectedRules.push(...this.tempAvailableSelected)
      this.tempAvailableSelected = []
      // 触发验证，清除错误提示
      this.$nextTick(() => {
        if (this.$refs.modelForm) {
          this.$refs.modelForm.validateField('selectedRules')
        }
      })
    },
    // 从已选择移除规则
    removeRules() {
      this.modelForm.selectedRules = this.modelForm.selectedRules.filter(
        code => !this.tempSelectedRules.includes(code)
      )
      this.tempSelectedRules = []
      // 触发验证
      this.$nextTick(() => {
        if (this.$refs.modelForm) {
          this.$refs.modelForm.validateField('selectedRules')
        }
      })
    },
    async handleSubmit() {
      this.$refs.modelForm.validate(async (valid) => {
        if (valid) {
          // 创建或编辑
          if (this.dialogType === 'create') {
            try {
              await this.handleCreateModel()
              this.dialogVisible = false
            } catch (error) {
              // 创建失败，不关闭对话框
              console.error('创建模型失败:', error)
            }
          } else {
            // 编辑功能
            try {
              await this.handleUpdateModel()
              this.dialogVisible = false
            } catch (error) {
              // 更新失败，不关闭对话框
              console.error('更新模型失败:', error)
            }
          }
        }
      })
    },
    // 创建模型
    async handleCreateModel() {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      try {
        // 构建 rules 数组，格式: [{ rule_code: "...", rule_name: "..." }]
        const rules = this.modelForm.selectedRules.map(ruleCode => {
          const rule = this.allRules.find(r => r.ruleCode === ruleCode)
          if (!rule) {
            throw new Error(`规则 ${ruleCode} 未找到，请刷新页面后重试`)
          }
          if (!rule.ruleCode || !rule.ruleName) {
            throw new Error(`规则 ${ruleCode} 的代码或名称未找到，请刷新页面后重试`)
          }
          return {
            rule_code: rule.ruleCode,  // 使用规则对象中的ruleCode
            rule_name: rule.ruleName   // 使用规则对象中的ruleName
          }
        })
        
        // 构建 data_sources 数组，格式: [{ data: id }]
        const dataSources = this.modelForm.dataSources.map(dataId => ({
          data: dataId
        }))
        
        // 构建请求体
        const requestData = {
          model_name: this.modelForm.modelName,
          model_type: this.modelForm.modelType,
          model_version: this.modelForm.modelVersion || '1.0',
          rules: rules,
          data_sources: dataSources
        }
        
        // 打印请求数据用于调试
        console.log('创建模型请求数据:', JSON.stringify(requestData, null, 2))
        
        const response = await fetch('/api/v1/rule-models/', {
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
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
        
        // 打印响应用于调试
        console.log('创建模型响应状态:', response.status)
        console.log('创建模型响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `创建模型失败: ${response.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (data && data.code !== undefined && data.message) {
            // 检查是否是模型名称重复错误
            if (data.message.includes('model_name') && 
                (data.message.includes('already exists') || data.message.includes('unique'))) {
              errorMessage = '模型名称不能重复'
            } else if (data.message.includes('rules') && data.message.includes('至少需要')) {
              errorMessage = '创建模型时至少需要选择一个规则'
            } else if (data.message.includes('data_sources') && data.message.includes('至少需要')) {
              errorMessage = '创建模型时至少需要选择一个数据源'
            } else if (data.message.includes('规则代码') || data.message.includes('不存在或不匹配')) {
              errorMessage = data.message
            } else if (data.message.includes('Invalid pk') || data.message.includes('does not exist')) {
              errorMessage = '数据源不存在，请检查选择的数据源'
            } else {
              errorMessage = data.message
            }
          } else if (response.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能创建模型'
          } else if (response.status === 400) {
            // 参数错误
            if (data) {
              // 处理统一响应格式的错误
              if (data.code !== undefined && data.message) {
                // 检查是否是模型名称重复错误
                if (data.message.includes('model_name') && 
                    (data.message.includes('already exists') || data.message.includes('unique'))) {
                  errorMessage = '模型名称不能重复'
                } else if (data.message.includes('rules') && data.message.includes('至少需要')) {
                  errorMessage = '创建模型时至少需要选择一个规则'
                } else if (data.message.includes('data_sources') && data.message.includes('至少需要')) {
                  errorMessage = '创建模型时至少需要选择一个数据源'
                } else if (data.message.includes('规则代码') || data.message.includes('不存在或不匹配')) {
                  errorMessage = data.message
                } else if (data.message.includes('Invalid pk') || data.message.includes('does not exist')) {
                  errorMessage = '数据源不存在，请检查选择的数据源'
                } else {
                  errorMessage = data.message
                }
              } else if (data.detail) {
                errorMessage = data.detail
              } else if (typeof data === 'object') {
                // 兼容旧格式：尝试提取字段错误
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
          } else if (data) {
            // 处理统一响应格式的错误
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
          let errorMessage = data.message || `创建模型失败: code ${data.code}`
          
          // 检查是否是模型名称重复错误
          if (errorMessage.includes('model_name') && 
              (errorMessage.includes('already exists') || errorMessage.includes('unique'))) {
            errorMessage = '模型名称不能重复'
          } else if (errorMessage.includes('rules') && errorMessage.includes('至少需要')) {
            errorMessage = '创建模型时至少需要选择一个规则'
          } else if (errorMessage.includes('data_sources') && errorMessage.includes('至少需要')) {
            errorMessage = '创建模型时至少需要选择一个数据源'
          } else if (errorMessage.includes('规则代码') || errorMessage.includes('不存在或不匹配')) {
            // 保持原错误消息
          } else if (errorMessage.includes('Invalid pk') || errorMessage.includes('does not exist')) {
            errorMessage = '数据源不存在，请检查选择的数据源'
          }
          
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        // 创建成功，始终使用中文成功消息
        this.$message.success('模型创建成功')
        
        // 重置表单
        this.modelForm = {
          modelName: '',
          modelType: '',
          modelVersion: '',
          selectedRules: [],
          dataSources: [],
          isDelete: false
        }
        this.tempAvailableSelected = []
        this.tempSelectedRules = []
        this.availableRuleSearch = ''
        this.selectedRuleSearch = ''
        
        // 清除表单验证状态
        this.$nextTick(() => {
          if (this.$refs.modelForm) {
            this.$refs.modelForm.clearValidate()
          }
        })
        
        // 刷新模型列表
        this.fetchModelList()
      } catch (error) {
        console.error('创建模型错误:', error)
        this.$message.error(error.message || '创建模型失败，请稍后重试')
        throw error // 抛出错误，让 handleSubmit 知道创建失败，不关闭对话框
      }
    },
    // 更新模型
    async handleUpdateModel() {
      if (!this.modelForm.id) {
        this.$message.error('未找到要更新的模型ID')
        return
      }
      
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      try {
        // 先获取当前模型详情，确保包含所有字段
        const getResponse = await fetch(`/api/v1/rule-models/${this.modelForm.id}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        // 读取响应文本
        const getText = await getResponse.text()
        let getData = null
        
        // 尝试解析 JSON
        try {
          getData = getText ? JSON.parse(getText) : null
        } catch (e) {
          throw new Error(`服务器返回了非 JSON 格式的响应 (${getResponse.status})`)
        }
        
        // 打印响应用于调试
        console.log('获取模型详情响应状态:', getResponse.status)
        console.log('获取模型详情响应数据:', getData)
        
        if (!getResponse.ok) {
          let errorMessage = `获取模型详情失败: ${getResponse.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (getData && getData.code !== undefined && getData.message) {
            errorMessage = getData.message
          } else if (getResponse.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (getResponse.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能查看模型详情'
          } else if (getResponse.status === 404) {
            errorMessage = '模型不存在'
            if (getData && getData.message) {
              errorMessage = getData.message
            } else if (getData && getData.detail) {
              errorMessage = getData.detail
            }
          } else if (getData) {
            if (getData.detail) {
              errorMessage = getData.detail
            } else if (getData.message) {
              errorMessage = getData.message
            } else if (getData.error) {
              errorMessage = getData.error
            }
          }
          
          throw new Error(errorMessage)
        }
        
        // 检查响应码（统一响应格式中的 code 字段）
        if (getData && getData.code !== undefined && getData.code !== 0) {
          // code 非0表示错误
          const errorMessage = getData.message || `获取模型详情失败: code ${getData.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        let currentData = null
        if (getData && getData.code === 0 && getData.data) {
          currentData = getData.data
        } else if (getData && getData.id) {
          // 兼容旧格式：数据直接在 getData 中
          currentData = getData
        }
        
        if (!currentData) {
          throw new Error('无法解析模型详情数据')
        }
        
        // 构建 rules 数组，格式: [{ rule_code: "...", rule_name: "..." }]
        const rules = this.modelForm.selectedRules.map(ruleCode => {
          const rule = this.allRules.find(r => r.ruleCode === ruleCode)
          if (!rule) {
            throw new Error(`规则 ${ruleCode} 未找到，请刷新页面后重试`)
          }
          if (!rule.ruleCode || !rule.ruleName) {
            throw new Error(`规则 ${ruleCode} 的代码或名称未找到，请刷新页面后重试`)
          }
          return {
            rule_code: rule.ruleCode,  // 使用规则对象中的ruleCode
            rule_name: rule.ruleName   // 使用规则对象中的ruleName
          }
        })
        
        // 构建 data_sources 数组，格式: [{ data: id }]
        const dataSources = this.modelForm.dataSources.map(dataId => ({
          data: dataId
        }))
        
        // 构建请求体，包含所有必需字段
        const requestData = {
          model_name: this.modelForm.modelName,
          model_type: this.modelForm.modelType,
          model_version: this.modelForm.modelVersion || '1.0',
          rules: rules,
          data_sources: dataSources,
          status: currentData.status || 'active',
          execution_order: currentData.execution_order || 'sequential'
        }
        
        // 添加可选字段（如果存在）
        if (currentData.model_description) {
          requestData.model_description = currentData.model_description
        }
        if (currentData.effective_time) {
          requestData.effective_time = currentData.effective_time
        }
        if (currentData.expiry_time) {
          requestData.expiry_time = currentData.expiry_time
        }
        
        // 打印请求数据用于调试
        console.log('更新模型请求数据:', JSON.stringify(requestData, null, 2))
        
        const response = await fetch(`/api/v1/rule-models/${this.modelForm.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })
        
        const text = await response.text()
        let data = null
        
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
        
        // 打印响应用于调试
        console.log('更新模型响应状态:', response.status)
        console.log('更新模型响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `更新模型失败: ${response.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (data && data.code !== undefined && data.message) {
            errorMessage = data.message
          } else if (response.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能更新模型'
          } else if (response.status === 404) {
            errorMessage = '模型不存在'
            if (data && data.message) {
              errorMessage = data.message
            } else if (data && data.detail) {
              errorMessage = data.detail
            }
          } else if (response.status === 400) {
            // 参数错误
            if (data) {
              // 处理统一响应格式的错误
              if (data.code !== undefined && data.message) {
                errorMessage = data.message
              } else if (data.detail) {
                errorMessage = data.detail
              } else if (typeof data === 'object') {
                // 兼容旧格式：尝试提取字段错误
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
          } else if (data) {
            // 处理统一响应格式的错误
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
          const errorMessage = data.message || `更新模型失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        // 更新成功，始终使用中文成功消息
        this.$message.success('模型更新成功')
        // 刷新模型列表
        this.fetchModelList()
      } catch (error) {
        console.error('更新模型错误:', error)
        this.$message.error(error.message || '更新模型失败，请稍后重试')
        throw error // 抛出错误，让 handleSubmit 知道更新失败，不关闭对话框
      }
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1 // 改变每页数量时重置到第一页
      this.fetchModelList()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchModelList()
    },
    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) {
        return '-'
      }
      try {
        const date = new Date(dateTime)
        if (isNaN(date.getTime())) {
          return dateTime
        }
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      } catch (error) {
        console.error('日期格式化错误:', error)
        return dateTime
      }
    }
  }
}
</script>

<style scoped>
.model-base {
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

/* 规则穿梭框 */
.rule-transfer-item {
  margin-bottom: 22px;
}

.transfer-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.transfer-panel {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.panel-header {
  background-color: #f5f7fa;
  padding: 10px 15px;
  font-weight: 500;
  border-bottom: 1px solid #dcdfe6;
}

.panel-body {
  height: 300px;
  overflow-y: auto;
  padding: 5px 10px;
}

.rule-item {
  margin-bottom: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
  text-align: left;
}

.rule-item .el-checkbox {
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  display: flex;
  align-items: center;
}

.rule-item .el-checkbox__label {
  padding-left: 8px;
  flex: 1;
  text-align: left;
}

.rule-item:hover {
  background-color: #f5f7fa;
}

.transfer-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-section {
    flex-direction: column;
  }

  .search-form {
    min-width: 100%;
  }

  .transfer-container {
    flex-direction: column;
  }

  .transfer-buttons {
    flex-direction: row;
    width: 100%;
    justify-content: center;
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
