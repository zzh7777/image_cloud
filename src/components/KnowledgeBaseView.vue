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
            <el-input
              v-model="searchForm.uploadTime"
              placeholder="请输入上传时间"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 右侧：上传区域 -->
      <div class="upload-section">
        <el-form :inline="true" class="upload-form">
          <el-form-item label="描述">
            <el-input
              v-model="uploadDescription"
              placeholder="请输入文件描述（可选）"
              clearable
              style="width: 200px"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-upload
              ref="upload"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :show-file-list="false"
              :limit="1"
              :auto-upload="false"
              accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
            >
              <el-button slot="trigger" type="primary">选择文件</el-button>
              <el-button 
                type="primary" 
                @click="handleUpload"
                :loading="uploading"
                style="margin-left: 10px"
              >上传</el-button>
            </el-upload>
          </el-form-item>
        </el-form>
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
        <el-table-column prop="file_name" label="文件名称" width="200" show-overflow-tooltip></el-table-column>
        <el-table-column prop="file_size" label="文件大小" width="120">
          <template slot-scope="scope">
            {{ formatFileSize(scope.row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column prop="upload_time" label="上传时间" width="160">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.upload_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploader" label="上传人" width="100"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status === 'active' ? '活跃' : scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="page_count" label="页数" width="80">
          <template slot-scope="scope">
            {{ scope.row.page_count || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" @click="handleView(scope.row)">查看</el-button>
            <el-divider direction="vertical"></el-divider>
            <el-button type="text" @click="handleDelete(scope.row)">删除</el-button>
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
            <el-descriptions-item label="状态">
              <el-tag :type="viewingFile.status === 'active' ? 'success' : 'info'" size="small">
                {{ viewingFile.status === 'active' ? '活跃' : viewingFile.status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="页数">{{ viewingFile.page_count || '-' }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ viewingFile.description || '-' }}</el-descriptions-item>
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
            <el-button type="primary" @click="tryDownloadFile">尝试下载文件</el-button>
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
            <img
              :src="fileViewUrlWithAuth"
              alt="文件预览"
              style="max-width: 100%; max-height: 600px;"
              @load="handleFileLoad"
              @error="handleFileError"
            />
          </div>
          <div v-else class="unsupported-viewer">
            <i class="el-icon-document"></i>
            <p>该文件格式不支持在线预览</p>
            <el-button type="primary" @click="tryDownloadFile">下载文件</el-button>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="tryDownloadFile" v-if="viewingFile">下载文件</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'KnowledgeBaseView',
  data() {
    return {
      searchForm: {
        fileName: '',
        uploadTime: ''
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
      // 上传描述
      uploadDescription: '',
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
      fileError: null
    }
  },
  computed: {
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
    // 带认证的文件访问 URL
    fileViewUrlWithAuth() {
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
      const params = new URLSearchParams({
        page: this.pagination.page,
        page_size: this.pagination.pageSize
      })
      const url = `/api/v1/knowledge-base/?${params.toString()}`
      
      try {
        const response = await fetch(url, {
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
          console.error('响应不是有效的 JSON:', text.substring(0, 200))
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
        
        // 打印响应用于调试
        console.log('知识库列表响应状态:', response.status)
        console.log('知识库列表响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `获取知识库列表失败: ${response.status}`
          
          if (response.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能访问'
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
        
        // 更新数据
        if (data && data.results) {
          this.fileList = data.results
          this.pagination.total = data.count || 0
        } else {
          this.fileList = []
          this.pagination.total = 0
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
      this.pagination.pageSize = val
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
      console.log('查询', this.searchForm)
      // 重置到第一页并重新获取数据
      this.pagination.page = 1
      this.fetchKnowledgeBaseList()
      // TODO: 如果后端支持搜索参数，可以在这里添加
    },
    handleReset() {
      this.searchForm = {
        fileName: '',
        uploadTime: ''
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
    // 文件选择变化事件
    // eslint-disable-next-line no-unused-vars
    handleFileChange(file, fileList) {
      console.log('文件选择变化:', file, fileList)
      
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
      this.$message.success(`已选择文件: ${file.name}`)
    },
    // 文件移除事件
    handleFileRemove() {
      this.selectedFile = null
      console.log('文件已移除')
    },
    // 自定义上传方法（el-upload 需要，但不会真正调用）
    customUpload(options) {
      // 这个方法不会被调用，因为我们设置了 auto-upload="false"
      console.log('customUpload 被调用（不应执行）:', options)
    },
    // 手动触发上传
    async handleUpload() {
      if (!this.selectedFile) {
        this.$message.warning('请先选择文件')
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
      if (this.uploadDescription) {
        formData.append('description', this.uploadDescription)
      }
      
      try {
        const response = await fetch('/api/v1/knowledge-base/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
            // 注意：不要设置 Content-Type，让浏览器自动设置，以便包含 boundary
          },
          body: formData
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
        console.log('上传响应状态:', response.status)
        console.log('上传响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `上传失败: ${response.status}`
          
          if (response.status === 401) {
            errorMessage = '认证失败，请重新登录'
            // 清除用户信息，跳转到登录页
            this.$store.commit('clearUser')
            this.$router.push('/login')
          } else if (response.status === 403) {
            errorMessage = '权限不足，只有 ADMIN 角色才能上传'
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
        
        // 上传成功
        this.$message.success('文件上传成功')
        
        // 清空文件选择和描述
        this.selectedFile = null
        this.uploadDescription = ''
        
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
        this.$message.error(error.message || '文件上传失败，请稍后重试')
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
      this.viewingFile = row
      this.viewDialogVisible = true
      this.fileLoading = true
      this.fileError = null
      
      // 尝试构建文件访问 URL
      // 方案1: 尝试通过后端 API 获取文件
      await this.loadFileForView(row)
    },
    // 加载文件用于查看
    async loadFileForView(file) {
      try {
        // 从 store 获取 access token
        const accessToken = this.$store.getters.accessToken
        if (!accessToken) {
          this.fileError = '未登录，请先登录'
          this.fileLoading = false
          return
        }

        // 直接使用文件名构建文件访问 URL
        // 基础路径格式：knowledge-base/文件名
        const fileName = encodeURIComponent(file.file_name)
        const filePath = `knowledge-base/${fileName}`
        
        // 尝试几种可能的访问方式
        // 方案1: 通过 API 代理访问（推荐，需要认证）
        const apiUrl = `/api/v1/${filePath}`
        
        // 方案2: 直接访问 Minio（如果配置了代理或公开访问）
        // const minioUrl = `http://localhost:9000/${filePath}`
        
        // 先尝试通过 API 访问（带认证）
        this.fileViewUrl = apiUrl
        
        // 对于需要认证的请求，可以在 URL 中添加 token 参数
        // 或者通过 iframe 的 src 会自动携带 cookie（如果配置了）
        // 这里先尝试直接访问，如果失败再处理
        
        this.fileLoading = false
        console.log('文件访问 URL:', this.fileViewUrl)
      } catch (error) {
        console.error('加载文件失败:', error)
        this.fileError = '无法加载文件'
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
    // 尝试下载文件
    async tryDownloadFile() {
      if (!this.viewingFile) return

      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }

      try {
        // 直接使用文件路径下载
        const fileName = encodeURIComponent(this.viewingFile.file_name)
        const filePath = `knowledge-base/${fileName}`
        const downloadUrl = `/api/v1/${filePath}`
        
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        if (response.ok) {
          const blob = await response.blob()
          const downloadUrlObj = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrlObj
          link.download = this.viewingFile.file_name
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(downloadUrlObj)
          this.$message.success('文件下载成功')
        } else {
          this.$message.error('文件下载失败')
        }
      } catch (error) {
        console.error('下载失败:', error)
        this.$message.error('文件下载失败，请稍后重试')
      }
    },
    // 关闭查看对话框
    handleViewDialogClose() {
      this.viewingFile = null
      this.fileViewUrl = ''
      this.fileError = null
      this.fileLoading = false
    },
    async handleDelete(row) {
      // row 参数用于后续删除接口调用
      console.log('删除文件', row)
      try {
        await this.$confirm('确定要删除该文件吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // TODO: 调用删除接口
        // 这里先模拟删除成功，后续需要对接删除接口
        this.$message.success('删除成功')
        
        // 删除成功后，重新获取列表
        this.fetchKnowledgeBaseList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          this.$message.error('删除失败，请稍后重试')
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
}

.image-viewer img {
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>

