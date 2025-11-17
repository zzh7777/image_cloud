<template>
  <div class="data-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">数据统计</h2>
    </div>

    <!-- 搜索区域 -->
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
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 数据统计表格 -->
    <div class="table-section">
      <div class="table-wrapper">
        <el-table :data="statisticsList" style="width: 100%" border>
          <el-table-column prop="taskName" label="任务名称" min-width="180"></el-table-column>
          <el-table-column prop="hospitalName" label="医疗机构名称" min-width="180"></el-table-column>
          <el-table-column prop="totalWarnings" label="累计预警数据条数" min-width="150" align="center"></el-table-column>
          <el-table-column prop="confirmedViolations" label="明确违规条数" min-width="140" align="center">
            <template slot-scope="scope">
              <span style="color: #F56C6C; font-weight: bold;">{{ scope.row.confirmedViolations }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="noViolations" label="没有违规条数" min-width="140" align="center">
            <template slot-scope="scope">
              <span style="color: #67C23A;">{{ scope.row.noViolations }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="positiveRate" label="阳性率" min-width="120" align="center">
            <template slot-scope="scope">
              <span :style="{ color: getPositiveRateColor(scope.row.positiveRate), fontWeight: 'bold' }">
                {{ scope.row.positiveRate }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="patientCount" label="涉及患者数量" min-width="140" align="center"></el-table-column>
          <el-table-column prop="departmentCount" label="涉及科室数量" min-width="140" align="center"></el-table-column>
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

    <!-- 数据汇总卡片 -->
    <div class="summary-section">
      <h3 class="section-title">数据汇总</h3>
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <i class="el-icon-document-copy"></i>
          </div>
          <div class="card-content">
            <div class="card-label">累计预警总数</div>
            <div class="card-value">{{ summaryData.totalWarnings }}</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <i class="el-icon-warning"></i>
          </div>
          <div class="card-content">
            <div class="card-label">明确违规总数</div>
            <div class="card-value danger">{{ summaryData.totalViolations }}</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <i class="el-icon-success"></i>
          </div>
          <div class="card-content">
            <div class="card-label">无违规总数</div>
            <div class="card-value success">{{ summaryData.totalNoViolations }}</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <i class="el-icon-data-line"></i>
          </div>
          <div class="card-content">
            <div class="card-label">平均阳性率</div>
            <div class="card-value">{{ summaryData.avgPositiveRate }}</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <i class="el-icon-user"></i>
          </div>
          <div class="card-content">
            <div class="card-label">涉及患者总数</div>
            <div class="card-value">{{ summaryData.totalPatients }}</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);">
            <i class="el-icon-office-building"></i>
          </div>
          <div class="card-content">
            <div class="card-label">涉及科室总数</div>
            <div class="card-value">{{ summaryData.totalDepartments }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataBaseView',
  data() {
    return {
      searchForm: {
        taskName: ''
      },
      statisticsList: [
        {
          taskName: '2024年虚假检查',
          hospitalName: '第一人民医院',
          totalWarnings: 2000,
          confirmedViolations: 20,
          noViolations: 1980,
          positiveRate: '1.00%',
          patientCount: 18,
          departmentCount: 5
        },
        {
          taskName: '2024年虚假检查',
          hospitalName: '第二人民医院',
          totalWarnings: 1000,
          confirmedViolations: 100,
          noViolations: 900,
          positiveRate: '10.00%',
          patientCount: 65,
          departmentCount: 12
        },
        {
          taskName: '2024年虚假检查',
          hospitalName: '第三人民医院',
          totalWarnings: 3000,
          confirmedViolations: 150,
          noViolations: 2850,
          positiveRate: '5.00%',
          patientCount: 40,
          departmentCount: 6
        },
        {
          taskName: '2024年虚假检查',
          hospitalName: '第四人民医院',
          totalWarnings: 1000,
          confirmedViolations: 1,
          noViolations: 999,
          positiveRate: '0.10%',
          patientCount: 1,
          departmentCount: 1
        },
        {
          taskName: '2024年虚假检查',
          hospitalName: '第五人民医院',
          totalWarnings: 2000,
          confirmedViolations: 5,
          noViolations: 1995,
          positiveRate: '0.25%',
          patientCount: 5,
          departmentCount: 1
        }
      ],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 5
      }
    }
  },
  computed: {
    summaryData() {
      const totalWarnings = this.statisticsList.reduce((sum, item) => sum + item.totalWarnings, 0)
      const totalViolations = this.statisticsList.reduce((sum, item) => sum + item.confirmedViolations, 0)
      const totalNoViolations = this.statisticsList.reduce((sum, item) => sum + item.noViolations, 0)
      const totalPatients = this.statisticsList.reduce((sum, item) => sum + item.patientCount, 0)
      const totalDepartments = this.statisticsList.reduce((sum, item) => sum + item.departmentCount, 0)
      const avgPositiveRate = totalWarnings > 0 ? ((totalViolations / totalWarnings) * 100).toFixed(2) + '%' : '0.00%'
      
      return {
        totalWarnings,
        totalViolations,
        totalNoViolations,
        totalPatients,
        totalDepartments,
        avgPositiveRate
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
        taskName: ''
      }
      // 重置后重新加载列表
      this.handleQuery()
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.handleQuery()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.handleQuery()
    },
    getPositiveRateColor(rate) {
      const value = parseFloat(rate)
      if (value === 0) {
        return '#909399'
      } else if (value < 1) {
        return '#67C23A'
      } else if (value < 5) {
        return '#409EFF'
      } else if (value < 10) {
        return '#E6A23C'
      } else {
        return '#F56C6C'
      }
    }
  }
}
</script>

<style scoped>
.data-base {
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
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.search-form {
  flex: 1;
}

.table-section {
  margin-top: 20px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 4px;
}

.table-wrapper >>> .el-table {
  min-width: 1200px;
}

.table-wrapper >>> .el-table th {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: 600;
}

.table-wrapper >>> .el-table td,
.table-wrapper >>> .el-table th {
  padding: 12px 0;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.summary-section {
  margin-top: 40px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  margin-right: 20px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.card-value.danger {
  color: #F56C6C;
}

.card-value.success {
  color: #67C23A;
}
</style>