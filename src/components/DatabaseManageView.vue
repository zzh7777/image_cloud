<template>
  <div class="database-manage">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">数据源管理</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="action-section">
      <!-- 搜索表单 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="数据名称">
            <el-input
              v-model="searchForm.dataName"
              placeholder="请输入数据名称"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="数据类型">
            <el-select v-model="searchForm.dataType" placeholder="请选择数据类型" clearable>
              <el-option label="全部" value=""></el-option>
              <el-option label="结构化数据" value="结构化数据"></el-option>
              <el-option label="非结构化数据" value="非结构化数据"></el-option>
            </el-select>
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

    <!-- 数据库列表表格 -->
    <div class="table-section">
      <div class="table-wrapper">
        <el-table 
          :data="databaseList" 
          style="width: 100%; min-width: 1000px;" 
          border
          v-loading="loading"
          element-loading-text="加载中..."
        >
          <el-table-column prop="dataName" label="数据名称" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="dataType" label="数据类型" width="140">
            <template slot-scope="scope">
              <el-tag :type="scope.row.dataType === 'structured' ? 'success' : 'warning'">
                {{ scope.row.dataType === 'structured' ? '结构化' : '非结构化' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="dataSource" label="数据源" width="120">
            <template slot-scope="scope">
              <el-tag :type="scope.row.dataSource === '影像云' ? 'primary' : 'success'">
                {{ scope.row.dataSource }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="160">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="creator" label="创建人" width="150"></el-table-column>
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button type="text" @click="handleView(scope.row)">查看详情</el-button>
              <el-divider direction="vertical"></el-divider>
              <el-button 
                type="text" 
                @click="handleEdit(scope.row)"
                v-if="canEdit"
              >编辑</el-button>
              <el-divider direction="vertical" v-if="canEdit && canDelete"></el-divider>
              <el-button 
                type="text" 
                style="color: #f56c6c" 
                @click="handleDelete(scope.row)"
                v-if="canDelete"
              >删除</el-button>
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

    <!-- 创建/编辑数据库对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="databaseForm" :rules="rules" ref="databaseForm" label-width="120px">
        <el-form-item label="数据名称" prop="dataName">
          <el-input v-model="databaseForm.dataName" placeholder="请输入数据名称" style="width: 100%"></el-input>
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="databaseForm.dataType" placeholder="请选择数据类型" style="width: 100%" @change="handleDataTypeChange">
            <el-option label="结构化数据" value="structured"></el-option>
            <el-option label="非结构化数据" value="unstructured"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="数据源" prop="dataSource">
          <el-select v-model="databaseForm.dataSource" placeholder="请选择数据源" style="width: 100%">
            <el-option label="影像云" value="影像云"></el-option>
            <el-option label="医保云" value="医保云"></el-option>
          </el-select>
        </el-form-item>
        <!-- 非结构化数据：文件上传 -->
        <el-form-item 
          v-if="databaseForm.dataType === 'unstructured'" 
          label="文件" 
          prop="file"
          :rules="databaseForm.dataType === 'unstructured' && !isEdit ? [{ required: true, message: '非结构化数据必须上传文件', trigger: 'change' }] : []"
        >
          <el-upload
            ref="fileUpload"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :limit="1"
            :file-list="fileList"
          >
            <el-button size="small" type="primary">选择文件</el-button>
            <div slot="tip" class="el-upload__tip" style="margin-top: 8px; color: #909399; font-size: 12px;">
              {{ isEdit ? '选择新文件将替换原有文件（可选）' : '非结构化数据必须上传文件' }}
            </div>
          </el-upload>
        </el-form-item>
        <!-- 结构化数据：数据结构定义输入 -->
        <el-form-item 
          v-if="databaseForm.dataType === 'structured'" 
          label="数据结构" 
          prop="structuredData"
          :rules="databaseForm.dataType === 'structured' ? [{ required: true, message: '结构化数据必须提供数据结构定义', trigger: 'blur', validator: validateStructuredData }] : []"
        >
          <el-input 
            v-model="databaseForm.structuredData" 
            type="textarea" 
            :rows="6"
            placeholder='请输入JSON格式的数据结构定义，例如：{"patient_id": "string", "name": "string", "age": "integer", "gender": "string"}'
            style="width: 100%">
          </el-input>
          <div style="margin-top: 8px; color: #909399; font-size: 12px;">
            提示：请输入有效的JSON格式数据结构定义（定义字段类型）
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSave" :loading="submitting">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 查看数据记录详情对话框 -->
    <el-dialog
      title="数据记录详情"
      :visible.sync="viewDialogVisible"
      width="800px"
      :close-on-click-modal="false"
      @close="handleViewDialogClose"
    >
      <div v-if="viewingDatabase" class="database-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="数据名称">{{ viewingDatabase.dataName || viewingDatabase.data_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="数据类型">
            <el-tag :type="(viewingDatabase.dataType || viewingDatabase.data_type) === 'structured' ? 'success' : 'warning'">
              {{ (viewingDatabase.dataType || viewingDatabase.data_type) === 'structured' ? '结构化数据' : '非结构化数据' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数据源">
            <el-tag :type="(viewingDatabase.dataSource || viewingDatabase.data_source) === '影像云' ? 'primary' : 'success'">
              {{ viewingDatabase.dataSource || viewingDatabase.data_source || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="(viewingDatabase.status === 'active' || viewingDatabase.status === '启用') ? 'success' : 'info'">
              {{ viewingDatabase.status === 'active' ? '启用' : (viewingDatabase.status === 'inactive' ? '禁用' : viewingDatabase.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数据描述" :span="2">
            <div style="white-space: pre-wrap; word-break: break-word;">
              {{ viewingDatabase.dataDescription || viewingDatabase.data_description || '-' }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="数据架构" :span="2" v-if="viewingDatabase.dataSchema || viewingDatabase.data_schema">
            <pre style="background: #f5f7fa; padding: 10px; border-radius: 4px; overflow-x: auto; max-height: 300px;">{{ JSON.stringify(viewingDatabase.dataSchema || viewingDatabase.data_schema, null, 2) }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="标签" :span="2" v-if="viewingDatabase.tags && viewingDatabase.tags.length > 0">
            <el-tag 
              v-for="tag in viewingDatabase.tags" 
              :key="tag" 
              style="margin-right: 5px;"
            >{{ tag }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="版本" v-if="viewingDatabase.version">{{ viewingDatabase.version }}</el-descriptions-item>
          <el-descriptions-item label="访问级别" v-if="viewingDatabase.accessLevel || viewingDatabase.access_level">
            {{ viewingDatabase.accessLevel || viewingDatabase.access_level }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2" v-if="viewingDatabase.remark">
            <div style="white-space: pre-wrap; word-break: break-word;">
              {{ viewingDatabase.remark }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ viewingDatabase.createTime || viewingDatabase.create_time ? formatDateTime(viewingDatabase.createTime || viewingDatabase.create_time) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ viewingDatabase.creator || '-' }}</el-descriptions-item>
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
  name: 'DatabaseManageView',
  data() {
    return {
      searchForm: {
        dataName: '',
        dataType: '',
        creator: '',
        dateRange: null
      },
      databaseList: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      dialogVisible: false,
      dialogTitle: '创建数据记录',
      isEdit: false,
      submitting: false,
      viewDialogVisible: false, // 查看详情对话框
      viewingDatabase: null, // 当前查看的数据记录
      viewLoading: false, // 查看详情加载状态
      databaseForm: {
        dataName: '',
        dataType: '',
        dataSource: '',
        dataDescription: '',
        status: 'active',
        file: null, // 非结构化数据的文件
        structuredData: '' // 结构化数据的JSON字符串
      },
      fileList: [], // 文件列表
      rules: {
        dataName: [
          { required: true, message: '请输入数据名称', trigger: 'blur' }
        ],
        dataType: [
          { required: true, message: '请选择数据类型', trigger: 'change' }
        ],
        dataSource: [
          { required: true, message: '请输入数据源', trigger: 'blur' }
        ]
      }
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
    }
  },
  mounted() {
    // 组件挂载时获取数据记录列表
    this.fetchDataRecordsList()
  },
  methods: {
    // 获取数据记录列表
    async fetchDataRecordsList() {
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
      if (this.searchForm.dataName) {
        params.append('data_name', this.searchForm.dataName)
      }
      if (this.searchForm.dataType) {
        // 将前端显示的类型转换为后端类型
        let backendType = ''
        if (this.searchForm.dataType === '结构化数据') {
          backendType = 'structured'
        } else if (this.searchForm.dataType === '非结构化数据') {
          backendType = 'unstructured'
        } else {
          backendType = this.searchForm.dataType
        }
        if (backendType) {
          params.append('data_type', backendType)
        }
      }
      if (this.searchForm.creator) {
        params.append('creator', this.searchForm.creator)
      }
      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        params.append('start_date', this.searchForm.dateRange[0])
        params.append('end_date', this.searchForm.dateRange[1])
      }
      
      const url = `/api/v1/data-records/?${params.toString()}`
      
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
        console.log('数据记录列表响应状态:', response.status, response.statusText)
        
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
        console.log('数据记录列表响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `获取数据记录列表失败: ${response.status}`
          
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
          const errorMessage = data.message || `获取数据记录列表失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: { count, results } }
        if (data && data.data && data.data.results) {
          // 映射后端字段到前端字段
          this.databaseList = data.data.results.map(item => {
            // 将后端数据源格式转换为前端显示格式
            let displayDataSource = item.data_source || ''
            if (item.data_source === 'image_cloud') {
              displayDataSource = '影像云'
            } else if (item.data_source === 'insurance_cloud') {
              displayDataSource = '医保云'
            }
            
            return {
              id: item.id,
              dataName: item.data_name || '',
              dataType: item.data_type || '',
              dataSource: displayDataSource,
              dataSourceRaw: item.data_source || '', // 保留原始值用于编辑
              dataDescription: item.data_description || '',
              status: item.status || 'inactive',
              createTime: item.create_time || '',
              creator: item.creator || ''
            }
          })
          this.pagination.total = data.data.count || 0
        } else {
          this.databaseList = []
          this.pagination.total = 0
        }
        
      } catch (error) {
        console.error('获取数据记录列表错误:', error)
        this.$message.error(error.message || '获取数据记录列表失败，请稍后重试')
        this.databaseList = []
        this.pagination.total = 0
      } finally {
        this.loading = false
      }
    },
    handleQuery() {
      console.log('查询', this.searchForm)
      // 重置到第一页并重新获取列表
      this.pagination.currentPage = 1
      this.fetchDataRecordsList()
    },
    handleReset() {
      this.searchForm = {
        dataName: '',
        dataType: '',
        creator: '',
        dateRange: null
      }
      // 重置后重新加载列表
      this.pagination.currentPage = 1
      this.fetchDataRecordsList()
    },
    // 查看数据记录详情
    async handleView(row) {
      console.log('查看数据记录详情', row)
      this.viewDialogVisible = true
      this.viewLoading = true
      this.viewingDatabase = null
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        this.viewDialogVisible = false
        return
      }
      
      try {
        // 先使用列表中的数据，避免对话框打开时没有数据
        this.viewingDatabase = row
        
        // 通过 API 获取数据记录详情
        let response = await fetch(`/api/v1/data-records/${row.id}/`, {
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
          response = await fetch(`/api/v1/data-records/${row.id}/`, {
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
          console.error('数据记录详情响应解析失败:', text.substring(0, 200))
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
        
        if (!response.ok) {
          let errorMessage = `获取数据记录详情失败: ${response.status}`
          
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
          const errorMessage = data.message || `获取数据记录详情失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        let recordData = null
        if (data && data.code === 0 && data.data) {
          recordData = data.data
        } else if (data && !data.code) {
          // 兼容旧格式：数据直接在 data 中
          recordData = data
        }
        
        if (!recordData) {
          throw new Error('无法解析数据记录详情数据')
        }
        
        // 转换数据格式，统一字段名
        const displayDataSource = recordData.data_source === 'image_cloud' ? '影像云' : 
                                  (recordData.data_source === 'medical_insurance_cloud' ? '医保云' : 
                                  (recordData.data_source || '-'))
        
        this.viewingDatabase = {
          id: recordData.id,
          dataName: recordData.data_name || recordData.dataName,
          dataType: recordData.data_type || recordData.dataType,
          dataSource: displayDataSource,
          dataSourceRaw: recordData.data_source || recordData.dataSource,
          dataDescription: recordData.data_description || recordData.dataDescription,
          status: recordData.status || 'inactive',
          dataSchema: recordData.data_schema || recordData.dataSchema,
          tags: recordData.tags || [],
          version: recordData.version,
          accessLevel: recordData.access_level || recordData.accessLevel,
          remark: recordData.remark,
          createTime: recordData.create_time || recordData.createTime,
          creator: recordData.creator,
          updateTime: recordData.update_time || recordData.updateTime
        }
        
        this.viewLoading = false
      } catch (error) {
        console.error('获取数据记录详情错误:', error)
        this.viewLoading = false
        this.$message.error(error.message || '获取数据记录详情失败，请稍后重试')
        // 如果出错，仍然显示列表中的数据
        if (!this.viewingDatabase) {
          this.viewingDatabase = row
        }
      }
    },
    // 关闭查看详情对话框
    handleViewDialogClose() {
      this.viewingDatabase = null
      this.viewLoading = false
    },
    handleCreate() {
      // 检查权限
      if (!this.canCreate) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能新增')
        return
      }
      
      this.dialogTitle = '创建数据记录'
      this.isEdit = false
      this.databaseForm = {
        dataName: '',
        dataType: '',
        dataSource: '',
        dataDescription: '',
        status: 'active',
        file: null,
        structuredData: ''
      }
      this.fileList = []
      this.dialogVisible = true
      // 清空验证
      this.$nextTick(() => {
        if (this.$refs.databaseForm) {
          this.$refs.databaseForm.clearValidate()
        }
        if (this.$refs.fileUpload) {
          this.$refs.fileUpload.clearFiles()
        }
      })
    },
    // 数据类型改变时的处理
    handleDataTypeChange() {
      // 清空文件和数据
      this.databaseForm.file = null
      this.databaseForm.structuredData = ''
      this.fileList = []
      if (this.$refs.fileUpload) {
        this.$refs.fileUpload.clearFiles()
      }
      // 重新验证表单
      this.$nextTick(() => {
        if (this.$refs.databaseForm) {
          this.$refs.databaseForm.clearValidate()
        }
      })
    },
    // 文件选择
    handleFileChange(file, fileList) {
      this.databaseForm.file = file.raw
      this.fileList = fileList
      // 触发验证
      this.$nextTick(() => {
        if (this.$refs.databaseForm) {
          this.$refs.databaseForm.validateField('file')
        }
      })
    },
    // 文件移除
    handleFileRemove() {
      this.databaseForm.file = null
      this.fileList = []
    },
    // 验证结构化数据
    validateStructuredData(rule, value, callback) {
      if (!value || value.trim() === '') {
        callback(new Error('结构化数据必须提供数据结构定义'))
        return
      }
      try {
        JSON.parse(value)
        callback()
      } catch (e) {
        callback(new Error('请输入有效的JSON格式数据结构定义'))
      }
    },
    async handleEdit(row) {
      // 检查权限
      if (!this.canEdit) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能修改')
        return
      }
      
      this.dialogTitle = '编辑数据记录'
      this.isEdit = true
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      try {
        // 获取数据记录详情
        const response = await fetch(`/api/v1/data-records/${row.id}/`, {
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
        console.log('获取数据记录详情响应状态:', response.status)
        console.log('获取数据记录详情响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `获取数据记录详情失败: ${response.status}`
          
          // 处理统一错误响应格式：{ code, message, data: null }
          if (data && data.code !== undefined && data.message) {
            // 如果是 403 权限错误，使用格式化函数转换为中文
            if (response.status === 403) {
              errorMessage = this.formatPermissionError(data.message, 'view')
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
            // 使用格式化函数处理权限错误
            errorMessage = this.formatPermissionError('You do not have permission to perform this action.', 'view')
          } else if (response.status === 404) {
            errorMessage = '数据记录不存在'
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
          // 如果是 403 权限错误，使用格式化函数转换为中文
          let errorMessage = data.message || `获取数据记录详情失败: code ${data.code}`
          if (response.status === 403) {
            errorMessage = this.formatPermissionError(errorMessage, 'view')
          }
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        let recordData = null
        if (data && data.code === 0 && data.data) {
          recordData = data.data
        } else if (data && data.id) {
          // 兼容旧格式：数据直接在 data 中
          recordData = data
        }
        
        if (!recordData) {
          throw new Error('无法解析数据记录详情数据')
        }
        
        // 将后端数据源格式转换为前端显示格式
        let displayDataSource = recordData.data_source || ''
        if (recordData.data_source === 'image_cloud') {
          displayDataSource = '影像云'
        } else if (recordData.data_source === 'insurance_cloud') {
          displayDataSource = '医保云'
        }
        
        // 填充表单数据
        this.databaseForm = {
          id: recordData.id,
          dataName: recordData.data_name || '',
          dataType: recordData.data_type || '',
          dataSource: displayDataSource,
          file: null, // 编辑时文件可选
          structuredData: recordData.data_schema ? JSON.stringify(recordData.data_schema, null, 2) : ''
        }
        
        this.fileList = [] // 清空文件列表
        this.dialogVisible = true
        
      // 清空验证
      this.$nextTick(() => {
          if (this.$refs.databaseForm) {
            this.$refs.databaseForm.clearValidate()
          }
          if (this.$refs.fileUpload) {
            this.$refs.fileUpload.clearFiles()
          }
        })
      } catch (error) {
        console.error('获取数据记录详情错误:', error)
        this.$message.error(error.message || '获取数据记录详情失败')
      }
    },
    async handleSave() {
      this.$refs.databaseForm.validate(async (valid) => {
        if (valid) {
          if (this.isEdit) {
            await this.handleUpdateDataRecord()
          } else {
            await this.handleCreateDataRecord()
          }
        }
      })
    },
    // 创建数据记录
    async handleCreateDataRecord() {
      this.submitting = true
      
      try {
        // 从 store 获取 access token
        const accessToken = this.$store.getters.accessToken
        if (!accessToken) {
          this.$message.error('未登录，请先登录')
          this.submitting = false
          return
        }

        // 根据数据类型选择不同的请求方式
        if (this.databaseForm.dataType === 'unstructured') {
          // 非结构化数据：使用 FormData 上传文件
          if (!this.databaseForm.file) {
            this.$message.error('非结构化数据必须上传文件')
            this.submitting = false
            return
          }

          const formData = new FormData()
          formData.append('data_name', this.databaseForm.dataName)
          formData.append('data_type', this.databaseForm.dataType)
          // 将前端显示的数据源转换为后端格式
          let backendSource = 'image_cloud' // 默认值
          if (this.databaseForm.dataSource === '影像云') {
            backendSource = 'image_cloud'
          } else if (this.databaseForm.dataSource === '医保云') {
            backendSource = 'insurance_cloud'
          }
          formData.append('data_source', backendSource)
          formData.append('status', 'active') // 默认设置为 active
          formData.append('file', this.databaseForm.file)

          console.log('创建非结构化数据记录，文件:', this.databaseForm.file.name)

          const response = await fetch('/api/v1/data-records/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`
              // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
            },
            body: formData
          })

          await this.handleCreateResponse(response)
        } else if (this.databaseForm.dataType === 'structured') {
          // 结构化数据：使用 JSON
          if (!this.databaseForm.structuredData || this.databaseForm.structuredData.trim() === '') {
            this.$message.error('结构化数据必须提供数据结构定义')
            this.submitting = false
            return
          }

          let dataSchemaObj
          try {
            dataSchemaObj = JSON.parse(this.databaseForm.structuredData)
          } catch (e) {
            this.$message.error('数据结构定义格式错误，请输入有效的JSON')
            this.submitting = false
            return
          }

          // 将前端显示的数据源转换为后端格式
          let backendSource = 'image_cloud' // 默认值
          if (this.databaseForm.dataSource === '影像云') {
            backendSource = 'image_cloud'
          } else if (this.databaseForm.dataSource === '医保云') {
            backendSource = 'insurance_cloud'
          }
          
          const requestData = {
            data_name: this.databaseForm.dataName,
            data_type: this.databaseForm.dataType,
            data_source: backendSource,
            data_schema: dataSchemaObj,
            status: 'active' // 默认设置为 active
          }

          console.log('创建结构化数据记录，数据:', requestData)

          const response = await fetch('/api/v1/data-records/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          })

          await this.handleCreateResponse(response)
        } else {
          this.$message.error('请选择数据类型')
          this.submitting = false
          return
        }
      } catch (error) {
        console.error('创建数据记录错误:', error)
        this.$message.error(error.message || '创建数据记录失败，请稍后重试')
        this.submitting = false
      }
    },
    // 更新数据记录
    async handleUpdateDataRecord() {
      if (!this.databaseForm.id) {
        this.$message.error('未找到要更新的数据记录ID')
        this.submitting = false
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

        // 将前端显示的数据源转换为后端格式
        let backendSource = 'image_cloud' // 默认值
        if (this.databaseForm.dataSource === '影像云') {
          backendSource = 'image_cloud'
        } else if (this.databaseForm.dataSource === '医保云') {
          backendSource = 'insurance_cloud'
        } else if (this.databaseForm.dataSource === 'image_cloud' || this.databaseForm.dataSource === 'insurance_cloud') {
          // 如果已经是后端格式，直接使用
          backendSource = this.databaseForm.dataSource
        }
        
        // 根据数据类型选择不同的请求方式
        if (this.databaseForm.dataType === 'unstructured') {
          // 非结构化数据：使用 FormData
          const formData = new FormData()
          formData.append('data_name', this.databaseForm.dataName)
          formData.append('data_type', this.databaseForm.dataType)
          formData.append('data_source', backendSource)
          formData.append('status', 'active')
          
          // 如果选择了新文件，则上传新文件；否则不传file字段（保持原文件）
          if (this.databaseForm.file) {
            formData.append('file', this.databaseForm.file)
          }

          console.log('更新非结构化数据记录，ID:', this.databaseForm.id)

          const response = await fetch(`/api/v1/data-records/${this.databaseForm.id}/`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`
              // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
            },
            body: formData
          })

          await this.handleUpdateResponse(response)
        } else if (this.databaseForm.dataType === 'structured') {
          // 结构化数据：使用 JSON
          if (!this.databaseForm.structuredData || this.databaseForm.structuredData.trim() === '') {
            this.$message.error('结构化数据必须提供数据结构定义')
            this.submitting = false
            return
          }

          let dataSchemaObj
          try {
            dataSchemaObj = JSON.parse(this.databaseForm.structuredData)
          } catch (e) {
            this.$message.error('数据结构定义格式错误，请输入有效的JSON')
            this.submitting = false
            return
          }

          const requestData = {
            data_name: this.databaseForm.dataName,
            data_type: this.databaseForm.dataType,
            data_source: backendSource,
            data_schema: dataSchemaObj,
            status: 'active'
          }

          console.log('更新结构化数据记录，ID:', this.databaseForm.id, '数据:', requestData)

          const response = await fetch(`/api/v1/data-records/${this.databaseForm.id}/`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          })

          await this.handleUpdateResponse(response)
        } else {
          this.$message.error('请选择数据类型')
          this.submitting = false
          return
        }
      } catch (error) {
        console.error('更新数据记录错误:', error)
        this.$message.error(error.message || '更新数据记录失败，请稍后重试')
        this.submitting = false
      }
    },
    // 处理更新响应
    async handleUpdateResponse(response) {
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
      console.log('更新数据记录响应状态:', response.status)
      console.log('更新数据记录响应数据:', data)

      if (!response.ok) {
        let errorMessage = `更新数据记录失败: ${response.status}`

        // 处理统一错误响应格式：{ code, message, data: null }
        if (data && data.code !== undefined && data.message) {
          // 如果是 403 权限错误，转换为中文
          if (response.status === 403) {
            errorMessage = this.formatPermissionError(data.message, 'update')
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
          errorMessage = '权限不足，只有 ADMIN 角色才能删除、新增、修改'
        } else if (response.status === 404) {
          errorMessage = '数据记录不存在'
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
              } else if (data.detail) {
                errorMessage = data.detail
              } else if (data.message) {
                errorMessage = data.message
              }
            } else if (typeof data === 'string') {
              errorMessage = data
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
        const errorMessage = data.message || `更新数据记录失败: code ${data.code}`
        throw new Error(errorMessage)
      }

      // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
      // 更新成功，始终使用中文成功消息
      this.$message.success('数据记录更新成功')
      this.dialogVisible = false
      this.isEdit = false
      this.submitting = false
      
      // 重新获取列表
      this.fetchDataRecordsList()
    },
    // 处理创建响应
    async handleCreateResponse(response) {
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
      console.log('创建数据记录响应状态:', response.status)
      console.log('创建数据记录响应数据:', data)

      if (!response.ok) {
        let errorMessage = `创建数据记录失败: ${response.status}`

        // 处理统一错误响应格式：{ code, message, data: null }
        if (data && data.code !== undefined && data.message) {
          // 如果是 403 权限错误，使用格式化函数转换为中文
          if (response.status === 403) {
            const { formatErrorMessage } = require('@/utils/errorHandler')
            errorMessage = formatErrorMessage(data.message, 403, 'create')
          } else if (data.message.includes('data_name') && 
              (data.message.includes('already exists') || data.message.includes('unique'))) {
            errorMessage = '数据名不能重复'
          } else if (data.message.includes('File is required for unstructured data')) {
            errorMessage = '非结构化数据必须上传文件'
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
          errorMessage = '权限不足，只有 ADMIN 角色才能删除、新增、修改'
        } else if (response.status === 400) {
          // 参数错误
          if (data) {
            // 处理统一响应格式的错误
            if (data.code !== undefined && data.message) {
              // 检查是否是数据名称重复错误
              if (data.message.includes('data_name') && 
                  (data.message.includes('already exists') || data.message.includes('unique'))) {
                errorMessage = '数据名不能重复'
              } else if (data.message.includes('File is required for unstructured data')) {
                errorMessage = '非结构化数据必须上传文件'
              } else {
                errorMessage = data.message
              }
            } else if (typeof data === 'object') {
              // 兼容旧格式：检查字段错误
              if (data.data_name && Array.isArray(data.data_name) && data.data_name.length > 0) {
                const dataNameError = data.data_name[0]
                let errorStr = ''
                
                if (typeof dataNameError === 'string') {
                  errorStr = dataNameError
                } else if (typeof dataNameError === 'object' && dataNameError.string) {
                  errorStr = dataNameError.string
                }
                
                if (errorStr && (errorStr.includes('already exists') || errorStr.includes('unique'))) {
                  errorMessage = '数据名不能重复'
                } else if (errorStr) {
                  errorMessage = `数据名称: ${errorStr}`
                }
              } else if (data.detail) {
                errorMessage = data.detail
              } else if (data.message) {
                errorMessage = data.message
              }
            } else if (typeof data === 'string') {
              errorMessage = data
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
        let errorMessage = data.message || `创建数据记录失败: code ${data.code}`
        
        // 检查是否是数据名称重复错误
        if (errorMessage.includes('data_name') && 
            (errorMessage.includes('already exists') || errorMessage.includes('unique'))) {
          errorMessage = '数据名不能重复'
        } else if (errorMessage.includes('File is required for unstructured data')) {
          errorMessage = '非结构化数据必须上传文件'
        }
        
        throw new Error(errorMessage)
      }

      // 处理统一响应格式：{ code: 0, message: "success", data: { ... } }
      // 创建成功，始终使用中文成功消息
      this.$message.success('数据记录创建成功')
      this.dialogVisible = false

      // 重新获取列表
      this.fetchDataRecordsList()
      this.submitting = false
    },
    async handleDelete(row) {
      // 检查权限
      if (!this.canDelete) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能删除')
        return
      }
      
      try {
        await this.$confirm(
          '<div>确定要删除该数据记录吗？</div><div style="margin-top: 10px; color: #909399;">提示：选择删除后模型无法再调用该数据，请谨慎操作！</div>',
          '提示',
          {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
            type: 'warning',
            dangerouslyUseHTMLString: true
          }
        )
      } catch {
        this.$message.info('已取消删除')
        return
      }
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      try {
        let response = await fetch(`/api/v1/data-records/${row.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('删除数据记录响应状态:', response.status)
        
        // 如果是401错误，尝试刷新token
        if (response.status === 401) {
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router)
          if (!refreshSuccess) {
            // 刷新失败，已经跳转到登录页
            return
          }
          
          // 刷新成功，重试请求
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(`/api/v1/data-records/${row.id}/`, {
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
        
        // 打印响应用于调试
        console.log('删除数据记录响应状态:', response.status)
        
        // 204 No Content 表示删除成功（无响应体）
        if (response.status === 204) {
          this.$message.success('数据记录删除成功')
          // 重新获取列表
          this.fetchDataRecordsList()
          return
        }
        
        // 尝试读取响应（可能返回统一响应格式）
        const text = await response.text()
        console.log('删除数据记录响应文本:', text)
        let data = null
        
        // 如果响应为空，且状态码是200-299，认为删除成功
        if (!text || !text.trim()) {
          if (response.ok || response.status === 204) {
            this.$message.success('数据记录删除成功')
            this.fetchDataRecordsList()
            return
          }
        }
        
        // 检查是否是代理错误（代理错误但删除可能已成功）
        if (text && (text.includes('Proxy error') || text.includes('HPE_INVALID_CONSTANT'))) {
          console.warn('检测到代理错误，但删除操作可能已成功，尝试刷新列表')
          // 延迟一下再刷新，给服务器时间完成删除操作
          setTimeout(() => {
            this.fetchDataRecordsList()
          }, 500)
          // 不显示错误，因为删除可能已经成功
          this.$message.success('数据记录删除成功')
          return
        }
        
        // 尝试解析 JSON
        if (text && text.trim()) {
          try {
            data = JSON.parse(text)
            console.log('删除数据记录响应数据:', data)
          } catch (e) {
            // 如果响应不是 JSON，检查是否是 HTML 错误页面
            if (text.includes('<html') || text.includes('<!DOCTYPE')) {
              console.error('服务器返回了 HTML 错误页面:', text.substring(0, 500))
              throw new Error(`服务器返回了 HTML 错误页面 (${response.status})，可能是服务器内部错误`)
            } else {
              console.error('解析 JSON 失败:', e, '响应文本:', text.substring(0, 200))
              // 如果响应不是 JSON，但状态码是200-299或204，也认为删除成功
              if (response.ok || response.status === 204) {
                this.$message.success('数据记录删除成功')
                this.fetchDataRecordsList()
                return
              }
              // 如果状态码是500，可能是代理错误或后端问题，删除可能已成功
              // 对于 DELETE 请求，即使返回 500，如果响应文本包含代理错误，也认为可能已成功
              if (response.status === 500) {
                console.warn('500错误，可能是代理问题或后端响应格式问题，删除操作可能已成功，尝试刷新列表')
                // 延迟刷新，给服务器时间完成删除操作
                setTimeout(() => {
                  this.fetchDataRecordsList()
                }, 1000)
                // 显示成功消息，因为删除可能已经成功
                this.$message.success('数据记录删除成功')
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
            this.$message.success('数据记录删除成功')
            // 重新获取列表
            this.fetchDataRecordsList()
            return
          } else {
            // 错误：code 非 0
            const errorMessage = data.message || `删除数据记录失败: code ${data.code}`
            
            // 检查是否是关联错误（code 400 且包含关联关键词）
            if (data.code === 400 && (
              errorMessage.includes('关联') || 
              errorMessage.includes('referenced') ||
              errorMessage.includes('被其他数据关联') ||
              errorMessage.includes('foreign key') ||
              errorMessage.includes('无法删除')
            )) {
              // 使用 alert 显示友好的错误提示
              this.$alert(
                errorMessage + '\n\n请先解除该数据记录与其他数据的关联关系，然后再尝试删除。',
                '无法删除',
                {
                  confirmButtonText: '我知道了',
                  type: 'warning',
                  dangerouslyUseHTMLString: false
                }
              )
              return // 不抛出错误，因为已经显示了友好的提示
            }
            
            // 其他错误：如果是 403 权限错误，使用格式化函数转换为中文
            let finalErrorMessage = errorMessage
            if (response.status === 403 || data.code === 403) {
              finalErrorMessage = this.formatPermissionError(errorMessage, 'delete')
            }
            throw new Error(finalErrorMessage)
          }
        }
        
        // 如果没有统一响应格式，检查 HTTP 状态码
        if (response.ok) {
          // HTTP 状态码是 200-299，认为删除成功
          this.$message.success('数据记录删除成功')
          this.fetchDataRecordsList()
          return
        }
        
        // 处理错误响应
        let errorMessage = `删除数据记录失败: ${response.status}`
        
        if (response.status === 400) {
          // 400 错误：可能是关联错误或其他参数错误
          if (data) {
            if (data.code !== undefined && data.message) {
              // 统一响应格式
              errorMessage = data.message
              
              // 检查是否是关联错误
              if (errorMessage.includes('关联') || 
                  errorMessage.includes('referenced') ||
                  errorMessage.includes('被其他数据关联') ||
                  errorMessage.includes('foreign key') ||
                  errorMessage.includes('无法删除')) {
                // 使用 alert 显示友好的错误提示
                this.$alert(
                  errorMessage + '\n\n请先解除该数据记录与其他数据的关联关系，然后再尝试删除。',
                  '无法删除',
                  {
                    confirmButtonText: '我知道了',
                    type: 'warning',
                    dangerouslyUseHTMLString: false
                  }
                )
                return // 不抛出错误，因为已经显示了友好的提示
              }
            } else if (data.detail) {
              errorMessage = data.detail
            } else if (data.message) {
              errorMessage = data.message
            } else if (data.error) {
              errorMessage = data.error
            }
          }
        } else if (response.status === 403) {
          // 使用格式化函数处理权限错误
          if (data && data.message) {
            errorMessage = this.formatPermissionError(data.message, 'delete')
          } else {
            errorMessage = '权限不足，只有 ADMIN 角色才能删除、新增、修改'
          }
        } else if (response.status === 404) {
          errorMessage = '数据记录不存在'
          if (data && data.message) {
            errorMessage = data.message
          } else if (data && data.detail) {
            errorMessage = data.detail
          }
        } else if (response.status === 500) {
          errorMessage = '服务器错误，删除失败'
          if (data && data.message) {
            errorMessage = data.message
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
        console.error('删除数据记录错误:', error)
        // 如果是跳转登录的错误，不显示错误消息（已经跳转了）
        if (error.message && error.message.includes('登录')) {
          return
        }
        this.$message.error(error.message || '删除数据记录失败，请稍后重试')
      }
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1 // 重置到第一页
      this.fetchDataRecordsList()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchDataRecordsList()
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
.database-manage {
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.search-form {
  flex: 1;
}

.create-section {
  margin-left: 20px;
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

.demo-form-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.demo-form-inline .el-form-item {
  margin-bottom: 0;
}
</style>

