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

    <!-- 规则列表表格 -->
    <div class="table-section">
      <el-table :data="ruleList" style="width: 100%" border>
        <el-table-column prop="ruleCode" label="规则编号" width="180"></el-table-column>
        <el-table-column prop="ruleName" label="规则名称" width="160"></el-table-column>
        <el-table-column prop="ruleContent" label="规则内容" min-width="280" show-overflow-tooltip></el-table-column>
        <el-table-column prop="ruleBasis" label="规则依据" width="200" show-overflow-tooltip></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160"></el-table-column>
        <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
        <el-table-column label="规则状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '启用' ? 'success' : 'info'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.status === '启用'"
              type="text"
              @click="handleToggleStatus(scope.row)"
            >停用</el-button>
            <el-button
              v-else
              type="text"
              @click="handleToggleStatus(scope.row)"
            >启用</el-button>
            <el-divider direction="vertical"></el-divider>
            <el-button type="text" @click="handleEdit(scope.row)">编辑</el-button>
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
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px">
        <el-form-item label="规则编号">
          <el-input v-model="ruleForm.ruleCode" disabled></el-input>
        </el-form-item>
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称（50字以内）"></el-input>
        </el-form-item>
        <el-form-item label="规则内容" prop="ruleContent">
          <el-input
            type="textarea"
            v-model="ruleForm.ruleContent"
            :rows="3"
            placeholder="请输入规则内容（200字以内）"
          ></el-input>
        </el-form-item>
        <el-form-item label="规则算法" prop="ruleAlgorithm">
          <el-input
            type="textarea"
            v-model="ruleForm.ruleAlgorithm"
            :rows="3"
            placeholder="请输入规则算法（200字以内）"
          ></el-input>
        </el-form-item>
        <el-form-item label="规则类型" prop="ruleType">
          <el-select v-model="ruleForm.ruleType" placeholder="请选择规则类型">
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
        <el-form-item label="违规定义" prop="violationDef">
          <el-select v-model="ruleForm.violationDef" placeholder="请选择违规定义">
            <el-option label="明确违规" value="明确违规"></el-option>
            <el-option label="疑似违规" value="疑似违规"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="规则依据" prop="ruleBasis">
          <el-select v-model="ruleForm.ruleBasis" placeholder="请选择规则依据">
            <el-option
              v-for="item in knowledgeBaseList"
              :key="item"
              :label="item"
              :value="item"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="是否删除" v-if="dialogType === 'edit'">
          <el-checkbox v-model="ruleForm.isDelete">删除</el-checkbox>
          <div style="color: red; font-size: 12px;" v-if="ruleForm.isDelete">
            提示：选择删除后模型与任务无法再调用该规则，请谨慎操作！
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'RuleBaseView',
  data() {
    return {
      searchForm: {
        ruleCode: '',
        ruleName: '',
        creator: ''
      },
      ruleList: [
        {
          ruleCode: 'YX0000000000000005',
          ruleName: '影像检查串换项目次数',
          ruleContent: '电子票据中有影像检查项目收费内容、医保中心结算数据中有报销记录，但影像平台缺失影像检查记录的次数，疑似虚假、串换检查记录',
          ruleBasis: '陕西省医疗服务价格项目价格目录',
          createTime: '20250514 14:23:26',
          creator: '张三',
          status: '启用'
        },
        {
          ruleCode: 'YX0000000000000004',
          ruleName: '影像检查设备未使用次数',
          ruleContent: '影像检查记录中检查时间段内该院检查设备未工作（设备未启动、设备故障、设备无检查请求）的次数，疑似复制伪造检查记录',
          ruleBasis: '陕西省医疗服务价格项目价格目录',
          createTime: '20250514 14:23:20',
          creator: '张三',
          status: '启用'
        },
        {
          ruleCode: 'YX0000000000000003',
          ruleName: '影像DICOM文件重复次数',
          ruleContent: '影像DICOM文件中SOP_INSTANCE_UID字段在患者多次影像检查记录中、在不同患者影像检查记录中重复出现的次数，疑似复制伪造检查记录',
          ruleBasis: '陕西省医疗服务价格项目价格目录',
          createTime: '20250514 14:23:10',
          creator: '张三',
          status: '启用'
        },
        {
          ruleCode: 'YX0000000000000002',
          ruleName: '患者重复检查次数',
          ruleContent: '通过医保报销凭证、身份证检索患者在短时间内在多个区域、多家医疗机构存在相同相似的影像检查记录，疑似重复检查记录',
          ruleBasis: '陕西省医疗服务价格项目价格目录',
          createTime: '20250514 14:23:02',
          creator: '张三',
          status: '启用'
        },
        {
          ruleCode: 'YX0000000000000001',
          ruleName: '患者就诊缺失检查次数',
          ruleContent: '对重点关注人群、病种在住院诊疗时没有任何关联影像检查的次数，疑似异常诊疗记录',
          ruleBasis: '陕西省医疗服务价格项目价格目录',
          createTime: '20250514 14:22:20',
          creator: '李四',
          status: '停用'
        }
      ],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 5
      },
      dialogVisible: false,
      dialogType: 'create', // create 或 edit
      ruleForm: {
        ruleCode: '',
        ruleName: '',
        ruleContent: '',
        ruleAlgorithm: '',
        ruleType: '',
        violationDef: '',
        ruleBasis: '',
        isDelete: false
      },
      rules: {
        ruleName: [
          { required: true, message: '请输入规则名称', trigger: 'blur' },
          { max: 50, message: '名称长度不超过50个字符', trigger: 'blur' }
        ],
        ruleContent: [
          { required: true, message: '请输入规则内容', trigger: 'blur' },
          { max: 200, message: '内容长度不超过200个字符', trigger: 'blur' }
        ],
        ruleAlgorithm: [
          { required: true, message: '请输入规则算法', trigger: 'blur' },
          { max: 200, message: '算法长度不超过200个字符', trigger: 'blur' }
        ],
        ruleType: [
          { required: true, message: '请选择规则类型', trigger: 'change' }
        ],
        violationDef: [
          { required: true, message: '请选择违规定义', trigger: 'change' }
        ],
        ruleBasis: [
          { required: true, message: '请选择规则依据', trigger: 'change' }
        ]
      },
      knowledgeBaseList: [
        '陕西省医疗服务价格项目价格目录',
        '陕西省基本医疗保险诊疗项目和医疗服务设施范围及支付标准'
      ]
    }
  },
  computed: {
    dialogTitle() {
      return this.dialogType === 'create' ? '规则创建' : '规则编辑'
    }
  },
  methods: {
    handleQuery() {
      console.log('查询', this.searchForm)
      // TODO: 实现查询逻辑，调用后端API
    },
    handleReset() {
      this.searchForm = {
        ruleCode: '',
        ruleName: '',
        creator: ''
      }
      // 重置后重新加载列表
      this.handleQuery()
    },
    handleCreate() {
      this.dialogType = 'create'
      this.ruleForm = {
        ruleCode: 'YX' + Date.now().toString().slice(-16).padStart(16, '0'), // 自动生成编号
        ruleName: '',
        ruleContent: '',
        ruleAlgorithm: '',
        ruleType: '',
        violationDef: '',
        ruleBasis: '',
        isDelete: false
      }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.ruleForm = { ...row, isDelete: false }
      this.dialogVisible = true
    },
    handleToggleStatus(row) {
      const newStatus = row.status === '启用' ? '停用' : '启用'
      this.$confirm(`确定要${newStatus}该规则吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        row.status = newStatus
        this.$message.success(`${newStatus}成功`)
        // TODO: 调用后端API更新状态
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    handleSubmit() {
      this.$refs.ruleForm.validate((valid) => {
        if (valid) {
          if (this.dialogType === 'edit' && this.ruleForm.isDelete) {
            // 删除操作
            this.$confirm('确定要删除该规则吗？删除后无法恢复！', '删除确认', {
              confirmButtonText: '确定删除',
              cancelButtonText: '取消',
              type: 'error'
            }).then(() => {
              const index = this.ruleList.findIndex(item => item.ruleCode === this.ruleForm.ruleCode)
              if (index > -1) {
                this.ruleList.splice(index, 1)
                this.$message.success('删除成功')
                this.dialogVisible = false
              }
              // TODO: 调用后端API删除
            })
          } else {
            // 创建或编辑
            if (this.dialogType === 'create') {
              this.ruleList.unshift({ ...this.ruleForm, createTime: new Date().toLocaleString(), status: '启用' })
              this.$message.success('创建成功')
            } else {
              const index = this.ruleList.findIndex(item => item.ruleCode === this.ruleForm.ruleCode)
              if (index > -1) {
                this.ruleList.splice(index, 1, this.ruleForm)
                this.$message.success('编辑成功')
              }
            }
            this.dialogVisible = false
            // TODO: 调用后端API
          }
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
