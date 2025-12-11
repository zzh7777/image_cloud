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

    <!-- 任务列表表格 -->
    <div class="table-section">
      <div class="table-wrapper">
        <el-table 
          :data="taskList" 
          style="width: 100%; min-width: 1200px;" 
          border
          v-loading="loading"
          element-loading-text="加载中..."
        >
          <el-table-column prop="taskId" label="任务ID" min-width="90" align="left"></el-table-column>
          <el-table-column prop="taskName" label="任务名称" min-width="270" align="left"></el-table-column>
          <el-table-column prop="modelName" label="调用模型" min-width="270" align="left"></el-table-column>
          <!-- 列表中展示外部状态（基于 external_status 映射的中文） -->
          <el-table-column label="外部状态" min-width="120" align="left">
            <template slot-scope="scope">
              <el-tag
                :type="scope.row.externalStatus === 'running' ? 'success'
                      : (scope.row.externalStatus === 'pending' || scope.row.externalStatus === 'paused' ? 'warning' : 'info')"
              >
                {{ scope.row.externalStatusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="dataCount" label="累计监测数据条数" min-width="120" align="left"></el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="140" align="left">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="creator" label="创建人" min-width="120" align="left"></el-table-column>
          <el-table-column label="操作" width="330" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button type="text" @click="handleView(scope.row)">查看详情</el-button>
              <el-divider direction="vertical"></el-divider>
              <!-- 运行中状态：停止、删除 -->
              <template v-if="scope.row.externalStatus === 'running'">
                <el-button 
                  type="text" 
                  @click="handleStop(scope.row)"
                  v-if="canStartStop"
                >停止</el-button>
                <el-divider direction="vertical" v-if="canStartStop && canDelete"></el-divider>
                <el-button 
                  type="text" 
                  style="color: #f56c6c;" 
                  @click="handleDelete(scope.row)"
                  v-if="canDelete"
                >删除</el-button>
              </template>
              <!-- 待运行 / 暂停 状态：开始、编辑、删除 -->
              <template v-else-if="scope.row.externalStatus === 'pending' || scope.row.externalStatus === 'paused'">
                <el-button 
                  type="text" 
                  @click="handleStart(scope.row)"
                  v-if="canStartStop"
                >开始</el-button>
                <el-divider direction="vertical" v-if="canStartStop && canEdit"></el-divider>
                <el-button 
                  type="text" 
                  @click="handleEdit(scope.row)"
                  v-if="canEdit"
                >编辑</el-button>
                <el-divider direction="vertical" v-if="(canStartStop || canEdit) && canDelete"></el-divider>
                <el-button 
                  type="text" 
                  style="color: #f56c6c;" 
                  @click="handleDelete(scope.row)"
                  v-if="canDelete"
                >删除</el-button>
              </template>
              <!-- 已结束状态：删除 -->
              <template v-else>
                <el-button 
                  type="text" 
                  style="color: #f56c6c;" 
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

    <!-- 创建/编辑任务对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="1200px"
      :close-on-click-modal="false"
    >
      <el-form :model="taskForm" :rules="rules" ref="taskForm" label-width="120px">
        <el-form-item label="任务ID" v-if="dialogType === 'edit'">
          <el-input v-model="taskForm.taskId" disabled></el-input>
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.taskName" placeholder="请输入任务名称（50字以内）"></el-input>
        </el-form-item>
        <el-form-item label="模型选择">
          <div style="display: flex; gap: 10px;">
            <el-select 
              v-model="taskForm.selectedModel" 
              placeholder="请选择模型" 
              style="flex: 1;"
              @change="handleModelChange"
            >
              <el-option
                v-for="model in availableModels"
                :key="model.id"
                :label="model.modelName"
                :value="model.id"
              ></el-option>
            </el-select>
            <el-select 
              v-model="taskForm.selectedModelVersion" 
              placeholder="请选择版本" 
              style="flex: 1;"
              :disabled="!taskForm.selectedModel"
            >
              <el-option
                v-for="version in availableVersions"
                :key="version"
                :label="`版本V${version}`"
                :value="version"
              ></el-option>
            </el-select>
          </div>
        </el-form-item>
        
        <el-form-item label="医院范围" class="hospital-transfer-item">
          <div class="transfer-container">
            <div class="transfer-panel">
              <div class="panel-header">待加入医院</div>
              <div style="padding: 10px; border-bottom: 1px solid #dcdfe6;">
                <div style="margin-bottom: 8px; display: flex; align-items: center;">
                  <span style="font-size: 12px; width: 60px; text-align: left;">医院等级</span>
                  <el-select 
                    v-model="availableHospitalLevel" 
                    placeholder="全部" 
                    size="small" 
                    clearable
                    style="flex: 1;"
                  >
                    <el-option
                      v-for="level in hospitalLevels"
                      :key="level"
                      :label="level"
                      :value="level"
                    ></el-option>
                  </el-select>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 12px; width: 60px; text-align: left;">医院名称</span>
                  <el-input
                    v-model="availableHospitalSearch"
                    placeholder="搜索医院"
                    size="small"
                    clearable
                    style="flex: 1;"
                  ></el-input>
                </div>
              </div>
              <div class="panel-body">
                <el-checkbox
                  :indeterminate="isAvailableIndeterminate"
                  v-model="availableAllChecked"
                  @change="handleAvailableHospitalCheckAll"
                  style="padding: 8px; border-bottom: 1px solid #f0f0f0;"
                >全选</el-checkbox>
                <el-checkbox-group v-model="tempAvailableHospitalsSelected">
                  <div
                    v-for="hospital in filteredAvailableHospitals"
                    :key="hospital.hospitalCode"
                    class="hospital-item"
                  >
                    <el-checkbox :label="hospital.hospitalCode">
                      {{ hospital.hospitalCode }} {{ hospital.hospitalName }} {{ hospital.hospitalLevel }}
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>
            </div>
            
            <div class="transfer-buttons">
              <el-button
                @click="addHospitals"
                :disabled="tempAvailableHospitalsSelected.length === 0"
                icon="el-icon-arrow-right"
                size="small"
              ></el-button>
              <el-button
                @click="removeHospitals"
                :disabled="tempSelectedHospitals.length === 0"
                icon="el-icon-arrow-left"
                size="small"
                style="margin-top: 10px;"
              ></el-button>
            </div>
            
            <div class="transfer-panel">
              <div class="panel-header">已加入医院</div>
              <div style="padding: 10px; border-bottom: 1px solid #dcdfe6;">
                <div style="margin-bottom: 8px; display: flex; align-items: center;">
                  <span style="font-size: 12px; width: 60px; text-align: left;">医院等级</span>
                  <el-select 
                    v-model="selectedHospitalLevel" 
                    placeholder="全部" 
                    size="small" 
                    clearable
                    style="flex: 1;"
                  >
                    <el-option
                      v-for="level in hospitalLevels"
                      :key="level"
                      :label="level"
                      :value="level"
                    ></el-option>
                  </el-select>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 12px; width: 60px; text-align: left;">医院名称</span>
                  <el-input
                    v-model="selectedHospitalSearch"
                    placeholder="搜索医院"
                    size="small"
                    clearable
                    style="flex: 1;"
                  ></el-input>
                </div>
              </div>
              <div class="panel-body">
                <el-checkbox
                  :indeterminate="isSelectedIndeterminate"
                  v-model="selectedAllChecked"
                  @change="handleSelectedHospitalCheckAll"
                  style="padding: 8px; border-bottom: 1px solid #f0f0f0;"
                >全选</el-checkbox>
                <el-checkbox-group v-model="tempSelectedHospitals">
                  <div
                    v-for="hospital in filteredSelectedHospitals"
                    :key="hospital.hospitalCode"
                    class="hospital-item"
                  >
                    <el-checkbox :label="hospital.hospitalCode">
                      {{ hospital.hospitalCode }} {{ hospital.hospitalName }} {{ hospital.hospitalLevel }}
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-radio-group v-model="taskForm.timeRangeType">
            <el-radio label="all">全部时间</el-radio>
            <el-radio label="specified">指定时间</el-radio>
          </el-radio-group>
          <el-date-picker
            v-if="taskForm.timeRangeType === 'specified'"
            v-model="taskForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="margin-left: 10px; width: 300px;"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item label="开始时间">
          <el-radio-group v-model="taskForm.startTimeType">
            <el-radio label="immediate">立刻开始</el-radio>
            <el-radio label="specified">指定时间</el-radio>
          </el-radio-group>
          <el-date-picker
            v-if="taskForm.startTimeType === 'specified'"
            v-model="taskForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="margin-left: 10px; width: 300px;"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss"
          ></el-date-picker>
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
      width="900px"
      :close-on-click-modal="false"
      @close="handleViewDialogClose"
    >
      <div v-if="viewTask.taskId || viewTask.id" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">{{ viewTask.taskId || viewTask.id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="任务编码">{{ viewTask.taskCode || viewTask.task_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ viewTask.taskName || viewTask.task_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="调用模型">
            {{ viewTask.modelName || viewTask.model_name || '-' }}
            <span v-if="viewTask.modelVersion || viewTask.model_version"> (版本V{{ viewTask.modelVersion || viewTask.model_version }})</span>
          </el-descriptions-item>
          <!-- 运行状态字段已由内部状态/外部状态替代，这里不再单独展示 -->
          <el-descriptions-item label="内部状态" v-if="viewTask.internalStatus || viewTask.internal_status">
            <el-tag :type="(viewTask.internalStatus || viewTask.internal_status) === 'running' ? 'success' : 
                          (viewTask.internalStatus || viewTask.internal_status) === 'pending' ? 'warning' : 'info'">
              {{ (viewTask.internalStatus || viewTask.internal_status) === 'running' ? '运行中' : 
                 ((viewTask.internalStatus || viewTask.internal_status) === 'pending' ? '待运行' : 
                 ((viewTask.internalStatus || viewTask.internal_status) === 'completed' ? '已完成' : 
                 ((viewTask.internalStatus || viewTask.internal_status) === 'stopped' ? '已停止' : 
                 (viewTask.internalStatus || viewTask.internal_status)))) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="外部状态" v-if="viewTask.externalStatus || viewTask.external_status">
            <el-tag :type="(viewTask.externalStatus || viewTask.external_status) === 'running' ? 'success' : 
                          (viewTask.externalStatus || viewTask.external_status) === 'pending' ? 'warning' : 'info'">
              {{ (viewTask.externalStatus || viewTask.external_status) === 'running' ? '运行中' : 
                 ((viewTask.externalStatus || viewTask.external_status) === 'pending' ? '待运行' : 
                 ((viewTask.externalStatus || viewTask.external_status) === 'completed' ? '已完成' : 
                 ((viewTask.externalStatus || viewTask.external_status) === 'stopped' ? '已停止' : 
                 (viewTask.externalStatus || viewTask.external_status)))) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间范围" :span="2">
            <span v-if="viewTask.timeRangeType === 'all' || viewTask.time_range_type === 'all'">全部时间</span>
            <span v-else-if="viewTask.timeRange && viewTask.timeRange.length === 2">
              {{ viewTask.timeRange[0] }} 至 {{ viewTask.timeRange[1] }}
            </span>
            <span v-else-if="viewTask.startTime && viewTask.endTime">
              {{ formatDateTime(viewTask.startTime) }} 至 {{ formatDateTime(viewTask.endTime) }}
            </span>
            <span v-else-if="viewTask.start_time && viewTask.end_time">
              {{ formatDateTime(viewTask.start_time) }} 至 {{ formatDateTime(viewTask.end_time) }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间" :span="2">
            <span v-if="viewTask.startTimeType === 'immediate' || viewTask.start_time_type === 'immediate'">立刻开始</span>
            <span v-else-if="viewTask.startTime">{{ viewTask.startTime }}</span>
            <span v-else-if="viewTask.taskLaunchTime || viewTask.task_launch_time">
              {{ formatDateTime(viewTask.taskLaunchTime || viewTask.task_launch_time) }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="完成时间" v-if="viewTask.completionTime || viewTask.completion_time">
            {{ formatDateTime(viewTask.completionTime || viewTask.completion_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="任务描述" :span="2" v-if="viewTask.description">
            <div style="white-space: pre-wrap; word-break: break-word;">
              {{ viewTask.description }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="医院范围" :span="2">
            <div v-if="viewTask.selectedHospitals && viewTask.selectedHospitals.length > 0" style="max-height: 200px; overflow-y: auto;">
              <el-tag
                v-for="(hospital, index) in viewTask.selectedHospitals"
                :key="index"
                style="margin: 4px;"
              >
                {{ getHospitalDisplayName(hospital) }}
              </el-tag>
            </div>
            <div v-else-if="viewTask.hospitals && viewTask.hospitals.length > 0" style="max-height: 200px; overflow-y: auto;">
              <el-tag
                v-for="(hospital, index) in viewTask.hospitals"
                :key="index"
                style="margin: 4px;"
              >
                {{ getHospitalDisplayName(hospital.hospital || hospital) }}
              </el-tag>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
          <!-- 统计数据 -->
          <el-descriptions-item label="总数据量" v-if="viewTask.totalDataCount !== undefined || viewTask.total_data_count !== undefined">
            {{ viewTask.totalDataCount || viewTask.total_data_count || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="已处理数据量" v-if="viewTask.lastDataCount !== undefined || viewTask.last_data_count !== undefined">
            {{ viewTask.lastDataCount || viewTask.last_data_count || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="成功数量" v-if="viewTask.successCount !== undefined || viewTask.success_count !== undefined">
            <el-tag type="success">{{ viewTask.successCount || viewTask.success_count || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="失败数量" v-if="viewTask.failedCount !== undefined || viewTask.failed_count !== undefined">
            <el-tag type="danger">{{ viewTask.failedCount || viewTask.failed_count || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ viewTask.createTime || viewTask.create_time ? formatDateTime(viewTask.createTime || viewTask.create_time) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ viewTask.creator || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" v-if="viewTask.updateTime || viewTask.update_time">
            {{ formatDateTime(viewTask.updateTime || viewTask.update_time) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <div v-else style="text-align: center; padding: 40px;">
        <i class="el-icon-loading" style="font-size: 24px;"></i>
        <p style="margin-top: 10px; color: #909399;">加载中...</p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { hasEditPermission } from '@/utils/permissions'

export default {
  name: 'TaskBaseView',
  data() {
    return {
      searchForm: {
        taskName: '',
        modelName: '',
        creator: '',
        dateRange: []
      },
      taskList: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      dialogVisible: false,
      dialogType: 'create', // create 或 edit
      taskForm: {
        taskId: '',
        taskName: '',
        selectedModel: null, // 选中的模型ID
        selectedModelVersion: '', // 选中的模型版本
        selectedHospitals: [], // 选中的医院编码数组
        timeRangeType: 'all', // 时间范围类型：all 或 specified
        timeRange: [], // 指定时间范围
        startTimeType: 'immediate', // 开始时间类型：immediate 或 specified
        startTime: '' // 指定开始时间
      },
      rules: {
      },
      // 所有模型列表（从数据库获取）
      allModels: [],
      // 所有医院列表（从数据库获取）
      allHospitals: [],
      // 医院等级列表（从医院数据中提取）
      hospitalLevels: [],
      // 已加入医院的临时选择
      tempSelectedHospitals: [],
      // 待加入医院的临时选择
      tempAvailableHospitalsSelected: [],
      // 已加入医院的搜索和筛选
      selectedHospitalSearch: '',
      selectedHospitalLevel: '',
      // 待加入医院的搜索和筛选
      availableHospitalSearch: '',
      availableHospitalLevel: '',
      // 全选复选框的状态
      availableAllChecked: false,
      selectedAllChecked: false,
      viewDialogVisible: false,
      viewTask: {}
    }
  },
  mounted() {
    // 组件挂载时获取任务列表、模型列表和医院列表
    this.fetchTaskList()
    this.fetchAllModels()
    this.fetchAllHospitals()
  },
  computed: {
    dialogTitle() {
      return this.dialogType === 'create' ? '任务明细' : '任务明细'
    },
    // 检查是否有创建权限
    canCreate() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'create')
    },
    // 检查是否有编辑权限
    canEdit() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'update')
    },
    // 检查是否有删除权限
    canDelete() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'delete')
    },
    // 检查是否有开始/停止权限
    canStartStop() {
      const role = this.$store.getters.role
      const routeName = this.$route.name
      return hasEditPermission(role, routeName, 'update')
    },
    // 任务创建时可供选择的模型列表（过滤掉禁用模型）
    availableModels() {
      return this.allModels.filter(model => {
        const status = model.status
        // 显式禁用的模型不允许选择
        if (status === 'inactive' || status === '禁用' || status === '停用') {
          return false
        }
        // 其他情况（active 或无状态字段）都可以选择
        return true
      })
    },
    // 当前选中模型的可用版本列表
    availableVersions() {
      if (!this.taskForm.selectedModel) {
        return []
      }
      const selectedModel = this.allModels.find(m => m.id === this.taskForm.selectedModel)
      if (!selectedModel) {
        return []
      }
      // 返回模型的版本，如果没有版本信息，返回默认版本
      return selectedModel.versions && selectedModel.versions.length > 0 
        ? selectedModel.versions 
        : [selectedModel.modelVersion || '1.0']
    },
    // 待加入医院列表（排除已选择的）
    availableHospitals() {
      return this.allHospitals.filter(hospital => 
        !this.taskForm.selectedHospitals.includes(hospital.hospitalCode)
      )
    },
    // 已加入医院列表
    selectedHospitalsList() {
      return this.allHospitals.filter(hospital =>
        this.taskForm.selectedHospitals.includes(hospital.hospitalCode)
      )
    },
    // 过滤后的待加入医院（根据搜索和等级筛选）
    filteredAvailableHospitals() {
      let filtered = this.availableHospitals
      
      // 按医院等级筛选
      if (this.availableHospitalLevel) {
        filtered = filtered.filter(h => h.hospitalLevel === this.availableHospitalLevel)
      }
      
      // 按医院名称搜索
      if (this.availableHospitalSearch) {
        const keyword = this.availableHospitalSearch.toLowerCase()
        filtered = filtered.filter(h => 
          h.hospitalName.toLowerCase().includes(keyword) ||
          h.hospitalCode.toLowerCase().includes(keyword)
        )
      }
      
      return filtered
    },
    // 过滤后的已加入医院（根据搜索和等级筛选）
    filteredSelectedHospitals() {
      let filtered = this.selectedHospitalsList
      
      // 按医院等级筛选
      if (this.selectedHospitalLevel) {
        filtered = filtered.filter(h => h.hospitalLevel === this.selectedHospitalLevel)
      }
      
      // 按医院名称搜索
      if (this.selectedHospitalSearch) {
        const keyword = this.selectedHospitalSearch.toLowerCase()
        filtered = filtered.filter(h => 
          h.hospitalName.toLowerCase().includes(keyword) ||
          h.hospitalCode.toLowerCase().includes(keyword)
        )
      }
      
      return filtered
    },
    // 待加入医院全选状态
    isAvailableAllChecked() {
      const filtered = this.filteredAvailableHospitals
      return filtered.length > 0 && this.tempAvailableHospitalsSelected.length === filtered.length
    },
    // 待加入医院半选状态
    isAvailableIndeterminate() {
      const filtered = this.filteredAvailableHospitals
      return this.tempAvailableHospitalsSelected.length > 0 && 
             this.tempAvailableHospitalsSelected.length < filtered.length
    },
    // 已加入医院全选状态
    isSelectedAllChecked() {
      const filtered = this.filteredSelectedHospitals
      return filtered.length > 0 && this.tempSelectedHospitals.length === filtered.length
    },
    // 已加入医院半选状态
    isSelectedIndeterminate() {
      const filtered = this.filteredSelectedHospitals
      return this.tempSelectedHospitals.length > 0 && 
             this.tempSelectedHospitals.length < filtered.length
    }
  },
  watch: {
    // 同步待加入医院全选状态
    isAvailableAllChecked(newVal) {
      this.availableAllChecked = newVal
    },
    // 同步已加入医院全选状态
    isSelectedAllChecked(newVal) {
      this.selectedAllChecked = newVal
    }
  },
  methods: {
    // 获取任务列表
    async fetchTaskList() {
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
        
        // 添加搜索条件
        if (this.searchForm.taskName) {
          params.append('task_name', this.searchForm.taskName)
        }
        if (this.searchForm.modelName) {
          params.append('model_name', this.searchForm.modelName)
        }
        if (this.searchForm.creator) {
          params.append('creator', this.searchForm.creator)
        }
        // 添加日期范围
        if (this.searchForm.dateRange && Array.isArray(this.searchForm.dateRange) && this.searchForm.dateRange.length === 2) {
          params.append('start_date', this.searchForm.dateRange[0])
          params.append('end_date', this.searchForm.dateRange[1])
        }
        
        // 尝试使用 batch-tasks 作为API路径
        const url = `/api/v1/batch-tasks/?${params.toString()}`
        
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
          console.error('解析任务列表响应失败:', e)
          if (!response.ok) {
            throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
          }
          this.loading = false
          return
        }
        
        // 打印响应用于调试
        console.log('任务列表响应状态:', response.status)
        console.log('任务列表响应数据:', data)
        
        if (!response.ok) {
          let errorMessage = `获取任务列表失败: ${response.status}`
          
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
          const errorMessage = data.message || `获取任务列表失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式：{ code: 0, message: "success", data: { count, results } }
        if (data && data.code === 0 && data.data && data.data.results) {
          this.processTaskList(data.data)
        } else if (data && data.results) {
          // 兼容旧格式
          this.processTaskList(data)
        } else {
          this.taskList = []
          this.pagination.total = 0
        }
      } catch (error) {
        console.error('获取任务列表错误:', error)
        const errorMessage = error.message || '获取任务列表失败，请稍后重试'
        this.$message.error(errorMessage)
      } finally {
        this.loading = false
      }
    },
    // 获取所有模型列表（用于模型选择）
    async fetchAllModels() {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        console.warn('未登录，无法获取模型列表')
        return
      }
      
      try {
        let allModelsData = []
        let page = 1
        let hasNext = true
        const pageSize = 100
        
        // 分页获取所有模型
        while (hasNext) {
          const params = new URLSearchParams({
            page: page,
            page_size: pageSize
          })
          
          const url = `/api/v1/rule-models/?${params.toString()}`
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!response.ok) {
            console.error('获取模型列表失败:', response.status)
            break
          }
          
          const text = await response.text()
          let data = null
          
          try {
            data = text ? JSON.parse(text) : null
          } catch (e) {
            console.error('解析模型列表响应失败:', e)
            break
          }
          
          // 处理统一响应格式：{ code: 0, message: "success", data: { count, results, next } }
          let results = null
          let next = null
          
          if (data && data.code === 0 && data.data) {
            results = data.data.results
            next = data.data.next
          } else if (data && data.results) {
            // 兼容旧格式
            results = data.results
            next = data.next
          }
          
          if (results && results.length > 0) {
            const pageModels = results.map(item => ({
              id: item.id,
              modelName: item.model_name || '',
              modelVersion: item.model_version || '1.0',
              modelCode: item.model_code || '',
              status: item.status || item.model_status || '', // active / inactive
              versions: [item.model_version || '1.0'] // 暂时只包含当前版本，后续可以根据需要扩展
            }))
            allModelsData = allModelsData.concat(pageModels)
            
            hasNext = !!next
            page++
          } else {
            hasNext = false
          }
        }
        
        this.allModels = allModelsData
      } catch (error) {
        console.error('获取模型列表错误:', error)
      }
    },
    // 获取所有医院列表（用于医院选择）
    async fetchAllHospitals() {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        console.warn('未登录，无法获取医院列表')
        return
      }
      
      try {
        let allHospitalsData = []
        let page = 1
        let hasNext = true
        const pageSize = 100
        
        // 分页获取所有医院
        while (hasNext) {
          const params = new URLSearchParams({
            page: page,
            page_size: pageSize
          })
          
          const url = `/api/v1/hospitals/?${params.toString()}`
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!response.ok) {
            console.error('获取医院列表失败:', response.status)
            break
          }
          
          const text = await response.text()
          let data = null
          
          try {
            data = text ? JSON.parse(text) : null
          } catch (e) {
            console.error('解析医院列表响应失败:', e)
            break
          }
          
          // 检查响应码（统一响应格式中的 code 字段）
          if (data && data.code !== undefined && data.code !== 0) {
            // code 非0表示错误
            console.error('获取医院列表失败:', data.message || `code ${data.code}`)
            break
          }
          
          if (!response.ok) {
            console.error('获取医院列表失败:', response.status)
            break
          }
          
          // 处理统一响应格式：{ code: 0, message: "success", data: { count, results, next } }
          let results = null
          let next = null
          
          if (data && data.code === 0 && data.data && data.data.results) {
            results = data.data.results
            next = data.data.next
          } else if (data && data.results) {
            // 兼容旧格式
            results = data.results
            next = data.next
          } else {
            // 如果没有结果，结束循环
            hasNext = false
            break
          }
          
          if (results && results.length > 0) {
            const pageHospitals = results.map(item => ({
              hospitalCode: item.hospital_code || '',
              hospitalName: item.hospital_name || '',
              hospitalLevel: item.hospital_level || ''
            }))
            console.log('获取到医院数据:', pageHospitals)
            allHospitalsData = allHospitalsData.concat(pageHospitals)
            
            // 提取医院等级列表（去重）
            const levels = pageHospitals
              .map(h => h.hospitalLevel)
              .filter(level => level)
            levels.forEach(level => {
              if (!this.hospitalLevels.includes(level)) {
                this.hospitalLevels.push(level)
              }
            })
            
            hasNext = !!next
            page++
          } else {
            hasNext = false
          }
        }
        
        this.allHospitals = allHospitalsData
        console.log('总共获取到', allHospitalsData.length, '家医院')
      } catch (error) {
        console.error('获取医院列表错误:', error)
      }
    },
    // 模型选择变化时的处理
    handleModelChange() {
      // 当模型改变时，重置版本选择
      this.taskForm.selectedModelVersion = ''
      // 如果只有一个版本，自动选择
      if (this.availableVersions.length === 1) {
        this.taskForm.selectedModelVersion = this.availableVersions[0]
      }
    },
    // 添加医院到已选择
    addHospitals() {
      this.taskForm.selectedHospitals.push(...this.tempAvailableHospitalsSelected)
      this.tempAvailableHospitalsSelected = []
    },
    // 从已选择移除医院
    removeHospitals() {
      this.taskForm.selectedHospitals = this.taskForm.selectedHospitals.filter(
        code => !this.tempSelectedHospitals.includes(code)
      )
      this.tempSelectedHospitals = []
    },
    // 待加入医院全选/取消全选
    handleAvailableHospitalCheckAll(val) {
      if (val) {
        this.tempAvailableHospitalsSelected = this.filteredAvailableHospitals.map(h => h.hospitalCode)
      } else {
        this.tempAvailableHospitalsSelected = []
      }
    },
    // 已加入医院全选/取消全选
    handleSelectedHospitalCheckAll(val) {
      if (val) {
        this.tempSelectedHospitals = this.filteredSelectedHospitals.map(h => h.hospitalCode)
      } else {
        this.tempSelectedHospitals = []
      }
    },
    // 处理任务列表数据
    processTaskList(data) {
      // 映射后端数据到前端显示格式
      this.taskList = data.results.map(item => {
        // 使用内部状态（internal_status）作为任务运行状态的来源（用于操作按钮控制）
        const internalStatus = item.internal_status || item.internalStatus || ''
        const internalStatusLabel = this.mapTaskStatus(internalStatus)
        
        // 使用外部状态（external_status）作为任务外部状态的来源（用于列表展示）
        const externalStatus = item.external_status || item.externalStatus || ''
        const externalStatusLabel = this.mapTaskStatus(externalStatus)

        // 获取模型名称（从关联的模型对象中获取，或使用 model_version）
        let modelName = item.model_version || ''
        // 如果后端返回了模型对象，可以使用 model.model_name
        if (item.model && typeof item.model === 'object' && item.model.model_name) {
          modelName = item.model.model_name
        } else if (item.model_name) {
          modelName = item.model_name
        }
        
        return {
          id: item.id,
          taskId: item.id, // 任务ID
          taskCode: item.task_code || '', // 任务编码
          taskName: item.task_name || '', // 任务名称
          modelName: modelName, // 调用模型
          // 内部状态（英文）及其中文展示，用于操作按钮控制
          internalStatus: internalStatus,
          internalStatusLabel: internalStatusLabel,
          // 外部状态（英文）及其中文展示，用于列表"外部状态"列展示
          externalStatus: externalStatus,
          externalStatusLabel: externalStatusLabel,
          dataCount: item.total_data_count || 0, // 累计监测数据条数
          createTime: item.create_time || '', // 创建时间
          creator: item.creator || '' // 创建人
        }
      })
      
      // 更新分页信息
      this.pagination.total = data.count || 0
    },
    handleQuery() {
      // 重置到第一页并查询
      this.pagination.currentPage = 1
      this.fetchTaskList()
    },
    handleReset() {
      this.searchForm = {
        taskName: '',
        modelName: '',
        creator: '',
        dateRange: []
      }
      // 重置后重新加载列表
      this.handleQuery()
    },
    handleCreate() {
      // 检查权限
      if (!this.canCreate) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能新增')
        return
      }
      
      this.dialogType = 'create'
      this.taskForm = {
        taskId: '',
        taskName: '',
        selectedModel: null,
        selectedModelVersion: '',
        selectedHospitals: [],
        timeRangeType: 'all',
        timeRange: [],
        startTimeType: 'immediate',
        startTime: ''
      }
      this.tempSelectedHospitals = []
      this.tempAvailableHospitalsSelected = []
      this.selectedHospitalSearch = ''
      this.selectedHospitalLevel = ''
      this.availableHospitalSearch = ''
      this.availableHospitalLevel = ''
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
        // 从API获取任务详情
        const response = await fetch(`/api/v1/batch-tasks/${row.id}/`, {
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
          console.error('解析任务详情响应失败:', e)
          throw new Error('获取任务详情失败')
        }
        
        // 检查响应码
        if (!response.ok || (data && data.code !== undefined && data.code !== 0)) {
          const errorMessage = data?.message || `获取任务详情失败: ${response.status}`
          throw new Error(errorMessage)
        }
        
        // 处理统一响应格式
        const taskData = data && data.code === 0 ? data.data : data
        
        if (!taskData) {
          throw new Error('任务详情数据为空')
        }
        
        // 映射API数据到表单格式
        // 时间范围类型
        const timeRangeType = taskData.time_range_type === 'specific' ? 'specified' : 'all'
        
        // 时间范围
        let timeRange = []
        if (timeRangeType === 'specified' && taskData.start_time && taskData.end_time) {
          const startDate = new Date(taskData.start_time)
          const endDate = new Date(taskData.end_time)
          timeRange = [
            `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
            `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
          ]
        }
        
        // 任务启动时间
        let startTimeType = 'immediate'
        let startTime = ''
        if (taskData.task_launch_time) {
          const launchDate = new Date(taskData.task_launch_time)
          if (!isNaN(launchDate.getTime())) {
            startTimeType = 'specified'
            startTime = `${launchDate.getFullYear()}-${String(launchDate.getMonth() + 1).padStart(2, '0')}-${String(launchDate.getDate()).padStart(2, '0')} ${String(launchDate.getHours()).padStart(2, '0')}:${String(launchDate.getMinutes()).padStart(2, '0')}:${String(launchDate.getSeconds()).padStart(2, '0')}`
          }
        }
        
        // 医院列表
        const selectedHospitals = taskData.hospitals && Array.isArray(taskData.hospitals)
          ? taskData.hospitals.map(h => h.hospital || h).filter(Boolean)
          : []
        
        // 填充表单
        this.taskForm = {
          taskId: taskData.id,
          taskName: taskData.task_name || '',
          selectedModel: taskData.model || null,
          selectedModelVersion: taskData.model_version || '',
          selectedHospitals: selectedHospitals,
          timeRangeType: timeRangeType,
          timeRange: timeRange,
          startTimeType: startTimeType,
          startTime: startTime
        }
        
        // 重置临时选择
        this.tempSelectedHospitals = []
        this.tempAvailableHospitalsSelected = []
        this.selectedHospitalSearch = ''
        this.selectedHospitalLevel = ''
        this.availableHospitalSearch = ''
        this.availableHospitalLevel = ''
        
        // 打开弹窗
        this.dialogVisible = true
      } catch (error) {
        console.error('获取任务详情错误:', error)
        this.$message.error(error.message || '获取任务详情失败，请稍后重试')
      }
    },
    async handleStart(row) {
      // 检查权限（只有 System Administrator / Medical Insurance Administrator 才能启动任务）
      if (!this.canStartStop) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能修改')
        return
      }

      // 二次确认
      try {
        await this.$confirm('确定要开始运行该任务吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch (e) {
        this.$message.info('已取消操作')
        return
      }

      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }

      try {
        let response = await fetch(`/api/v1/batch-tasks/${row.id}/start/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        // 401：尝试刷新 token 后重试一次
        if (response.status === 401) {
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (!refreshSuccess) {
            return
          }
          const newAccessToken = this.$store.getters.accessToken
          response = await fetch(`/api/v1/batch-tasks/${row.id}/start/`, {
            method: 'POST',
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
          console.error('解析启动任务响应失败:', e, text)
        }

        // 统一处理错误（包括 code 非 0 的情况）
        if (!response.ok || (data && data.code !== undefined && data.code !== 0)) {
          let errorMessage = (data && data.message) || `启动任务失败: ${response.status}`

          if (response.status === 403) {
            // 使用全局错误格式化，转成中文提示
            errorMessage = this.formatPermissionError(errorMessage, 'update')
          }

          this.$message.error(errorMessage)
          return
        }

        // 成功：根据统一响应格式获取实际数据
        const resultData = data && data.code === 0 ? data.data : data
        console.log('启动任务成功，返回数据:', resultData)

        // 更新当前行状态为“运行中”
        this.$set(row, 'status', '运行中')
        this.$message.success('任务已开始运行')

        // 可选：重新加载列表，确保状态与后端完全一致
        this.fetchTaskList && this.fetchTaskList()
      } catch (error) {
        console.error('启动任务错误:', error)
        this.$message.error(error.message || '启动任务失败，请稍后重试')
      }
    },
    handleStop(row) {
      // 检查权限
      if (!this.canStartStop) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能修改')
        return
      }
      
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
    async handleView(row) {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      // 先显示基本信息
      this.viewTask = { ...row }
      this.viewDialogVisible = true
      
      try {
        // 从API获取任务详情
        let response = await fetch(`/api/v1/batch-tasks/${row.id}/`, {
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
          if (refreshSuccess) {
            const newAccessToken = this.$store.getters.accessToken
            response = await fetch(`/api/v1/batch-tasks/${row.id}/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${newAccessToken}`,
                'Content-Type': 'application/json'
              }
            })
          }
        }
        
        const text = await response.text()
        let data = null
        
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('解析任务详情响应失败:', e)
          this.$message.error('获取任务详情失败')
          return
        }
        
        // 检查响应码
        if (!response.ok || (data && data.code !== undefined && data.code !== 0)) {
          let errorMessage = data?.message || `获取任务详情失败: ${response.status}`
          
          // 处理权限错误
          if (response.status === 403) {
            errorMessage = this.formatPermissionError(errorMessage, 'view')
          }
          
          this.$message.error(errorMessage)
          return
        }
        
        // 处理统一响应格式
        const taskData = data && data.code === 0 ? data.data : data
        
        if (!taskData) {
          this.$message.error('任务详情数据为空')
          return
        }
        
        // 映射API数据到查看格式
        // 时间范围类型
        const timeRangeType = taskData.time_range_type === 'specific' ? 'specified' : 'all'
        
        // 时间范围
        let timeRange = []
        if (timeRangeType === 'specified' && taskData.start_time && taskData.end_time) {
          const startDate = new Date(taskData.start_time)
          const endDate = new Date(taskData.end_time)
          timeRange = [
            `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
            `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
          ]
        }
        
        // 任务启动时间
        let startTimeType = 'immediate'
        let startTime = ''
        if (taskData.task_launch_time) {
          const launchDate = new Date(taskData.task_launch_time)
          if (!isNaN(launchDate.getTime())) {
            startTimeType = 'specified'
            startTime = `${launchDate.getFullYear()}-${String(launchDate.getMonth() + 1).padStart(2, '0')}-${String(launchDate.getDate()).padStart(2, '0')} ${String(launchDate.getHours()).padStart(2, '0')}:${String(launchDate.getMinutes()).padStart(2, '0')}:${String(launchDate.getSeconds()).padStart(2, '0')}`
          }
        }
        
        // 医院列表
        const selectedHospitals = taskData.hospitals && Array.isArray(taskData.hospitals)
          ? taskData.hospitals.map(h => h.hospital || h).filter(Boolean)
          : []
        
        // 获取模型名称
        let modelName = ''
        if (taskData.model) {
          const model = this.allModels.find(m => m.id === taskData.model)
          if (model) {
            modelName = model.modelName
          }
        }
        
        // 更新查看任务数据
        this.viewTask = {
          id: taskData.id,
          taskId: taskData.id,
          taskCode: taskData.task_code || taskData.taskCode,
          taskName: taskData.task_name || taskData.taskName || '',
          modelName: modelName,
          modelVersion: taskData.model_version || taskData.modelVersion || '',
          model: taskData.model,
          selectedHospitals: selectedHospitals,
          hospitals: taskData.hospitals || [],
          timeRangeType: timeRangeType,
          timeRange: timeRange,
          startTimeType: startTimeType,
          startTime: startTime,
          start_time: taskData.start_time,
          end_time: taskData.end_time,
          taskLaunchTime: taskData.task_launch_time || taskData.task_launch_time,
          task_launch_time: taskData.task_launch_time,
          completionTime: taskData.completion_time || taskData.completionTime,
          completion_time: taskData.completion_time,
          status: this.mapTaskStatus(taskData.internal_status || taskData.internalStatus || taskData.status || row.status),
          internalStatus: taskData.internal_status || taskData.internalStatus,
          internal_status: taskData.internal_status,
          externalStatus: taskData.external_status || taskData.externalStatus,
          external_status: taskData.external_status,
          totalDataCount: taskData.total_data_count || taskData.totalDataCount,
          total_data_count: taskData.total_data_count,
          lastDataCount: taskData.last_data_count || taskData.lastDataCount,
          last_data_count: taskData.last_data_count,
          successCount: taskData.success_count || taskData.successCount,
          success_count: taskData.success_count,
          failedCount: taskData.failed_count || taskData.failedCount,
          failed_count: taskData.failed_count,
          description: taskData.description || '',
          createTime: taskData.create_time || taskData.createTime,
          create_time: taskData.create_time,
          creator: taskData.creator || '',
          updateTime: taskData.update_time || taskData.updateTime,
          update_time: taskData.update_time
        }
      } catch (error) {
        console.error('获取任务详情错误:', error)
        this.$message.error(error.message || '获取任务详情失败，请稍后重试')
      }
    },
    // 映射任务内部状态（internal_status）到中文
    mapTaskStatus(status) {
      if (!status) return status
      const statusMap = {
        pending: '待运行',
        running: '运行中',
        completed: '已完成',
        paused: '已暂停',
        // 兼容已存在的中文值
        '待运行': '待运行',
        '运行中': '运行中',
        '已完成': '已完成',
        '已暂停': '已暂停'
      }
      return statusMap[status] || status
    },
    // 关闭查看详情对话框
    handleViewDialogClose() {
      this.viewTask = {}
    },
    // 获取医院显示名称
    getHospitalDisplayName(hospitalCode) {
      const hospital = this.allHospitals.find(h => h.hospitalCode === hospitalCode)
      if (hospital) {
        return `${hospital.hospitalCode} ${hospital.hospitalName} ${hospital.hospitalLevel}`
      }
      return hospitalCode
    },
    handleDelete(row) {
      // 检查权限
      if (!this.canDelete) {
        this.$message.warning('权限不足，只有 ADMIN 角色才能删除')
        return
      }
      
      this.$confirm('确定要删除该任务吗？删除后无法恢复！', '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
        this.deleteTask(row)
      }).catch(() => {
        // 用户取消删除
      })
    },
    // 删除任务
    async deleteTask(row) {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      try {
        // 发送DELETE请求
        let response = await fetch(`/api/v1/batch-tasks/${row.id}/`, {
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
          response = await fetch(`/api/v1/batch-tasks/${row.id}/`, {
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
        
        console.log('删除任务响应状态:', response.status)
        
        // 204 No Content 表示删除成功（无响应体）
        if (response.status === 204) {
          this.$message.success('删除成功')
          // 刷新任务列表
          this.fetchTaskList()
          return
        }
        
        // 读取响应文本
        const text = await response.text()
        console.log('删除任务响应文本:', text)
        let data = null
        
        // 如果响应为空，且状态码是200-299，认为删除成功
        if (!text || !text.trim()) {
          if (response.ok) {
            this.$message.success('删除成功')
            this.fetchTaskList()
            return
          }
        }
        
        // 检查是否是代理错误（代理错误但删除可能已成功）
        if (text && (text.includes('Proxy error') || text.includes('HPE_INVALID_CONSTANT'))) {
          console.warn('检测到代理错误，但删除操作可能已成功，尝试刷新列表')
          // 延迟一下再刷新，给服务器时间完成删除操作
          setTimeout(() => {
            this.fetchTaskList()
          }, 500)
          // 不显示错误，因为删除可能已经成功
          this.$message.success('删除成功')
          return
        }
        
        // 尝试解析 JSON
        if (text && text.trim()) {
          try {
            data = JSON.parse(text)
            console.log('删除任务响应数据:', data)
          } catch (e) {
            // 如果响应不是 JSON，检查是否是 HTML 错误页面
            if (text.includes('<html') || text.includes('<!DOCTYPE')) {
              console.error('服务器返回了 HTML 错误页面:', text.substring(0, 500))
              throw new Error(`服务器返回了 HTML 错误页面 (${response.status})，可能是服务器内部错误`)
            } else {
              console.error('解析 JSON 失败:', e, '响应文本:', text.substring(0, 200))
              // 如果响应不是 JSON，但状态码是200-299或204，也认为删除成功
              if (response.ok || response.status === 204) {
                this.$message.success('删除成功')
                this.fetchTaskList()
                return
              }
              // 如果状态码是500，可能是代理错误或后端问题，删除可能已成功
              if (response.status === 500) {
                console.warn('500错误，可能是代理问题或后端响应格式问题，删除操作可能已成功，尝试刷新列表')
                // 延迟刷新，给服务器时间完成删除操作
                setTimeout(() => {
                  this.fetchTaskList()
                }, 1000)
                // 显示成功消息，因为删除可能已经成功
                this.$message.success('删除成功')
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
            this.$message.success('删除成功')
            // 刷新任务列表
            this.fetchTaskList()
            return
          } else {
            // 错误：code 非 0
            // 如果是 403 权限错误，使用格式化函数转换为中文
            let errorMessage = data.message || `删除失败: code ${data.code}`
            if (response.status === 403) {
              errorMessage = this.formatPermissionError(errorMessage, 'delete')
            }
            throw new Error(errorMessage)
          }
        }
        
        // 如果没有统一响应格式，检查 HTTP 状态码
        if (response.ok) {
          // HTTP 状态码是 200-299，认为删除成功
          this.$message.success('删除成功')
          this.fetchTaskList()
          return
        }
        
        // 处理错误响应
        let errorMessage = `删除失败: ${response.status}`
        
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
        } else if (response.status === 400) {
          // 可能是任务正在运行
          if (data && data.message && (data.message.includes('运行中') || data.message.includes('处理中'))) {
            errorMessage = '无法删除运行中或处理中的任务，请先停止任务'
          } else {
            errorMessage = data?.message || '删除失败，请检查任务状态'
          }
        } else if (response.status === 404) {
          errorMessage = '任务不存在'
          if (data && data.message) {
            errorMessage = data.message
          } else if (data && data.detail) {
            errorMessage = data.detail
          }
        } else if (data) {
          // 兼容旧格式的错误响应
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
        console.error('删除任务错误:', error)
        this.$message.error(error.message || '删除任务失败，请稍后重试')
      }
    },
    handleSubmit() {
      // 手动验证所有必填字段
      const errors = []
      
      if (!this.taskForm.taskName || this.taskForm.taskName.trim() === '') {
        errors.push('请输入任务名称')
      } else if (this.taskForm.taskName.length > 50) {
        errors.push('任务名称长度不能超过50个字符')
      }
      
      if (!this.taskForm.selectedModel) {
        errors.push('请选择模型')
      } else if (!this.taskForm.selectedModelVersion) {
        errors.push('请选择模型版本')
      }
      
      if (!this.taskForm.selectedHospitals || this.taskForm.selectedHospitals.length === 0) {
        errors.push('请至少选择一个医院')
      }
      
      // 检查时间范围：如果选择了"指定时间"，必须填写具体时间
      if (this.taskForm.timeRangeType === 'specified') {
        if (!this.taskForm.timeRange || !Array.isArray(this.taskForm.timeRange) || this.taskForm.timeRange.length !== 2) {
          errors.push('请选择时间范围')
        }
      }
      
      // 检查开始时间：如果选择了"指定时间"，必须填写具体时间
      if (this.taskForm.startTimeType === 'specified') {
        if (!this.taskForm.startTime) {
          errors.push('请选择开始时间')
        } else {
          // 验证开始时间不能小于当前时间
          const selectedTime = new Date(this.taskForm.startTime.replace(' ', 'T'))
          const now = new Date()
          if (selectedTime < now) {
            errors.push('开始时间不能小于当前时间')
          }
        }
      }
      
      // 如果有错误，弹窗提示
      if (errors.length > 0) {
        this.$message.warning(errors[0])
        return
      }
      
      // 验证通过，提交表单
      if (this.dialogType === 'create') {
        this.createTask()
      } else {
        this.updateTask()
      }
    },
    // 创建任务
    async createTask() {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      try {
        // 构建请求体
        const requestData = {
          task_name: this.taskForm.taskName.trim(),
          model: this.taskForm.selectedModel,
          model_version: this.taskForm.selectedModelVersion,
          hospitals: this.taskForm.selectedHospitals.map(code => ({
            hospital: code
          })),
          time_range_type: this.taskForm.timeRangeType === 'specified' ? 'specific' : 'all'
        }
        
        // 处理时间范围
        if (this.taskForm.timeRangeType === 'specified' && this.taskForm.timeRange && Array.isArray(this.taskForm.timeRange) && this.taskForm.timeRange.length === 2) {
          // 时间范围：将日期转换为ISO 8601格式
          // 开始时间：设置为当天的00:00:00
          const startDate = new Date(this.taskForm.timeRange[0] + 'T00:00:00')
          // 结束时间：设置为当天的23:59:59
          const endDate = new Date(this.taskForm.timeRange[1] + 'T23:59:59')
          requestData.start_time = startDate.toISOString()
          requestData.end_time = endDate.toISOString()
        }
        
        // 处理任务启动时间（task_launch_time）
        // 如果选择了"指定时间"，则设置 task_launch_time
        if (this.taskForm.startTimeType === 'specified' && this.taskForm.startTime) {
          // 将 yyyy-MM-dd HH:mm:ss 格式转换为 ISO 8601 格式
          // 格式：yyyy-MM-dd HH:mm:ss -> yyyy-MM-ddTHH:mm:ss
          const dateTimeStr = this.taskForm.startTime.replace(' ', 'T')
          const launchDate = new Date(dateTimeStr)
          if (!isNaN(launchDate.getTime())) {
            // 转换为 ISO 8601 格式（UTC 时间）
            requestData.task_launch_time = launchDate.toISOString()
          } else {
            console.warn('开始时间格式无效:', this.taskForm.startTime)
          }
        }
        // 如果选择"立刻开始"，则不传 task_launch_time（系统会自动设置为当前时间）
        
        // 发送请求
        const response = await fetch('/api/v1/batch-tasks/', {
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
          console.error('解析创建任务响应失败:', e)
          if (!response.ok) {
            throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
          }
        }
        
        // 检查响应码（统一响应格式中的 code 字段）
        // 优先检查统一响应格式
        if (data && data.code !== undefined && data.code !== 0) {
          // code 非0表示错误
          const errorMessage = data.message || `创建失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        if (!response.ok) {
          let errorMessage = `创建失败: ${response.status}`
          
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
          } else if (data) {
            // 兼容旧格式的错误响应
            if (data.detail) {
              errorMessage = data.detail
            } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
              errorMessage = data.non_field_errors[0]
            } else if (typeof data === 'object') {
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
        
        // 处理统一响应格式：{ code: 0, message: "success", data: { ... } }
        this.$message.success('任务创建成功')
        // 关闭弹窗
        this.dialogVisible = false
        // 重置表单数据（不打开弹窗）
        this.taskForm = {
          taskId: '',
          taskName: '',
          selectedModel: null,
          selectedModelVersion: '',
          selectedHospitals: [],
          timeRangeType: 'all',
          timeRange: [],
          startTimeType: 'immediate',
          startTime: ''
        }
        this.tempSelectedHospitals = []
        this.tempAvailableHospitalsSelected = []
        this.selectedHospitalSearch = ''
        this.selectedHospitalLevel = ''
        this.availableHospitalSearch = ''
        this.availableHospitalLevel = ''
        // 刷新任务列表
        this.fetchTaskList()
      } catch (error) {
        console.error('创建任务错误:', error)
        this.$message.error(error.message || '创建任务失败，请稍后重试')
      }
    },
    // 更新任务
    async updateTask() {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        return
      }
      
      try {
        // 构建请求体（与创建任务类似）
        const requestData = {
          task_name: this.taskForm.taskName.trim(),
          model: this.taskForm.selectedModel,
          model_version: this.taskForm.selectedModelVersion,
          hospitals: this.taskForm.selectedHospitals.map(code => ({
            hospital: code
          })),
          time_range_type: this.taskForm.timeRangeType === 'specified' ? 'specific' : 'all'
        }
        
        // 处理时间范围
        if (this.taskForm.timeRangeType === 'specified' && this.taskForm.timeRange && Array.isArray(this.taskForm.timeRange) && this.taskForm.timeRange.length === 2) {
          // 时间范围：将日期转换为ISO 8601格式
          const startDate = new Date(this.taskForm.timeRange[0] + 'T00:00:00')
          const endDate = new Date(this.taskForm.timeRange[1] + 'T23:59:59')
          requestData.start_time = startDate.toISOString()
          requestData.end_time = endDate.toISOString()
        } else {
          // 全部时间：设置为 null
          requestData.start_time = null
          requestData.end_time = null
        }
        
        // 处理任务启动时间（task_launch_time）
        if (this.taskForm.startTimeType === 'specified' && this.taskForm.startTime) {
          const dateTimeStr = this.taskForm.startTime.replace(' ', 'T')
          const launchDate = new Date(dateTimeStr)
          if (!isNaN(launchDate.getTime())) {
            requestData.task_launch_time = launchDate.toISOString()
          } else {
            console.warn('开始时间格式无效:', this.taskForm.startTime)
          }
        } else {
          // 立刻开始：设置为 null（系统会自动设置为当前时间）
          requestData.task_launch_time = null
        }
        
        // 发送PUT请求
        const response = await fetch(`/api/v1/batch-tasks/${this.taskForm.taskId}/`, {
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
          console.error('解析更新任务响应失败:', e)
          if (!response.ok) {
            throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
          }
        }
        
        // 检查响应码（统一响应格式中的 code 字段）
        // 优先检查统一响应格式
        if (data && data.code !== undefined && data.code !== 0) {
          // code 非0表示错误
          const errorMessage = data.message || `更新失败: code ${data.code}`
          throw new Error(errorMessage)
        }
        
        if (!response.ok) {
          let errorMessage = `更新失败: ${response.status}`
          
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
          } else if (response.status === 400) {
            // 可能是任务正在运行
            if (data && data.message && data.message.includes('运行中')) {
              errorMessage = '无法编辑运行中或处理中的任务'
            } else {
              errorMessage = data?.message || '更新失败，请检查输入数据'
            }
          } else if (data) {
            // 兼容旧格式的错误响应
            if (data.detail) {
              errorMessage = data.detail
            } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
              errorMessage = data.non_field_errors[0]
            } else if (typeof data === 'object') {
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
        
        // 处理统一响应格式：{ code: 0, message: "success", data: { ... } }
        this.$message.success('任务更新成功')
        // 关闭弹窗
        this.dialogVisible = false
        // 重置表单数据（不打开弹窗）
        this.taskForm = {
          taskId: '',
          taskName: '',
          selectedModel: null,
          selectedModelVersion: '',
          selectedHospitals: [],
          timeRangeType: 'all',
          timeRange: [],
          startTimeType: 'immediate',
          startTime: ''
        }
        this.tempSelectedHospitals = []
        this.tempAvailableHospitalsSelected = []
        this.selectedHospitalSearch = ''
        this.selectedHospitalLevel = ''
        this.availableHospitalSearch = ''
        this.availableHospitalLevel = ''
        // 刷新任务列表
        this.fetchTaskList()
      } catch (error) {
        console.error('更新任务错误:', error)
        this.$message.error(error.message || '更新任务失败，请稍后重试')
      }
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1 // 改变每页数量时重置到第一页
      this.fetchTaskList()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchTaskList()
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

/* 医院穿梭框样式 */
.hospital-transfer-item {
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

.hospital-item {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
  text-align: left;
}

.hospital-item:hover {
  background-color: #f5f7fa;
}

.transfer-buttons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

/* 隐藏所有表单项的必填标记（红色星号） */
::v-deep .el-form-item__label::before {
  display: none !important;
}
</style>