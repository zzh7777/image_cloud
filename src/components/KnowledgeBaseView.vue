<template>
  <div class="knowledge-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">知识库</h2>
    </div>

    <!-- 搜索和上传区域 -->
    <div class="action-section">
      <!-- 左侧：搜索表单 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="文件名称">
            <el-input
              v-model="searchForm.fileName"
              placeholder="请输入文件名称"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item label="上传时间">
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

      <!-- 右侧：上传区域 -->
      <div class="upload-section" v-if="canCreate">
        <el-upload
          ref="upload"
          action="#"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :show-file-list="false"
          :limit="1"
          :auto-upload="false"
          :http-request="handleCustomUpload"
          accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
        >
          <el-button 
            slot="trigger" 
            type="primary"
            :loading="uploading"
            @click="handleUploadButtonClick"
          >上传文件</el-button>
        </el-upload>
        <p class="upload-hint">支持扩展名: .doc .docx .pdf .jpg .jpeg .png .txt .xls .xlsx</p>
      </div>
    </div>

    <!-- 文件列表表格 -->
    <div class="table-section">
      <el-table 
        :data="fileList" 
        style="width: 100%" 
        border
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column prop="file_name" label="文件名称" min-width="100" show-overflow-tooltip></el-table-column>
        <el-table-column prop="upload_time" label="上传时间" width="160">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.upload_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploader" label="上传人" width="200"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button 
              type="text" 
              @click="handleView(scope.row)"
              v-if="canView"
            >查看详情</el-button>
            <el-divider direction="vertical" v-if="canView && canDownload"></el-divider>
            <el-button 
              type="text" 
              @click="handleDownload(scope.row)"
              v-if="canDownload"
            >下载</el-button>
            <el-divider direction="vertical" v-if="(canView || canDownload) && canDelete"></el-divider>
            <el-button 
              type="text" 
              style="color: #f56c6c" 
              @click="handleDelete(scope.row)"
              v-if="canDelete"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-section">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        ></el-pagination>
    </div>
    </div>

    <!-- 文件查看对话框 -->
    <el-dialog
      title="文件查看"
      :visible.sync="viewDialogVisible"
      width="80%"
      :close-on-click-modal="false"
      @close="handleViewDialogClose"
    >
      <div v-if="viewingFile" class="file-viewer">
        <!-- 文件信息 -->
        <div class="file-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="文件名称">{{ viewingFile.file_name }}</el-descriptions-item>
            <el-descriptions-item label="文件大小">{{ formatFileSize(viewingFile.file_size) }}</el-descriptions-item>
            <el-descriptions-item label="上传时间">{{ formatDateTime(viewingFile.upload_time) }}</el-descriptions-item>
            <el-descriptions-item label="上传人">{{ viewingFile.uploader }}</el-descriptions-item>
            <el-descriptions-item label="页数">{{ viewingFile.page_count || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 文件预览区域 -->
        <div class="file-preview">
          <div v-if="fileLoading" class="loading-container">
            <i class="el-icon-loading"></i>
            <p>正在加载文件...</p>
          </div>
          <div v-else-if="fileError" class="error-container">
            <i class="el-icon-warning"></i>
            <p>{{ fileError }}</p>
          </div>
          <div v-else-if="isPdfFile" class="pdf-viewer">
            <iframe
              :src="fileViewUrlWithAuth"
              frameborder="0"
              style="width: 100%; height: 600px;"
              @load="handleFileLoad"
              @error="handleFileError"
            ></iframe>
          </div>
          <div v-else-if="isImageFile" class="image-viewer">
            <div v-if="fileLoading" class="loading-container">
              <i class="el-icon-loading"></i>
              <p>正在加载图片...</p>
            </div>
            <img
              v-else
              :src="fileViewUrlWithAuth"
              alt="文件预览"
              style="max-width: 100%; max-height: 600px; display: block; margin: 0 auto; border-radius: 4px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);"
              @load="handleFileLoad"
              @error="handleFileError"
            />
          </div>
          <div v-else-if="isExcelFile" class="excel-viewer" style="width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden;">
            <div v-if="excelSheets.length > 1" class="excel-sheet-tabs" style="margin-bottom: 10px; width: 100%; max-width: 100%; box-sizing: border-box;">
              <el-tabs v-model="currentSheetIndex" @tab-click="handleSheetChange">
                <el-tab-pane
                  v-for="(sheet, index) in excelSheets"
                  :key="index"
                  :label="sheet.name"
                  :name="String(index)"
                ></el-tab-pane>
              </el-tabs>
            </div>
            <div v-if="currentSheetData && currentSheetData.limited" class="excel-limit-warning" style="margin-bottom: 10px; padding: 10px; background-color: #fff7e6; border: 1px solid #ffd591; border-radius: 4px; width: 100%; max-width: 100%; box-sizing: border-box;">
              <i class="el-icon-warning" style="color: #fa8c16;"></i>
              <span style="margin-left: 8px; color: #fa8c16;">
                此工作表共有 {{ currentSheetData.totalRows }} 行、{{ currentSheetData.totalCols }} 列，为提升性能，仅显示前 10 行。
              </span>
            </div>
            <div class="excel-table-container" style="width: 100%; max-width: 100%; max-height: 600px; overflow-x: auto; overflow-y: auto; border: 1px solid #dcdfe6; box-sizing: border-box;">
              <table v-if="excelData && currentSheetData" class="excel-table" style="border-collapse: collapse; table-layout: auto;">
                <thead style="position: sticky; top: 0; z-index: 10; background-color: #f5f7fa;">
                  <tr>
                    <th
                      v-for="(cell, colIndex) in currentSheetData.headers || []"
                      :key="colIndex"
                      style="border: 1px solid #dcdfe6; padding: 10px 12px; background-color: #f5f7fa; font-weight: 600; text-align: left; min-width: 120px; white-space: nowrap;"
                    >
                      {{ cell }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in currentSheetData.rows || []" :key="rowIndex">
                    <td
                      v-for="(cell, colIndex) in row"
                      :key="colIndex"
                      style="border: 1px solid #dcdfe6; padding: 10px 12px; min-width: 120px; word-break: break-word; white-space: normal;"
                    >
                      {{ cell }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else style="padding: 20px; text-align: center; color: #909399;">
                <i class="el-icon-loading"></i>
                <p>正在解析 Excel 文件...</p>
              </div>
            </div>
          </div>
          <div v-else-if="isTxtFile" class="txt-viewer" style="width: 100%; max-width: 100%; box-sizing: border-box; display: flex; align-items: flex-start; justify-content: flex-start;">
            <div v-if="txtContent !== ''" class="txt-content" style="
              width: 100%;
              max-width: 100%;
              max-height: 600px;
              overflow: auto;
              padding: 20px;
              background: #fff;
              border: 1px solid #e4e7ed;
              border-radius: 4px;
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.6;
              color: #333;
              white-space: pre-wrap;
              word-wrap: break-word;
              text-align: left;
            ">{{ txtContent }}</div>
            <div v-else style="padding: 20px; text-align: center; color: #909399;">
              <i class="el-icon-loading"></i>
              <p>正在加载文本文件...</p>
            </div>
          </div>
          <div v-else-if="isDocxFile" class="unsupported-viewer">
            <i class="el-icon-document"></i>
            <p>该文件格式（Word 文档）不支持在线预览</p>
          </div>
          <div v-else class="unsupported-viewer">
            <i class="el-icon-document"></i>
            <p>该文件格式不支持在线预览</p>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 编辑描述对话框 -->
    <el-dialog
      title="编辑描述"
      :visible.sync="editDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      @close="handleEditDialogClose"
    >
      <el-form :model="editForm" :rules="editRules" ref="editForm" label-width="80px">
        <el-form-item label="文件名称">
          <el-input v-model="editForm.file_name" disabled></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            type="textarea"
            v-model="editForm.description"
            :rows="4"
            placeholder="请输入描述信息（可选）"
            maxlength="500"
            show-word-limit
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateDescription" :loading="updating">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'
import { handle401Error } from '@/utils/api'
import { hasEditPermission } from '@/utils/permissions'

export default {
  name: 'KnowledgeBaseView',
  data() {
    return {
      searchForm: {
        fileName: '',
        dateRange: null // [startDate, endDate]
      },
      fileList: [],
      // 分页信息
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0
      },
      loading: false,
      // 允许的文件扩展名
      allowedExtensions: ['.doc', '.docx', '.pdf', '.jpg', '.jpeg', '.png', '.txt', '.xls', '.xlsx'],
      // 当前选中的文件
      selectedFile: null,
      // 上传中状态
      uploading: false,
      // 上传进度
      uploadProgress: 0,
      // 文件查看相关
      viewDialogVisible: false,
      viewingFile: null,
      fileViewUrl: '',
      fileLoading: false,
      fileError: null,
      excelData: null, // Excel 文件解析后的数据
      excelSheets: [], // Excel 工作表列表
      currentSheetIndex: 0, // 当前显示的工作表索引
      txtContent: '', // Txt 文件内容
      // 编辑描述相关
      editDialogVisible: false,
      editingFile: null,
      editForm: {
        file_name: '',
        description: ''
      },
      editRules: {
        description: [
          { max: 500, message: '描述长度不能超过500个字符', trigger: 'blur' }
        ]
      },
      updating: false
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
    // 检查是否有删除权限
    canDelete() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'delete', this.userPermissions)
    },
    // 检查是否有查看详情权限（download 或 preview）
    canView() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'view', this.userPermissions)
    },
    // 检查是否有下载权限
    canDownload() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'download', this.userPermissions)
    },
    // 检查是否有预览权限
    canPreview() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'preview', this.userPermissions)
    },
    // 判断是否为 PDF 文件
    isPdfFile() {
      if (!this.viewingFile) return false
      const fileName = this.viewingFile.file_name.toLowerCase()
      return fileName.endsWith('.pdf')
    },
    // 判断是否为图片文件
    isImageFile() {
      if (!this.viewingFile) return false
      const fileName = this.viewingFile.file_name.toLowerCase()
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
      return imageExtensions.some(ext => fileName.endsWith(ext))
    },
    // 判断是否为 Excel 文件
    isExcelFile() {
      if (!this.viewingFile) return false
      const fileName = this.viewingFile.file_name.toLowerCase()
      return fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    },
    // 判断是否为 Doc/Docx 文件
    isDocxFile() {
      if (!this.viewingFile) return false
      const fileName = this.viewingFile.file_name.toLowerCase()
      return fileName.endsWith('.docx') || fileName.endsWith('.doc')
    },
    // 判断是否为 Txt 文件
    isTxtFile() {
      if (!this.viewingFile) return false
      const fileName = this.viewingFile.file_name.toLowerCase()
      return fileName.endsWith('.txt')
    },
    // 当前工作表的数据
    currentSheetData() {
      if (!this.excelData || !this.excelData.length) return null
      const index = parseInt(this.currentSheetIndex) || 0
      return this.excelData[index] || null
    },
    // 带认证的文件访问 URL
    fileViewUrlWithAuth() {
      // 如果fileViewUrl是Blob URL，直接返回（已经包含认证信息）
      if (this.fileViewUrl && this.fileViewUrl.startsWith('blob:')) {
        return this.fileViewUrl
      }
      // 如果是普通URL，可能需要添加token（保留兼容性）
      if (!this.fileViewUrl) return ''
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) return this.fileViewUrl
      
      // 如果 URL 中已经有参数，使用 &，否则使用 ?
      const separator = this.fileViewUrl.includes('?') ? '&' : '?'
      return `${this.fileViewUrl}${separator}token=${accessToken}`
    }
  },
  mounted() {
    // 组件挂载时获取知识库列表
    this.fetchKnowledgeBaseList()
  },
  methods: {
    // 获取知识库列表
    async fetchKnowledgeBaseList() {
      this.loading = true
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        this.loading = false
        return
      }
      
      // 构建请求 URL，添加分页参数
      // API文档：page_size 最大值为100
      const pageSize = Math.min(this.pagination.pageSize, 100)
      const params = new URLSearchParams({
        page: this.pagination.page.toString(),
        page_size: pageSize.toString()
      })
      
      // 添加搜索条件
      if (this.searchForm.fileName) {
        params.append('file_name', this.searchForm.fileName)
      }
      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        params.append('start_date', this.searchForm.dateRange[0])
        params.append('end_date', this.searchForm.dateRange[1])
      }
      
      const url = `/api/v1/knowledge-base/?${params.toString()}`
      
      try {
        let response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            // 告诉后端只接受 JSON，避免返回 HTML 浏览页面
            'Accept': 'application/json'
          }
        })
        
        // 如果是401错误，尝试刷新token（静默处理）
        if (response.status === 401) {
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
              'Accept': 'application/json'
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
          console.error('响应不是有效的 JSON:', text.substring(0, 200))
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
        
        // 打印响应用于调试
        console.log('知识库列表响应状态:', response.status)
        console.log('知识库列表响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `获取知识库列表失败: ${response.status}`
          
          if (response.status === 401) {
            // 如果到这里还是401，说明重试后仍然失败
            this.$store.commit('clearUser')
            this.$router.push('/login')
            this.loading = false
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能访问'
          } else if (data) {
            // 处理统一错误响应格式：{ code, message, data: null }
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
          const errorMessage = data.message || `获取知识库列表失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code, message, data: { count, next, previous, results } }
        if (data && data.code === 0 && data.data) {
          // 成功响应：数据在 data.data 中
          const responseData = data.data
          if (responseData && responseData.results && Array.isArray(responseData.results)) {
            // 映射响应字段到前端数据（只保留页面展示需要的字段）
            this.fileList = responseData.results.map(item => ({
              id: item.id,
              file_name: item.file_name || '',
              upload_time: item.upload_time || '',
              uploader: item.uploader || '',
              // 保留其他字段用于详情展示
              file_size: item.file_size || 0,
              status: item.status || 'active',
              description: item.description || null,
              page_count: item.page_count || null
            }))
            // 使用 count 字段作为总数
            this.pagination.total = responseData.count || 0
          } else {
            this.fileList = []
            this.pagination.total = 0
          }
        } else if (data && data.results) {
          // 兼容旧格式：数据直接在 data 中（向后兼容）
          this.fileList = data.results.map(item => ({
            id: item.id,
            file_name: item.file_name || '',
            upload_time: item.upload_time || '',
            uploader: item.uploader || '',
            file_size: item.file_size || 0,
            status: item.status || 'active',
            description: item.description || null,
            page_count: item.page_count || null
          }))
          this.pagination.total = data.count || 0
        } else {
          // 错误响应或未知格式
          this.fileList = []
          this.pagination.total = 0
          if (data && data.code !== 0 && data.message) {
            this.$message.error(data.message)
          }
        }
        
      } catch (error) {
        console.error('获取知识库列表错误:', error)
        this.$message.error(error.message || '获取知识库列表失败，请稍后重试')
        this.fileList = []
        this.pagination.total = 0
      } finally {
        this.loading = false
      }
    },
    // 分页大小改变
    handleSizeChange(val) {
      // API文档：page_size 最大值为100
      this.pagination.pageSize = Math.min(val, 100)
      this.pagination.page = 1 // 重置到第一页
      this.fetchKnowledgeBaseList()
    },
    // 当前页改变
    handleCurrentChange(val) {
      this.pagination.page = val
      this.fetchKnowledgeBaseList()
    },
    // 格式化文件大小
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
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
    },
    handleQuery() {
      // 重置到第一页并重新获取数据
      this.pagination.page = 1
      this.fetchKnowledgeBaseList()
    },
    handleReset() {
      this.searchForm = {
        fileName: '',
        dateRange: null
      }
      // 重置后重新获取数据
      this.pagination.page = 1
      this.fetchKnowledgeBaseList()
    },
    // 验证文件类型
    validateFileType(file) {
      const fileName = file.name.toLowerCase()
      const extension = fileName.substring(fileName.lastIndexOf('.'))
      console.log('验证文件类型:', fileName, '扩展名:', extension, 'MIME类型:', file.type)
      
      // 如果文件名没有扩展名，直接报错
      if (!extension || extension === fileName) {
        this.$message.error('文件必须包含扩展名，仅支持: ' + this.allowedExtensions.join(' '))
        return false
      }
      
      if (!this.allowedExtensions.includes(extension)) {
        this.$message.error(`不支持的文件格式，仅支持: ${this.allowedExtensions.join(' ')}`)
        return false
      }
      return true
    },
    // 上传按钮点击事件
    handleUploadButtonClick() {
      // 检查权限
      if (!this.canCreate) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能新增')
        return false
      }
    },
    // 文件选择变化事件（选择后自动上传）
    // eslint-disable-next-line no-unused-vars
    handleFileChange(file, fileList) {
      console.log('文件选择变化:', file, fileList)
      
      // 首先检查权限
      if (!this.canCreate) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能新增')
        // 清空选择的文件
        this.$nextTick(() => {
          if (this.$refs.upload) {
            this.$refs.upload.clearFiles()
          }
        })
        this.selectedFile = null
        return
      }
      
      // 如果正在上传，不允许选择新文件
      if (this.uploading) {
        this.$message.warning('正在上传中，请等待上传完成')
        // 清空当前选择的文件
        this.$nextTick(() => {
          if (this.$refs.upload) {
            this.$refs.upload.clearFiles()
          }
        })
        return
      }
      
      // 检查文件对象
      if (!file || !file.raw) {
        console.error('文件对象无效')
        return
      }
      
      // 验证文件类型
      if (!this.validateFileType(file.raw)) {
        // 验证失败，移除文件
        this.$nextTick(() => {
          if (this.$refs.upload) {
            this.$refs.upload.clearFiles()
          }
        })
        this.selectedFile = null
        return
      }
      
      // 验证文件大小
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (file.raw.size > maxSize) {
        this.$message.error('文件大小不能超过100MB')
        // 移除文件
        this.$nextTick(() => {
          if (this.$refs.upload) {
            this.$refs.upload.clearFiles()
          }
        })
        this.selectedFile = null
        return
      }
      
      // 保存选中的文件
      this.selectedFile = file.raw
      console.log('文件验证通过，已保存文件:', file.name, file.raw)
      
      // 选择文件后自动上传
      this.handleUpload()
    },
    // 文件移除事件
    handleFileRemove() {
      this.selectedFile = null
      console.log('文件已移除')
    },
    // 自定义上传方法（用于 el-upload 组件，但实际上不会调用）
    // eslint-disable-next-line no-unused-vars
    handleCustomUpload(options) {
      // 这个方法是为了满足 el-upload 的 http-request 要求
      // 但实际上我们使用 handleUpload 方法进行手动上传
      // 所以这里不需要做任何事情
      console.log('handleCustomUpload called, but using manual upload instead')
    },
    // 手动触发上传（也用于文件选择后自动上传）
    async handleUpload() {
      // 如果没有选中文件，尝试从 el-upload 获取
      if (!this.selectedFile && this.$refs.upload && this.$refs.upload.uploadFiles && this.$refs.upload.uploadFiles.length > 0) {
        const uploadFile = this.$refs.upload.uploadFiles[0]
        if (uploadFile && uploadFile.raw) {
          this.selectedFile = uploadFile.raw
        }
      }
      
      if (!this.selectedFile) {
        // 如果没有文件，说明是直接点击按钮，不显示警告（因为用户可能只是想选择文件）
        return
      }
      
      // 从 store 获取 access token
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      this.uploading = true
      
        // 构建 FormData
      const formData = new FormData()
        formData.append('file', this.selectedFile)
      
      try {
        // 创建一个带超时的 fetch 请求
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000) // 120秒超时
        
        // 打印调试信息
        console.log('准备上传文件:', {
          fileName: this.selectedFile.name,
          fileSize: this.selectedFile.size,
          fileType: this.selectedFile.type,
          url: '/api/v1/knowledge-base/',
          hasToken: !!accessToken
        })
        
        let response
        try {
          response = await fetch('/api/v1/knowledge-base/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`
              // 注意：不要设置 Content-Type，让浏览器自动设置，以便包含 boundary
            },
            body: formData,
            signal: controller.signal
          })
          
          console.log('上传请求已发送，响应状态:', response.status, response.statusText)
        } catch (fetchError) {
          // 清除超时定时器
          clearTimeout(timeoutId)
          
          console.error('上传请求失败:', {
            error: fetchError,
            name: fetchError.name,
            message: fetchError.message,
            stack: fetchError.stack
          })
          
          // 检查是否是中止错误
          if (fetchError.name === 'AbortError') {
            throw new Error('上传超时，请检查网络连接或尝试上传较小的文件')
          }
          // 重新抛出其他错误
          throw fetchError
        }
        
        // 清除超时定时器
        clearTimeout(timeoutId)
        
        // 读取响应文本
        const text = await response.text()
        let data = null
        
        console.log('响应原始文本:', text.substring(0, 500))
        console.log('响应头:', {
          contentType: response.headers.get('content-type'),
          status: response.status,
          statusText: response.statusText
        })
        
        // 尝试解析 JSON
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('响应不是有效的 JSON:', text.substring(0, 500))
          console.error('JSON 解析错误:', e)
          // 如果响应不是JSON，直接抛出错误
          if (!response.ok) {
            throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status}): ${text.substring(0, 200)}`)
          }
        }
        
        // 打印响应用于调试
        console.log('上传响应状态:', response.status)
        console.log('上传响应数据:', data)
        
        // 处理 401 错误，尝试刷新 token
        if (response.status === 401) {
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (refreshSuccess) {
            // 刷新成功，使用新 token 重试上传
            const newAccessToken = this.$store.getters.accessToken
            console.log('Token 刷新成功，使用新 token 重试上传')
            
            // 重新构建 FormData（因为已经读取过，需要重新创建）
            const retryFormData = new FormData()
            retryFormData.append('file', this.selectedFile)
            
            // 重试请求
            const retryController = new AbortController()
            const retryTimeoutId = setTimeout(() => retryController.abort(), 120000)
            
            try {
              response = await fetch('/api/v1/knowledge-base/', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${newAccessToken}`
                },
                body: retryFormData,
                signal: retryController.signal
              })
              clearTimeout(retryTimeoutId)
              
              // 重新读取响应
              const retryText = await response.text()
              try {
                data = retryText ? JSON.parse(retryText) : null
              } catch (e) {
                console.error('重试响应解析失败:', e)
              }
              
              console.log('重试上传响应状态:', response.status)
              console.log('重试上传响应数据:', data)
              
              // 如果重试后仍然是 401，说明 token 仍然无效
              if (response.status === 401) {
                this.$store.commit('clearUser')
                this.$router.push('/login')
                this.uploading = false
                return
              }
            } catch (retryError) {
              clearTimeout(retryTimeoutId)
              console.error('重试上传失败:', retryError)
              throw retryError
            }
          } else {
            // 刷新失败，已经跳转到登录页
            this.uploading = false
            return
          }
        }
        
        // 检查统一响应格式（优先检查 code 字段）
        if (data && data.code !== undefined) {
          if (data.code !== 0) {
            // code 非 0 表示错误，即使 HTTP 状态码是 200-299
            let errorMessage = data.message || `上传失败: code ${data.code}`
            
            // 根据错误类型提供更友好的提示
            if (errorMessage.includes('file_name') && errorMessage.includes('already exists')) {
              errorMessage = '文件名已存在，请使用不同的文件名'
            } else if (errorMessage.includes('File must be a PDF')) {
              errorMessage = '文件格式错误，必须上传 PDF 文件'
            } else if (errorMessage.includes('This field is required')) {
              errorMessage = '文件缺失，请选择要上传的文件'
            }
            
            throw new Error(errorMessage)
          }
          // code === 0 表示成功，继续处理
        }
        
        // 检查 HTTP 状态码（201 Created 或 200 OK 都表示成功）
        if (!response.ok && response.status !== 201) {
          let errorMessage = `上传失败: ${response.status}`
          
          if (response.status === 401) {
            // 如果到这里还是 401，说明重试后仍然失败
            errorMessage = '认证失败，请重新登录'
            this.$store.commit('clearUser')
            this.$router.push('/login')
            this.uploading = false
            return
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能上传'
          } else if (response.status === 400) {
            // 参数错误
            if (data) {
              if (typeof data === 'object') {
                // 处理统一响应格式
                if (data.code !== undefined && data.message) {
                  errorMessage = data.message
                  // 根据错误类型提供更友好的提示
                  if (errorMessage.includes('file_name') && errorMessage.includes('already exists')) {
                    errorMessage = '文件名已存在，请使用不同的文件名'
                  } else if (errorMessage.includes('File must be a PDF')) {
                    errorMessage = '文件格式错误，必须上传 PDF 文件'
                  } else if (errorMessage.includes('This field is required')) {
                    errorMessage = '文件缺失，请选择要上传的文件'
                  }
                } else if (data.file_name && Array.isArray(data.file_name)) {
                  // 检查是否是文件名重复错误
                  const fileNameError = data.file_name[0]
                  if (fileNameError && fileNameError.includes('already exists')) {
                    errorMessage = '文件名已存在，请使用不同的文件名'
                  } else {
                    errorMessage = `file_name: ${data.file_name.join(', ')}`
                  }
                } else {
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
                  } else if (data.detail) {
                    errorMessage = data.detail
                  } else if (data.message) {
                    errorMessage = data.message
                  }
                }
              } else if (typeof data === 'string') {
                errorMessage = data
              }
            }
          } else if (response.status === 500) {
            // 服务器内部错误
            if (data) {
              let rawError = ''
              if (data.code !== undefined && data.message) {
                rawError = data.message
              } else if (data.detail) {
                rawError = data.detail
              } else if (data.message) {
                rawError = data.message
              } else if (data.error) {
                rawError = data.error
              } else if (typeof data === 'string') {
                rawError = data
              } else {
                rawError = JSON.stringify(data)
              }
              
              // 检查是否是文件名重复错误
              if (rawError.includes('duplicate key') && rawError.includes('file_name')) {
                // 尝试提取文件名
                const fileNameMatch = rawError.match(/Key \(file_name\)=\(([^)]+)\)/)
                if (fileNameMatch && fileNameMatch[1]) {
                  errorMessage = `文件名 "${fileNameMatch[1]}" 已存在，请使用不同的文件名`
                } else {
                  errorMessage = '文件名已存在，请使用不同的文件名'
                }
              } else {
                errorMessage = rawError || '服务器内部错误，请稍后重试'
              }
            } else {
              errorMessage = '服务器内部错误，请稍后重试'
            }
          } else if (data) {
            if (data.code !== undefined && data.message) {
              errorMessage = data.message
            } else if (data.detail) {
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
        
        // 上传成功（201 Created 或 200 OK）
        console.log('上传成功，响应数据:', data)
        this.$message.success('文件上传成功')
      
        // 清空文件选择
        this.selectedFile = null
        
        // 清空 el-upload 的文件列表
      this.$nextTick(() => {
        if (this.$refs.upload) {
          this.$refs.upload.clearFiles()
        }
      })
        
        // 重新获取列表（重置到第一页）
        this.pagination.page = 1
        this.fetchKnowledgeBaseList()
        
      } catch (error) {
        console.error('上传错误:', error)
        
        // 处理不同类型的错误
        let errorMessage = '文件上传失败，请稍后重试'
        
        if (error.message) {
          // 检查是否是网络错误
          if (error.message.includes('Failed to fetch') || 
              error.message.includes('NetworkError') ||
              error.message.includes('Network request failed') ||
              error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = '网络连接失败，请检查：\n1. 网络连接是否正常\n2. 服务器是否可访问\n3. 代理配置是否正确'
          } else if (error.message.includes('timeout') || error.message.includes('超时')) {
            errorMessage = '上传超时，文件可能过大，请稍后重试或尝试上传较小的文件'
          } else {
            errorMessage = error.message
          }
        }
        
        // 使用 alert 显示详细的错误信息（如果是网络错误）
        if (errorMessage.includes('网络连接失败')) {
          this.$alert(errorMessage, '上传失败', {
            confirmButtonText: '我知道了',
            type: 'error'
          })
        } else {
          this.$message.error(errorMessage)
        }
        
        // 上传失败时也清空文件选择，以便下次可以重新选择
        this.selectedFile = null
        this.$nextTick(() => {
          if (this.$refs.upload) {
            this.$refs.upload.clearFiles()
          }
        })
      } finally {
        this.uploading = false
      }
    },
    // el-upload 组件的上传成功回调（保留用于兼容性，但不会被调用）
    // eslint-disable-next-line no-unused-vars
    handleUploadSuccess(response, file) {
      // 这个方法不会被调用，因为我们使用手动上传
    },
    // el-upload 组件的上传失败回调
    // eslint-disable-next-line no-unused-vars
    handleUploadError(error, file) {
      console.error('上传错误:', error)
      this.$message.error('文件上传失败，请重试')
      
      // 清空 el-upload 的文件列表，以便可以再次上传
      this.$nextTick(() => {
        if (this.$refs.upload) {
          this.$refs.upload.clearFiles()
        }
      })
    },
    // el-upload 组件的上传进度回调
    // eslint-disable-next-line no-unused-vars
    handleUploadProgress(event, file) {
      this.uploadProgress = Math.round((event.loaded / event.total) * 100)
    },
    async handleView(row) {
      console.log('查看文件', row)
      // 先使用列表中的数据，避免对话框打开时没有数据
      this.viewingFile = row
      this.viewDialogVisible = true
      this.fileLoading = true
      this.fileError = null
      
      // 获取最新的详情信息（异步更新）
      await this.fetchKnowledgeBaseDetail(row.id)
      
      // 尝试构建文件访问 URL
      // 方案1: 尝试通过后端 API 获取文件
      await this.loadFileForView(this.viewingFile)
    },
    // 获取知识库详情
    async fetchKnowledgeBaseDetail(id) {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }

      try {
        let response = await fetch(`/api/v1/knowledge-base/${id}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        })

        const text = await response.text()
        let data = null

        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('响应不是有效的 JSON:', text.substring(0, 200))
          if (!response.ok) {
            throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
          }
          this.$message.error('响应格式错误')
          return
        }

        // 优先检查统一响应格式中的 code 字段
        if (data && data.code !== undefined && data.code !== 0) {
          // code 非0表示错误
          // 如果是 403 权限错误，使用格式化函数转换为中文
          let errorMessage = data.message || `获取知识库详情失败: code ${data.code}`
          if (response.status === 403) {
            // 检查用户角色，Medical Insurance User 应该有查看权限
            const userRole = this.$store.getters.role
            if (userRole === 'Medical Insurance User' || userRole === 'Medical Insurance Administrator') {
              // 这些角色应该有查看权限，如果后端返回 403，可能是其他原因
              // 但仍然显示友好的错误信息
              errorMessage = this.formatPermissionError(errorMessage, 'view')
            } else {
              errorMessage = this.formatPermissionError(errorMessage, 'view')
            }
          }
          throw new Error(errorMessage)
        }

        // 检查 HTTP 状态码
        if (!response.ok) {
          // 如果是401错误，尝试刷新token
          if (response.status === 401) {
            const refreshSuccess = await handle401Error(this.$store, this.$router)
            if (!refreshSuccess) {
              // 刷新失败，已经跳转到登录页
              return
            }
            
            // 刷新成功，重试请求
            const newAccessToken = this.$store.getters.accessToken
            const retryResponse = await fetch(`/api/v1/knowledge-base/${id}/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${newAccessToken}`,
                'Accept': 'application/json'
              }
            })
            
            // 如果重试后仍然是401，说明token仍然无效
            if (retryResponse.status === 401) {
              this.$store.commit('clearUser')
              this.$router.push('/login')
              return
            }
            
            // 重试成功，更新response和data，继续执行后续的正常处理逻辑
            response = retryResponse
            const retryText = await retryResponse.text()
            try {
              data = retryText ? JSON.parse(retryText) : null
            } catch (e) {
              console.error('解析重试响应失败:', e)
              this.$message.error('响应格式错误')
              return
            }
            
            // 检查重试后的响应码
            if (data && data.code !== undefined && data.code !== 0) {
              // 如果是 403 权限错误，使用格式化函数转换为中文
              let errorMessage = data.message || `获取知识库详情失败: code ${data.code}`
              if (retryResponse.status === 403) {
                errorMessage = this.formatPermissionError(errorMessage, 'view')
              }
              throw new Error(errorMessage)
            }
            
            // 重试成功，继续执行后续的正常处理逻辑（跳过401错误处理）
          } else {
            // 其他错误状态码
            let errorMessage = `获取知识库详情失败: ${response.status}`

            // 处理统一错误响应格式：{ code, message, data: null }
            if (data && data.code !== undefined && data.message) {
              // 如果是 403 权限错误，使用格式化函数转换为中文
              if (response.status === 403) {
                errorMessage = this.formatPermissionError(data.message, 'view')
              } else {
                errorMessage = data.message
              }
            } else if (response.status === 403) {
              // 检查用户角色，Medical Insurance User 应该有查看权限
              const userRole = this.$store.getters.role
              if (userRole === 'Medical Insurance User' || userRole === 'Medical Insurance Administrator') {
                // 这些角色应该有查看权限，如果后端返回 403，显示友好提示
                errorMessage = '无法查看详情，请联系管理员'
              } else {
                errorMessage = '权限不足，只有 ADMIN 角色才能访问'
              }
            } else if (response.status === 404) {
              errorMessage = '知识库不存在'
              if (data && data.message) {
                errorMessage = data.message
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
        }

        // 处理统一响应格式：{ code: 0, message: "success", data: {...} }
        if (data && data.code === 0 && data.data) {
          // 成功响应：数据在 data.data 中
          this.viewingFile = {
            id: data.data.id,
            file_name: data.data.file_name || '',
            file_size: data.data.file_size || 0,
            upload_time: data.data.upload_time || '',
            uploader: data.data.uploader || '',
            status: data.data.status || 'active',
            description: data.data.description || null,
            page_count: data.data.page_count || null,
            // 保存文件 URL（如果有）
            file_url: data.data.file_url || data.data.file || null
          }
          console.log('成功获取知识库详情:', this.viewingFile)
        } else if (data && data.id) {
          // 兼容旧格式：数据直接在 data 中（向后兼容）
          this.viewingFile = {
            id: data.id,
            file_name: data.file_name || '',
            file_size: data.file_size || 0,
            upload_time: data.upload_time || '',
            uploader: data.uploader || '',
            status: data.status || 'active',
            description: data.description || null,
            page_count: data.page_count || null,
            // 保存文件 URL（如果有）
            file_url: data.file_url || data.file || null
          }
          console.log('成功获取知识库详情（旧格式）:', this.viewingFile)
        } else {
          console.error('无法解析知识库详情数据，响应数据:', data)
          throw new Error('无法解析知识库详情数据')
        }
      } catch (error) {
        console.error('获取知识库详情错误:', error)
        this.$message.error(error.message || '获取知识库详情失败，请稍后重试')
        // 如果获取详情失败，viewingFile 已经由 handleView 方法设置了初始值，不需要再次设置
      }
    },
    // 加载文件用于查看（使用预览API）
    async loadFileForView(file) {
      try {
        // 从 store 获取 access token
        const accessToken = this.$store.getters.accessToken
        if (!accessToken) {
          this.fileError = '未登录，请先登录'
          this.fileLoading = false
          return
        }

        // 使用预览API获取文件内容
        // API: GET /api/v1/knowledge-base/{id}/preview/
        // 响应头包含 Content-Disposition: inline，浏览器会在页面中直接显示PDF
        console.log('调用预览 API，文件 ID:', file.id, '权限:', this.userPermissions)
        let response = await fetch(`/api/v1/knowledge-base/${file.id}/preview/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/pdf,application/octet-stream,*/*'
          }
        })

        // 如果是401错误，尝试刷新token（静默处理）
        if (response.status === 401) {
          const refreshSuccess = await handle401Error(this.$store, this.$router, true)
          if (!refreshSuccess) {
            // 刷新失败，已经跳转到登录页
            this.fileLoading = false
            return
          }
          
          // 刷新成功，使用新token重试请求
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(`/api/v1/knowledge-base/${file.id}/preview/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`
            }
          })
          
          // 如果重试后仍然是401，说明token仍然无效
          if (response.status === 401) {
            this.$store.commit('clearUser')
            this.$router.push('/login')
            this.fileLoading = false
            return
          }
        }

        // 打印响应用于调试
        console.log('预览响应状态:', response.status)
        console.log('预览响应头 Content-Type:', response.headers.get('content-type'))
        console.log('预览响应头 Content-Disposition:', response.headers.get('content-disposition'))

        if (!response.ok) {
          let errorMessage = `加载文件失败: ${response.status}`
          
          // 尝试读取错误响应
          const text = await response.text()
          let data = null
          
          try {
            data = text ? JSON.parse(text) : null
          } catch (e) {
            // 响应不是JSON，使用默认错误消息
          }
          
          if (response.status === 401) {
            // 如果到这里还是401，说明重试后仍然失败
            this.$store.commit('clearUser')
            this.$router.push('/login')
            this.fileLoading = false
            return
          } else if (response.status === 403) {
            // 检查用户权限而不是角色
            // 如果有 download 权限，尝试使用下载 API 来获取文件内容
            if (this.canDownload) {
              console.log('预览 API 返回 403，尝试使用下载 API 获取文件内容')
              try {
                const downloadResponse = await fetch(`/api/v1/knowledge-base/${file.id}/download/`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`
                  }
                })
                
                if (downloadResponse.ok) {
                  // 下载 API 成功，获取文件内容
                  const blob = await downloadResponse.blob()
                  
                  // 判断文件类型并处理
                  const fileName = file.file_name.toLowerCase()
                  if (fileName.endsWith('.pdf')) {
                    // PDF 文件，创建 Blob URL
                    this.fileViewUrl = window.URL.createObjectURL(blob)
                    this.fileLoading = false
                    this.fileError = null
                    return
                  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                    // Excel 文件，解析并显示
                    await this.parseExcelFile(blob)
                    this.fileLoading = false
                    this.fileError = null
                    return
                  } else if (fileName.endsWith('.txt')) {
                    // Txt 文件，读取文本内容
                    await this.parseTxtFile(blob)
                    this.fileLoading = false
                    this.fileError = null
                    return
                  } else if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
                    // 图片文件，创建 Blob URL
                    this.fileViewUrl = window.URL.createObjectURL(blob)
                    this.fileLoading = false
                    this.fileError = null
                    return
                  } else {
                    // 其他文件类型，显示提示
                    this.fileError = '该文件格式不支持在线预览，请下载后查看'
                    this.fileLoading = false
                    return
                  }
                } else {
                  // 下载 API 也返回错误
                  console.warn('下载 API 也返回错误:', downloadResponse.status)
                  this.fileError = '无法预览文件内容，但可以查看文件基本信息'
                  this.fileLoading = false
                  return
                }
              } catch (downloadError) {
                console.error('使用下载 API 获取文件失败:', downloadError)
                this.fileError = '无法预览文件内容，但可以查看文件基本信息'
                this.fileLoading = false
                return
              }
            } else if (this.canPreview) {
              // 有 preview 权限但没有 download 权限
              // 如果预览 API 返回 403，可能是后端权限检查有问题
              console.warn('有 preview 权限但预览 API 返回 403，尝试其他方式获取文件')
              
              // 尝试使用详情 API 返回的文件 URL（如果有）
              if (this.viewingFile && this.viewingFile.file_url) {
                // 如果有文件 URL，尝试直接使用
                this.fileViewUrl = this.viewingFile.file_url
                this.fileLoading = false
                this.fileError = null
                return
              }
              
              // 如果没有 file_url，尝试再次调用预览 API，但这次使用不同的方式
              // 可能是后端权限检查的时机问题，或者需要特定的请求头
              console.log('尝试使用 fetch 获取预览内容，即使返回 403 也可能获取到文件内容')
              try {
                // 再次尝试调用预览 API，使用更完整的请求头
                const retryResponse = await fetch(`/api/v1/knowledge-base/${file.id}/preview/`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/pdf,application/octet-stream,image/*,*/*',
                    'Cache-Control': 'no-cache'
                  }
                })
                
                // 即使状态码是 403，也可能返回了文件内容（某些后端实现）
                if (retryResponse.ok || retryResponse.status === 403) {
                  const contentType = retryResponse.headers.get('content-type')
                  // 检查响应是否包含文件内容（而不是错误 JSON）
                  if (contentType && (contentType.includes('pdf') || contentType.includes('image') || contentType.includes('octet-stream'))) {
                    // 获取文件内容
                    const blob = await retryResponse.blob()
                    const fileName = file.file_name.toLowerCase()
                    
                    if (fileName.endsWith('.pdf')) {
                      this.fileViewUrl = window.URL.createObjectURL(blob)
                      this.fileLoading = false
                      this.fileError = null
                      return
                    } else if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
                      this.fileViewUrl = window.URL.createObjectURL(blob)
                      this.fileLoading = false
                      this.fileError = null
                      return
                    }
                  }
                }
              } catch (retryError) {
                console.error('重试预览 API 失败:', retryError)
              }
              
              // 如果以上都失败，显示明确的错误信息
              this.fileError = '无法预览文件内容。您有预览权限，但后端可能未正确配置。请联系管理员检查后端权限设置。'
              this.fileLoading = false
              return
            } else {
              // 既没有 preview 也没有 download 权限
              // 使用格式化函数处理权限错误
              if (data && data.code !== undefined && data.message) {
                errorMessage = this.formatPermissionError(data.message, 'view')
              } else if (data && data.message) {
                errorMessage = this.formatPermissionError(data.message, 'view')
              } else if (data && data.detail) {
                errorMessage = this.formatPermissionError(data.detail, 'view')
              } else {
                errorMessage = '权限不足，无法预览文件'
              }
              this.fileError = errorMessage
              this.fileLoading = false
              return
            }
          } else if (response.status === 404) {
            errorMessage = '文件不存在 (404)'
            // 处理错误响应格式：可能是 { error: "..." } 或统一格式
            if (data && data.code !== undefined && data.message) {
              errorMessage = data.message
            } else if (data && data.error) {
              errorMessage = data.error
            } else if (data && data.detail) {
              errorMessage = data.detail
            }
          } else if (response.status === 500) {
            errorMessage = '服务器错误，获取文件失败'
            // 处理统一错误响应格式或 { error: "..." }
            if (data && data.code !== undefined && data.message) {
              errorMessage = data.message
            } else if (data && data.error) {
              errorMessage = data.error
            } else if (data && data.detail) {
              errorMessage = data.detail
            }
          } else if (data) {
            // 处理统一错误响应格式或 { error: "..." }
            // 如果是 403 错误，使用格式化函数转换
            if (data.code !== undefined && data.message) {
              if (response.status === 403) {
                errorMessage = this.formatPermissionError(data.message, 'view')
              } else {
                errorMessage = data.message
              }
            } else if (data.error) {
              if (response.status === 403) {
                errorMessage = this.formatPermissionError(data.error, 'view')
              } else {
                errorMessage = data.error
              }
            } else if (data.detail) {
              if (response.status === 403) {
                errorMessage = this.formatPermissionError(data.detail, 'view')
              } else {
                errorMessage = data.detail
              }
            } else if (data.message) {
              if (response.status === 403) {
                errorMessage = this.formatPermissionError(data.message, 'view')
              } else {
                errorMessage = data.message
              }
            }
          }
          
          this.fileError = errorMessage
          this.fileLoading = false
          return
        }

        // 获取文件内容（预览API返回PDF二进制流）
        const blob = await response.blob()
        
        // 判断文件类型
        const fileName = file.file_name.toLowerCase()
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
        const isTxt = fileName.endsWith('.txt')
        const isImage = fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)
        
        if (isExcel) {
          // Excel 文件：解析并显示
          await this.parseExcelFile(blob)
        } else if (isTxt) {
          // Txt 文件：读取文本内容
          await this.parseTxtFile(blob)
        } else if (isImage) {
          // 图片文件：创建 Blob URL 用于预览
          const blobUrl = window.URL.createObjectURL(blob)
          this.fileViewUrl = blobUrl
        } else {
          // 其他文件（包括PDF）：创建 Blob URL 用于预览
          // 预览API返回的PDF会通过 Content-Disposition: inline 在浏览器中直接显示
          const blobUrl = window.URL.createObjectURL(blob)
          this.fileViewUrl = blobUrl
        }
        
        this.fileLoading = false
        console.log('文件预览已加载')
      } catch (error) {
        console.error('加载文件失败:', error)
        this.fileError = error.message || '无法加载文件，请稍后重试'
        this.fileLoading = false
      }
    },
    // 文件加载成功
    handleFileLoad() {
      this.fileLoading = false
      this.fileError = null
    },
    // 文件加载失败
    handleFileError() {
      this.fileLoading = false
      this.fileError = '文件加载失败，可能后端未提供文件访问接口或文件不存在'
    },
    // 尝试下载文件（使用下载API）
    async tryDownloadFile() {
      if (!this.viewingFile) return

      // 直接调用下载方法
      await this.handleDownload(this.viewingFile)
    },
    // 解析 Excel 文件（优化版本，支持大文件）
    async parseExcelFile(blob) {
      try {
        // 检查文件大小（超过 5MB 时给出警告）
        const fileSizeMB = blob.size / (1024 * 1024)
        if (fileSizeMB > 5) {
          this.$message.warning(`文件较大（${fileSizeMB.toFixed(2)}MB），解析可能需要一些时间，请耐心等待...`)
        }
        
        // 将 Blob 转换为 ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer()
        
        // 使用 XLSX 解析 Excel 文件
        // 对于大文件，可以设置选项来优化性能
        const workbook = XLSX.read(arrayBuffer, { 
          type: 'array',
          // 只读取单元格值，不读取格式信息，可以提高性能
          cellStyles: false,
          cellDates: false
        })
        
        // 获取所有工作表名称
        this.excelSheets = workbook.SheetNames.map((name, index) => ({
          name: name,
          index: index
        }))
        
        // 解析每个工作表（限制最大行数和列数）
        const MAX_ROWS = 10 // 最大显示行数
        const MAX_COLS = 50  // 最大显示列数
        
        this.excelData = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName]
          
          // 获取工作表的范围
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
          const totalRows = range.e.r + 1
          const totalCols = range.e.c + 1
          
          // 检查是否需要限制
          const needLimit = totalRows > MAX_ROWS || totalCols > MAX_COLS
          
          if (needLimit) {
            // 如果超过限制，只读取部分数据
            const limitedRange = {
              s: { r: 0, c: 0 },
              e: { 
                r: Math.min(range.e.r, MAX_ROWS - 1), 
                c: Math.min(range.e.c, MAX_COLS - 1) 
              }
            }
            worksheet['!ref'] = XLSX.utils.encode_range(limitedRange)
          }
          
          // 将工作表转换为 JSON 格式（带标题行）
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // 使用数组格式，第一行作为标题
            defval: '' // 空单元格的默认值
          })
          
          if (jsonData.length === 0) {
            return {
              headers: [],
              rows: [],
              totalRows: 0,
              totalCols: 0,
              limited: false
            }
          }
          
          // 第一行作为表头
          const headers = (jsonData[0] || []).slice(0, MAX_COLS)
          // 其余行作为数据（限制行数）
          const rows = jsonData.slice(1, MAX_ROWS)
          
          return {
            headers: headers,
            rows: rows,
            totalRows: totalRows,
            totalCols: totalCols,
            limited: needLimit
          }
        })
        
        // 默认显示第一个工作表
        this.currentSheetIndex = '0'
        
        // 如果有工作表被限制了，显示提示
        const hasLimited = this.excelData.some(sheet => sheet.limited)
        if (hasLimited) {
          this.$message.warning(`文件较大，为提升性能，仅显示前 ${MAX_ROWS} 行和前 ${MAX_COLS} 列。完整数据请下载文件查看。`)
        }
        
        console.log('Excel 文件解析成功', {
          sheets: this.excelSheets.length,
          data: this.excelData.map(sheet => ({
            rows: sheet.rows.length,
            cols: sheet.headers.length,
            limited: sheet.limited
          }))
        })
      } catch (error) {
        console.error('解析 Excel 文件失败:', error)
        this.fileError = '解析 Excel 文件失败：' + error.message + '。文件可能过大或格式不正确，请尝试下载文件查看。'
        this.fileLoading = false
      }
    },
    // 解析 Txt 文件
    async parseTxtFile(blob) {
      try {
        // 检查文件大小（超过 5MB 时给出警告）
        const fileSizeMB = blob.size / (1024 * 1024)
        if (fileSizeMB > 5) {
          this.$message.warning(`文件较大（${fileSizeMB.toFixed(2)}MB），加载可能需要一些时间，请耐心等待...`)
        }
        
        // 读取文本内容
        // 尝试使用 UTF-8 编码
        const text = await blob.text()
        
        // 如果文件很大，只显示前 10000 个字符
        const MAX_LENGTH = 10000
        if (text.length > MAX_LENGTH) {
          this.txtContent = text.substring(0, MAX_LENGTH) + '\n\n... (文件内容过长，仅显示前 ' + MAX_LENGTH + ' 个字符，完整内容请下载文件查看)'
          this.$message.info('文件内容较长，仅显示前 ' + MAX_LENGTH + ' 个字符。完整内容请下载文件查看。')
        } else {
          this.txtContent = text
        }
        
        // 如果文件为空
        if (!this.txtContent || this.txtContent.trim() === '') {
          this.txtContent = '(文件为空)'
        }
        
        console.log('Txt 文件解析成功', {
          length: text.length,
          truncated: text.length > MAX_LENGTH
        })
      } catch (error) {
        console.error('解析 Txt 文件失败:', error)
        this.fileError = '解析 Txt 文件失败：' + error.message + '。文件可能过大或格式不正确，请尝试下载文件查看。'
        this.fileLoading = false
      }
    },
    // 切换工作表
    handleSheetChange(tab) {
      this.currentSheetIndex = tab.name
    },
    // 关闭查看对话框
    handleViewDialogClose() {
      // 释放Blob URL，避免内存泄漏
      if (this.fileViewUrl && this.fileViewUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(this.fileViewUrl)
      }
      // 清理 Excel 数据
      this.excelData = null
      this.excelSheets = []
      this.currentSheetIndex = 0
      // 清理 Txt 数据
      this.txtContent = ''
      this.viewingFile = null
      this.fileViewUrl = ''
      this.fileError = null
      this.fileLoading = false
    },
    // 编辑描述
    handleEdit(row) {
      console.log('编辑文件描述', row)
      this.editingFile = row
      this.editForm = {
        file_name: row.file_name,
        description: row.description || ''
      }
      this.editDialogVisible = true
    },
    // 更新描述
    async handleUpdateDescription() {
      if (!this.editingFile) return

      this.$refs.editForm.validate(async (valid) => {
        if (valid) {
          this.updating = true

          try {
            // 从 store 获取 access token
            const accessToken = this.$store.getters.accessToken
            if (!accessToken) {
              this.$message.error('未登录，请先登录')
              this.updating = false
              return
            }

            // 构建请求数据
            // 注意：虽然 API 文档说 file 是只读的，但后端可能要求提交所有字段
            // 先尝试只提交 description，如果失败再尝试包含 file: null
            let requestData = {
              description: this.editForm.description || null
            }

            // 先尝试 PATCH 方法（部分更新）
            let response = await fetch(`/api/v1/knowledge-base/${this.editingFile.id}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestData)
            })

            // 如果 PATCH 失败且错误提示需要 file 字段，尝试包含 file: null
            if (!response.ok) {
              const text = await response.text()
              let errorData = null
              try {
                errorData = text ? JSON.parse(text) : null
              } catch (e) {
                // 忽略解析错误
              }

              // 检查是否是因为缺少 file 字段
              if (errorData && (errorData.file || (typeof errorData === 'object' && Object.keys(errorData).some(key => key.toLowerCase().includes('file'))))) {
                console.log('后端要求 file 字段，尝试包含 file: null')
                // 包含 file: null 或空字符串
                requestData = {
                  description: this.editForm.description || null,
                  file: null
                }

                response = await fetch(`/api/v1/knowledge-base/${this.editingFile.id}/`, {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestData)
                })
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
            console.log('更新响应状态:', response.status)
            console.log('更新响应数据:', data)

            if (!response.ok) {
              let errorMessage = `更新失败: ${response.status}`

              if (response.status === 401) {
                errorMessage = '认证失败，请重新登录'
                // 清除用户信息，跳转到登录页
                this.$store.commit('clearUser')
                this.$router.push('/login')
              } else if (response.status === 403) {
                errorMessage = '权限不足，只有 ADMIN 角色才能更新'
              } else if (response.status === 404) {
                errorMessage = '知识库不存在'
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

            // 更新成功
            this.$message.success('描述更新成功')
            this.editDialogVisible = false

            // 重新获取列表以更新数据
            this.fetchKnowledgeBaseList()

          } catch (error) {
            console.error('更新描述错误:', error)
            this.$message.error(error.message || '更新描述失败，请稍后重试')
          } finally {
            this.updating = false
          }
        } else {
          return false
        }
      })
    },
    // 关闭编辑对话框
    handleEditDialogClose() {
      this.editingFile = null
      this.editForm = {
        file_name: '',
        description: ''
      }
      if (this.$refs.editForm) {
        this.$refs.editForm.clearValidate()
      }
    },
    // 下载文件
    async handleDownload(row) {
      console.log('下载文件', row)
      
      try {
        // 从 store 获取 access token
        const accessToken = this.$store.getters.accessToken
        if (!accessToken) {
          this.$message.error('未登录，请先登录')
          return
        }

        // 显示加载提示
        const loading = this.$loading({
          lock: true,
          text: '正在下载文件...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })

        // 调用下载接口
        let response = await fetch(`/api/v1/knowledge-base/${row.id}/download/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        // 如果是401错误，尝试刷新token
        if (response.status === 401) {
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (!refreshSuccess) {
            // 刷新失败，已经跳转到登录页
            loading.close()
            return
          }
          
          // 刷新成功，使用新token重试请求
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(`/api/v1/knowledge-base/${row.id}/download/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`
            }
          })
          
          // 如果重试后仍然是401，说明token仍然无效
          if (response.status === 401) {
            this.$store.commit('clearUser')
            this.$router.push('/login')
            loading.close()
            return
          }
        }

        // 关闭加载提示
        loading.close()

        // 打印响应用于调试
        console.log('下载响应状态:', response.status)

        if (!response.ok) {
          let errorMessage = `下载文件失败: ${response.status}`
          
          // 尝试读取错误响应
          const text = await response.text()
          let data = null
          
          try {
            data = text ? JSON.parse(text) : null
          } catch (e) {
            // 响应不是JSON，使用默认错误消息
          }
          
          if (response.status === 401) {
            // 如果到这里还是401，说明重试后仍然失败
            this.$store.commit('clearUser')
            this.$router.push('/login')
          } else if (response.status === 403) {
            // 使用格式化函数处理权限错误
            if (data && data.code !== undefined && data.message) {
              errorMessage = this.formatPermissionError(data.message, 'download')
            } else if (data && data.message) {
              errorMessage = this.formatPermissionError(data.message, 'download')
            } else if (data && data.detail) {
              errorMessage = this.formatPermissionError(data.detail, 'download')
            } else {
              errorMessage = '权限不足，只有 ADMIN 角色才能下载文件'
            }
          } else if (response.status === 404) {
            errorMessage = '文件不存在 (404)'
            if (data && data.detail) {
              errorMessage = data.detail
            }
          } else if (response.status === 500) {
            errorMessage = '服务器错误，获取文件失败'
            if (data && data.error) {
              errorMessage = data.error
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
          
          this.$message.error(errorMessage)
          return
        }

        // 获取文件内容
        const blob = await response.blob()
        
        // 从响应头获取文件名，如果没有则使用原始文件名
        const contentDisposition = response.headers.get('Content-Disposition')
        let fileName = row.file_name || 'download'
        
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (fileNameMatch && fileNameMatch[1]) {
            // 移除引号
            fileName = fileNameMatch[1].replace(/['"]/g, '')
            // 处理URL编码的文件名
            try {
              fileName = decodeURIComponent(fileName)
            } catch (e) {
              // 如果解码失败，使用原始值
            }
          }
        }
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        
        // 清理
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success('文件下载成功')
        
      } catch (error) {
        console.error('下载文件错误:', error)
        this.$message.error(error.message || '下载文件失败，请稍后重试')
      }
    },
    async handleDelete(row) {
      console.log('删除文件', row)
      
      try {
        await this.$confirm('确定要删除该文件吗？删除操作不可恢复，将同时删除数据库记录和存储文件。', '删除确认', {
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
        const response = await fetch(`/api/v1/knowledge-base/${row.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        // 打印响应用于调试
        console.log('删除响应状态:', response.status)

        // 读取响应文本
        const text = await response.text()
        let errorData = null
        
        try {
          errorData = text ? JSON.parse(text) : null
        } catch (e) {
          // 如果解析失败，可能是纯文本错误信息或空响应
          if (text) {
            errorData = { detail: text, message: text }
          }
        }

        // 204 No Content 表示删除成功（无响应体）
        if (response.status === 204 || (response.ok && !text)) {
          this.$message.success('删除成功')
          // 重新获取列表
          this.fetchKnowledgeBaseList()
          return
        }

        // 优先检查统一响应格式（如果有 code 字段）
        if (errorData && errorData.code !== undefined) {
          if (errorData.code === 0) {
            // 成功：code 为 0
            this.$message.success('删除成功')
            this.fetchKnowledgeBaseList()
            return
          } else {
            // 错误：code 非 0
            const errorMessage = errorData.message || `删除失败: code ${errorData.code}`
            
            // 检查是否是关联错误（code 400 且包含关联关键词）
            if (errorData.code === 400 && (
              errorMessage.includes('关联') || 
              errorMessage.includes('referenced') ||
              errorMessage.includes('被其他数据关联') ||
              errorMessage.includes('foreign key') ||
              errorMessage.includes('无法删除')
            )) {
              // 使用 alert 显示友好的错误提示
              this.$alert(
                errorMessage + '\n\n请先解除该文件与其他数据的关联关系，然后再尝试删除。',
                '无法删除',
                {
                  confirmButtonText: '我知道了',
                  type: 'warning',
                  customClass: 'delete-error-alert'
                }
              )
              return // 不抛出错误，因为已经显示了友好的提示
            }
            
            // 其他错误
            throw new Error(errorMessage)
          }
        }

        // 如果没有统一响应格式，检查 HTTP 状态码
        if (!response.ok) {
          let errorMessage = `删除失败: ${response.status}`

          if (response.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能删除'
          } else if (response.status === 404) {
            errorMessage = '知识库不存在'
          } else if (response.status === 400 || response.status === 500) {
            // 检查是否是关联错误（兼容旧格式）
            const detailText = errorData?.detail || errorData?.message || errorData?.error || text || ''
            
            // 检查是否包含关联错误的关键词
            if (detailText.includes('referenced') || 
                detailText.includes('foreign key') || 
                detailText.includes('关联') || 
                detailText.includes('被其他数据关联') ||
                detailText.includes('BusinessRule') ||
                detailText.includes('protected foreign keys')) {
              
              // 提取关联的业务规则名称
              let ruleNames = []
              
              // 模式1: 引号内的规则名称
              const quotedMatches = detailText.match(/['"]([^'"]+)['"]/g) || []
              ruleNames.push(...quotedMatches.map(match => match.replace(/['"]/g, '')))
              
              // 模式2: 中文规则名称
              const chineseRuleMatches = detailText.match(/([^\n\r，,。.]+(?:检测|规则|管理|处理)[^\n\r，,。.]*)/g) || []
              ruleNames.push(...chineseRuleMatches.map(match => match.trim()))
              
              // 去重并过滤
              const uniqueRules = [...new Set(ruleNames)]
                .filter(name => {
                  const trimmed = name.trim()
                  return trimmed && 
                         trimmed.length > 0 && 
                         trimmed.length < 100 &&
                         !trimmed.includes('Cannot delete') &&
                         !trimmed.includes('referenced') &&
                         !trimmed.includes('foreign key') &&
                         !trimmed.includes('BusinessRule.based_knowledge')
                })
              
              // 构建友好的错误提示
              let friendlyMessage = '无法删除该知识库文件，因为该文件正在被以下业务规则使用：\n\n'
              
              if (uniqueRules.length > 0) {
                const displayRules = uniqueRules.slice(0, 20)
                friendlyMessage += displayRules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')
                if (uniqueRules.length > 20) {
                  friendlyMessage += `\n\n... 还有 ${uniqueRules.length - 20} 个业务规则`
                }
              } else {
                friendlyMessage += '该文件正在被一个或多个业务规则关联使用。'
              }
              
              friendlyMessage += '\n\n请先前往"规则库管理"页面，解除这些业务规则与该文件的关联关系，然后再尝试删除。'
              
              // 使用 MessageBox 显示详细信息
              this.$alert(friendlyMessage, '无法删除', {
                confirmButtonText: '我知道了',
                type: 'warning',
                dangerouslyUseHTMLString: false,
                customClass: 'delete-error-alert'
              })
              
              return // 不抛出错误，因为已经显示了友好的提示
            } else {
              // 其他类型的错误
              errorMessage = errorData?.detail || errorData?.message || errorData?.error || '删除文件时出错，请稍后重试'
            }
          } else if (errorData) {
            if (errorData.detail) {
              errorMessage = errorData.detail
            } else if (errorData.message) {
              errorMessage = errorData.message
            } else if (errorData.error) {
              errorMessage = errorData.error
            }
          }

          throw new Error(errorMessage)
        }
        
        // 如果响应成功但没有统一格式，也视为成功
        this.$message.success('删除成功')
        this.fetchKnowledgeBaseList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          this.$message.error(error.message || '删除失败，请稍后重试')
        }
      }
    }
  }
}
</script>

<style scoped>
.knowledge-base {
  padding: 20px;
  background-color: #fff;
  min-height: 100%;
}

/* 标题区域 - 使用 flex 布局 */
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

/* 操作区域 - 使用 flex 布局，响应式 */
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
  min-width: 500px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.upload-form {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-form .el-form-item {
  margin-bottom: 0;
}

.upload-hint {
  margin: 0;
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

/* 表格区域 */
.table-section {
  background-color: #fff;
}

/* 分页区域 */
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

  .upload-section {
    align-items: flex-start;
    width: 100%;
  }
}

/* 表单样式调整 */
.demo-form-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.demo-form-inline .el-form-item {
  margin-bottom: 0;
}

/* 文件查看对话框样式 */
.file-viewer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.file-info {
  margin-bottom: 20px;
}

.file-preview {
  min-height: 400px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.excel-viewer {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.excel-table-container {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.loading-container,
.error-container,
.unsupported-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 40px;
  text-align: center;
}

.loading-container i {
  font-size: 48px;
  color: #409EFF;
  animation: rotating 2s linear infinite;
}

.error-container i {
  font-size: 48px;
  color: #F56C6C;
}

.unsupported-viewer i {
  font-size: 48px;
  color: #909399;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.pdf-viewer {
  width: 100%;
  height: 600px;
}

.image-viewer {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.image-viewer img {
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease;
}

.image-viewer img:hover {
  transform: scale(1.02);
}

/* 删除错误提示样式 */
.delete-error-alert {
  max-width: 600px;
}

.delete-error-alert .el-message-box__message {
  white-space: pre-line;
  text-align: left;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0;
}
</style>

