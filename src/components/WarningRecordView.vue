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
      <!-- 错误信息显示 -->
      <div v-if="errorMessage" class="error-message" style="padding: 20px; background: #fff; margin: 20px; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);">
        <el-alert
          :title="errorMessage"
          type="error"
          :closable="false"
          show-icon>
        </el-alert>
        <div style="margin-top: 15px;">
          <el-button type="primary" @click="retryLoad">重试</el-button>
          <el-button @click="goBack">返回</el-button>
        </div>
      </div>
      
      <!-- 左侧内容区域 -->
      <div v-else class="left-content">
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

            </div>
            
      <!-- 右侧内容区域：审核流程 -->
      <div v-if="!errorMessage" class="right-content">
        <div class="review-process">
          <h3 class="section-title">审核流程</h3>
          
          <!-- 流程时间线 -->
          <el-timeline>
            <!-- 初审 -->
            <!-- 只要有 list_alert_detail 权限，就能看到审核流程，不依赖审核权限 -->
            <el-timeline-item
              :timestamp="showFirstReview ? formatDateTime(reviewProcess.firstReview.time) : '待审核'"
              placement="top"
              :color="showFirstReview ? '#67C23A' : '#E4E7ED'"
            >
              <el-card>
                <h4>初审</h4>
                <!-- 初审表单（当需要审核时显示） -->
                <div v-if="showReviewForm && reviewFormType === 'initial'" class="review-form-in-card">
                  <el-form :model="reviewForm" label-width="100px" size="small">
                    <el-form-item label="初审结果" required>
                      <el-radio-group v-model="reviewForm.result" class="review-radio-group">
                        <el-radio label="confirmed_violation">明确违规</el-radio>
                        <el-radio label="suspected_violation">疑似违规</el-radio>
                        <el-radio label="no_violation">没有违规</el-radio>
                </el-radio-group>
              </el-form-item>
                    <el-form-item label="初审意见">
                <el-input 
                  v-model="reviewForm.opinion" 
                  type="textarea" 
                        :rows="3"
                        placeholder="请输入初审意见（选填）">
                </el-input>
              </el-form-item>
            <el-form-item>
                      <el-button type="primary" @click="submitReview" :loading="loading" size="small">确定</el-button>
                      <el-button @click="showReviewForm = false" size="small">取消</el-button>
            </el-form-item>
          </el-form>
        </div>
                <!-- 初审结果展示（当已审核时显示） -->
                <div v-else class="process-content">
                  <div class="info-row" v-if="reviewProcess.firstReview.reviewer">
                    <span class="label">初审人：</span>
                    <span>{{ reviewProcess.firstReview.reviewer }}</span>
      </div>
              <div class="info-row">
                <span class="label">初审结果：</span>
                <el-tag v-if="reviewProcess.firstReview.result" 
                      :type="reviewProcess.firstReview.result === '明确违规' ? 'danger' : 
                             (reviewProcess.firstReview.result === '疑似违规' ? 'warning' : 'success')" 
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
            <!-- 只要有 list_alert_detail 权限，就能看到审核流程，不依赖审核权限 -->
            <el-timeline-item
              v-if="!isFirstReviewNoViolation"
              :timestamp="getHospitalReviewTimestamp"
          placement="top"
              :color="reviewProcess.hospitalReview.time ? '#67C23A' : '#E4E7ED'"
        >
          <el-card>
            <h4>医院复核</h4>
                <!-- 医院复核表单（当需要复核时显示） -->
                <div v-if="showReviewForm && reviewFormType === 'hospital'" class="review-form-in-card">
                  <el-form :model="reviewForm" label-width="100px" size="small">
                    <el-form-item label="复核结果" required>
                      <el-input 
                        v-model="reviewForm.result" 
                        type="textarea" 
                        :rows="3"
                        placeholder="请输入复核结果和意见（必填）">
                      </el-input>
                    </el-form-item>
                    <el-form-item label="申诉理由">
                      <el-input 
                        v-model="reviewForm.appealReason" 
                        type="textarea" 
                        :rows="3"
                        placeholder="如果对预警结果有异议，请填写申诉理由（选填）">
                      </el-input>
                    </el-form-item>
                    <el-form-item label="申诉截图">
                      <el-upload
                        :auto-upload="false"
                        :on-change="handleScreenshotChange"
                        :limit="1"
                        accept="image/*">
                        <el-button size="small" type="primary">选择截图</el-button>
                      </el-upload>
                      <div class="el-upload__tip" style="margin-top: 8px; font-size: 12px; color: #909399;">支持图片格式（选填）</div>
                    </el-form-item>
                    <el-form-item label="补充材料">
                      <el-upload
                        :auto-upload="false"
                        :on-change="handleSupplementaryChange"
                        :limit="1">
                        <el-button size="small" type="primary">选择文件</el-button>
                      </el-upload>
                      <div class="el-upload__tip" style="margin-top: 8px; font-size: 12px; color: #909399;">支持PDF、图片等格式（选填）</div>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="submitReview" :loading="loading" size="small">确定</el-button>
                      <el-button @click="showReviewForm = false" size="small">取消</el-button>
                    </el-form-item>
                  </el-form>
                </div>
                <!-- 医院复核结果展示（当已复核时显示） -->
                <div v-else class="process-content">
                  <div class="info-row" v-if="reviewProcess.hospitalReview.reviewer">
                    <span class="label">复核人：</span>
                    <span>{{ reviewProcess.hospitalReview.reviewer }}</span>
                  </div>
              <div class="info-row">
                <span class="label">复核结果：</span>
                    <span v-if="reviewProcess.hospitalReview.result">{{ reviewProcess.hospitalReview.result }}</span>
                <span v-else class="empty-text">{{ getHospitalReviewStatusText }}</span>
              </div>
              <div class="info-row" v-if="reviewProcess.hospitalReview.appealReason">
                <span class="label">申诉理由：</span>
                <span>{{ reviewProcess.hospitalReview.appealReason }}</span>
              </div>
                  <div class="info-row" v-if="reviewProcess.hospitalReview.appealMaterials">
                <span class="label">申诉材料：</span>
                <div class="materials">
                  <el-link 
                    type="primary"
                    :underline="false"
                        @click="previewMaterials">
                        【查看申诉材料】
                      </el-link>
                      <el-link 
                        type="primary"
                        :underline="false"
                        @click="previewScreenshot"
                        style="margin-left: 10px;">
                        【查看申诉截图】
                  </el-link>
                </div>
              </div>
            </div>
          </el-card>
        </el-timeline-item>

            <!-- 终审（仅在初审结果为"明确违规"或"疑似违规"时显示） -->
            <!-- 只要有 list_alert_detail 权限，就能看到审核流程，不依赖审核权限 -->
        <el-timeline-item
              v-if="!isFirstReviewNoViolation"
              :timestamp="reviewProcess.finalReview.time ? formatDateTime(reviewProcess.finalReview.time) : '待终审'"
          placement="top"
              :color="reviewProcess.finalReview.time ? '#67C23A' : '#E4E7ED'"
        >
          <el-card>
            <h4>终审</h4>
                <!-- 终审表单（当需要终审时显示） -->
                <div v-if="showReviewForm && reviewFormType === 'final'" class="review-form-in-card">
                  <el-form :model="reviewForm" label-width="100px" size="small">
                    <el-form-item label="终审结果" required>
                      <el-radio-group v-model="reviewForm.result" class="review-radio-group">
                        <el-radio label="confirmed_violation">明确违规</el-radio>
                        <el-radio label="no_violation">没有违规</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="终审意见">
                      <el-input 
                        v-model="reviewForm.opinion" 
                        type="textarea" 
                        :rows="3"
                        placeholder="请输入终审意见（选填）">
                      </el-input>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="submitReview" :loading="loading" size="small">确定</el-button>
                      <el-button @click="showReviewForm = false" size="small">取消</el-button>
                    </el-form-item>
                  </el-form>
                </div>
                <!-- 终审结果展示（当已终审时显示） -->
                <div v-else class="process-content">
                  <div class="info-row" v-if="reviewProcess.finalReview.reviewer">
                    <span class="label">终审人：</span>
                    <span>{{ reviewProcess.finalReview.reviewer }}</span>
                  </div>
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
          
          <!-- 审核操作按钮 -->
          <div class="review-actions" style="margin-top: 20px;">
            <el-button 
              v-if="canDoInitialReview"
              type="primary" 
              @click="openReviewForm('initial')"
              size="small">
              进行初审
            </el-button>
            <el-button 
              v-if="canDoHospitalReview"
              type="primary" 
              @click="openReviewForm('hospital')"
              size="small">
              进行复核
            </el-button>
            <el-button 
              v-if="canDoFinalReview"
              type="primary" 
              @click="openReviewForm('final')"
              size="small">
              进行终审
            </el-button>
        </div>
      </div>
    </div>
    </div>

    <!-- 截图预览对话框 -->
    <div v-if="screenshotDialogVisible" class="screenshot-dialog-overlay" @click.self="closeScreenshotDialog">
      <div class="screenshot-dialog-container">
        <div class="screenshot-dialog-header">
          <span class="dialog-title">申诉截图</span>
          <el-button type="text" icon="el-icon-close" @click="closeScreenshotDialog" class="close-btn"></el-button>
        </div>
        <div class="screenshot-dialog-body">
          <div v-if="screenshotLoading" class="screenshot-loading">
            <div class="loading-spinner"></div>
            <div class="loading-text">正在加载图片...</div>
          </div>
          <img 
            v-if="screenshotUrl" 
            :src="screenshotUrl" 
            alt="申诉截图" 
            class="screenshot-image"
            :class="{ 'image-loading': screenshotLoading }"
            @load="handleScreenshotLoad"
            @error="handleScreenshotError"
          />
        </div>
      </div>
    </div>

    <!-- 申诉材料预览对话框 -->
    <el-dialog
      title="申诉材料预览"
      :visible.sync="materialsDialogVisible"
      width="80%"
      :close-on-click-modal="false"
      @close="closeMaterialsDialog"
    >
      <div v-if="materialsFileName" class="file-viewer">
        <!-- 文件信息 -->
        <div class="file-info" style="margin-bottom: 20px;">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="文件名称">{{ materialsFileName }}</el-descriptions-item>
            <el-descriptions-item label="文件类型">{{ materialsFileType || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 文件预览区域 -->
        <div class="file-preview">
          <div v-if="materialsFileLoading" class="loading-container">
            <i class="el-icon-loading"></i>
            <p>正在加载文件...</p>
          </div>
          <div v-else-if="materialsFileError" class="error-container">
            <i class="el-icon-warning"></i>
            <p>{{ materialsFileError }}</p>
            <el-button type="primary" @click="downloadMaterials">下载文件</el-button>
          </div>
          <div v-else-if="isPdfFile" class="pdf-viewer">
            <iframe
              :src="materialsFileUrl"
              frameborder="0"
              style="width: 100%; height: 600px;"
              @load="handleMaterialsFileLoad"
              @error="handleMaterialsFileError"
            ></iframe>
          </div>
          <div v-else-if="isImageFile" class="image-viewer">
            <img
              :src="materialsFileUrl"
              alt="申诉材料"
              style="max-width: 100%; max-height: 600px; display: block; margin: 0 auto; border-radius: 4px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);"
              @load="handleMaterialsFileLoad"
              @error="handleMaterialsFileError"
            />
          </div>
          <div v-else-if="isExcelFile" class="excel-viewer" style="width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden;">
            <div v-if="excelSheets.length > 1" class="excel-sheet-tabs" style="margin-bottom: 10px; width: 100%; max-width: 100%; box-sizing: border-box;">
              <el-tabs v-model="currentSheetIndex" @tab-click="handleSheetChange">
                <el-tab-pane
                  v-for="(sheet, index) in excelSheets"
                  :key="index"
                  :label="sheet.name"
                  :name="String(index)"
                ></el-tab-pane>
              </el-tabs>
            </div>
            <div v-if="currentSheetData" class="excel-limit-warning" style="margin-bottom: 10px; padding: 10px; background-color: #fff7e6; border: 1px solid #ffd591; border-radius: 4px; width: 100%; max-width: 100%; box-sizing: border-box;">
              <i class="el-icon-warning" style="color: #fa8c16;"></i>
              <span style="margin-left: 8px; color: #fa8c16;">
                Excel仅展示前10行，查看完整内容请
                <el-button type="text" size="small" @click="downloadMaterials" style="padding: 0; margin-left: 5px; color: #409EFF;">下载</el-button>
              </span>
            </div>
            <div class="excel-table-container" style="width: 100%; max-width: 100%; max-height: 600px; overflow-x: auto; overflow-y: auto; border: 1px solid #dcdfe6; box-sizing: border-box;">
              <table v-if="excelData && currentSheetData" class="excel-table" style="border-collapse: collapse; table-layout: auto;">
                <thead style="position: sticky; top: 0; z-index: 10; background-color: #f5f7fa;">
                  <tr>
                    <th
                      v-for="(cell, colIndex) in currentSheetData.headers || []"
                      :key="colIndex"
                      style="border: 1px solid #dcdfe6; padding: 10px 12px; background-color: #f5f7fa; font-weight: 600; text-align: left; min-width: 120px; white-space: nowrap;"
                    >
                      {{ cell }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in currentSheetData.rows || []" :key="rowIndex">
                    <td
                      v-for="(cell, colIndex) in row"
                      :key="colIndex"
                      style="border: 1px solid #dcdfe6; padding: 10px 12px; min-width: 120px; word-break: break-word; white-space: normal;"
                    >
                      {{ cell }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else style="padding: 20px; text-align: center; color: #909399;">
                <i class="el-icon-loading"></i>
                <p>正在解析 Excel 文件...</p>
              </div>
            </div>
          </div>
          <div v-else-if="isTxtFile" class="txt-viewer" style="width: 100%; max-width: 100%; box-sizing: border-box; display: flex; align-items: flex-start; justify-content: flex-start;">
            <div v-if="txtContent !== ''" class="txt-content" style="
              width: 100%;
              max-width: 100%;
              max-height: 600px;
              overflow: auto;
              padding: 20px;
              background: #fff;
              border: 1px solid #e4e7ed;
              border-radius: 4px;
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.6;
              color: #333;
              white-space: pre-wrap;
              word-wrap: break-word;
              text-align: left;
            ">{{ txtContent }}</div>
            <div v-else style="padding: 20px; text-align: center; color: #909399;">
              <i class="el-icon-loading"></i>
              <p>正在加载文本文件...</p>
            </div>
          </div>
          <div v-else class="unsupported-viewer">
            <i class="el-icon-document"></i>
            <p>该文件格式不支持在线预览</p>
            <el-button type="primary" @click="downloadMaterials">下载文件</el-button>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="materialsDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadMaterials">下载文件</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'WarningRecordView',
  data() {
    return {
      loading: false,
      errorMessage: null, // 错误信息
      imageTab: 'application', // 影像信息当前显示的标签
      recordId: null, // 预警记录ID
      showReviewForm: false,
      reviewFormType: 'initial', // initial, hospital, final
      screenshotDialogVisible: false, // 截图对话框显示状态
      screenshotUrl: null, // 截图URL
      screenshotLoading: false, // 截图加载状态
      // 申诉材料预览相关
      materialsDialogVisible: false, // 申诉材料对话框显示状态
      materialsFileUrl: '', // 申诉材料文件URL
      materialsFileLoading: false, // 申诉材料加载状态
      materialsFileError: null, // 申诉材料错误信息
      materialsFileName: '', // 申诉材料文件名
      materialsFileType: '', // 申诉材料文件类型
      excelData: null, // Excel 文件解析后的数据
      excelSheets: [], // Excel 工作表列表
      currentSheetIndex: '0', // 当前显示的工作表索引
      txtContent: '', // Txt 文件内容
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
      // 审核流程数据（从后端获取）
      reviewProcess: {
        firstReview: {
          reviewer: null,
          time: null,
          opinion: null,
          result: null
        },
        hospitalReview: {
          reviewer: null,
          time: null,
          result: null,
          appealReason: null,
          appealMaterials: null
        },
        finalReview: {
          reviewer: null,
          time: null,
          opinion: null,
          result: null
        }
      },
      reviewForm: {
        result: '',
        opinion: '',
        appealReason: '',
        fileList: [],
        screenshotFile: null,
        supplementaryFile: null
      }
    }
  },
  computed: {
    // 预警信息表格数据（只展示固定字段）
    warningInfoData() {
      // 确保 recordData 是对象
      if (!this.recordData || typeof this.recordData !== 'object') {
        console.warn('warningInfoData: recordData 不是有效对象', this.recordData)
        // 即使数据为空，也返回字段列表，显示为 '-'
        return [
          { label: '任务ID', value: '-' },
          { label: '任务名称', value: '-' },
          { label: '模型名称', value: '-' },
          { label: '规则编号', value: '-' },
          { label: '规则名称', value: '-' },
          { label: '预警时间', value: '-' },
          { label: '预警原因', value: '-' }
        ]
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
      // 确保 treatmentData 是对象
      if (!this.treatmentData || typeof this.treatmentData !== 'object') {
        console.warn('treatmentInfoData: treatmentData 不是有效对象', this.treatmentData)
        // 即使数据为空，也返回字段列表，显示为 '-'
        return [
          { label: '医院编码', value: '-' },
          { label: '医院名称', value: '-' },
          { label: '医院等级', value: '-' },
          { label: '患者姓名', value: '-' },
          { label: '患者身份证号码', value: '-' },
          { label: '就诊ID', value: '-' },
          { label: '就诊科室', value: '-' },
          { label: '就诊类型', value: '-' },
          { label: '结算ID', value: '-' }
        ]
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
    },
    // 判断是否显示初审卡片
    showFirstReview() {
      return !!this.reviewProcess.firstReview.time
    },
    // 判断是否显示医院复核卡片
    // 只要有 list_alert_detail 权限，就能看到审核流程，不依赖审核权限
    showHospitalReview() {
      // 如果已复核，显示
      if (this.reviewProcess.hospitalReview.time) {
        return true
      }
      // 如果已初审，且初审结果是"明确违规"或"疑似违规"，可以显示（待复核状态）
      const firstReviewResult = this.reviewProcess.firstReview.result
      if (this.showFirstReview && 
          (firstReviewResult === '明确违规' || firstReviewResult === '疑似违规' ||
           String(firstReviewResult || '').toLowerCase() === 'confirmed_violation' ||
           String(firstReviewResult || '').toLowerCase() === 'suspected_violation')) {
        return true
      }
      // 即使没有初审，只要有 list_alert_detail 权限，也应该显示（显示"待初审"状态）
      // 这里返回 true，让所有用户都能看到医院复核卡片
      return true
    },
    // 判断是否显示医院复核卡片（包括没有初审的情况）
    canShowHospitalReviewCard() {
      // 如果已复核，显示
      if (this.reviewProcess.hospitalReview.time) {
        return true
      }
      // 检查是否有复核权限
      const role = this.$store.getters.role
      const permissions = this.$store.getters.permissions || []
      const hasPermission = role === 'Superuser' || 
                            role === 'System Administrator' || 
                            permissions.includes('warning.review_hospital')
      
      // 如果有复核权限，即使没有初审也显示（显示"待初审"状态）
      if (hasPermission) {
        return true
      }
      
      // 如果已初审，且初审结果是"明确违规"或"疑似违规"，可以显示
      const firstReviewResult = this.reviewProcess.firstReview.result
      if (this.showFirstReview && 
          (firstReviewResult === '明确违规' || firstReviewResult === '疑似违规')) {
        return true
      }
      return false
    },
    // 获取医院复核的时间戳显示文本
    getHospitalReviewTimestamp() {
      if (this.reviewProcess.hospitalReview.time) {
        return this.formatDateTime(this.reviewProcess.hospitalReview.time)
      }
      // 如果没有初审，显示"待初审"，否则显示"待复核"
      if (!this.showFirstReview) {
        return '待初审'
      }
      // 如果初审结果是"明确违规"或"疑似违规"，显示"待复核"
      const firstReviewResult = this.reviewProcess.firstReview.result
      const resultStr = String(firstReviewResult || '').toLowerCase()
      if (firstReviewResult === '明确违规' || firstReviewResult === '疑似违规' ||
          resultStr === 'confirmed_violation' || resultStr === 'suspected_violation') {
        return '待复核'
      }
      // 如果初审结果是"没有违规"，显示"待复核"（虽然不会显示这个卡片，因为 isFirstReviewNoViolation 为 true）
      return '待复核'
    },
    // 获取医院复核状态文本
    getHospitalReviewStatusText() {
      // 如果没有初审，显示"待初审"
      if (!this.showFirstReview) {
        return '待初审'
      }
      return '待复核'
    },
    // 判断是否显示终审卡片
    // 只要有 list_alert_detail 权限，就能看到审核流程，不依赖审核权限
    showFinalReview() {
      // 如果已终审，显示
      if (this.reviewProcess.finalReview.time) {
        return true
      }
      // 如果初审结果是"明确违规"或"疑似违规"，且已复核，则可以显示（待终审状态）
      const firstReviewResult = this.reviewProcess.firstReview.result
      const resultStr = String(firstReviewResult || '').toLowerCase()
      if (this.showFirstReview && 
          (firstReviewResult === '明确违规' || firstReviewResult === '疑似违规' ||
           resultStr === 'confirmed_violation' || resultStr === 'suspected_violation') &&
          this.reviewProcess.hospitalReview.time) {
        return true
      }
      // 即使没有满足上述条件，只要有 list_alert_detail 权限，也应该显示（显示"待终审"状态）
      // 但需要确保初审结果不是"没有违规"（这个由 isFirstReviewNoViolation 控制）
      return true
    },
    // 判断当前用户是否可以初审
    canInitialReview() {
      const role = this.$store.getters.role
      const permissions = this.$store.getters.permissions || []
      
      // 超级管理员和系统管理员拥有所有权限
      if (role === 'Superuser' || role === 'System Administrator') {
        return true
      }
      
      // 检查是否有 warning.review_initial 权限
      const hasPermission = permissions.includes('warning.review_initial')
      
      console.log('是否可以初审 - 角色:', role, '权限:', permissions, '有权限:', hasPermission)
      return hasPermission
    },
    // 判断当前用户是否可以医院复核
    canHospitalReview() {
      const role = this.$store.getters.role
      const permissions = this.$store.getters.permissions || []
      
      // 超级管理员和系统管理员拥有所有权限
      if (role === 'Superuser' || role === 'System Administrator') {
        return true
      }
      
      // 检查是否有 warning.review_hospital 权限
      const hasPermission = permissions.includes('warning.review_hospital')
      
      return hasPermission
    },
    // 判断当前用户是否可以终审
    canFinalReview() {
      const role = this.$store.getters.role
      const permissions = this.$store.getters.permissions || []
      
      // 超级管理员和系统管理员拥有所有权限
      if (role === 'Superuser' || role === 'System Administrator') {
        return true
      }
      
      // 检查是否有 warning.review_final 权限
      const hasPermission = permissions.includes('warning.review_final')
      
      return hasPermission
    },
    // 判断是否可以预览申诉材料
    canPreviewMaterials() {
      const role = this.$store.getters.role
      const permissions = this.$store.getters.permissions || []
      
      // 超级管理员和系统管理员拥有所有权限
      if (role === 'Superuser' || role === 'System Administrator') {
        // 只要有医院复核信息就可以预览（无论是否已终审）
        return this.showHospitalReview
      }
      
      // 如果有 warning.review_hospital 权限（医院角色），就可以预览材料
      // 或者有 warning.review_final 权限（医保角色），也可以预览材料（有终审权限就能看到初审结果和医院复核结果）
      // 或者有 warning.preview_materials 权限也可以预览（向后兼容）
      const hasPermission = permissions.includes('warning.review_hospital') || 
                           permissions.includes('warning.review_final') ||
                           permissions.includes('warning.preview_materials')
      
      // 有权限且医院复核信息存在就可以预览（有终审权限的用户即使已终审也能预览）
      return hasPermission && this.showHospitalReview
    },
    // 判断当前状态是否可以初审
    canDoInitialReview() {
      return this.canInitialReview && !this.showFirstReview
    },
    // 判断当前状态是否可以医院复核
    canDoHospitalReview() {
      // 检查权限
      const role = this.$store.getters.role
      const permissions = this.$store.getters.permissions || []
      const roleType = this.$store.getters.roleType
      
      // 检查是否是医院用户（通过 roleType 判断）
      const isHospitalUser = roleType === 'hospital' || 
                             role === 'Hospital Administrator' || 
                             role === 'Hospital User'
      
      const hasPermission = role === 'Superuser' || 
                            role === 'System Administrator' || 
                            permissions.includes('warning.review_hospital')
      
      console.log('canDoHospitalReview 检查:', {
        role,
        roleType,
        isHospitalUser,
        hasPermission,
        permissions,
        showFirstReview: this.showFirstReview,
        firstReviewResult: this.reviewProcess.firstReview.result,
        hospitalReviewTime: this.reviewProcess.hospitalReview.time
      })
      
      if (!hasPermission) {
        console.log('没有复核权限')
        return false
      }
      
      // 如果已复核，不能再复核
      if (this.reviewProcess.hospitalReview.time) {
        console.log('已复核，不能再复核')
        return false
      }
      
      // 必须已初审，且初审结果是"明确违规"或"疑似违规"
      const firstReviewResult = this.reviewProcess.firstReview.result
      if (!this.showFirstReview) {
        console.log('未初审，不能复核')
        return false
      }
      
      // 初审结果必须是"明确违规"或"疑似违规"（支持中英文）
      const resultStr = String(firstReviewResult || '').toLowerCase()
      const isValidResult = firstReviewResult === '明确违规' || 
                           firstReviewResult === '疑似违规' ||
                           resultStr === 'confirmed_violation' ||
                           resultStr === 'suspected_violation'
      
      if (!isValidResult) {
        console.log('初审结果不符合复核条件:', firstReviewResult, 'resultStr:', resultStr)
        return false
      }
      
      console.log('可以复核')
      return true
    },
    // 判断当前状态是否可以终审
    canDoFinalReview() {
      // 必须已复核，且未终审
      return this.canFinalReview && 
             this.reviewProcess.hospitalReview.time && 
             !this.reviewProcess.finalReview.time
    },
    // 判断初审结果是否为"没有违规"（如果是，则流程结束）
    isFirstReviewNoViolation() {
      return this.reviewProcess.firstReview.result === '没有违规'
    },
    // 判断是否为PDF文件（同时检查文件名和文件类型）
    isPdfFile() {
      if (!this.materialsFileName && !this.materialsFileType) return false
      const fileName = this.materialsFileName ? this.materialsFileName.toLowerCase() : ''
      const fileType = this.materialsFileType ? this.materialsFileType.toLowerCase() : ''
      // 检查文件名或文件类型
      return fileName.endsWith('.pdf') || fileType === 'pdf' || fileType.includes('pdf')
    },
    // 判断是否为图片文件
    isImageFile() {
      if (!this.materialsFileName) return false
      const fileName = this.materialsFileName.toLowerCase()
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
      return imageExtensions.some(ext => fileName.endsWith(ext))
    },
    // 判断是否为Excel文件（同时检查文件名和文件类型）
    isExcelFile() {
      if (!this.materialsFileName && !this.materialsFileType) return false
      const fileName = this.materialsFileName ? this.materialsFileName.toLowerCase() : ''
      const fileType = this.materialsFileType ? this.materialsFileType.toLowerCase() : ''
      // 检查文件名或文件类型，或者是否有Excel数据
      return (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) || 
             fileType === 'excel' || fileType.includes('excel') || fileType.includes('spreadsheet') ||
             (this.excelData && this.excelData.length > 0)
    },
    // 判断是否为Txt文件
    isTxtFile() {
      if (!this.materialsFileName) return false
      const fileName = this.materialsFileName.toLowerCase()
      return fileName.endsWith('.txt')
    },
    // 当前工作表的数据
    currentSheetData() {
      if (!this.excelData || !this.excelData.length) return null
      const index = parseInt(this.currentSheetIndex) || 0
      return this.excelData[index] || null
    }
  },
  mounted() {
    // 从路由参数获取记录ID并加载数据
    const recordId = this.$route.query.id || this.$route.query.recordId
    console.log('WarningRecordView mounted, 路由参数:', this.$route.query)
    console.log('WarningRecordView mounted, recordId:', recordId)
    console.log('WarningRecordView mounted, 当前路由:', this.$route.path, this.$route.name)
    if (recordId) {
      this.recordId = recordId
      this.loadRecordData(recordId)
    } else {
      this.errorMessage = '缺少记录ID参数，请从预警列表页面点击"查看"按钮进入'
      console.error('缺少记录ID参数，路由参数:', this.$route.query)
      this.loading = false
    }
  },
  methods: {
    // 从后端加载预警记录详情
    async loadRecordData(recordId) {
      console.log('开始加载预警详情, recordId:', recordId)
      this.loading = true
      this.errorMessage = null // 清除之前的错误信息
      
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        console.error('未找到 accessToken')
        this.errorMessage = '未登录，请先登录'
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
          this.errorMessage = '获取预警详情失败: 响应格式错误'
          this.loading = false
          return
        }
        
        // 检查响应码
        if (!response.ok || (data && data.code !== undefined && data.code !== 0)) {
          let errorMessage = data?.message || data?.detail || `获取预警详情失败: ${response.status}`
          
          if (response.status === 404) {
            errorMessage = '预警详情不存在'
          } else if (response.status === 403) {
            errorMessage = '权限不足，无法查看预警详情'
          }
          
          console.error('接口返回错误:', response.status, errorMessage, data)
          this.errorMessage = errorMessage
          this.loading = false
          return
        }
        
        // 如果响应成功但没有数据，也显示错误
        if (!data || (!data.data && data.code === undefined)) {
          console.error('响应成功但数据为空:', data)
          this.errorMessage = '预警详情数据为空'
          this.loading = false
          return
        }
        
        // 处理统一响应格式
        const detailData = data && data.code === 0 ? data.data : data
        console.log('detailData:', detailData)
        
        if (!detailData) {
          console.error('detailData 为空')
          this.errorMessage = '预警详情数据为空'
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
        // 确保 warningInfo 是对象
        if (warningInfo && typeof warningInfo === 'object') {
        this.$set(this, 'recordData', warningInfo)
        console.log('解析后的 recordData:', this.recordData)
        } else {
          console.warn('warningInfo 不是有效对象，使用空对象')
          this.$set(this, 'recordData', {})
        }
        
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
        // 确保 treatmentInfo 是对象
        if (treatmentInfo && typeof treatmentInfo === 'object') {
        this.$set(this, 'treatmentData', treatmentInfo)
        console.log('解析后的 treatmentData:', this.treatmentData)
        } else {
          console.warn('treatmentInfo 不是有效对象，使用空对象')
          this.$set(this, 'treatmentData', {})
        }
        
        // 解析图片数据（base64 编码）
        const images = detailData.images || {}
        console.log('images:', images)
        
        // 解析申请信息图片（base64 数组）
        this.$set(this, 'applicationImages', images.application_info_images || [])
        
        // 解析报告信息图片（base64 数组）
        this.$set(this, 'reportImages', images.report_info_images || [])
        
        // 解析影像信息图片（使用 presigned_url）
        // 从 dicom_images 数组中提取第一个元素的 presigned_url
        const dicomImagesArray = images.dicom_images || []
        if (dicomImagesArray.length > 0 && dicomImagesArray[0].presigned_url) {
          // 直接使用后端返回的 presigned_url
          const presignedUrl = dicomImagesArray[0].presigned_url
          this.$set(this, 'dicomImages', [presignedUrl])
        } else {
          this.$set(this, 'dicomImages', [])
        }
        
        console.log('图片数据:', {
          applicationImages: this.applicationImages.length,
          reportImages: this.reportImages.length,
          dicomImages: this.dicomImages.length
        })
        
        // 解析审核流程数据
        this.$set(this.reviewProcess, 'firstReview', {
          reviewer: detailData.initial_reviewer || null,
          time: detailData.initial_review_time || null,
          opinion: detailData.initial_review_opinion || null,
          result: this.mapReviewResult(detailData.initial_review_result) || null
        })
        
        this.$set(this.reviewProcess, 'hospitalReview', {
          reviewer: detailData.hospital_reviewer || null,
          time: detailData.hospital_review_time || null,
          result: detailData.hospital_review_result || null,
          appealReason: detailData.appeal_reason || null,
          appealMaterials: detailData.appeal_materials || null
        })
        
        this.$set(this.reviewProcess, 'finalReview', {
          reviewer: detailData.final_reviewer || null,
          time: detailData.final_review_time || null,
          opinion: detailData.final_review_opinion || null,
          result: this.mapReviewResult(detailData.final_result) || null
        })
        
        console.log('审核流程数据:', this.reviewProcess)
        
        console.log('预警详情加载成功')
        this.errorMessage = null // 清除错误信息
        
      } catch (error) {
        console.error('加载预警详情错误:', error)
        console.error('错误堆栈:', error.stack)
        this.errorMessage = error.message || '获取预警详情失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    // 重试加载
    retryLoad() {
      if (this.recordId) {
        this.loadRecordData(this.recordId)
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
    getReviewTitle() {
      const titleMap = {
        'initial': '初审',
        'hospital': '医院复核',
        'final': '终审'
      }
      return titleMap[this.reviewFormType] || '审核'
    },
    // 映射审核结果为中文
    mapReviewResult(result) {
      if (!result) return null
      const resultMap = {
        'confirmed_violation': '明确违规',
        'suspected_violation': '疑似违规',
        'no_violation': '没有违规'
      }
      return resultMap[result] || result
    },
    // 打开审核表单
    openReviewForm(type) {
      this.reviewFormType = type
      this.reviewForm = {
        result: '',
        opinion: '',
        appealReason: '',
        fileList: [],
        screenshotFile: null,
        supplementaryFile: null
      }
      this.showReviewForm = true
    },
    // 提交审核
    async submitReview() {
      if (!this.recordId) {
        this.$message.error('缺少记录ID')
        return
      }
      
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        this.$router.push('/login')
        return
      }
      
      this.loading = true
      try {
        if (this.reviewFormType === 'initial') {
          // 初审
      if (!this.reviewForm.result) {
        this.$message.warning('请选择审核结果')
            this.loading = false
        return
      }
      
          await this.submitInitialReview()
        } else if (this.reviewFormType === 'hospital') {
          // 医院复核
          if (!this.reviewForm.result || !this.reviewForm.result.trim()) {
            this.$message.warning('请填写复核结果')
            this.loading = false
            return
          }
          
          await this.submitHospitalReview()
        } else if (this.reviewFormType === 'final') {
          // 终审
          if (!this.reviewForm.result) {
            this.$message.warning('请选择审核结果')
            this.loading = false
            return
          }
          
          await this.submitFinalReview()
        }
      } catch (error) {
        console.error('提交审核错误:', error)
        this.$message.error(error.message || '提交审核失败，请稍后重试')
        this.loading = false
      }
    },
    // 提交初审
    async submitInitialReview() {
      const accessToken = this.$store.getters.accessToken
      const role = this.$store.getters.role
      const user = this.$store.getters
      
      console.log('提交初审 - 当前用户信息:', {
        role: role,
        username: user.username,
        institutionType: user.institutionType,
        accessToken: accessToken ? '存在' : '不存在'
      })
      
      const response = await fetch(`/api/v1/details/${this.recordId}/review/initial/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          initial_review_opinion: this.reviewForm.opinion || null,
          initial_review_result: this.reviewForm.result
        })
      })
      
      console.log('提交初审 - 响应状态:', response.status, response.statusText)
      
      // 处理401错误
      if (response.status === 401) {
        const { handle401Error } = await import('@/utils/api')
        const refreshSuccess = await handle401Error(this.$store, this.$router, false)
        if (refreshSuccess) {
          const newAccessToken = this.$store.getters.accessToken
          const retryResponse = await fetch(`/api/v1/details/${this.recordId}/review/initial/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              initial_review_opinion: this.reviewForm.opinion || null,
              initial_review_result: this.reviewForm.result
            })
          })
          return this.handleReviewResponse(retryResponse)
        }
        return
      }
      
      return this.handleReviewResponse(response)
    },
    // 提交医院复核
    async submitHospitalReview() {
      const accessToken = this.$store.getters.accessToken
      
      const formData = new FormData()
      formData.append('hospital_review_result', this.reviewForm.result)
      if (this.reviewForm.appealReason) {
        formData.append('appeal_reason', this.reviewForm.appealReason)
      }
      if (this.reviewForm.screenshotFile) {
        formData.append('image_screenshot', this.reviewForm.screenshotFile)
      }
      if (this.reviewForm.supplementaryFile) {
        formData.append('supplementary_materials', this.reviewForm.supplementaryFile)
      }
      
      const response = await fetch(`/api/v1/hospital/alerts/${this.recordId}/review/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`
          // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
        },
        body: formData
      })
      
      // 处理401错误
      if (response.status === 401) {
        const { handle401Error } = await import('@/utils/api')
        const refreshSuccess = await handle401Error(this.$store, this.$router, false)
        if (refreshSuccess) {
          const newAccessToken = this.$store.getters.accessToken
          const retryResponse = await fetch(`/api/v1/hospital/alerts/${this.recordId}/review/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`
            },
            body: formData
          })
          return this.handleReviewResponse(retryResponse)
        }
        return
      }
      
      return this.handleReviewResponse(response)
    },
    // 提交终审
    async submitFinalReview() {
      const accessToken = this.$store.getters.accessToken
      
      const response = await fetch(`/api/v1/details/${this.recordId}/review/final/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          final_review_opinion: this.reviewForm.opinion || null,
          final_result: this.reviewForm.result
        })
      })
      
      // 处理401错误
      if (response.status === 401) {
        const { handle401Error } = await import('@/utils/api')
        const refreshSuccess = await handle401Error(this.$store, this.$router, false)
        if (refreshSuccess) {
          const newAccessToken = this.$store.getters.accessToken
          const retryResponse = await fetch(`/api/v1/details/${this.recordId}/review/final/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              final_review_opinion: this.reviewForm.opinion || null,
              final_result: this.reviewForm.result
            })
          })
          return this.handleReviewResponse(retryResponse)
        }
        return
      }
      
      return this.handleReviewResponse(response)
    },
    // 处理审核响应
    async handleReviewResponse(response) {
      const text = await response.text()
      let data = null
      
      try {
        data = text ? JSON.parse(text) : null
      } catch (e) {
        console.error('解析审核响应失败:', e)
        if (!response.ok) {
          throw new Error(`服务器返回了非 JSON 格式的响应 (${response.status})`)
        }
      }
      
      // 检查响应码
      if (!response.ok || (data && data.code !== undefined && data.code !== 0)) {
        let errorMessage = data?.message || `提交审核失败: ${response.status}`
        
        console.error('审核响应错误:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          errorMessage: errorMessage
        })
        
        if (response.status === 403) {
          // 403错误，显示更详细的错误信息
          if (data && data.message) {
            errorMessage = data.message
          } else if (data && data.detail) {
            errorMessage = data.detail
          } else {
            errorMessage = '权限不足，无法执行此操作。请确认您的用户角色是否有权限进行此操作。'
          }
        } else if (response.status === 404) {
          errorMessage = '预警详情不存在'
        } else if (response.status === 400) {
          errorMessage = data?.message || '数据验证失败，请检查输入'
        }
        
        throw new Error(errorMessage)
      }
      
      // 成功，重新加载数据
      this.$message.success('审核提交成功')
      this.showReviewForm = false
      this.loading = false
      await this.loadRecordData(this.recordId)
    },
    handleUploadSuccess(response, file, fileList) {
      this.reviewForm.fileList = fileList
      this.$message.success('文件上传成功')
    },
    // 处理截图文件选择
    handleScreenshotChange(file) {
      this.reviewForm.screenshotFile = file.raw
    },
    // 处理补充材料文件选择
    handleSupplementaryChange(file) {
      this.reviewForm.supplementaryFile = file.raw
    },
    // 预览申诉材料
    async previewMaterials() {
      if (!this.recordId) {
        this.$message.error('缺少记录ID')
        return
      }
      
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        this.$router.push('/login')
        return
      }
      
      // 显示对话框并开始加载
      this.materialsDialogVisible = true
      this.materialsFileLoading = true
      this.materialsFileError = null
      
      // 先尝试从已加载的数据中获取原始文件名
      let initialFileName = `申诉材料_${this.recordId}`
      if (this.reviewProcess && this.reviewProcess.hospitalReview && this.reviewProcess.hospitalReview.appealMaterials) {
        const appealMaterials = this.reviewProcess.hospitalReview.appealMaterials
        console.log('appealMaterials 数据:', appealMaterials, typeof appealMaterials)
        
        // 如果appealMaterials是对象，尝试多种可能的字段名
        if (typeof appealMaterials === 'object' && appealMaterials !== null) {
          // 尝试多种可能的字段名（按优先级）
          initialFileName = appealMaterials.original_name || 
                           appealMaterials.original_filename ||
                           appealMaterials.filename ||
                           appealMaterials.name || 
                           appealMaterials.file_name ||
                           appealMaterials.fileName ||
                           initialFileName
          
          console.log('从appealMaterials对象获取的文件名:', initialFileName)
        } else if (typeof appealMaterials === 'string') {
          // 如果是字符串，可能是文件名或URL
          // 如果是URL，尝试提取文件名
          if (appealMaterials.includes('/') || appealMaterials.includes('\\')) {
            // 可能是路径，提取文件名
            const pathParts = appealMaterials.split(/[/\\]/)
            const lastPart = pathParts[pathParts.length - 1]
            if (lastPart && lastPart.includes('.')) {
              // 看起来像文件名
              initialFileName = lastPart
            } else {
              initialFileName = appealMaterials
            }
          } else {
            initialFileName = appealMaterials
          }
          console.log('从appealMaterials字符串获取的文件名:', initialFileName)
        }
      } else {
        console.log('未找到appealMaterials数据，使用默认文件名')
      }
      
      this.materialsFileName = initialFileName
      this.materialsFileType = ''
      
      try {
        let response = await fetch(`/api/v1/details/${this.recordId}/preview/materials/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        // 处理401错误
        if (response.status === 401) {
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (refreshSuccess) {
            const newAccessToken = this.$store.getters.accessToken
            response = await fetch(`/api/v1/details/${this.recordId}/preview/materials/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${newAccessToken}`
              }
            })
          } else {
            this.materialsFileLoading = false
            this.materialsFileError = '登录已过期，请重新登录'
            return
          }
        }
        
        if (!response.ok) {
          this.materialsFileLoading = false
          if (response.status === 404) {
            this.materialsFileError = '未找到申诉材料'
          } else if (response.status === 403) {
            this.materialsFileError = '权限不足，无法查看申诉材料'
          } else {
            this.materialsFileError = `获取申诉材料失败: ${response.status}`
          }
          return
        }
        
        // 获取文件类型
        const contentType = response.headers.get('content-type') || 'application/octet-stream'
        const blob = await response.blob()
        
        // 从Content-Disposition头获取文件名（如果有）
        const contentDisposition = response.headers.get('content-disposition')
        if (contentDisposition) {
          console.log('Content-Disposition:', contentDisposition)
          let fileName = null
          
          // 尝试多种格式匹配
          // 格式1: filename="filename.ext"
          // 格式2: filename*=UTF-8''filename.ext (RFC 5987)
          // 格式3: filename=filename.ext
          
          // 先尝试匹配 UTF-8 编码的文件名 (filename*=UTF-8''...)
          const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
          if (utf8Match && utf8Match[1]) {
            try {
              fileName = decodeURIComponent(utf8Match[1])
            } catch (e) {
              console.warn('UTF-8文件名解码失败:', e)
            }
          }
          
          // 如果没有找到UTF-8格式，尝试标准格式
          if (!fileName) {
            // 匹配 filename="..." 或 filename='...'
            const quotedMatch = contentDisposition.match(/filename[^;=\n]*=((['"])([^'"]+)\2)/i)
            if (quotedMatch && quotedMatch[3]) {
              fileName = quotedMatch[3]
            } else {
              // 匹配 filename=... (无引号)
              const unquotedMatch = contentDisposition.match(/filename[^;=\n]*=([^;\n]+)/i)
              if (unquotedMatch && unquotedMatch[1]) {
                fileName = unquotedMatch[1].trim()
                // 移除可能的引号
                fileName = fileName.replace(/^["']|["']$/g, '')
              }
            }
          }
          
          // 如果找到了文件名，进行URL解码
          if (fileName) {
            try {
              // 尝试URL解码（处理 %20 等编码）
              fileName = decodeURIComponent(fileName)
            } catch (e) {
              // 如果解码失败，使用原始文件名
              console.warn('文件名URL解码失败:', e)
            }
            // 如果从数据中获取的文件名是默认值，则使用响应头的文件名
            // 否则优先使用从数据中获取的原始文件名
            if (this.materialsFileName === `申诉材料_${this.recordId}`) {
              this.materialsFileName = fileName
              console.log('从Content-Disposition获取的文件名（覆盖默认值）:', fileName)
            } else {
              console.log('保留从数据中获取的原始文件名:', this.materialsFileName, '（响应头文件名:', fileName, '）')
            }
          } else {
            console.warn('无法从Content-Disposition解析文件名，使用已设置的文件名:', this.materialsFileName)
          }
        } else {
          console.warn('响应头中没有Content-Disposition，使用已设置的文件名:', this.materialsFileName)
        }
        
        // 根据Content-Type设置文件类型
        if (contentType.includes('pdf')) {
          this.materialsFileType = 'PDF'
        } else if (contentType.includes('image')) {
          this.materialsFileType = '图片'
        } else if (contentType.includes('excel') || contentType.includes('spreadsheet')) {
          this.materialsFileType = 'Excel'
        } else if (contentType.includes('text')) {
          this.materialsFileType = '文本'
        } else {
          this.materialsFileType = '未知'
        }
        
        // 判断文件类型并处理（同时检查文件名和Content-Type）
        const fileName = this.materialsFileName.toLowerCase()
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
                       contentType.includes('excel') || contentType.includes('spreadsheet')
        const isTxt = fileName.endsWith('.txt') || contentType.includes('text/plain')
        const isImage = fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/) || 
                       contentType.startsWith('image/')
        const isPdf = fileName.endsWith('.pdf') || contentType.includes('application/pdf') || contentType.includes('pdf')
        
        console.log('文件类型判断:', {
          fileName: this.materialsFileName,
          contentType: contentType,
          isExcel: isExcel,
          isTxt: isTxt,
          isImage: isImage,
          isPdf: isPdf
        })
        
        if (isExcel) {
          // Excel 文件：解析并显示
          await this.parseExcelFile(blob)
        } else if (isTxt) {
          // Txt 文件：读取文本内容
          await this.parseTxtFile(blob)
        } else if (isImage || isPdf) {
          // 图片或PDF文件：创建 Blob URL 用于预览
          const blobUrl = window.URL.createObjectURL(blob)
          this.materialsFileUrl = blobUrl
          console.log('创建预览URL:', blobUrl)
        } else {
          // 其他文件：创建 Blob URL 用于下载
          const blobUrl = window.URL.createObjectURL(blob)
          this.materialsFileUrl = blobUrl
        }
        
        this.materialsFileLoading = false
        console.log('申诉材料预览已加载')
      } catch (error) {
        console.error('预览申诉材料错误:', error)
        this.materialsFileLoading = false
        this.materialsFileError = error.message || '无法加载文件，请稍后重试'
      }
    },
    
    /**
     * 解析 Excel 文件
     */
    async parseExcelFile(blob) {
      try {
        // 导入 XLSX 库
        const XLSX = await import('xlsx')
        
        // 检查文件大小（超过 5MB 时给出警告）
        const fileSizeMB = blob.size / (1024 * 1024)
        if (fileSizeMB > 5) {
          this.$message.warning(`文件较大（${fileSizeMB.toFixed(2)}MB），解析可能需要一些时间，请耐心等待...`)
        }
        
        // 将 Blob 转换为 ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer()
        
        // 使用 XLSX 解析 Excel 文件
        const workbook = XLSX.read(arrayBuffer, { 
          type: 'array',
          cellStyles: false,
          cellDates: false
        })
        
        // 获取所有工作表名称
        this.excelSheets = workbook.SheetNames.map((name, index) => ({
          name: name,
          index: index
        }))
        
        // 解析每个工作表（限制最大行数）
        const MAX_ROWS = 10 // 最大显示行数
        const MAX_COLS = 50  // 最大显示列数
        
        this.excelData = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName]
          
          // 获取工作表的范围
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
          const totalRows = range.e.r + 1
          const totalCols = range.e.c + 1
          
          // 检查是否需要限制
          const needLimit = totalRows > MAX_ROWS || totalCols > MAX_COLS
          
          if (needLimit) {
            // 如果超过限制，只读取部分数据
            const limitedRange = {
              s: { r: 0, c: 0 },
              e: { 
                r: Math.min(range.e.r, MAX_ROWS - 1), 
                c: Math.min(range.e.c, MAX_COLS - 1) 
              }
            }
            worksheet['!ref'] = XLSX.utils.encode_range(limitedRange)
          }
          
          // 将工作表转换为 JSON 格式（带标题行）
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // 使用数组格式，第一行作为标题
            defval: '' // 空单元格的默认值
          })
          
          if (jsonData.length === 0) {
            return {
              headers: [],
              rows: [],
              totalRows: 0,
              totalCols: 0,
              limited: false
            }
          }
          
          // 第一行作为表头
          const headers = (jsonData[0] || []).slice(0, MAX_COLS)
          // 其余行作为数据（限制行数）
          const rows = jsonData.slice(1, MAX_ROWS + 1)
          
          return {
            headers: headers,
            rows: rows,
            totalRows: totalRows,
            totalCols: totalCols,
            limited: needLimit
          }
        })
        
        // 默认显示第一个工作表
        this.currentSheetIndex = '0'
        
        // 如果有工作表被限制了，显示提示
        const hasLimited = this.excelData.some(sheet => sheet.limited)
        if (hasLimited) {
          this.$message.warning(`文件较大，为提升性能，仅显示前 ${MAX_ROWS} 行和前 ${MAX_COLS} 列。完整数据请下载文件查看。`)
        }
        
        this.materialsFileLoading = false
        this.materialsFileError = null
        console.log('Excel 文件解析成功', {
          sheets: this.excelSheets.length,
          data: this.excelData.map(sheet => ({
            rows: sheet.rows.length,
            cols: sheet.headers.length,
            limited: sheet.limited
          }))
        })
      } catch (error) {
        console.error('解析 Excel 文件失败:', error)
        this.materialsFileLoading = false
        this.materialsFileError = '解析 Excel 文件失败：' + error.message + '。文件可能过大或格式不正确，请尝试下载文件查看。'
      }
    },
    
    /**
     * 解析 Txt 文件
     */
    async parseTxtFile(blob) {
      try {
        // 检查文件大小（超过 5MB 时给出警告）
        const fileSizeMB = blob.size / (1024 * 1024)
        if (fileSizeMB > 5) {
          this.$message.warning(`文件较大（${fileSizeMB.toFixed(2)}MB），加载可能需要一些时间，请耐心等待...`)
        }
        
        // 读取文本内容
        const text = await blob.text()
        
        // 如果文件很大，只显示前 10000 个字符
        const MAX_LENGTH = 10000
        if (text.length > MAX_LENGTH) {
          this.txtContent = text.substring(0, MAX_LENGTH) + '\n\n... (文件内容过长，仅显示前 ' + MAX_LENGTH + ' 个字符，完整内容请下载文件查看)'
          this.$message.info('文件内容较长，仅显示前 ' + MAX_LENGTH + ' 个字符。完整内容请下载文件查看。')
        } else {
          this.txtContent = text
        }
        
        // 如果内容为空，显示提示
        if (!this.txtContent || this.txtContent.trim() === '') {
          this.txtContent = '(文件为空)'
        }
        
        this.materialsFileLoading = false
        console.log('Txt 文件解析成功')
      } catch (error) {
        console.error('解析 Txt 文件失败:', error)
        this.materialsFileLoading = false
        this.materialsFileError = '解析 Txt 文件失败：' + error.message
      }
    },
    
    /**
     * 下载申诉材料
     */
    async downloadMaterials() {
      if (!this.recordId) {
        this.$message.error('缺少记录ID')
        return
      }
      
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        this.$router.push('/login')
        return
      }
      
      try {
        const response = await fetch(`/api/v1/details/${this.recordId}/preview/materials/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        // 处理401错误
        if (response.status === 401) {
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (refreshSuccess) {
            const newAccessToken = this.$store.getters.accessToken
            const retryResponse = await fetch(`/api/v1/details/${this.recordId}/preview/materials/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${newAccessToken}`
              }
            })
            if (retryResponse.ok) {
              const blob = await retryResponse.blob()
              this.downloadBlob(blob)
              return
            }
          }
          this.$message.error('登录已过期，请重新登录')
          return
        }
        
        if (!response.ok) {
          this.$message.error('下载申诉材料失败')
          return
        }
        
        const blob = await response.blob()
        this.downloadBlob(blob)
      } catch (error) {
        console.error('下载申诉材料错误:', error)
        this.$message.error('下载申诉材料失败，请稍后重试')
      }
    },
    
    /**
     * 下载 Blob 文件
     */
    downloadBlob(blob) {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = this.materialsFileName || `申诉材料_${this.recordId}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      this.$message.success('文件下载成功')
    },
    
    /**
     * 处理工作表切换
     */
    handleSheetChange(tab) {
      this.currentSheetIndex = tab.name
    },
    
    /**
     * 处理文件加载成功
     */
    handleMaterialsFileLoad() {
      this.materialsFileLoading = false
      this.materialsFileError = null
    },
    
    /**
     * 处理文件加载失败
     */
    handleMaterialsFileError() {
      this.materialsFileLoading = false
      this.materialsFileError = '文件加载失败，可能后端未提供文件访问接口或文件不存在'
    },
    
    /**
     * 关闭申诉材料对话框
     */
    closeMaterialsDialog() {
      // 释放 Blob URL
      if (this.materialsFileUrl && this.materialsFileUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(this.materialsFileUrl)
      }
      // 清理 Excel 数据
      this.excelData = null
      this.excelSheets = []
      this.currentSheetIndex = '0'
      // 清理 Txt 数据
      this.txtContent = ''
      this.materialsFileUrl = ''
      this.materialsFileName = ''
      this.materialsFileType = ''
      this.materialsFileError = null
      this.materialsFileLoading = false
    },
    // 预览申诉截图
    async previewScreenshot() {
      if (!this.recordId) {
        this.$message.error('缺少记录ID')
        return
      }
      
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        this.$message.error('未登录，请先登录')
        this.$router.push('/login')
        return
      }
      
      // 显示加载动画
      const loadingInstance = this.$loading({
        lock: true,
        text: '正在加载申诉截图...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      
      try {
        const url = `/api/v1/details/${this.recordId}/preview/screenshot/`
        console.log('请求申诉截图URL:', url)
        
        let response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        // 处理401错误
        if (response.status === 401) {
          const { handle401Error } = await import('@/utils/api')
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (refreshSuccess) {
            const newAccessToken = this.$store.getters.accessToken
            response = await fetch(url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${newAccessToken}`
              }
            })
          } else {
            loadingInstance.close() // 关闭加载动画
            return
          }
        }
        
        // 处理错误响应
        if (!response.ok) {
          loadingInstance.close() // 关闭加载动画
          const contentType = response.headers.get('content-type') || ''
          
          if (response.status === 404) {
            this.$message.warning('未找到申诉截图，可能尚未上传')
          } else if (response.status === 403) {
            this.$message.error('权限不足，无法查看申诉截图')
          } else if (response.status === 401) {
            this.$message.error('登录已过期，请重新登录')
            this.$store.commit('clearUser')
            this.$router.push('/login')
          } else if (response.status === 503 || response.status === 502 || response.status === 500) {
            // 服务器错误（503 Service Unavailable, 502 Bad Gateway, 500 Internal Server Error）
            let errorMessage = '服务器暂时不可用，请稍后重试'
            if (response.status === 503) {
              errorMessage = '服务暂时不可用，请稍后重试'
            } else if (response.status === 502) {
              errorMessage = '网关错误，请稍后重试'
            } else if (response.status === 500) {
              errorMessage = '服务器内部错误，请稍后重试'
            }
            
            // 如果是HTML响应（如ngrok错误页面），不尝试读取内容
            if (contentType.includes('text/html')) {
              console.error('获取申诉截图失败: 服务器返回HTML错误页面', response.status)
              this.$message.error(errorMessage)
            } else {
              try {
                const errorText = await response.text()
                console.error('获取申诉截图失败:', response.status, errorText.substring(0, 200))
                this.$message.error(errorMessage)
              } catch (e) {
                console.error('获取申诉截图失败: 无法读取错误响应', response.status)
                this.$message.error(errorMessage)
              }
            }
          } else {
            // 其他错误
            try {
              // 检查是否是HTML响应
              if (contentType.includes('text/html')) {
                console.error('获取申诉截图失败: 服务器返回HTML错误页面', response.status)
                this.$message.error(`获取申诉截图失败: ${response.status}`)
              } else {
                const errorText = await response.text()
                console.error('获取申诉截图失败:', response.status, errorText.substring(0, 200))
                this.$message.error(`获取申诉截图失败: ${response.status}`)
              }
            } catch (e) {
              console.error('获取申诉截图失败: 无法读取错误响应', response.status, e)
              this.$message.error(`获取申诉截图失败: ${response.status}`)
            }
          }
          return
        }
        
        // 检查响应类型是否为图片
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.startsWith('image/')) {
          loadingInstance.close() // 关闭加载动画
          console.warn('响应不是图片类型:', contentType)
          // 如果是HTML，说明可能是错误页面
          if (contentType && contentType.includes('text/html')) {
            try {
              const htmlText = await response.text()
              console.error('服务器返回HTML而不是图片:', htmlText.substring(0, 200))
              this.$message.error('服务器返回了错误页面，请稍后重试')
            } catch (e) {
              this.$message.error('服务器返回了错误页面，请稍后重试')
            }
          } else {
            this.$message.warning('返回的数据不是图片格式')
          }
          return
        }
        
        // 获取图片并显示
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        
        // 关闭加载动画
        loadingInstance.close()
        
        // 在当前页面显示截图对话框
        this.screenshotDialogVisible = true
        this.screenshotLoading = true
        // 先设置 URL，确保图片元素被渲染
        this.screenshotUrl = blobUrl
        console.log('设置截图URL:', blobUrl)
        
        // 如果图片已经缓存，可能不会触发 load 事件，使用定时器作为备用
        setTimeout(() => {
          // 检查图片是否已经加载完成
          if (this.screenshotLoading && this.screenshotUrl) {
            const img = document.querySelector('.screenshot-image')
            if (img && img.complete && img.naturalHeight !== 0) {
              console.log('图片已加载完成（通过定时器检查）')
              this.screenshotLoading = false
            }
          }
        }, 100)
      } catch (error) {
        // 关闭加载动画
        loadingInstance.close()
        console.error('预览申诉截图错误:', error)
        this.$message.error('获取申诉截图失败，请稍后重试')
      }
    },
    
    /**
     * 关闭截图对话框
     */
    closeScreenshotDialog() {
      this.screenshotDialogVisible = false
      // 释放 Blob URL
      if (this.screenshotUrl) {
        window.URL.revokeObjectURL(this.screenshotUrl)
        this.screenshotUrl = null
      }
      this.screenshotLoading = false
    },
    
    /**
     * 处理截图加载完成
     */
    handleScreenshotLoad() {
      console.log('截图加载完成')
      this.screenshotLoading = false
    },
    
    /**
     * 处理截图加载错误
     */
    handleScreenshotError(event) {
      console.error('截图加载失败:', event)
      this.screenshotLoading = false
      this.$message.error('图片加载失败')
    },
    viewFile(fileName) {
      this.$message.info('查看文件：' + fileName)
      // TODO: 实现文件查看功能
    },
    handleImageError(event) {
      const imgSrc = event.target.src
      console.error('图片加载失败:', {
        src: imgSrc,
        error: event,
        imgElement: event.target
      })
      
      // 如果是 minio URL，尝试通过后端代理访问
      if (imgSrc && imgSrc.includes('10.198.236.252:9000')) {
        console.warn('Minio 直接访问失败，可能需要通过后端代理访问')
        // 可以在这里添加通过后端 API 获取图片的逻辑
        // 例如：/api/v1/minio/proxy?path=...
      }
      
      // 可以在这里添加错误处理逻辑，比如显示占位图
      // event.target.src = '/placeholder.png'
    },
    // 测试 minio URL 是否可访问
    async testMinioUrl(url) {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        console.log('Minio URL 测试:', { url, status: response.status, ok: response.ok })
        return response.ok
      } catch (error) {
        console.error('Minio URL 测试失败:', { url, error: error.message })
        return false
      }
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
  text-align: left;
}

