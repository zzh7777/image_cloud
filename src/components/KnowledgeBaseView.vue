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
        <el-button type="primary" @click="handleUpload">上传</el-button>
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
      ]
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
    handleUpload() {
      console.log('上传文件')
      // TODO: 实现上传逻辑
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

