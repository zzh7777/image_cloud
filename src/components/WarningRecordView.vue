<template>
  <div class="warning-record">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">预警记录详情</h2>
      <el-button type="text" icon="el-icon-arrow-left" @click="goBack" class="back-btn">返回</el-button>
    </div>

    <!-- 主要内容区域：左右分栏布局 -->
    <div class="main-content" v-loading="loading" element-loading-text="加载中...">
      <!-- 左侧内容区域 -->
      <div class="left-content">
        <!-- 1. 预警信息 -->
        <div class="warning-info-section">
          <h3 class="section-title">预警信息</h3>
          <el-table :data="warningInfoData" border style="width: 100%">
            <el-table-column prop="label" label="字段" width="150"></el-table-column>
            <el-table-column prop="value" label="内容" show-overflow-tooltip></el-table-column>
          </el-table>
        </div>

        <!-- 2. 诊疗信息 -->
        <div class="treatment-info-section">
          <h3 class="section-title">诊疗信息</h3>
          <el-table :data="treatmentInfoData" border style="width: 100%">
            <el-table-column prop="label" label="字段" width="150"></el-table-column>
            <el-table-column prop="value" label="内容" show-overflow-tooltip></el-table-column>
          </el-table>
        </div>

        <!-- 3. 影像信息 -->
        <div class="image-section">
          <h3 class="section-title">影像信息</h3>
          <div class="image-buttons">
            <el-button 
              :type="imageTab === 'application' ? 'primary' : 'default'" 
              @click="imageTab = 'application'"
            >
              申请信息
            </el-button>
            <el-button 
              :type="imageTab === 'report' ? 'primary' : 'default'" 
              @click="imageTab = 'report'"
            >
              报告信息
            </el-button>
            <el-button 
              :type="imageTab === 'image' ? 'primary' : 'default'" 
              @click="imageTab = 'image'"
            >
              影像信息
            </el-button>
          </div>
          <div class="image-content">
            <!-- 申请信息图片 -->
            <div v-if="imageTab === 'application'" class="image-wrapper">
              <div v-if="applicationImages.length === 0" class="image-placeholder">暂无图片</div>
              <div v-else class="image-gallery">
                <img 
                  v-for="(image, index) in applicationImages" 
                  :key="index"
                  :src="image" 
                  alt="申请信息" 
                  @error="handleImageError"
                  class="gallery-image"
                />
              </div>
            </div>
            
            <!-- 报告信息图片 -->
            <div v-if="imageTab === 'report'" class="image-wrapper">
              <div v-if="reportImages.length === 0" class="image-placeholder">暂无图片</div>
              <div v-else class="image-gallery">
                <img 
                  v-for="(image, index) in reportImages" 
                  :key="index"
                  :src="image" 
                  alt="报告信息" 
                  @error="handleImageError"
                  class="gallery-image"
                />
              </div>
            </div>
            
            <!-- 影像信息图片 -->
            <div v-if="imageTab === 'image'" class="image-wrapper">
              <div v-if="dicomImages.length === 0" class="image-placeholder">暂无图片</div>
              <div v-else class="image-gallery">
                <img 
                  v-for="(image, index) in dicomImages" 
                  :key="index"
                  :src="image" 
                  alt="影像信息" 
                  @error="handleImageError"
                  class="gallery-image"
                />
              </div>
            </div>
          </div>
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
      </div>

      <!-- 右侧内容区域：审核流程 -->
      <div class="right-content">
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
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WarningRecordView',
  data() {
    return {
      loading: false,
      imageTab: 'application', // 影像信息当前显示的标签
      currentStatus: '待初审', // 当前审核状态
      showReviewForm: false,
      uploadUrl: '/api/upload', // 上传文件的接口地址
      recordData: {
        taskId: null,
        taskName: '',
        modelName: '',
        ruleCode: '',
        ruleName: '',
        warningTime: '',
        warningReason: '',
        supplement: ''
      },
      treatmentData: {
        hospitalCode: '',
        hospitalName: '',
        hospitalLevel: '',
        patientName: '',
        patientIdNumber: '',
        visitId: '',
        visitDepartment: '',
        visitType: '',
        settlementId: ''
      },
      // 图片数据（Base64数组）
      applicationImages: [],
      reportImages: [],
      dicomImages: [],
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
  computed: {
    // 预警信息表格数据（只展示固定字段）
    warningInfoData() {
      if (!this.recordData || typeof this.recordData !== 'object') {
        return []
      }
      
      // 只展示这些固定字段，按顺序
      // 支持多个可能的字段名（字段名映射）
      const fields = [
        { 
          keys: ['task_id', 'taskId'], 
          label: '任务ID',
          fromRoute: 'taskId'
        },
        { 
          keys: ['task_name', 'taskName'], 
          label: '任务名称',
          fromRoute: 'taskName'
        },
        { 
          keys: ['model_name', 'modelName'], 
          label: '模型名称'
        },
        { 
          keys: ['rule_code', 'ruleCode'], 
          label: '规则编号'
        },
        { 
          keys: ['rule_name', 'ruleName'], 
          label: '规则名称'
        },
        { 
          keys: ['warning_time', 'warningTime'], 
          label: '预警时间', 
          format: 'datetime'
        },
        { 
          keys: ['warning_reason', 'warningReason', 'reason'], 
          label: '预警原因'
        }
      ]
      
      const result = []
      for (const field of fields) {
        let value = null
        
        // 先从路由参数获取（如果指定了 fromRoute）
        if (field.fromRoute && this.$route.query[field.fromRoute]) {
          value = this.$route.query[field.fromRoute]
        } else {
          // 从 recordData 中查找，支持多个可能的字段名
          for (const key of field.keys) {
            if (this.recordData[key] !== undefined && this.recordData[key] !== null && this.recordData[key] !== '') {
              value = this.recordData[key]
              break
            }
          }
        }
        
        // 处理值
        if (value === null || value === undefined || value === '') {
          value = '-'
        } else if (field.format === 'datetime') {
          value = this.formatDateTime(value)
        } else if (typeof value === 'object') {
          value = JSON.stringify(value, null, 2)
        } else {
          value = String(value)
        }
        
        result.push({ label: field.label, value })
      }
      
      return result
    },
    // 诊疗信息表格数据（只展示固定字段）
    treatmentInfoData() {
      if (!this.treatmentData || typeof this.treatmentData !== 'object') {
        return []
      }
      
      // 只展示这些固定字段，按顺序
      // 支持多个可能的字段名（字段名映射）
      const fields = [
        { 
          keys: ['hospital_code', 'hospitalCode'], 
          label: '医院编码'
        },
        { 
          keys: ['hospital_name', 'hospitalName'], 
          label: '医院名称'
        },
        { 
          keys: ['hospital_level', 'hospitalLevel'], 
          label: '医院等级'
        },
        { 
          keys: ['patient_name', 'patientName'], 
          label: '患者姓名', 
          format: 'desensitizeName'
        },
        { 
          keys: ['patient_id_number', 'patientIdNumber', 'patient_id'], 
          label: '患者身份证号码', 
          format: 'desensitizeIdCard'
        },
        { 
          keys: ['visit_id', 'visitId'], 
          label: '就诊ID'
        },
        { 
          keys: ['visit_department', 'visitDepartment'], 
          label: '就诊科室'
        },
        { 
          keys: ['visit_type', 'visitType'], 
          label: '就诊类型'
        },
        { 
          keys: ['settlement_id', 'settlementId'], 
          label: '结算ID'
        }
      ]
      
      const result = []
      for (const field of fields) {
        let value = null
        
        // 从 treatmentData 中查找，支持多个可能的字段名
        for (const key of field.keys) {
          if (this.treatmentData[key] !== undefined && this.treatmentData[key] !== null && this.treatmentData[key] !== '') {
            value = this.treatmentData[key]
            break
          }
        }
        
        // 处理值
        if (value === null || value === undefined || value === '') {
          value = '-'
        } else if (field.format === 'desensitizeName') {
          value = this.desensitizeName(value)
        } else if (field.format === 'desensitizeIdCard') {
          value = this.desensitizeIdCard(value)
        } else if (typeof value === 'object') {
          value = JSON.stringify(value, null, 2)
        } else {
          value = String(value)
        }
        
        result.push({ label: field.label, value })
      }
      
      return result
    }
  },
  mounted() {
    // 从路由参数获取记录ID并加载数据
    const recordId = this.$route.query.id || this.$route.query.recordId
    console.log('WarningRecordView mounted, 路由参数:', this.$route.query)
    console.log('WarningRecordView mounted, recordId:', recordId)
    if (recordId) {
      this.loadRecordData(recordId)
    } else {
      this.$message.error('缺少记录ID参数')
      this.goBack()
    }
  },
  methods: {
    // 从后端加载预警记录详情
    async loadRecordData(recordId) {
      console.log('开始加载预警详情, recordId:', recordId)
      this.loading = true
      
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        console.error('未找到 accessToken')
        this.$message.error('未登录，请先登录')
        this.$router.push('/login')
        this.loading = false
        return
      }
      
      try {
        const url = `/api/v1/details/${recordId}/`
        console.log('请求URL:', url)
        
        let response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        console.log('响应状态:', response.status, response.statusText)
        
        // 如果是401错误，尝试刷新token
        if (response.status === 401) {
          console.log('收到401错误，尝试刷新token')
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (refreshSuccess) {
            const newAccessToken = this.$store.getters.accessToken
            response = await fetch(url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${newAccessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            })
            console.log('重试后响应状态:', response.status, response.statusText)
          } else {
            this.loading = false
            return
          }
        }
        
        const text = await response.text()
        console.log('响应文本长度:', text.length)
        console.log('响应文本前500字符:', text.substring(0, 500))
        
        let data = null
        
        try {
          data = text ? JSON.parse(text) : null
          console.log('解析后的数据:', data)
        } catch (e) {
          console.error('解析预警详情响应失败:', e)
          console.error('响应文本:', text)
          this.$message.error('获取预警详情失败: 响应格式错误')
          this.loading = false
          return
        }
        
        // 检查响应码
        if (!response.ok || (data && data.code !== undefined && data.code !== 0)) {
          let errorMessage = data?.message || `获取预警详情失败: ${response.status}`
          
          if (response.status === 404) {
            errorMessage = '预警详情不存在'
          } else if (response.status === 403) {
            errorMessage = '权限不足，无法查看预警详情'
          }
          
          console.error('接口返回错误:', response.status, errorMessage, data)
          this.$message.error(errorMessage)
          this.loading = false
          return
        }
        
        // 处理统一响应格式
        const detailData = data && data.code === 0 ? data.data : data
        console.log('detailData:', detailData)
        
        if (!detailData) {
          console.error('detailData 为空')
          this.$message.error('预警详情数据为空')
          this.loading = false
          return
        }
        
        // 解析预警信息（可能是 JSON 字符串）
        let warningInfo = detailData.warning_info || {}
        if (typeof warningInfo === 'string') {
          try {
            warningInfo = JSON.parse(warningInfo)
            console.log('warning_info 解析为 JSON:', warningInfo)
          } catch (e) {
            console.error('解析 warning_info JSON 失败:', e)
            warningInfo = {}
          }
        }
        console.log('warningInfo:', warningInfo)
        // 将解析后的对象存储，用于动态展示
        this.$set(this, 'recordData', warningInfo)
        console.log('解析后的 recordData:', this.recordData)
        
        // 解析诊疗信息（可能是 JSON 字符串）
        let treatmentInfo = detailData.treatment_info || {}
        if (typeof treatmentInfo === 'string') {
          try {
            treatmentInfo = JSON.parse(treatmentInfo)
            console.log('treatment_info 解析为 JSON:', treatmentInfo)
          } catch (e) {
            console.error('解析 treatment_info JSON 失败:', e)
            treatmentInfo = {}
          }
        }
        console.log('treatmentInfo:', treatmentInfo)
        // 将解析后的对象存储，用于动态展示
        this.$set(this, 'treatmentData', treatmentInfo)
        console.log('解析后的 treatmentData:', this.treatmentData)
        
        // 解析图片数据
        const images = detailData.images || {}
        console.log('images:', images)
        this.$set(this, 'applicationImages', images.application_info_images || [])
        this.$set(this, 'reportImages', images.report_info_images || [])
        this.$set(this, 'dicomImages', images.dicom_images || [])
        console.log('图片数据:', {
          applicationImages: this.applicationImages.length,
          reportImages: this.reportImages.length,
          dicomImages: this.dicomImages.length
        })
        
        console.log('预警详情加载成功')
        
      } catch (error) {
        console.error('加载预警详情错误:', error)
        console.error('错误堆栈:', error.stack)
        this.$message.error(error.message || '获取预警详情失败，请稍后重试')
      } finally {
        this.loading = false
      }
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
    // 格式化补充信息（可能是对象或字符串）
    formatSupplementInfo(supplement) {
      if (!supplement) return '-'
      if (typeof supplement === 'string') {
        return supplement
      }
      if (typeof supplement === 'object') {
        try {
          return JSON.stringify(supplement, null, 2)
        } catch (e) {
          return String(supplement)
        }
      }
      return String(supplement)
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
      if (idCard.length <= 6) return idCard
      return idCard.substring(0, 6) + '*'.repeat(idCard.length - 10) + idCard.substring(idCard.length - 4)
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
    },
    handleImageError(event) {
      // 图片加载失败时的处理
      console.error('图片加载失败:', event.target.src.substring(0, 50))
      event.target.style.display = 'none'
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

/* 主要内容区域：左右分栏布局 */
.main-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

/* 左侧内容区域 */
.left-content {
  flex: 1;
  min-width: 0;
}

/* 右侧内容区域：审核流程 */
.right-content {
  width: 400px;
  flex-shrink: 0;
}

/* 预警信息区域 */
.warning-info-section {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 诊疗信息区域 */
.treatment-info-section {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 影像信息区域 */
.image-section {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.image-buttons {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.image-content {
  margin-top: 10px;
  overflow: hidden;
}

.image-wrapper {
  width: 100%;
  text-align: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
}

.image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.image-placeholder {
  color: #909399;
  font-size: 14px;
  padding: 40px;
  text-align: center;
}

.image-gallery {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  width: 100%;
}

.gallery-image {
  max-width: 100%;
  max-height: 600px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

/* 审核流程区域 */
.review-process {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 20px;
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
/* 字段列标题加粗 */
.warning-info-section /deep/ .el-table th:first-child .cell,
.treatment-info-section /deep/ .el-table th:first-child .cell {
  font-weight: bold;
}
</style>