/* 卡片内的审核表单 */
.review-form-in-card {
  padding: 15px 0;
  border-top: 1px solid #EBEEF5;
  margin-top: 15px;
  text-align: left;
}

.review-form-in-card .el-form-item {
  margin-bottom: 15px;
}

.review-form-in-card .el-form-item:last-child {
  margin-bottom: 0;
  margin-top: 10px;
}

/* 单选按钮组对齐 */
.review-radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-radio-group .el-radio {
  margin-right: 0;
  line-height: 1.5;
}

.info-row {
  margin-bottom: 10px;
  line-height: 1.8;
  text-align: left;
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

/* 确保时间戳左对齐 */
.el-timeline :deep(.el-timeline-item__timestamp) {
  text-align: left;
  padding-left: 0;
}

.el-timeline-item h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
  text-align: left;
}

.el-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  text-align: left;
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

/* 截图预览对话框样式 */
.screenshot-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.screenshot-dialog-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.screenshot-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #EBEEF5;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.screenshot-dialog-header .close-btn {
  font-size: 18px;
  color: #909399;
  padding: 0;
  width: 24px;
  height: 24px;
  line-height: 24px;
}

.screenshot-dialog-header .close-btn:hover {
  color: #303133;
}

.screenshot-dialog-body {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 400px;
  min-height: 300px;
  max-width: 90vw;
  max-height: calc(90vh - 80px);
  overflow: auto;
  position: relative;
}

