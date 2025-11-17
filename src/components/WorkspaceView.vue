<template>
  <div class="workspace">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">工作台</h2>
    </div>

    <!-- 待办提醒区域 -->
    <div class="todo-section">
      <h3 class="section-title">
        <i class="el-icon-bell"></i> 待办提醒
      </h3>
      <div class="todo-cards">
        <div class="todo-card">
          <div class="todo-label">待初审条数</div>
          <div class="todo-value">{{ todoData.pendingFirstReview }}</div>
        </div>
        <div class="todo-card">
          <div class="todo-label">待医院复核条数</div>
          <div class="todo-value">{{ todoData.pendingHospitalReview }}</div>
        </div>
        <div class="todo-card">
          <div class="todo-label">待终审条数</div>
          <div class="todo-value">{{ todoData.pendingFinalReview }}</div>
        </div>
      </div>
    </div>

    <!-- 监管概况区域 -->
    <div class="overview-section">
      <div class="overview-item">
        <div class="overview-label">监管医院覆盖数量</div>
        <div class="overview-value">
          <span class="value">{{ overviewData.hospitalCount }}</span>
          <span class="unit">（家）</span>
        </div>
      </div>
      <div class="overview-divider"></div>
      <div class="overview-item">
        <div class="overview-label">累计监管数据条数</div>
        <div class="overview-value">
          <span class="value">{{ overviewData.dataCount }}</span>
          <span class="unit">（万条）</span>
        </div>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <div class="stat-card-large">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <i class="el-icon-document"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">规则数量</div>
          <div class="stat-value">{{ statistics.ruleCount }}<span class="unit">条</span></div>
        </div>
      </div>

      <div class="stat-card-large">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <i class="el-icon-s-grid"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">模型数量</div>
          <div class="stat-value">{{ statistics.modelCount }}<span class="unit">个</span></div>
        </div>
      </div>

      <div class="stat-card-large">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <i class="el-icon-files"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">任务数量</div>
          <div class="stat-value">{{ statistics.taskCount }}<span class="unit">个</span></div>
        </div>
      </div>

      <div class="stat-card-large">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <i class="el-icon-warning"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">明确违规记录数量</div>
          <div class="stat-value">{{ statistics.violationCount }}<span class="unit">条</span></div>
        </div>
      </div>
    </div>

    <!-- 排行榜区域 -->
    <div class="rankings-section">
      <!-- 违规医院阳性率TOP10 -->
      <div class="ranking-card">
        <div class="card-header">
          <h3>违规医院阳性率TOP10排行</h3>
          <el-select v-model="selectedTask" size="small" style="width: 200px;">
            <el-option label="2025虚假检查专项" value="2025虚假检查专项"></el-option>
            <el-option label="2024重复检查" value="2024重复检查"></el-option>
          </el-select>
        </div>
        <el-table :data="hospitalRankings" style="width: 100%" size="small">
          <el-table-column prop="rank" label="序号" width="80" align="center">
            <template slot-scope="scope">
              <span :class="getRankClass(scope.row.rank)">{{ scope.row.rank }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="hospitalName" label="医院名称" min-width="180"></el-table-column>
          <el-table-column prop="violationCount" label="医院违规条数" width="120" align="center"></el-table-column>
          <el-table-column prop="positiveRate" label="阳性率" width="100" align="center">
            <template slot-scope="scope">
              <span style="color: #F56C6C; font-weight: bold;">{{ scope.row.positiveRate }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 规则阳性率TOP10 -->
      <div class="ranking-card">
        <div class="card-header">
          <h3>规则阳性率TOP10排行</h3>
        </div>
        <el-table :data="ruleRankings" style="width: 100%" size="small">
          <el-table-column prop="rank" label="序号" width="80" align="center">
            <template slot-scope="scope">
              <span :class="getRankClass(scope.row.rank)">{{ scope.row.rank }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ruleName" label="规则名称" min-width="200"></el-table-column>
          <el-table-column prop="triggerCount" label="触发次数" width="120" align="center"></el-table-column>
          <el-table-column prop="positiveRate" label="阳性率" width="100" align="center">
            <template slot-scope="scope">
              <span style="color: #F56C6C; font-weight: bold;">{{ scope.row.positiveRate }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkspaceView',
  data() {
    return {
      todoData: {
        pendingFirstReview: 15,
        pendingHospitalReview: 15,
        pendingFinalReview: 15
      },
      overviewData: {
        hospitalCount: 120,
        dataCount: 1234
      },
      statistics: {
        ruleCount: 560,
        modelCount: 30,
        taskCount: 36,
        violationCount: 56000
      },
      selectedTask: '2025虚假检查专项',
      hospitalRankings: [
        { rank: 1, hospitalName: '第一人民医院', violationCount: 24, positiveRate: '28.12%' },
        { rank: 2, hospitalName: '第二人民医院', violationCount: 24, positiveRate: '27.12%' },
        { rank: 3, hospitalName: '第三人民医院', violationCount: 24, positiveRate: '26.12%' },
        { rank: 4, hospitalName: '第四人民医院', violationCount: 24, positiveRate: '25.12%' },
        { rank: 5, hospitalName: '第五人民医院', violationCount: 24, positiveRate: '24.12%' },
        { rank: 6, hospitalName: '第六人民医院', violationCount: 24, positiveRate: '23.12%' },
        { rank: 7, hospitalName: '第七人民医院', violationCount: 24, positiveRate: '22.12%' },
        { rank: 8, hospitalName: '第八人民医院', violationCount: 22, positiveRate: '21.12%' },
        { rank: 9, hospitalName: '第九人民医院', violationCount: 20, positiveRate: '20.12%' },
        { rank: 10, hospitalName: '第十人民医院', violationCount: 18, positiveRate: '19.12%' }
      ],
      ruleRankings: [
        { rank: 1, ruleName: '影像检查串换项目次数', triggerCount: 1200, positiveRate: '32.15%' },
        { rank: 2, ruleName: '影像检查设备未使用次数', triggerCount: 980, positiveRate: '28.45%' },
        { rank: 3, ruleName: '影像DICOM文件重复次数', triggerCount: 856, positiveRate: '25.80%' },
        { rank: 4, ruleName: '患者重复检查次数', triggerCount: 745, positiveRate: '23.50%' },
        { rank: 5, ruleName: '患者就诊缺失检查次数', triggerCount: 620, positiveRate: '21.25%' },
        { rank: 6, ruleName: '影像报告异常标记缺失', triggerCount: 580, positiveRate: '19.80%' },
        { rank: 7, ruleName: '检查费用异常波动', triggerCount: 450, positiveRate: '18.50%' },
        { rank: 8, ruleName: '非工作时间检查记录', triggerCount: 380, positiveRate: '16.20%' },
        { rank: 9, ruleName: '检查设备超负荷使用', triggerCount: 320, positiveRate: '14.80%' },
        { rank: 10, ruleName: '跨科室检查异常', triggerCount: 280, positiveRate: '12.50%' }
      ]
    }
  },
  methods: {
    getRankClass(rank) {
      if (rank <= 3) {
        return 'rank-top'
      }
      return 'rank-normal'
    }
  }
}
</script>

<style scoped>
.workspace {
  padding: 20px;
  background-color: #fff;
  min-height: 100%;
}

.title-section {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
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

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 待办提醒区域 */
.todo-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.todo-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.todo-card {
  padding: 30px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  text-align: center;
  color: #fff;
  transition: transform 0.3s;
}

.todo-card:hover {
  transform: translateY(-5px);
}

.todo-label {
  font-size: 14px;
  margin-bottom: 15px;
  opacity: 0.9;
}

.todo-value {
  font-size: 42px;
  font-weight: bold;
}

/* 监管概况区域 */
.overview-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.overview-item {
  flex: 1;
  text-align: center;
}

.overview-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 15px;
}

.overview-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 5px;
}

.overview-value .value {
  font-size: 48px;
  font-weight: bold;
  color: #303133;
}

.overview-value .unit {
  font-size: 14px;
  color: #909399;
}

.overview-divider {
  width: 2px;
  height: 80px;
  background-color: #e4e7ed;
  margin: 0 40px;
}

/* 统计卡片区域 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card-large {
  display: flex;
  align-items: center;
  padding: 25px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card-large:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 70px;
  height: 70px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #fff;
  margin-right: 20px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-value .unit {
  font-size: 16px;
  font-weight: normal;
  margin-left: 5px;
  color: #909399;
}

/* 排行榜区域 */
.rankings-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
}

.ranking-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

/* 排名样式 */
.rank-top {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
}

.rank-normal {
  font-weight: 500;
  color: #606266;
}
</style>

