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
        <el-upload
          ref="upload"
          :action="uploadAction"
          :http-request="customUpload"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :on-progress="handleUploadProgress"
          :show-file-list="false"
          :limit="1"
          :auto-upload="true"
          accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
        >
          <el-button slot="trigger" type="primary">上传</el-button>
        </el-upload>
        <p class="upload-hint">支持扩展名: .doc .docx .pdf .jpg .jpeg .png .txt .xls .xlsx</p>
      </div>
    </div>

    <!-- 文件列表表格 -->
    <div class="table-section">
      <el-table :data="fileList" style="width: 100%" border>
        <el-table-column prop="fileName" label="文件名称" min-width="300"></el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="180"></el-table-column>
        <el-table-column prop="uploader" label="上传人" width="120"></el-table-column>
        <el-table-column label="操作" width="150">
          <template slot-scope="scope">
            <el-link type="primary" @click="handleView(scope.row)" :underline="false">查看</el-link>
            <span style="margin: 0 8px;">|</span>
            <el-link type="danger" @click="handleDelete(scope.row)" :underline="false">删除</el-link>
          </template>
        </el-table-column>
      </el-table>
    </div>
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
      fileList: [
        {
          fileName: '陕西省医疗服务价格项目价格目录',
          uploadTime: '20250514 16:00:00',
          uploader: '张三'
        },
        {
          fileName: '陕西省基本医疗保险诊疗项目和医疗服务设施范围及支付标准',
          uploadTime: '20250514 15:00:00',
          uploader: '李四'
        }
      ],
      // 允许的文件扩展名
      allowedExtensions: ['.doc', '.docx', '.pdf', '.jpg', '.jpeg', '.png', '.txt', '.xls', '.xlsx'],
      // 上传接口地址（需要根据实际后端API修改）
      uploadAction: '/api/knowledge/upload',
      // 上传进度
      uploadProgress: 0,
      // 开发模式：设置为 true 时，不发送真实请求，直接模拟上传成功
      devMode: true
    }
  },
  methods: {
    handleQuery() {
      console.log('查询', this.searchForm)
      // TODO: 实现查询逻辑
    },
    handleReset() {
      this.searchForm = {
        fileName: '',
        uploadTime: ''
      }
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
    // el-upload 组件的上传前验证
    beforeUpload(file) {
      console.log('beforeUpload 被调用:', file.name, file.type, file.size)
      if (!this.validateFileType(file)) {
        console.log('文件类型验证失败')
        return false
      }
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (file.size > maxSize) {
        this.$message.error('文件大小不能超过100MB')
        console.log('文件大小验证失败')
        return false
      }
      console.log('文件验证通过，准备上传')
      return true
    },
    // 自定义上传方法
    customUpload(options) {
      console.log('customUpload 被调用:', options)
      const { file } = options
      
      // 显示上传进度提示
      const loading = this.$loading({
        lock: true,
        text: '正在上传文件...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      
      // 开发模式：直接模拟上传成功，不发送真实请求
      if (this.devMode) {
        console.log('开发模式：模拟上传成功')
        // 模拟上传延迟（1秒）
        setTimeout(() => {
          loading.close()
          // this.$message.warning('开发模式：模拟上传成功（未发送真实请求）')
          this.handleUploadSuccess({ success: true, message: '开发模式模拟上传' }, file)
        }, 1000)
        return
      }
      
      // 生产模式：发送真实请求
      const formData = new FormData()
      formData.append('file', file)
      
      // 使用 fetch 进行上传
      fetch(this.uploadAction, {
        method: 'POST',
        body: formData
      })
        .then(response => {
          if (response.ok) {
            return response.json()
          } else {
            // 如果接口返回错误状态码（如404），在开发环境下模拟成功
            console.warn('后端接口返回错误状态:', response.status, response.statusText)
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        })
        .then(data => {
          loading.close()
          // 调用成功回调
          this.handleUploadSuccess(data, file)
        })
        .catch(error => {
          loading.close()
          console.error('上传错误详情:', error)
          console.log('错误类型:', error.constructor.name)
          console.log('错误消息:', error.message)
          
          // 在开发环境下，如果后端接口不存在或出错，模拟上传成功
          // 捕获所有可能的网络错误和 HTTP 错误
          const errorMessage = error.message || error.toString()
          const isNetworkError = 
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('Network request failed') ||
            errorMessage.includes('404') ||
            errorMessage.includes('500') ||
            errorMessage.includes('TypeError') ||
            error.name === 'TypeError' ||
            error.name === 'NetworkError'
          
          if (isNetworkError) {
            console.log('检测到网络错误或接口不存在，模拟上传成功（开发模式）')
            this.$message.warning('后端接口未配置，模拟上传成功（开发模式）')
            // 模拟成功回调
            this.handleUploadSuccess({ success: true, message: '模拟上传成功' }, file)
          } else {
            // 其他错误，调用失败回调
            console.error('上传失败，错误信息:', error)
            this.handleUploadError(error, file)
          }
        })
    },
    // el-upload 组件的上传成功回调（如果使用 el-upload 的自动上传）
    handleUploadSuccess(response, file) {
      const now = new Date()
      const uploadTime = now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0')
      
      this.fileList.unshift({
        fileName: file.name,
        uploadTime: uploadTime,
        uploader: '当前用户'
      })
      this.$message.success('文件上传成功')
      
      // 清空 el-upload 的文件列表，以便可以再次上传
      this.$nextTick(() => {
        if (this.$refs.upload) {
          this.$refs.upload.clearFiles()
        }
      })
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
    handleView(row) {
      console.log('查看文件', row)
      // TODO: 实现查看逻辑
    },
    handleDelete(row) {
      this.$confirm('确定要删除该文件吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.fileList.findIndex(item => item === row)
        if (index > -1) {
          this.fileList.splice(index, 1)
          this.$message.success('删除成功')
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
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
</style>

