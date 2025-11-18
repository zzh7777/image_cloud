<template>
  <div class="database-manage">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">数据库管理</h2>
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
          <el-form-item label="数据源">
            <el-select v-model="searchForm.dataSource" placeholder="请选择数据源" clearable>
              <el-option label="全部" value=""></el-option>
              <el-option label="影像云" value="影像云"></el-option>
              <el-option label="HIS系统" value="HIS系统"></el-option>
              <el-option label="系统配置" value="系统配置"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 创建按钮 -->
      <div class="create-section">
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </div>
    </div>

    <!-- 数据库列表表格 -->
    <div class="table-section">
      <div class="table-wrapper">
        <el-table :data="databaseList" style="width: 100%; min-width: 1000px;" border>
          <el-table-column prop="dataName" label="数据名称" min-width="200"></el-table-column>
          <el-table-column prop="dataType" label="数据类型" min-width="160">
            <template slot-scope="scope">
              <el-tag :type="scope.row.dataType === '结构化数据' ? 'success' : 'warning'">
                {{ scope.row.dataType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="dataSource" label="数据源" min-width="150"></el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="180"></el-table-column>
          <el-table-column prop="creator" label="创建人" min-width="120"></el-table-column>
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button type="text" @click="handleEdit(scope.row)">编辑</el-button>
              <el-divider direction="vertical"></el-divider>
              <el-button type="text" @click="handleDelete(scope.row)">删除</el-button>
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
      <el-form :model="databaseForm" :rules="rules" ref="databaseForm" label-width="100px">
        <el-form-item label="数据名称" prop="dataName">
          <el-input v-model="databaseForm.dataName" placeholder="请输入数据名称"></el-input>
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="databaseForm.dataType" placeholder="请选择数据类型" style="width: 100%">
            <el-option label="结构化数据" value="结构化数据"></el-option>
            <el-option label="非结构化数据" value="非结构化数据"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="数据源" prop="dataSource">
          <el-select v-model="databaseForm.dataSource" placeholder="请选择数据源" style="width: 100%">
            <el-option label="影像云" value="影像云"></el-option>
            <el-option label="医保云" value="医保云"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="数据描述">
          <el-input 
            v-model="databaseForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="请输入数据描述">
          </el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSave">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'DatabaseManageView',
  data() {
    return {
      searchForm: {
        dataName: '',
        dataType: '',
        dataSource: ''
      },
      databaseList: [
        {
          id: 1,
          dataName: '影像申请单',
          dataType: '结构化数据',
          dataSource: '影像云',
          createTime: '20250514 14:23:26',
          creator: '张三'
        },
        {
          id: 2,
          dataName: '影像报告单',
          dataType: '结构化数据',
          dataSource: '影像云',
          createTime: '20250514 14:23:20',
          creator: '张三'
        },
        {
          id: 3,
          dataName: '影像结算',
          dataType: '结构化数据',
          dataSource: '影像云',
          createTime: '20250514 14:23:10',
          creator: '张三'
        },
        {
          id: 4,
          dataName: '影像图像',
          dataType: '非结构化数据',
          dataSource: '影像云',
          createTime: '20250514 14:23:00',
          creator: '张三'
        },
        {
          id: 5,
          dataName: '患者基本信息',
          dataType: '结构化数据',
          dataSource: 'HIS系统',
          createTime: '20250514 14:22:50',
          creator: '李四'
        },
        {
          id: 6,
          dataName: '就诊记录',
          dataType: '结构化数据',
          dataSource: 'HIS系统',
          createTime: '20250514 14:22:40',
          creator: '李四'
        },
        {
          id: 7,
          dataName: '检查项目字典',
          dataType: '结构化数据',
          dataSource: '影像云',
          createTime: '20250514 14:22:30',
          creator: '王五'
        },
        {
          id: 8,
          dataName: '医院信息',
          dataType: '结构化数据',
          dataSource: '系统配置',
          createTime: '20250514 14:22:20',
          creator: '王五'
        }
      ],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 8
      },
      dialogVisible: false,
      dialogTitle: '创建数据库',
      isEdit: false,
      databaseForm: {
        dataName: '',
        dataType: '',
        dataSource: '',
        description: ''
      },
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
  methods: {
    handleQuery() {
      console.log('查询', this.searchForm)
      // TODO: 实现查询逻辑，调用后端API
    },
    handleReset() {
      this.searchForm = {
        dataName: '',
        dataType: '',
        dataSource: ''
      }
      // 重置后重新加载列表
      this.handleQuery()
    },
    handleCreate() {
      this.dialogTitle = '创建数据库'
      this.isEdit = false
      this.databaseForm = {
        dataName: '',
        dataType: '',
        dataSource: '',
        description: ''
      }
      this.dialogVisible = true
      // 清空验证
      this.$nextTick(() => {
        this.$refs.databaseForm && this.$refs.databaseForm.clearValidate()
      })
    },
    handleEdit(row) {
      this.dialogTitle = '编辑数据库'
      this.isEdit = true
      this.databaseForm = {
        id: row.id,
        dataName: row.dataName,
        dataType: row.dataType,
        dataSource: row.dataSource,
        description: ''
      }
      this.dialogVisible = true
      // 清空验证
      this.$nextTick(() => {
        this.$refs.databaseForm && this.$refs.databaseForm.clearValidate()
      })
    },
    handleSave() {
      this.$refs.databaseForm.validate((valid) => {
        if (valid) {
          if (this.isEdit) {
            // 编辑
            const index = this.databaseList.findIndex(item => item.id === this.databaseForm.id)
            if (index !== -1) {
              this.databaseList[index] = {
                ...this.databaseList[index],
                ...this.databaseForm
              }
              this.$message.success('编辑成功')
            }
          } else {
            // 创建
            this.databaseList.push({
              id: this.databaseList.length + 1,
              ...this.databaseForm,
              createTime: new Date().toLocaleString().replace(/\//g, '').replace(/:/g, '').replace(/ /g, ' '),
              creator: '当前用户'
            })
            this.pagination.total++
            this.$message.success('创建成功')
          }
          this.dialogVisible = false
        }
      })
    },
    handleDelete(row) {
      this.$confirm('确定要删除该数据库吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.databaseList.findIndex(item => item.id === row.id)
        if (index !== -1) {
          this.databaseList.splice(index, 1)
          this.pagination.total--
          this.$message.success('删除成功')
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.handleQuery()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.handleQuery()
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

