<template>
  <div class="warning-record">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">预警记录详情</h2>
      <el-button type="text" icon="el-icon-arrow-left" @click="goBack" class="back-btn">返回</el-button>
    </div>

    <!-- 基本信息区域 -->
    <div class="info-section">
      <h3 class="section-title">基本信息</h3>
      
      <!-- 任务信息 -->
      <div class="info-group">
        <div class="group-title">任务信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="任务ID">{{ recordData.taskId }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ recordData.taskName }}</el-descriptions-item>
          <el-descriptions-item label="模型名称">{{ recordData.modelName }}</el-descriptions-item>
          <el-descriptions-item label="规则编号">{{ recordData.ruleCode }}</el-descriptions-item>
          <el-descriptions-item label="规则名称" :span="2">{{ recordData.ruleName }}</el-descriptions-item>
          <el-descriptions-item label="预警原因" :span="2">{{ recordData.warningReason }}</el-descriptions-item>
          <el-descriptions-item label="补充信息" :span="2">{{ recordData.supplement }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <!-- 医院信息 -->
      <div class="info-group">
        <div class="group-title">医院信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="医院H码">{{ recordData.hospitalCode }}</el-descriptions-item>
          <el-descriptions-item label="医院名称">{{ recordData.hospitalName }}</el-descriptions-item>
          <el-descriptions-item label="医院等级">{{ recordData.hospitalLevel }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <!-- 患者信息 -->
      <div class="info-group">
        <div class="group-title">患者信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="患者姓名">{{ recordData.patientName }}</el-descriptions-item>
          <el-descriptions-item label="患者身份证">{{ recordData.idCard }}</el-descriptions-item>
          <el-descriptions-item label="就诊ID">{{ recordData.visitId }}</el-descriptions-item>
          <el-descriptions-item label="就诊类型">{{ recordData.visitType }}</el-descriptions-item>
          <el-descriptions-item label="就诊科室">{{ recordData.department }}</el-descriptions-item>
          <el-descriptions-item label="结算ID">{{ recordData.settlementId }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <!-- 影像信息区域 -->
    <div class="image-section">
      <h3 class="section-title">影像信息</h3>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="申请信息" name="application">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="申请单号">{{ imageData.application.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ imageData.application.applyTime }}</el-descriptions-item>
            <el-descriptions-item label="申请医生">{{ imageData.application.doctor }}</el-descriptions-item>
            <el-descriptions-item label="申请科室">{{ imageData.application.department }}</el-descriptions-item>
            <el-descriptions-item label="检查项目" :span="2">{{ imageData.application.examItem }}</el-descriptions-item>
            <el-descriptions-item label="临床诊断" :span="2">{{ imageData.application.diagnosis }}</el-descriptions-item>
            <el-descriptions-item label="检查目的" :span="2">{{ imageData.application.purpose }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <el-tab-pane label="报告信息" name="report">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="报告单号">{{ imageData.report.reportNo }}</el-descriptions-item>
            <el-descriptions-item label="报告时间">{{ imageData.report.reportTime }}</el-descriptions-item>
            <el-descriptions-item label="报告医生">{{ imageData.report.doctor }}</el-descriptions-item>
            <el-descriptions-item label="审核医生">{{ imageData.report.reviewer }}</el-descriptions-item>
            <el-descriptions-item label="检查所见" :span="2">{{ imageData.report.findings }}</el-descriptions-item>
            <el-descriptions-item label="诊断意见" :span="2">{{ imageData.report.diagnosis }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <el-tab-pane label="影像信息" name="image">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="检查号">{{ imageData.image.examNo }}</el-descriptions-item>
            <el-descriptions-item label="检查时间">{{ imageData.image.examTime }}</el-descriptions-item>
            <el-descriptions-item label="设备名称">{{ imageData.image.deviceName }}</el-descriptions-item>
            <el-descriptions-item label="设备型号">{{ imageData.image.deviceModel }}</el-descriptions-item>
            <el-descriptions-item label="检查部位">{{ imageData.image.bodyPart }}</el-descriptions-item>
            <el-descriptions-item label="检查技师">{{ imageData.image.technician }}</el-descriptions-item>
            <el-descriptions-item label="序列数">{{ imageData.image.seriesCount }}</el-descriptions-item>
            <el-descriptions-item label="图像数">{{ imageData.image.imageCount }}</el-descriptions-item>
            <el-descriptions-item label="SOP Instance UID" :span="2">{{ imageData.image.sopInstanceUID }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 审核流程区域 -->
    <div class="review-process">
      <h3 class="section-title">审核流程</h3>
      
      <!-- 流程时间线 -->
      <el-timeline>
        <!-- 初审 -->
        <el-timeline-item
          :timestamp="reviewProcess.firstReview.time"
          placement="top"
          :color="getTimelineColor(reviewProcess.firstReview.status)"
        >
          <el-card>
            <h4>初审</h4>
            <div class="process-content">
              <div class="info-row">
                <span class="label">初审结果：</span>
                <el-tag v-if="reviewProcess.firstReview.result" 
                  :type="reviewProcess.firstReview.result === '明确违规' ? 'danger' : 'success'" 
                  size="small">
                  {{ reviewProcess.firstReview.result }}
                </el-tag>
                <span v-else class="empty-text">待审核</span>
              </div>
              <div class="info-row" v-if="reviewProcess.firstReview.opinion">
                <span class="label">初审意见：</span>
                <span>{{ reviewProcess.firstReview.opinion }}</span>
              </div>
            </div>
          </el-card>
        </el-timeline-item>

        <!-- 医院复核 -->
        <el-timeline-item
          :timestamp="reviewProcess.hospitalReview.time"
          placement="top"
          :color="getTimelineColor(reviewProcess.hospitalReview.status)"
        >
          <el-card>
            <h4>医院复核</h4>
            <div class="process-content">
              <div class="info-row">
                <span class="label">复核结果：</span>
                <el-tag v-if="reviewProcess.hospitalReview.result" 
                  :type="reviewProcess.hospitalReview.result === '没有违规' ? 'success' : 'danger'" 
                  size="small">
                  {{ reviewProcess.hospitalReview.result }}
                </el-tag>
                <span v-else class="empty-text">待复核</span>
              </div>
              <div class="info-row" v-if="reviewProcess.hospitalReview.appealReason">
                <span class="label">申诉理由：</span>
                <span>{{ reviewProcess.hospitalReview.appealReason }}</span>
              </div>
              <div class="info-row" v-if="reviewProcess.hospitalReview.materials && reviewProcess.hospitalReview.materials.length > 0">
                <span class="label">申诉材料：</span>
                <div class="materials">
                  <el-link 
                    v-for="(file, index) in reviewProcess.hospitalReview.materials" 
                    :key="index"
                    type="primary"
                    :underline="false"
                    @click="viewFile(file)">
                    【{{ file }}】
                  </el-link>
                </div>
              </div>
            </div>
          </el-card>
        </el-timeline-item>

        <!-- 终审 -->
        <el-timeline-item
          :timestamp="reviewProcess.finalReview.time"
          placement="top"
          :color="getTimelineColor(reviewProcess.finalReview.status)"
        >
          <el-card>
            <h4>终审</h4>
            <div class="process-content">
              <div class="info-row">
                <span class="label">终审结果：</span>
                <el-tag v-if="reviewProcess.finalReview.result" 
                  :type="reviewProcess.finalReview.result === '明确违规' ? 'danger' : 'success'" 
                  size="small">
                  {{ reviewProcess.finalReview.result }}
                </el-tag>
                <span v-else class="empty-text">待终审</span>
              </div>
              <div class="info-row" v-if="reviewProcess.finalReview.opinion">
                <span class="label">终审意见：</span>
                <span>{{ reviewProcess.finalReview.opinion }}</span>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 审核操作区域 -->
    <div v-if="showReviewForm" class="review-action">
      <h3 class="section-title">{{ getReviewTitle() }}</h3>
      <el-form :model="reviewForm" label-width="100px" size="small">
        <!-- 初审表单 -->
        <div v-if="currentStatus === '待初审'">
          <el-form-item label="初审结果">
            <el-radio-group v-model="reviewForm.result">
              <el-radio label="明确违规">明确违规</el-radio>
              <el-radio label="没有违规">没有违规</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="初审意见">
            <el-input 
              v-model="reviewForm.opinion" 
              type="textarea" 
              :rows="4"
              placeholder="请输入初审意见">
            </el-input>
          </el-form-item>
        </div>
        
        <!-- 医院复核表单 -->
        <div v-if="currentStatus === '待医院复核'">
          <el-form-item label="复核结果">
            <el-radio-group v-model="reviewForm.result">
              <el-radio label="没有违规">没有违规</el-radio>
              <el-radio label="确认违规">确认违规</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="申诉理由">
            <el-input 
              v-model="reviewForm.appealReason" 
              type="textarea" 
              :rows="4"
              placeholder="请输入申诉理由">
            </el-input>
          </el-form-item>
          <el-form-item label="申诉材料">
            <el-upload
              :action="uploadUrl"
              :on-success="handleUploadSuccess"
              :file-list="reviewForm.fileList">
              <el-button size="small" type="primary">上传文件+</el-button>
            </el-upload>
          </el-form-item>
        </div>
        
        <!-- 终审表单 -->
        <div v-if="currentStatus === '待终审'">
          <el-form-item label="终审结果">
            <el-radio-group v-model="reviewForm.result">
              <el-radio label="明确违规">明确违规</el-radio>
              <el-radio label="没有违规">没有违规</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="终审意见">
            <el-input 
              v-model="reviewForm.opinion" 
              type="textarea" 
              :rows="4"
              placeholder="请输入终审意见">
            </el-input>
          </el-form-item>
        </div>
        
        <el-form-item>
          <el-button type="primary" @click="submitReview">确定</el-button>
          <el-button @click="showReviewForm = false">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 操作按钮 -->
    <div v-if="!showReviewForm && currentStatus !== '已终审'" class="action-buttons">
      <el-button type="primary" @click="startReview">开始审核</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WarningRecordView',
  data() {
    return {
      activeTab: 'application',
      currentStatus: '待初审', // 当前审核状态
      showReviewForm: false,
      uploadUrl: '/api/upload', // 上传文件的接口地址
      recordData: {
        taskId: 'JG0000000000014',
        taskName: '虚假检查监测',
        modelName: '虚假检查监测模型',
        ruleCode: 'YX0000000000000003',
        ruleName: '影像DICOM文件重复次数',
        warningReason: '影像DICOM文件中SOP_INSTANCE_UID字段在患者多次影像检查记录中、在不同患者影像检查记录中重复出现的次数，疑似复制伪造检查记录',
        supplement: '100000000000708463177-202411221430-000000000-0000000000000-123502004266007916',
        hospitalCode: 'H000000001',
        hospitalName: '第一人民医院',
        hospitalLevel: '三级',
        patientName: '张**',
        idCard: '32038219890711****',
        visitId: '23243893739',
        department: '骨科',
        visitType: '门诊',
        settlementId: '87718182828'
      },
      imageData: {
        application: {
          orderNo: 'SQ202411220001',
          applyTime: '2024-11-22 09:30:00',
          doctor: '李医生',
          department: '骨科',
          examItem: 'CT检查-腰椎',
          diagnosis: '腰椎间盘突出',
          purpose: '明确病变部位及程度'
        },
        report: {
          reportNo: 'BG202411220001',
          reportTime: '2024-11-22 14:30:00',
          doctor: '王医生',
          reviewer: '赵医生',
          findings: '腰椎生理曲度存在，L4-5椎间盘向后突出，硬膜囊受压变窄，双侧神经根受压。',
          diagnosis: '1. L4-5椎间盘突出；2. 双侧神经根受压'
        },
        image: {
          examNo: 'JC202411220001',
          examTime: '2024-11-22 10:15:00',
          deviceName: 'CT扫描仪',
          deviceModel: 'Siemens SOMATOM Definition',
          bodyPart: '腰椎',
          technician: '技师A',
          seriesCount: '3',
          imageCount: '120',
          sopInstanceUID: '1.2.840.113619.2.55.3.604688119.868.1234567890.1'
        }
      },
      reviewProcess: {
        firstReview: {
          status: 'completed', // pending, completed
          result: '明确违规',
          opinion: '经查实影像记录存在异常',
          time: '2025-11-05 11:00:00'
        },
        hospitalReview: {
          status: 'completed',
          result: '没有违规',
          appealReason: '患者张三影像数据已补传',
          materials: ['影像截图', '补充说明材料'],
          time: '2025-11-06 11:00:00'
        },
        finalReview: {
          status: 'pending',
          result: '',
          opinion: '',
          time: ''
        }
      },
      reviewForm: {
        result: '',
        opinion: '',
        appealReason: '',
        fileList: []
      }
    }
  },
  mounted() {
    // 从路由参数获取记录ID并加载数据
    const recordId = this.$route.query.recordId
    if (recordId) {
      this.loadRecordData(recordId)
    }
  },
  methods: {
    loadRecordData(recordId) {
      // TODO: 从后端加载具体记录数据
      console.log('加载记录ID:', recordId)
    },
    goBack() {
      this.$router.back()
    },
    getTimelineColor(status) {
      return status === 'completed' ? '#67C23A' : '#E4E7ED'
    },
    getReviewTitle() {
      const titleMap = {
        '待初审': '初审',
        '待医院复核': '医院复核',
        '待终审': '终审'
      }
      return titleMap[this.currentStatus] || '审核'
    },
    startReview() {
      this.showReviewForm = true
      this.reviewForm = {
        result: '',
        opinion: '',
        appealReason: '',
        fileList: []
      }
    },
    submitReview() {
      if (!this.reviewForm.result) {
        this.$message.warning('请选择审核结果')
        return
      }
      
      // TODO: 提交审核结果到后端
      this.$message.success('审核提交成功')
      this.showReviewForm = false
      
      // 更新审核流程
      if (this.currentStatus === '待初审') {
        this.reviewProcess.firstReview.status = 'completed'
        this.reviewProcess.firstReview.result = this.reviewForm.result
        this.reviewProcess.firstReview.opinion = this.reviewForm.opinion
        this.reviewProcess.firstReview.time = new Date().toLocaleString()
        this.currentStatus = '待医院复核'
      } else if (this.currentStatus === '待医院复核') {
        this.reviewProcess.hospitalReview.status = 'completed'
        this.reviewProcess.hospitalReview.result = this.reviewForm.result
        this.reviewProcess.hospitalReview.appealReason = this.reviewForm.appealReason
        this.reviewProcess.hospitalReview.time = new Date().toLocaleString()
        this.currentStatus = '待终审'
      } else if (this.currentStatus === '待终审') {
        this.reviewProcess.finalReview.status = 'completed'
        this.reviewProcess.finalReview.result = this.reviewForm.result
        this.reviewProcess.finalReview.opinion = this.reviewForm.opinion
        this.reviewProcess.finalReview.time = new Date().toLocaleString()
        this.currentStatus = '已终审'
      }
    },
    handleUploadSuccess(response, file, fileList) {
      this.reviewForm.fileList = fileList
      this.$message.success('文件上传成功')
    },
    viewFile(fileName) {
      this.$message.info('查看文件：' + fileName)
      // TODO: 实现文件查看功能
    }
  }
}
</script>

<style scoped>
.warning-record {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.title-section {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  position: relative;
}

.title-bar {
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #409EFF 0%, #66b1ff 100%);
  margin-right: 12px;
  border-radius: 2px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
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

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 12px;
  border-bottom: 2px solid #E4E7ED;
}

/* 基本信息区域 */
.info-section {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.info-group {
  margin-bottom: 25px;
}

.info-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #409EFF;
}

/* 影像信息区域 */
.image-section {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.image-section .el-tabs {
  margin-top: 10px;
}

/* 审核流程区域 */
.review-process {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.process-content {
  padding: 10px 0;
}

.info-row {
  margin-bottom: 10px;
  line-height: 1.8;
}

.info-row .label {
  color: #606266;
  font-weight: 500;
  margin-right: 10px;
}

.empty-text {
  color: #909399;
}

.materials {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 审核操作区域 */
.review-action {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.action-buttons {
  text-align: center;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* Timeline样式优化 */
.el-timeline {
  padding-left: 10px;
}

.el-timeline-item h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

.el-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.el-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: box-shadow 0.3s;
}

/* Descriptions样式优化 */
.el-descriptions {
  margin-top: 5px;
}

.el-descriptions :deep(.el-descriptions__label) {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
  width: 150px;
}

.el-descriptions :deep(.el-descriptions__content) {
  background-color: #fff;
  color: #303133;
}
</style>