.screenshot-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 8px;
}

.screenshot-loading .loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.screenshot-loading .loading-text {
  color: #606266;
  font-size: 14px;
}

.screenshot-image {
  max-width: 100%;
  max-height: calc(90vh - 120px);
  object-fit: contain;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  animation: imageFadeIn 0.3s ease;
}

.screenshot-image.image-loading {
  opacity: 0;
  visibility: hidden;
}

@keyframes imageFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 申诉材料预览对话框样式 */
.file-viewer {
  width: 100%;
}

.file-info {
  margin-bottom: 20px;
}

.file-preview {
  width: 100%;
  min-height: 400px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;
}

.loading-container i {
  font-size: 32px;
  color: #409EFF;
  margin-bottom: 16px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;
}

.error-container i {
  font-size: 32px;
  color: #F56C6C;
  margin-bottom: 16px;
}

.pdf-viewer {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.image-viewer {
  width: 100%;
  text-align: center;
}

.excel-viewer {
  width: 100%;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
}

.excel-table th,
.excel-table td {
  border: 1px solid #dcdfe6;
  padding: 8px;
  text-align: left;
}

.excel-table th {
  background-color: #f5f7fa;
  font-weight: 600;
}

.unsupported-viewer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;
}

.unsupported-viewer i {
  font-size: 48px;
  color: #909399;
  margin-bottom: 16px;
}
</style>

