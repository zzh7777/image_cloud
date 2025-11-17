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

    <!-- 模型列表表格 -->
    <div class="table-section">
      <el-table :data="modelList" style="width: 100%" border>
        <el-table-column prop="modelName" label="模型名称" width="200"></el-table-column>
        <el-table-column prop="modelType" label="模型类型" width="120"></el-table-column>
        <el-table-column prop="modelVersion" label="模型版本" width="100"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160"></el-table-column>
        <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
        <el-table-column label="运行状态" width="100">
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
            >禁用</el-button>
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
                style="margin: 10px;"
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
                style="margin: 10px;"
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
          <el-checkbox-group v-model="modelForm.dataSources">
            <el-checkbox label="影像申请单"></el-checkbox>
            <el-checkbox label="影像报告单"></el-checkbox>
            <el-checkbox label="影像结算"></el-checkbox>
            <el-checkbox label="影像图像"></el-checkbox>
            <el-checkbox label="设备运行日志"></el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="是否删除" v-if="dialogType === 'edit'">
          <el-checkbox v-model="modelForm.isDelete">删除</el-checkbox>
          <div style="color: red; font-size: 12px;" v-if="modelForm.isDelete">
            提示：选择删除后任务无法再调用该模型，请谨慎操作！
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
  name: 'ModelBaseView',
  data() {
    return {
      searchForm: {
        modelName: '',
        modelType: '',
        creator: ''
      },
      modelList: [
        {
          modelName: '虚假检查监测模型',
          modelType: '数据质量',
          modelVersion: 'V1.1.1',
          createTime: '20250514 14:23:26',
          creator: '张三',
          status: '禁用'
        },
        {
          modelName: '重复检查监测模型',
          modelType: '反欺诈',
          modelVersion: 'V1.1.1',
          createTime: '20250514 14:23:20',
          creator: '张三',
          status: '启用'
        },
        {
          modelName: '图像白片监测模型',
          modelType: '影像质量',
          modelVersion: 'V1.1.1',
          createTime: '20250514 14:23:10',
          creator: '张三',
          status: '启用'
        },
        {
          modelName: '不合理检查监测模型',
          modelType: '反欺诈',
          modelVersion: 'V1.1.1',
          createTime: '20250514 14:23:02',
          creator: '张三',
          status: '启用'
        },
        {
          modelName: '过度检查监测模型',
          modelType: '反欺诈',
          modelVersion: 'V1.1.3',
          createTime: '20250514 14:22:20',
          creator: '李四',
          status: '启用'
        }
      ],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 5
      },
      dialogVisible: false,
      dialogType: 'create',
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
      // 所有可用规则（启用状态）
      allRules: [
        { ruleCode: 'YX0000000000000005', ruleName: '影像检查串换项目次数' },
        { ruleCode: 'YX0000000000000004', ruleName: '影像检查设备未使用次数' },
        { ruleCode: 'YX0000000000000003', ruleName: '影像DICOM文件重复次数' },
        { ruleCode: 'YX0000000000000002', ruleName: '患者重复检查次数' }
      ],
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
    // 待加入规则列表（排除已选择的）
    availableRules() {
      return this.allRules.filter(rule => 
        !this.modelForm.selectedRules.includes(rule.ruleCode)
      )
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
  methods: {
    handleQuery() {
      console.log('查询', this.searchForm)
      // TODO: 实现查询逻辑，调用后端API
    },
    handleReset() {
      this.searchForm = {
        modelName: '',
        modelType: '',
        creator: ''
      }
      this.handleQuery()
    },
    handleCreate() {
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
    handleEdit(row) {
      this.dialogType = 'edit'
      // 模拟已有规则数据
      this.modelForm = {
        ...row,
        selectedRules: ['YX0000000000000005', 'YX0000000000000004'],
        dataSources: ['影像申请单', '影像报告单'],
        isDelete: false
      }
      this.tempAvailableSelected = []
      this.tempSelectedRules = []
      this.dialogVisible = true
    },
    handleToggleStatus(row) {
      const newStatus = row.status === '启用' ? '禁用' : '启用'
      this.$confirm(`确定要${newStatus}该模型吗？`, '提示', {
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
    // 添加规则到已选择
    addRules() {
      this.modelForm.selectedRules.push(...this.tempAvailableSelected)
      this.tempAvailableSelected = []
    },
    // 从已选择移除规则
    removeRules() {
      this.modelForm.selectedRules = this.modelForm.selectedRules.filter(
        code => !this.tempSelectedRules.includes(code)
      )
      this.tempSelectedRules = []
    },
    handleSubmit() {
      this.$refs.modelForm.validate((valid) => {
        if (valid) {
          if (this.dialogType === 'edit' && this.modelForm.isDelete) {
            // 删除操作
            this.$confirm('确定要删除该模型吗？删除后无法恢复！', '删除确认', {
              confirmButtonText: '确定删除',
              cancelButtonText: '取消',
              type: 'error'
            }).then(() => {
              const index = this.modelList.findIndex(item => item.modelName === this.modelForm.modelName)
              if (index > -1) {
                this.modelList.splice(index, 1)
                this.$message.success('删除成功')
                this.dialogVisible = false
              }
              // TODO: 调用后端API删除
            })
          } else {
            // 创建或编辑
            if (this.dialogType === 'create') {
              this.modelList.unshift({
                ...this.modelForm,
                createTime: new Date().toLocaleString(),
                creator: '当前用户',
                status: '启用'
              })
              this.$message.success('创建成功')
            } else {
              const index = this.modelList.findIndex(item => item.modelName === this.modelForm.modelName)
              if (index > -1) {
                this.modelList.splice(index, 1, { ...this.modelList[index], ...this.modelForm })
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

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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
  padding: 10px;
}

.rule-item {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
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
