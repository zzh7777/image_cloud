<template>
  <div class="warning-detail">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">预警列表</h2>
      <el-button type="text" icon="el-icon-arrow-left" @click="goBack" class="back-btn">返回</el-button>
    </div>

    <!-- 搜索表单 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="医疗机构名称">
          <el-input
            v-model="searchForm.hospitalName"
            placeholder="请输入医疗机构名称"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="就诊类别">
          <el-input
            v-model="searchForm.visitType"
            placeholder="请输入就诊类别"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="就诊科室">
          <el-input
            v-model="searchForm.department"
            placeholder="请输入就诊科室"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" placeholder="请选择审核状态" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="待初审" value="待初审"></el-option>
            <el-option label="待医院复核" value="待医院复核"></el-option>
            <el-option label="待终审" value="待终审"></el-option>
            <el-option label="已终审" value="已终审"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="终审结果">
          <el-select v-model="searchForm.finalResult" placeholder="请选择终审结果" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="明确违规" value="明确违规"></el-option>
            <el-option label="没有违规" value="没有违规"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        :data="warningList"
        border
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column prop="hospitalName" label="医疗机构名称" min-width="150"></el-table-column>
        <el-table-column prop="patientName" label="患者姓名" width="120">
          <template slot-scope="scope">
            {{ desensitizeName(scope.row.patientName) }}
          </template>
        </el-table-column>
        <el-table-column prop="idCard" label="患者身份证号码" min-width="180">
          <template slot-scope="scope">
            {{ desensitizeIdCard(scope.row.idCard) }}
          </template>
        </el-table-column>
        <el-table-column prop="visitType" label="就诊类别" width="120"></el-table-column>
        <el-table-column prop="department" label="就诊科室" min-width="150"></el-table-column>
        <el-table-column prop="warningReason" label="预警原因" min-width="200" show-overflow-tooltip></el-table-column>
        <el-table-column prop="status" label="审核状态" width="130" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="small">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="finalResult" label="终审结果" width="130" align="center">
          <template slot-scope="scope">
            <el-tag
              v-if="scope.row.finalResult"
              :type="scope.row.finalResult === '明确违规' ? 'danger' : 'success'"
              size="small"
            >
              {{ scope.row.finalResult }}
            </el-tag>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleView(scope.row, scope.$index)">查看</el-button>
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
          :total="pagination.total"
        ></el-pagination>
      </div>
    </div>

    <!-- 预警详情弹框 -->
    <el-dialog
      title="预警详情"
      :visible.sync="detailDialogVisible"
      width="90%"
      :close-on-click-modal="false"
      class="warning-detail-dialog"
    >
      <div class="detail-header">
        <h3 class="detail-title">预警详情</h3>
        <div class="detail-actions">
          <el-button
            size="small"
            :disabled="currentIndex === 0"
            @click="handlePrev"
          >
            上一条
          </el-button>
          <el-button
            size="small"
            :disabled="currentIndex >= warningList.length - 1"
            @click="handleNext"
          >
            下一条
          </el-button>
          <el-button size="small" @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </div>

      <div class="detail-content" v-if="currentDetail">
        <div class="detail-main">
          <!-- 预警信息 -->
          <div class="info-section">
            <h4 class="section-title">预警信息</h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="任务ID">{{ currentDetail.taskId }}</el-descriptions-item>
              <el-descriptions-item label="任务名称">{{ currentDetail.taskName }}</el-descriptions-item>
              <el-descriptions-item label="模型名称">{{ currentDetail.modelName }}</el-descriptions-item>
              <el-descriptions-item label="规则编号">{{ currentDetail.ruleCode }}</el-descriptions-item>
              <el-descriptions-item label="规则名称">{{ currentDetail.ruleName }}</el-descriptions-item>
              <el-descriptions-item label="预警时间">{{ formatDateTime(currentDetail.warningTime) }}</el-descriptions-item>
              <el-descriptions-item label="预警原因" :span="2">{{ currentDetail.warningReason }}</el-descriptions-item>
              <el-descriptions-item label="补充信息" :span="2">
                <div v-if="currentDetail.supplement">
                  <span>{{ currentDetail.supplement }}</span>
                  <el-button
                    v-if="currentDetail.imageIndexes && currentDetail.imageIndexes.length > 0"
                    type="text"
                    size="small"
                    @click="showImageIndexDialog = true"
                    style="margin-left: 10px;"
                  >
                    查看影像索引
                  </el-button>
                </div>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 诊疗信息 -->
          <div class="info-section">
            <h4 class="section-title">诊疗信息</h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="医院H码">{{ currentDetail.hospitalCode }}</el-descriptions-item>
              <el-descriptions-item label="医院名称">{{ currentDetail.hospitalName }}</el-descriptions-item>
              <el-descriptions-item label="医院等级">{{ currentDetail.hospitalLevel }}</el-descriptions-item>
              <el-descriptions-item label="患者姓名">{{ desensitizeName(currentDetail.patientName) }}</el-descriptions-item>
              <el-descriptions-item label="患者身份证号码">{{ desensitizeIdCard(currentDetail.idCard) }}</el-descriptions-item>
              <el-descriptions-item label="就诊科室">{{ formatDepartment(currentDetail.department) }}</el-descriptions-item>
              <el-descriptions-item label="就诊类型">{{ currentDetail.visitType }}</el-descriptions-item>
              <el-descriptions-item label="就诊ID">{{ currentDetail.visitId }}</el-descriptions-item>
              <el-descriptions-item label="结算ID">{{ currentDetail.settlementId }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 影像信息 -->
          <div class="info-section">
            <h4 class="section-title">影像信息</h4>
            <div class="image-tabs">
              <el-button
                :type="imageTab === 'application' ? 'primary' : ''"
                @click="imageTab = 'application'"
                size="small"
              >
                申请信息
              </el-button>
              <el-button
                :type="imageTab === 'report' ? 'primary' : ''"
                @click="imageTab = 'report'"
                size="small"
              >
                报告信息
              </el-button>
              <el-button
                :type="imageTab === 'image' ? 'primary' : ''"
                @click="imageTab = 'image'"
                size="small"
              >
                影像信息
              </el-button>
            </div>
            <div class="image-content">
              <!-- 申请信息 -->
              <el-descriptions v-if="imageTab === 'application'" :column="2" border>
                <el-descriptions-item label="申请单号">{{ currentDetail.imageInfo?.application?.orderNo || '-' }}</el-descriptions-item>
                <el-descriptions-item label="患者姓名">{{ currentDetail.imageInfo?.application?.patientName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="年龄/性别">{{ currentDetail.imageInfo?.application?.ageGender || '-' }}</el-descriptions-item>
                <el-descriptions-item label="申请科室">{{ currentDetail.imageInfo?.application?.department || '-' }}</el-descriptions-item>
                <el-descriptions-item label="证件类型">{{ currentDetail.imageInfo?.application?.idType || '-' }}</el-descriptions-item>
                <el-descriptions-item label="证件号码">{{ currentDetail.imageInfo?.application?.idNumber || '-' }}</el-descriptions-item>
                <el-descriptions-item label="医保卡号">{{ currentDetail.imageInfo?.application?.insuranceCard || '-' }}</el-descriptions-item>
                <el-descriptions-item label="就诊类别">{{ currentDetail.imageInfo?.application?.visitCategory || '-' }}</el-descriptions-item>
                <el-descriptions-item label="过敏史">{{ currentDetail.imageInfo?.application?.allergyHistory || '-' }}</el-descriptions-item>
                <el-descriptions-item label="检查项目">{{ currentDetail.imageInfo?.application?.examItem || '-' }}</el-descriptions-item>
                <el-descriptions-item label="主诉" :span="2">{{ currentDetail.imageInfo?.application?.chiefComplaint || '-' }}</el-descriptions-item>
                <el-descriptions-item label="病史摘要" :span="2">{{ currentDetail.imageInfo?.application?.medicalHistory || '-' }}</el-descriptions-item>
                <el-descriptions-item label="检查目的" :span="2">{{ currentDetail.imageInfo?.application?.examPurpose || '-' }}</el-descriptions-item>
                <el-descriptions-item label="检查部位">{{ currentDetail.imageInfo?.application?.examPart || '-' }}</el-descriptions-item>
                <el-descriptions-item label="申请医师">{{ currentDetail.imageInfo?.application?.applyingPhysician || '-' }}</el-descriptions-item>
                <el-descriptions-item label="申请时间">{{ formatDateTime(currentDetail.imageInfo?.application?.applyTime) || '-' }}</el-descriptions-item>
              </el-descriptions>

              <!-- 报告信息 -->
              <el-descriptions v-if="imageTab === 'report'" :column="2" border>
                <el-descriptions-item label="报告单号">{{ currentDetail.imageInfo?.report?.reportNo || '-' }}</el-descriptions-item>
                <el-descriptions-item label="报告时间">{{ formatDateTime(currentDetail.imageInfo?.report?.reportTime) || '-' }}</el-descriptions-item>
                <el-descriptions-item label="报告医生">{{ currentDetail.imageInfo?.report?.reportDoctor || '-' }}</el-descriptions-item>
                <el-descriptions-item label="审核医生">{{ currentDetail.imageInfo?.report?.reviewDoctor || '-' }}</el-descriptions-item>
                <el-descriptions-item label="检查所见" :span="2">{{ currentDetail.imageInfo?.report?.findings || '-' }}</el-descriptions-item>
                <el-descriptions-item label="诊断意见" :span="2">{{ currentDetail.imageInfo?.report?.diagnosis || '-' }}</el-descriptions-item>
              </el-descriptions>

              <!-- 影像信息 -->
              <el-descriptions v-if="imageTab === 'image'" :column="2" border>
                <el-descriptions-item label="检查号">{{ currentDetail.imageInfo?.image?.examNo || '-' }}</el-descriptions-item>
                <el-descriptions-item label="检查时间">{{ formatDateTime(currentDetail.imageInfo?.image?.examTime) || '-' }}</el-descriptions-item>
                <el-descriptions-item label="设备名称">{{ currentDetail.imageInfo?.image?.deviceName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="设备型号">{{ currentDetail.imageInfo?.image?.deviceModel || '-' }}</el-descriptions-item>
                <el-descriptions-item label="检查部位">{{ currentDetail.imageInfo?.image?.bodyPart || '-' }}</el-descriptions-item>
                <el-descriptions-item label="检查技师">{{ currentDetail.imageInfo?.image?.technician || '-' }}</el-descriptions-item>
                <el-descriptions-item label="序列数">{{ currentDetail.imageInfo?.image?.seriesCount || '-' }}</el-descriptions-item>
                <el-descriptions-item label="图像数">{{ currentDetail.imageInfo?.image?.imageCount || '-' }}</el-descriptions-item>
                <el-descriptions-item label="SOP Instance UID" :span="2">{{ currentDetail.imageInfo?.image?.sopInstanceUID || '-' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </div>

        <!-- 右侧流程展示 -->
        <div class="detail-sidebar">
          <div class="process-section">
            <h4 class="section-title">预警操作记录</h4>
            <div class="process-timeline">
              <!-- 预警 -->
              <div class="process-item">
                <div class="process-node active"></div>
                <div class="process-content">
                  <div class="process-title">预警</div>
                  <div class="process-info">
                    <div class="info-item">
                      <span class="info-label">预警时间:</span>
                      <span class="info-value">{{ formatDateTime(currentDetail.warningTime) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">违规定义:</span>
                      <span class="info-value">{{ currentDetail.violationDefinition || '疑似违规' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 初审 -->
              <div class="process-item">
                <div class="process-node" :class="{ active: currentDetail.firstReview }"></div>
                <div class="process-content">
                  <div class="process-title">初审</div>
                  <div class="process-info" v-if="currentDetail.firstReview">
                    <div class="info-item">
                      <span class="info-label">初审时间:</span>
                      <span class="info-value">{{ formatDateTime(currentDetail.firstReview.reviewTime) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">初审意见:</span>
                      <span class="info-value">{{ currentDetail.firstReview.opinion || '无' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">初审结果:</span>
                      <el-tag
                        :type="getReviewResultType(currentDetail.firstReview.result)"
                        size="small"
                        style="margin-left: 5px;"
                      >
                        {{ currentDetail.firstReview.result }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="process-info" v-else>
                    <div class="info-item">
                      <span class="info-value empty">待审核</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 医院复核 -->
              <div class="process-item" v-if="currentDetail.firstReview && (currentDetail.firstReview.result === '明确违规' || currentDetail.firstReview.result === '疑似违规')">
                <div class="process-node" :class="{ active: currentDetail.hospitalReview }"></div>
                <div class="process-content">
                  <div class="process-title">医院复核</div>
                  <div class="process-info" v-if="currentDetail.hospitalReview">
                    <div class="info-item">
                      <span class="info-label">复核时间:</span>
                      <span class="info-value">{{ formatDateTime(currentDetail.hospitalReview.reviewTime) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">复核结果:</span>
                      <el-tag
                        :type="getReviewResultType(currentDetail.hospitalReview.result)"
                        size="small"
                        style="margin-left: 5px;"
                      >
                        {{ currentDetail.hospitalReview.result }}
                      </el-tag>
                    </div>
                    <div class="info-item" v-if="currentDetail.hospitalReview.appealReason">
                      <span class="info-label">申诉理由:</span>
                      <span class="info-value">{{ currentDetail.hospitalReview.appealReason }}</span>
                    </div>
                    <div class="info-item" v-if="currentDetail.hospitalReview.materials && currentDetail.hospitalReview.materials.length > 0">
                      <span class="info-label">申诉材料:</span>
                      <div class="materials-list">
                        <el-link
                          v-for="(material, index) in currentDetail.hospitalReview.materials"
                          :key="index"
                          type="primary"
                          :underline="false"
                          @click="viewMaterial(material)"
                          style="margin-right: 10px;"
                        >
                          【{{ material.name || material }}】
                        </el-link>
                      </div>
                    </div>
                  </div>
                  <div class="process-info" v-else>
                    <div class="info-item">
                      <span class="info-value empty">待复核</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 终审 -->
              <div class="process-item" v-if="currentDetail.hospitalReview || (currentDetail.firstReview && currentDetail.firstReview.result === '明确违规')">
                <div class="process-node" :class="{ active: currentDetail.finalReview }"></div>
                <div class="process-content">
                  <div class="process-title">终审</div>
                  <div class="process-info" v-if="currentDetail.finalReview">
                    <div class="info-item">
                      <span class="info-label">终审时间:</span>
                      <span class="info-value">{{ formatDateTime(currentDetail.finalReview.reviewTime) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">终审意见:</span>
                      <span class="info-value">{{ currentDetail.finalReview.opinion || '无' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">终审结果:</span>
                      <el-tag
                        :type="getReviewResultType(currentDetail.finalReview.result)"
                        size="small"
                        style="margin-left: 5px;"
                      >
                        {{ currentDetail.finalReview.result }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="process-info" v-else>
                    <div class="info-item">
                      <span class="info-value empty">待终审</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 影像索引弹框 -->
    <el-dialog
      title="影像索引"
      :visible.sync="showImageIndexDialog"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="currentDetail && currentDetail.imageIndexes">
        <el-table :data="currentDetail.imageIndexes" border>
          <el-table-column prop="index" label="索引号" width="150"></el-table-column>
          <el-table-column prop="description" label="描述"></el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="viewImageDetail(scope.row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer">
        <el-button @click="showImageIndexDialog = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 影像详情弹框 -->
    <el-dialog
      title="影像详情"
      :visible.sync="showImageDetailDialog"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="currentImageDetail" class="image-detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请单号">{{ currentImageDetail.orderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="患者姓名">{{ currentImageDetail.patientName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请科室">{{ currentImageDetail.department || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请医师">{{ currentImageDetail.applyingPhysician || '-' }}</el-descriptions-item>
          <el-descriptions-item label="检查项目">{{ currentImageDetail.examItem || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatDateTime(currentImageDetail.applyTime) || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <div slot="footer">
        <el-button @click="showImageDetailDialog = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 申诉材料查看弹框 -->
    <el-dialog
      title="文件查看"
      :visible.sync="showMaterialDialog"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="currentMaterial" class="material-viewer">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="文件名称">{{ currentMaterial.name || currentMaterial }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ currentMaterial.size || '-' }}</el-descriptions-item>
          <el-descriptions-item label="上传时间">{{ formatDateTime(currentMaterial.uploadTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="上传人">{{ currentMaterial.uploader || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="material-preview" v-if="currentMaterial.url">
          <iframe
            v-if="isPdfFile(currentMaterial.url)"
            :src="currentMaterial.url"
            frameborder="0"
            style="width: 100%; height: 600px; margin-top: 20px;"
          ></iframe>
          <img
            v-else-if="isImageFile(currentMaterial.url)"
            :src="currentMaterial.url"
            alt="文件预览"
            style="max-width: 100%; max-height: 600px; margin-top: 20px;"
          />
          <div v-else class="unsupported-file">
            <i class="el-icon-document"></i>
            <p>该文件格式不支持在线预览</p>
            <el-button type="primary" @click="downloadMaterial(currentMaterial)">下载文件</el-button>
          </div>
        </div>
      </div>
      <div slot="footer">
        <el-button @click="showMaterialDialog = false">关闭</el-button>
        <el-button type="primary" @click="downloadMaterial(currentMaterial)" v-if="currentMaterial">下载文件</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'WarningDetailView',
  data() {
    return {
      loading: false,
      taskId: '',
      taskCode: '',
      taskName: '',
      searchForm: {
        hospitalName: '',
        visitType: '',
        department: '',
        status: '',
        finalResult: ''
      },
      warningList: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      detailDialogVisible: false,
      currentIndex: 0,
      currentDetail: null,
      imageTab: 'application',
      showImageIndexDialog: false,
      showImageDetailDialog: false,
      currentImageDetail: null,
      showMaterialDialog: false,
      currentMaterial: null
    }
  },
  mounted() {
    // 从路由参数获取任务信息
    if (this.$route.query.taskId) {
      this.taskId = this.$route.query.taskId
    }
    if (this.$route.query.taskCode) {
      this.taskCode = this.$route.query.taskCode
    }
    if (this.$route.query.taskName) {
      this.taskName = this.$route.query.taskName
    }
    this.fetchWarningList()
  },
  methods: {
    // 获取预警列表
    async fetchWarningList() {
      this.loading = true
      try {
        const accessToken = this.$store.getters.accessToken
        if (!accessToken) {
          this.$message.error('未登录，请先登录')
          this.loading = false
          return
        }

        const params = new URLSearchParams({
          page: this.pagination.currentPage,
          page_size: this.pagination.pageSize
        })

        // 添加任务ID过滤（必填）
        if (this.taskId) {
          params.append('task', this.taskId)
        }

        // 添加搜索条件（如果API支持筛选）
        if (this.searchForm.hospitalName) {
          params.append('hospital_name', this.searchForm.hospitalName)
        }
        if (this.searchForm.visitType) {
          params.append('visit_type', this.searchForm.visitType)
        }
        if (this.searchForm.department) {
          params.append('visit_department', this.searchForm.department)
        }
        if (this.searchForm.status) {
          params.append('review_status', this.searchForm.status)
        }
        if (this.searchForm.finalResult) {
          params.append('final_result', this.searchForm.finalResult)
        }

        const url = `/api/v1/details/?${params.toString()}`
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

        if (!response.ok) {
          if (response.status === 401) {
            // 如果到这里还是401，说明重试后仍然失败
            this.$store.commit('clearUser')
            this.$router.push('/login')
            this.loading = false
            return
          } else if (response.status === 403) {
            this.$message.error('权限不足，无法访问')
            return
          } else {
            console.error('获取预警列表失败:', response.status)
            this.$message.error('获取预警列表失败，请稍后重试')
            this.loading = false
            return
          }
        }

        const text = await response.text()
        let responseData = null

        try {
          responseData = text ? JSON.parse(text) : null
        } catch (e) {
          console.error('解析响应失败:', e)
          this.$message.error('数据解析失败')
          this.loading = false
          return
        }

        // 处理新的响应格式：{ code, message, data: { count, results } }
        if (responseData && responseData.code === 0 && responseData.data) {
          this.processWarningList(responseData.data)
        } else {
          this.warningList = []
          this.pagination.total = 0
          if (responseData && responseData.message) {
            this.$message.warning(responseData.message)
          }
        }
      } catch (error) {
        console.error('获取预警列表错误:', error)
        this.$message.error('获取预警列表失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    // 加载模拟数据
    loadMockData() {
      this.warningList = [
        {
          id: 1,
          hospitalName: '第一人民医院',
          patientName: '张三',
          idCard: '320382198907110123',
          visitType: '门诊',
          department: '003', // 骨科ID
          warningReason: '影像DICOM文件中SOP_INSTANCE_UID字段在患者多次影像检查记录中、在不同患者影像检查记录中重复出现的次数，疑似复制伪造检查记录',
          status: '待初审',
          finalResult: '',
          taskId: 'JG0000000000014',
          taskName: '虚假检查监测',
          modelName: '虚假检查监测模型',
          ruleCode: 'YX0000000000000003',
          ruleName: '影像DICOM文件重复次数',
          warningTime: '2025-11-04 11:00:00',
          violationDefinition: '疑似违规',
          supplement: '100000000000708463177-202411221430-000000000-0000000000000-123502004266007916',
          hospitalCode: 'H000000001',
          hospitalLevel: '三级',
          visitId: '23243893739',
          settlementId: '87718182828',
          imageIndexes: [
            { index: 'IMG001', description: '影像索引1' },
            { index: 'IMG002', description: '影像索引2' }
          ],
          imageInfo: {
            application: {
              orderNo: '401389',
              patientName: '张三',
              ageGender: '33Y/M',
              department: '微外科',
              idType: '1',
              idNumber: '3203021',
              insuranceCard: '2...',
              visitCategory: '住院',
              allergyHistory: '-',
              examItem: '胸部CT(平扫)',
              chiefComplaint: '-',
              medicalHistory: '单创欧股沟疝',
              examPurpose: '明确病变部位及程度',
              examPart: '-',
              applyingPhysician: '苏可',
              applyTime: '2023-12-28 09:33:51'
            },
            report: {
              reportNo: 'BG001',
              reportTime: '2023-12-28 14:30:00',
              reportDoctor: '王医生',
              reviewDoctor: '赵医生',
              findings: '检查所见内容',
              diagnosis: '诊断意见'
            },
            image: {
              examNo: 'JC001',
              examTime: '2023-12-28 10:15:00',
              deviceName: 'CT扫描仪',
              deviceModel: 'Siemens SOMATOM Definition',
              bodyPart: '胸部',
              technician: '技师A',
              seriesCount: '3',
              imageCount: '120',
              sopInstanceUID: '1.2.840.113619.2.55.3.604688119.868.1234567890.1'
            }
          },
          firstReview: null,
          hospitalReview: null,
          finalReview: null
        },
        {
          id: 2,
          hospitalName: '第一人民医院',
          patientName: '李四',
          idCard: '320382198907110456',
          visitType: '门诊',
          department: '002',
          warningReason: '影像检查串换项目次数',
          status: '待医院复核',
          finalResult: '',
          taskId: 'JG0000000000015',
          taskName: '虚假检查监测',
          modelName: '虚假检查监测模型',
          ruleCode: 'YX0000000000000004',
          ruleName: '影像检查串换项目',
          warningTime: '2025-11-04 10:00:00',
          violationDefinition: '疑似违规',
          supplement: '',
          hospitalCode: 'H000000001',
          hospitalLevel: '三级',
          visitId: '23243893740',
          settlementId: '87718182829',
          imageIndexes: [],
          imageInfo: {
            application: {
              orderNo: '401390',
              patientName: '李四',
              ageGender: '28Y/F',
              department: '骨科',
              idType: '1',
              idNumber: '3203022',
              insuranceCard: '3...',
              visitCategory: '门诊',
              allergyHistory: '-',
              examItem: 'X光检查',
              chiefComplaint: '腰痛',
              medicalHistory: '腰椎间盘突出',
              examPurpose: '明确诊断',
              examPart: '腰椎',
              applyingPhysician: '李医生',
              applyTime: '2023-12-29 09:00:00'
            }
          },
          firstReview: {
            reviewTime: '2025-11-05 11:00:00',
            opinion: '无',
            result: '明确违规'
          },
          hospitalReview: null,
          finalReview: null
        },
        {
          id: 3,
          hospitalName: '第一人民医院',
          patientName: '王五',
          idCard: '320382198907110789',
          visitType: '门诊',
          department: '002',
          warningReason: '影像检查串换项目次数',
          status: '待终审',
          finalResult: '',
          taskId: 'JG0000000000016',
          taskName: '虚假检查监测',
          modelName: '虚假检查监测模型',
          ruleCode: 'YX0000000000000005',
          ruleName: '影像检查串换项目',
          warningTime: '2025-11-04 09:00:00',
          violationDefinition: '疑似违规',
          supplement: '',
          hospitalCode: 'H000000001',
          hospitalLevel: '三级',
          visitId: '23243893741',
          settlementId: '87718182830',
          imageIndexes: [],
          imageInfo: {
            application: {
              orderNo: '401391',
              patientName: '王五',
              ageGender: '45Y/M',
              department: '呼吸内科',
              idType: '1',
              idNumber: '3203023',
              insuranceCard: '4...',
              visitCategory: '门诊',
              allergyHistory: '-',
              examItem: 'CT检查',
              chiefComplaint: '咳嗽',
              medicalHistory: '上呼吸道感染',
              examPurpose: '明确诊断',
              examPart: '胸部',
              applyingPhysician: '王医生',
              applyTime: '2023-12-30 10:00:00'
            }
          },
          firstReview: {
            reviewTime: '2025-11-05 11:00:00',
            opinion: '无',
            result: '明确违规'
          },
          hospitalReview: {
            reviewTime: '2025-11-06 11:00:00',
            result: '没有违规',
            appealReason: '患者张三影像数据已补传',
            materials: [
              { name: '影像截图', url: '', size: '2.5MB' },
              { name: '补充说明材料', url: '', size: '1.2MB' }
            ]
          },
          finalReview: null
        },
        {
          id: 4,
          hospitalName: '第一人民医院',
          patientName: '赵六',
          idCard: '320382199012010123',
          visitType: '住院',
          department: '003',
          warningReason: '患者就诊缺失检查次数',
          status: '已终审',
          finalResult: '明确违规',
          taskId: 'JG0000000000017',
          taskName: '虚假检查监测',
          modelName: '虚假检查监测模型',
          ruleCode: 'YX0000000000000006',
          ruleName: '患者就诊缺失检查',
          warningTime: '2025-11-04 08:00:00',
          violationDefinition: '疑似违规',
          supplement: '',
          hospitalCode: 'H000000001',
          hospitalLevel: '三级',
          visitId: '23243893742',
          settlementId: '87718182831',
          imageIndexes: [],
          imageInfo: {
            application: {
              orderNo: '401392',
              patientName: '赵六',
              ageGender: '50Y/F',
              department: '骨科',
              idType: '1',
              idNumber: '3203024',
              insuranceCard: '5...',
              visitCategory: '住院',
              allergyHistory: '-',
              examItem: 'MRI检查',
              chiefComplaint: '关节疼痛',
              medicalHistory: '关节炎',
              examPurpose: '明确诊断',
              examPart: '膝关节',
              applyingPhysician: '赵医生',
              applyTime: '2023-12-31 11:00:00'
            }
          },
          firstReview: {
            reviewTime: '2025-11-05 11:00:00',
            opinion: '无',
            result: '明确违规'
          },
          hospitalReview: {
            reviewTime: '2025-11-06 11:00:00',
            result: '确认违规',
            appealReason: '/',
            materials: []
          },
          finalReview: {
            reviewTime: '2025-11-06 11:00:00',
            opinion: '经查实确系违规',
            result: '确认违规'
          }
        },
        {
          id: 5,
          hospitalName: '第二人民医院',
          patientName: '孙七',
          idCard: '320382199512150456',
          visitType: '门诊',
          department: '001',
          warningReason: '影像检查设备未使用次数',
          status: '已终审',
          finalResult: '没有违规',
          taskId: 'JG0000000000018',
          taskName: '虚假检查监测',
          modelName: '虚假检查监测模型',
          ruleCode: 'YX0000000000000007',
          ruleName: '影像检查设备未使用',
          warningTime: '2025-11-04 07:00:00',
          violationDefinition: '疑似违规',
          supplement: '',
          hospitalCode: 'H000000002',
          hospitalLevel: '二级',
          visitId: '23243893743',
          settlementId: '87718182832',
          imageIndexes: [],
          imageInfo: {
            application: {
              orderNo: '401393',
              patientName: '孙七',
              ageGender: '35Y/M',
              department: '心内科',
              idType: '1',
              idNumber: '3203025',
              insuranceCard: '6...',
              visitCategory: '门诊',
              allergyHistory: '-',
              examItem: '心电图',
              chiefComplaint: '心悸',
              medicalHistory: '心律失常',
              examPurpose: '明确诊断',
              examPart: '心脏',
              applyingPhysician: '孙医生',
              applyTime: '2024-01-01 09:00:00'
            }
          },
          firstReview: {
            reviewTime: '2025-11-05 11:00:00',
            opinion: '无',
            result: '明确违规'
          },
          hospitalReview: {
            reviewTime: '2025-11-06 11:00:00',
            result: '没有违规',
            appealReason: '患者张三影像数据已补传',
            materials: [
              { name: '影像截图', url: '', size: '2.5MB' },
              { name: '补充说明材料', url: '', size: '1.2MB' }
            ]
          },
          finalReview: {
            reviewTime: '2025-11-06 11:00:00',
            opinion: '经查实已上传文件',
            result: '没有违规'
          }
        }
      ]
      this.pagination.total = this.warningList.length
    },
    // 处理预警列表数据
    processWarningList(data) {
      this.warningList = (data.results || []).map(item => {
        // 处理审核状态映射
        let status = item.review_status || ''
        if (status) {
          status = this.mapStatus(status)
        }
        
        // 处理终审结果映射
        let finalResult = item.final_result || ''
        if (finalResult) {
          finalResult = this.mapFinalResult(finalResult)
        }
        
        // 处理医院信息
        const hospital = item.hospital || {}
        
        // 处理初审信息
        let firstReview = null
        if (item.initial_reviewer || item.initial_review_time) {
          firstReview = {
            reviewer: item.initial_reviewer || '',
            reviewTime: item.initial_review_time || '',
            opinion: item.initial_review_opinion || '',
            result: item.initial_review_result || ''
          }
        }
        
        // 处理医院复核信息
        let hospitalReview = null
        if (item.hospital_reviewer || item.hospital_review_time) {
          // 处理申诉材料：可能是数组、对象或ID
          let materials = []
          if (item.appeal_materials) {
            if (Array.isArray(item.appeal_materials)) {
              materials = item.appeal_materials
            } else if (typeof item.appeal_materials === 'object') {
              materials = [item.appeal_materials]
            } else {
              // 如果是ID，保留为空数组（后续可以通过API获取详情）
              materials = []
            }
          }
          
          hospitalReview = {
            reviewer: item.hospital_reviewer || '',
            reviewTime: item.hospital_review_time || '',
            result: item.hospital_review_result || '',
            appealReason: item.appeal_reason || '',
            materials: materials
          }
        }
        
        // 处理终审信息
        let finalReview = null
        if (item.final_reviewer || item.final_review_time) {
          finalReview = {
            reviewer: item.final_reviewer || '',
            reviewTime: item.final_review_time || '',
            opinion: item.final_review_opinion || '',
            result: item.final_result || ''
          }
        }
        
        // 处理汇总信息
        const summary = item.summary || {}
        
        return {
          id: item.id,
          hospitalName: hospital.hospital_name || '',
          patientName: item.patient_name || '',
          idCard: item.patient_id_number || '',
          visitType: item.visit_type || '',
          department: item.visit_department || '',
          warningReason: item.warning_reason || '',
          status: status,
          finalResult: finalResult,
          // 详情弹框需要的字段
          taskId: summary.task_code || '',
          taskName: summary.task_name || '',
          modelName: '', // API中没有提供，保留空值
          ruleCode: '', // API中没有提供，保留空值
          ruleName: '', // API中没有提供，保留空值
          warningTime: item.warning_time || '',
          violationDefinition: item.violation_definition || '疑似违规',
          supplement: '', // API中没有提供，保留空值
          hospitalCode: hospital.hospital_code || '',
          hospitalLevel: hospital.hospital_level || '',
          visitId: '', // API中没有提供，保留空值
          settlementId: '', // API中没有提供，保留空值
          imageIndexes: [], // API中没有提供，保留空值
          // 处理 image_info：可能是对象或ID
          imageInfo: (item.image_info && typeof item.image_info === 'object' && !Array.isArray(item.image_info)) 
            ? item.image_info 
            : {},
          firstReview: firstReview,
          hospitalReview: hospitalReview,
          finalReview: finalReview,
          // 保留原始数据用于详情展示
          rawData: item
        }
      })
      this.pagination.total = data.count || 0
    },
    // 状态映射
    mapStatus(status) {
      if (!status) return ''
      // 如果已经是中文状态，直接返回
      if (['待初审', '待医院复核', '待终审', '已终审'].includes(status)) {
        return status
      }
      // 映射英文状态到中文
      const statusMap = {
        'pending_first_review': '待初审',
        'pending_initial_review': '待初审',
        'pending_hospital_review': '待医院复核',
        'pending_final_review': '待终审',
        'final_reviewed': '已终审',
        '1': '待初审', // 根据API示例，可能是数字
        '2': '待医院复核',
        '3': '待终审',
        '4': '已终审'
      }
      return statusMap[status] || status
    },
    // 终审结果映射
    mapFinalResult(result) {
      if (!result) return ''
      // 如果已经是中文结果，直接返回
      if (['明确违规', '没有违规'].includes(result)) {
        return result
      }
      // 映射英文结果到中文
      const resultMap = {
        'confirmed_violation': '明确违规',
        'no_violation': '没有违规',
        '1': '明确违规', // 根据API示例，可能是数字或字符串
        '没有违规': '没有违规'
      }
      return resultMap[result] || result
    },
    // 查询
    handleQuery() {
      this.pagination.currentPage = 1
      this.fetchWarningList()
    },
    // 重置
    handleReset() {
      this.searchForm = {
        hospitalName: '',
        visitType: '',
        department: '',
        status: '',
        finalResult: ''
      }
      this.handleQuery()
    },
    // 查看详情 - 跳转到预警详情页面
    handleView(row) {
      // 跳转到预警详情页面（WarningRecordView）
      this.$router.push({
        name: 'warning-record',
        query: {
          id: row.id,
          taskId: this.taskId,
          taskCode: this.taskCode,
          taskName: this.taskName
        }
      })
    },
    // 上一条
    handlePrev() {
      if (this.currentIndex > 0) {
        this.currentIndex--
        this.currentDetail = { ...this.warningList[this.currentIndex] }
        this.imageTab = 'application'
      }
    },
    // 下一条
    handleNext() {
      if (this.currentIndex < this.warningList.length - 1) {
        this.currentIndex++
        this.currentDetail = { ...this.warningList[this.currentIndex] }
        this.imageTab = 'application'
      }
    },
    // 分页大小改变
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1
      this.fetchWarningList()
    },
    // 当前页改变
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchWarningList()
    },
    goBack() {
      this.$router.back()
    },
    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        '待初审': 'warning',
        '待医院复核': 'primary',
        '待终审': 'info',
        '已终审': 'success'
      }
      return typeMap[status] || 'info'
    },
    // 获取审核结果类型
    getReviewResultType(result) {
      if (result === '明确违规' || result === '确认违规') {
        return 'danger'
      } else if (result === '没有违规') {
        return 'success'
      } else if (result === '疑似违规') {
        return 'warning'
      }
      return 'info'
    },
    // 姓名脱敏
    desensitizeName(name) {
      if (!name) return '-'
      if (name.length <= 1) return name
      return name.charAt(0) + '*'.repeat(name.length - 1)
    },
    // 身份证脱敏
    desensitizeIdCard(idCard) {
      if (!idCard) return '-'
      if (idCard.length <= 4) return idCard
      return idCard.slice(0, -4) + '****'
    },
    // 格式化科室（去除ID）
    formatDepartment(department) {
      if (!department) return '-'
      // 如果科室是纯数字ID，返回默认值
      if (/^\d+$/.test(department)) {
        return '骨科' // 这里可以根据实际情况映射
      }
      return department
    },
    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
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
        return dateTime
      }
    },
    // 查看影像详情
    viewImageDetail(row) {
      this.currentImageDetail = {
        orderNo: row.index,
        patientName: this.currentDetail.patientName,
        department: this.currentDetail.department,
        applyingPhysician: '-',
        examItem: '-',
        applyTime: this.currentDetail.warningTime
      }
      this.showImageDetailDialog = true
    },
    // 查看申诉材料
    viewMaterial(material) {
      this.currentMaterial = typeof material === 'string' ? { name: material } : material
      this.showMaterialDialog = true
    },
    // 判断是否为PDF文件
    isPdfFile(url) {
      if (!url) return false
      return url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf')
    },
    // 判断是否为图片文件
    isImageFile(url) {
      if (!url) return false
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
      return imageExtensions.some(ext => url.toLowerCase().endsWith(ext))
    },
    // 下载材料
    downloadMaterial(material) {
      if (material && material.url) {
        window.open(material.url, '_blank')
      } else {
        this.$message.info('文件下载链接不可用')
      }
    }
  }
}
</script>

<style scoped>
.warning-detail {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.title-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fff;
  position: relative;
  border-radius: 4px;
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

.back-btn {
  position: absolute;
  right: 20px;
  font-size: 14px;
  color: #409EFF;
}

.back-btn:hover {
  color: #66b1ff;
}

.search-section {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.search-form {
  margin: 0;
}

.table-section {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 详情弹框样式 */
.warning-detail-dialog ::v-deep .el-dialog__body {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.detail-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.detail-actions {
  display: flex;
  gap: 10px;
}

.detail-content {
  display: flex;
  gap: 20px;
}

.detail-main {
  flex: 1;
  min-width: 0;
}

.detail-sidebar {
  width: 350px;
  flex-shrink: 0;
}

.info-section {
  margin-bottom: 25px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 4px;
}

.section-title {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 10px;
  border-bottom: 2px solid #409EFF;
}

.image-tabs {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.image-content {
  min-height: 200px;
}

/* 流程时间线样式 */
.process-section {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.process-timeline {
  position: relative;
  padding-left: 30px;
}

.process-item {
  position: relative;
  padding-bottom: 30px;
}

.process-item:last-child {
  padding-bottom: 0;
}

.process-node {
  position: absolute;
  left: -25px;
  top: 5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #e4e7ed;
  border: 3px solid #fff;
  z-index: 2;
}

.process-node.active {
  background-color: #409EFF;
}

.process-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: -18px;
  top: 20px;
  width: 2px;
  height: calc(100% - 5px);
  background-color: #e4e7ed;
  z-index: 1;
}

.process-content {
  padding-left: 10px;
}

.process-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.process-info {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.info-item {
  margin-bottom: 8px;
  line-height: 1.6;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #606266;
  font-weight: 500;
  margin-right: 8px;
}

.info-value {
  color: #303133;
}

.info-value.empty {
  color: #909399;
  font-style: italic;
}

.materials-list {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 5px;
}

/* 影像详情弹框样式 */
.image-detail-content {
  padding: 20px 0;
}

.material-viewer {
  padding: 20px 0;
}

.material-preview {
  margin-top: 20px;
}

.unsupported-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #909399;
}

.unsupported-file i {
  font-size: 48px;
  margin-bottom: 15px;
}

/* 表格样式优化 */
.el-table th {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: 600;
}

.el-table td,
.el-table th {
  padding: 12px 0;
}
</style>
