<template>
  <div class="data-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">数据统计</h2>
    </div>

    <!-- 数据汇总卡片 -->
    <div class="summary-section">
      <h3 class="section-title">数据汇总</h3>
      <div class="summary-cards">
        <div class="summary-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="card-icon">
            <i class="el-icon-warning"></i>
          </div>
          <div class="card-content">
            <div class="card-label">预警总数</div>
            <div class="card-value">{{ summaryData.totalWarnings }}</div>
          </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div class="card-icon">
            <i class="el-icon-close"></i>
          </div>
          <div class="card-content">
            <div class="card-label">违规总数</div>
            <div class="card-value">{{ summaryData.totalViolations }}</div>
          </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <div class="card-icon">
            <i class="el-icon-check"></i>
          </div>
          <div class="card-content">
            <div class="card-label">无违规总数</div>
            <div class="card-value">{{ summaryData.totalNoViolations }}</div>
          </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <div class="card-icon">
            <i class="el-icon-data-analysis"></i>
          </div>
          <div class="card-content">
            <div class="card-label">平均阳性率</div>
            <div class="card-value">{{ summaryData.avgPositiveRate }}</div>
          </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
          <div class="card-icon">
            <i class="el-icon-user"></i>
          </div>
          <div class="card-content">
            <div class="card-label">患者总数</div>
            <div class="card-value">{{ summaryData.totalPatients }}</div>
          </div>
        </div>
        <div class="summary-card" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
          <div class="card-icon">
            <i class="el-icon-office-building"></i>
          </div>
          <div class="card-content">
            <div class="card-label">科室总数</div>
            <div class="card-value">{{ summaryData.totalDepartments }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索表单 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="任务名称">
        <el-input v-model="searchForm.taskName" placeholder="请输入任务名称" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search">查询</el-button>
        <el-button icon="el-icon-refresh-left">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table :data="tableData" style="width: 100%; min-width: 1200px;" border>
        <el-table-column prop="taskName" label="任务名称" min-width="180"></el-table-column>
        <el-table-column prop="hospitalName" label="医院名称" min-width="150"></el-table-column>
        <el-table-column prop="totalWarnings" label="预警总数" min-width="120" align="center"></el-table-column>
        <el-table-column prop="violations" label="明确违规" min-width="120" align="center">
          <template slot-scope="scope">
            <span style="color: #F56C6C; font-weight: bold;">{{ scope.row.violations }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="noViolations" label="无违规" min-width="100" align="center">
          <template slot-scope="scope">
            <span style="color: #67C23A; font-weight: bold;">{{ scope.row.noViolations }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="positiveRate" label="阳性率" min-width="100" align="center">
          <template slot-scope="scope">
            <span :style="{ color: getPositiveRateColor(scope.row.positiveRate), fontWeight: 'bold' }">
              {{ scope.row.positiveRate }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="patientCount" label="患者数" min-width="100" align="center"></el-table-column>
        <el-table-column prop="departmentCount" label="科室数" min-width="100" align="center"></el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      class="pagination">
    </el-pagination>
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
      summaryData: {
        totalWarnings: 1250,
        totalViolations: 856,
        totalNoViolations: 394,
        avgPositiveRate: '8.5%',
        totalPatients: 5680,
        totalDepartments: 45
      },
      tableData: [
        {
          taskName: '虚假检查监测',
          hospitalName: '第一人民医院',
          totalWarnings: 150,
          violations: 120,
          noViolations: 30,
          positiveRate: '12.5%',
          patientCount: 680,
          departmentCount: 8
        },
        {
          taskName: '重复检查监测',
          hospitalName: '第二人民医院',
          totalWarnings: 200,
          violations: 145,
          noViolations: 55,
          positiveRate: '9.8%',
          patientCount: 820,
          departmentCount: 10
        },
        {
          taskName: '缺失检查监测',
          hospitalName: '第三人民医院',
          totalWarnings: 180,
          violations: 98,
          noViolations: 82,
          positiveRate: '6.2%',
          patientCount: 750,
          departmentCount: 9
        },
        {
          taskName: '过度检查监测',
          hospitalName: '第四人民医院',
          totalWarnings: 120,
          violations: 56,
          noViolations: 64,
          positiveRate: '4.5%',
          patientCount: 580,
          departmentCount: 7
        },
        {
          taskName: '虚假检查监测',
          hospitalName: '第五人民医院',
          totalWarnings: 90,
          violations: 45,
          noViolations: 45,
          positiveRate: '3.8%',
          patientCount: 420,
          departmentCount: 6
        },
        {
          taskName: '重复检查监测',
          hospitalName: '第六人民医院',
          totalWarnings: 160,
          violations: 88,
          noViolations: 72,
          positiveRate: '7.2%',
          patientCount: 690,
          departmentCount: 8
        },
        {
          taskName: '缺失检查监测',
          hospitalName: '第七人民医院',
          totalWarnings: 110,
          violations: 62,
          noViolations: 48,
          positiveRate: '5.5%',
          patientCount: 520,
          departmentCount: 7
        },
        {
          taskName: '过度检查监测',
          hospitalName: '第八人民医院',
          totalWarnings: 140,
          violations: 78,
          noViolations: 62,
          positiveRate: '6.8%',
          patientCount: 620,
          departmentCount: 8
        },
        {
          taskName: '虚假检查监测',
          hospitalName: '第九人民医院',
          totalWarnings: 100,
          violations: 52,
          noViolations: 48,
          positiveRate: '4.2%',
          patientCount: 480,
          departmentCount: 6
        }
      ],
      currentPage: 1,
      pageSize: 10,
      total: 9
    }
  },
  methods: {
    handleSizeChange(val) {
      this.pageSize = val
    },
    handleCurrentChange(val) {
      this.currentPage = val
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

.search-form {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 0;
  margin-top: 0;
}

/* 数据汇总区域 */
.summary-section {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.summary-card {
  padding: 20px;
  border-radius: 12px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.card-icon {
  font-size: 36px;
  opacity: 0.9;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
}

/* 表格区域 */
.table-wrapper {
  overflow-x: auto;
  background-color: #fff;
  padding: 10px;
  border-radius: 8px;
  margin-top: 5px;
  margin-bottom: 5px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.table-wrapper .el-table {
  min-width: 1200px;
}

.table-wrapper .el-table th {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: 600;
}

.table-wrapper .el-table td,
.table-wrapper .el-table th {
  padding: 12px 0;
  font-size: 14px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
