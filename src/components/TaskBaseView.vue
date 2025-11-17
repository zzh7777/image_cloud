<template>
  <div class="task-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">任务</h2>
    </div>

    <!-- 搜索和创建区域 -->
    <div class="action-section">
      <!-- 搜索表单 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="任务ID">
            <el-input
              v-model="searchForm.taskId"
              placeholder="请输入任务ID"
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
          <el-form-item label="调用模型">
            <el-input
              v-model="searchForm.modelName"
              placeholder="请输入调用模型"
              clearable
            ></el-input>
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

    <!-- 任务列表表格 -->
    <div class="table-section">
      <el-table :data="taskList" style="width: 100%" border>
        <el-table-column prop="taskId" label="任务ID" width="180"></el-table-column>
        <el-table-column prop="taskName" label="任务名称" width="160"></el-table-column>
        <el-table-column prop="modelName" label="调用模型" width="180"></el-table-column>
        <el-table-column label="运行状态" width="100">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.status === '运行中' ? 'success' : (scope.row.status === '待运行' ? 'warning' : 'info')"
            >
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataCount" label="累计监测数据条数" width="150"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160"></el-table-column>
        <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <!-- 运行中状态：停止、查看 -->
            <template v-if="scope.row.status === '运行中'">
              <el-button type="text" @click="handleStop(scope.row)">停止</el-button>
              <el-divider direction="vertical"></el-divider>
              <el-button type="text" @click="handleView(scope.row)">查看</el-button>
            </template>
            <!-- 待运行状态：开始、编辑、删除 -->
            <template v-else-if="scope.row.status === '待运行'">
              <el-button type="text" @click="handleStart(scope.row)">开始</el-button>
              <el-divider direction="vertical"></el-divider>
              <el-button type="text" @click="handleEdit(scope.row)">编辑</el-button>
              <el-divider direction="vertical"></el-divider>
              <el-button type="text" @click="handleDelete(scope.row)">删除</el-button>
            </template>
            <!-- 已结束状态：查看、删除 -->
            <template v-else>
              <el-button type="text" @click="handleView(scope.row)">查看</el-button>
              <el-divider direction="vertical"></el-divider>
              <el-button type="text" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 创建/编辑任务对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="taskForm" :rules="rules" ref="taskForm" label-width="120px">
        <el-form-item label="任务ID" v-if="dialogType === 'edit'">
          <el-input v-model="taskForm.taskId" disabled></el-input>
        </el-form-item>
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="taskForm.taskName" placeholder="请输入任务名称（50字以内）"></el-input>
        </el-form-item>
        <el-form-item label="调用模型" prop="modelName">
          <el-select v-model="taskForm.modelName" placeholder="请选择调用模型" style="width: 100%">
            <el-option
              v-for="item in modelList"
              :key="item"
              :label="item"
              :value="item"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述" prop="taskDescription">
          <el-input
            type="textarea"
            v-model="taskForm.taskDescription"
            :rows="4"
            placeholder="请输入任务描述（200字以内）"
          ></el-input>
        </el-form-item>
        <el-form-item label="监测周期" prop="monitorCycle">
          <el-select v-model="taskForm.monitorCycle" placeholder="请选择监测周期" style="width: 100%">
            <el-option label="实时监测" value="实时监测"></el-option>
            <el-option label="每日监测" value="每日监测"></el-option>
            <el-option label="每周监测" value="每周监测"></el-option>
            <el-option label="每月监测" value="每月监测"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="数据范围" prop="dataRange">
          <el-date-picker
            v-model="taskForm.dataRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          >
          </el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 查看任务详情对话框 -->
    <el-dialog
      title="任务详情"
      :visible.sync="viewDialogVisible"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务ID">{{ viewTask.taskId }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ viewTask.taskName }}</el-descriptions-item>
        <el-descriptions-item label="调用模型">{{ viewTask.modelName }}</el-descriptions-item>
        <el-descriptions-item label="运行状态">
          <el-tag
            :type="viewTask.status === '运行中' ? 'success' : (viewTask.status === '待运行' ? 'warning' : 'info')"
          >
            {{ viewTask.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="累计监测数据条数">{{ viewTask.dataCount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewTask.createTime }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ viewTask.creator }}</el-descriptions-item>
        <el-descriptions-item label="监测周期">{{ viewTask.monitorCycle || '每日监测' }}</el-descriptions-item>
        <el-descriptions-item label="任务描述" :span="2">
          {{ viewTask.taskDescription || '暂无描述' }}
        </el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="viewDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'TaskBaseView',
  data() {
    return {
      searchForm: {
        taskId: '',
        taskName: '',
        modelName: ''
      },
      taskList: [
        {
          taskId: 'JG0000000000014',
          taskName: '虚假检查监测',
          modelName: '虚假检查监测模型',
          status: '运行中',
          dataCount: 123344,
          createTime: '20250514 14:23:26',
          creator: '张三',
          monitorCycle: '实时监测',
          taskDescription: '监测医疗机构虚假检查行为，包括检查记录缺失、设备未使用等情况'
        },
        {
          taskId: 'JG0000000000013',
          taskName: '重复检查监测',
          modelName: '重复检查监测模型',
          status: '待运行',
          dataCount: 123344,
          createTime: '20250514 14:23:20',
          creator: '张三',
          monitorCycle: '每日监测',
          taskDescription: '监测患者重复检查行为，识别短时间内多次相同或相似检查的情况'
        },
        {
          taskId: 'JG0000000000012',
          taskName: '重复检查监测',
          modelName: '重复检查监测模型',
          status: '已结束',
          dataCount: 123344,
          createTime: '20250514 14:23:10',
          creator: '张三',
          monitorCycle: '每日监测',
          taskDescription: '监测患者重复检查行为'
        },
        {
          taskId: 'JG0000000000011',
          taskName: '过度检查监测',
          modelName: '过度检查监测模型',
          status: '已结束',
          dataCount: 123344,
          createTime: '20250514 14:23:02',
          creator: '张三',
          monitorCycle: '每周监测',
          taskDescription: '监测过度检查行为，识别不必要的重复检查'
        },
        {
          taskId: 'JG0000000000010',
          taskName: '缺失检查监测',
          modelName: '过度检查监测模型',
          status: '已结束',
          dataCount: 123344,
          createTime: '20250514 14:22:20',
          creator: '李四',
          monitorCycle: '每日监测',
          taskDescription: '监测诊疗过程中缺失必要检查的情况'
        }
      ],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 5
      },
      dialogVisible: false,
      dialogType: 'create', // create 或 edit
      taskForm: {
        taskId: '',
        taskName: '',
        modelName: '',
        taskDescription: '',
        monitorCycle: '',
        dataRange: []
      },
      rules: {
        taskName: [
          { required: true, message: '请输入任务名称', trigger: 'blur' },
          { max: 50, message: '名称长度不超过50个字符', trigger: 'blur' }
        ],
        modelName: [
          { required: true, message: '请选择调用模型', trigger: 'change' }
        ],
        taskDescription: [
          { max: 200, message: '描述长度不超过200个字符', trigger: 'blur' }
        ],
        monitorCycle: [
          { required: true, message: '请选择监测周期', trigger: 'change' }
        ],
        dataRange: [
          { required: true, message: '请选择数据范围', trigger: 'change' }
        ]
      },
      modelList: [
        '虚假检查监测模型',
        '重复检查监测模型',
        '图像白片监测模型',
        '不合理检查监测模型',
        '过度检查监测模型'
      ],
      viewDialogVisible: false,
      viewTask: {}
    }
  },
  computed: {
    dialogTitle() {
      return this.dialogType === 'create' ? '任务创建' : '任务编辑'
    }
  },
  methods: {
    handleQuery() {
      console.log('查询', this.searchForm)
      // TODO: 实现查询逻辑，调用后端API
    },
    handleReset() {
      this.searchForm = {
        taskId: '',
        taskName: '',
        modelName: ''
      }
      // 重置后重新加载列表
      this.handleQuery()
    },
    handleCreate() {
      this.dialogType = 'create'
      this.taskForm = {
        taskId: '',
        taskName: '',
        modelName: '',
        taskDescription: '',
        monitorCycle: '',
        dataRange: []
      }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.taskForm = {
        ...row,
        dataRange: [new Date(), new Date()]
      }
      this.dialogVisible = true
    },
    handleStart(row) {
      this.$confirm('确定要开始运行该任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        row.status = '运行中'
        this.$message.success('任务已开始运行')
        // TODO: 调用后端API开始任务
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    handleStop(row) {
      this.$confirm('确定要停止该任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        row.status = '已结束'
        this.$message.success('任务已停止')
        // TODO: 调用后端API停止任务
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    handleView(row) {
      this.viewTask = { ...row }
      this.viewDialogVisible = true
    },
    handleDelete(row) {
      this.$confirm('确定要删除该任务吗？删除后无法恢复！', '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
        const index = this.taskList.findIndex(item => item.taskId === row.taskId)
        if (index > -1) {
          this.taskList.splice(index, 1)
          this.$message.success('删除成功')
        }
        // TODO: 调用后端API删除
      })
    },
    handleSubmit() {
      this.$refs.taskForm.validate((valid) => {
        if (valid) {
          if (this.dialogType === 'create') {
            const newTask = {
              ...this.taskForm,
              taskId: 'JG' + Date.now().toString().slice(-13).padStart(13, '0'),
              createTime: new Date().toLocaleString(),
              creator: '当前用户',
              status: '待运行',
              dataCount: 0
            }
            this.taskList.unshift(newTask)
            this.$message.success('创建成功')
          } else {
            const index = this.taskList.findIndex(item => item.taskId === this.taskForm.taskId)
            if (index > -1) {
              this.taskList.splice(index, 1, { ...this.taskList[index], ...this.taskForm })
              this.$message.success('编辑成功')
            }
          }
          this.dialogVisible = false
          // TODO: 调用后端API
        }
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
.task-base {
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
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>